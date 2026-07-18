import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const runtime = 'edge';

async function getCloudflareContext() {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    return getRequestContext().env as {
      NOORAI_DB: D1Database;
      NOORAI_KV: KVNamespace;
    };
  } catch {
    return null;
  }
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string; chatId: string }>;
}) {
  const { locale, chatId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("noorai_session")?.value;

  if (!token) {
    redirect(`/${locale}/auth/login`);
  }

  let initialMessages: Message[] = [];

  try {
    const env = await getCloudflareContext();
    if (env) {
      const { validateSession } = await import("@/lib/auth");
      const { getChatById } = await import("@/lib/db/chats");
      const { getMessagesByChatId } = await import("@/lib/db/messages");

      const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token);
      if (!userId) redirect(`/${locale}/auth/login`);

      const chat = await getChatById(env.NOORAI_DB, chatId);
      if (chat && chat.user_id !== userId) {
        notFound();
      }

      if (chat) {
        const dbMessages = await getMessagesByChatId(env.NOORAI_DB, chatId);
        initialMessages = dbMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          attachments: m.attachments ? JSON.parse(m.attachments) : [],
        }));
      }
    }
  } catch (err) {
    throw err;
  }

  return <ChatInterface chatId={chatId} initialMessages={initialMessages} locale={locale} />;
}
