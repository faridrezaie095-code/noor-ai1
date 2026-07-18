export const runtime = "edge";

import { streamGemmaResponse } from "@/lib/ai/gemma";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { validateSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/kv/ratelimit";
import { saveMessage, getMessageCount } from "@/lib/db/messages";
import { updateChatTitle, touchChat, getChatById, createChat } from "@/lib/db/chats";
import { generateTitle } from "@/lib/utils/generateTitle";

interface CloudflareEnv {
  NOORAI_DB: D1Database;
  NOORAI_KV: KVNamespace;
  GOOGLE_AI_API_KEY: string;
}

function getEnv(): CloudflareEnv {
  return process.env as unknown as CloudflareEnv;
}

export async function POST(request: Request) {
  const env = getEnv();

  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.match(/noorai_session=([^;]+)/)?.[1];

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token);
  if (!userId) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }

  const rateLimitResult = await checkRateLimit(env.NOORAI_KV, userId, "chat");
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: "rate_limit", remaining: 0, resetAt: rateLimitResult.resetAt },
      { status: 429 }
    );
  }

  const { messages, chatId } = (await request.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string; attachments?: string[] }>;
    chatId: string;
  };

  // Ensure the chat exists and belongs to this user (create lazily if needed)
  let chat = await getChatById(env.NOORAI_DB, chatId);
  if (!chat) {
    chat = await createChat(env.NOORAI_DB, { userId });
  } else if (chat.user_id !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const resolvedChatId = chat.id;

  const localeHeader = request.headers.get("x-locale") as "fa" | "en" | null;
  const locale = localeHeader ?? "fa";
  const systemPrompt = buildSystemPrompt(locale);
  const apiKey = env.GOOGLE_AI_API_KEY;

  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage?.role === "user") {
    await saveMessage(env.NOORAI_DB, {
      chatId: resolvedChatId,
      userId,
      role: "user",
      content: lastUserMessage.content,
      attachments: lastUserMessage.attachments,
    });
  }

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamGemmaResponse(
          messages,
          systemPrompt,
          apiKey,
          (chunk) => {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
          },
          async () => {
            await saveMessage(env.NOORAI_DB, {
              chatId: resolvedChatId,
              userId,
              role: "assistant",
              content: fullResponse,
            });

            await touchChat(env.NOORAI_DB, resolvedChatId);

            const messageCount = await getMessageCount(env.NOORAI_DB, resolvedChatId);
            if (messageCount <= 2 && lastUserMessage) {
              const title = generateTitle(lastUserMessage.content);
              await updateChatTitle(env.NOORAI_DB, resolvedChatId, title);
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chatId: resolvedChatId })}\n\n`)
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        );
      } catch (error) {
        console.error("AI streaming error:", error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI error" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
