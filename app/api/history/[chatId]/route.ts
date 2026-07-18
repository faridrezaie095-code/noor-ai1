export const runtime = "edge";

import { validateSession } from "@/lib/auth";
import { getChatById, deleteChat } from "@/lib/db/chats";
import { getMessagesByChatId } from "@/lib/db/messages";

interface CloudflareEnv {
  NOORAI_DB: D1Database;
  NOORAI_KV: KVNamespace;
}

function getEnv(): CloudflareEnv {
  return process.env as unknown as CloudflareEnv;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const env = getEnv();
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.match(/noorai_session=([^;]+)/)?.[1];

  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token);
  if (!userId) return Response.json({ error: "Session expired" }, { status: 401 });

  const { chatId } = await params;
  const chat = await getChatById(env.NOORAI_DB, chatId);

  if (!chat || chat.user_id !== userId) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = await getMessagesByChatId(env.NOORAI_DB, chatId);

  return Response.json({
    chat,
    messages: messages.map((m) => ({
      ...m,
      attachments: m.attachments ? JSON.parse(m.attachments) : [],
    })),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const env = getEnv();
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.match(/noorai_session=([^;]+)/)?.[1];

  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token);
  if (!userId) return Response.json({ error: "Session expired" }, { status: 401 });

  const { chatId } = await params;
  const chat = await getChatById(env.NOORAI_DB, chatId);

  if (!chat || chat.user_id !== userId) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  await deleteChat(env.NOORAI_DB, chatId);
  return Response.json({ success: true });
}
