import { redirect } from "next/navigation";
import { cookies } from "next/headers";

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

export default async function ChatIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("noorai_session")?.value;

  if (!token) {
    redirect(`/${locale}/auth/login`);
  }

  try {
    const env = await getCloudflareContext();
    if (env) {
      const { validateSession } = await import("@/lib/auth");
      const { createChat } = await import("@/lib/db/chats");

      const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token);
      if (!userId) redirect(`/${locale}/auth/login`);

      const chat = await createChat(env.NOORAI_DB, { userId });
      redirect(`/${locale}/chat/${chat.id}`);
    }
  } catch (err) {
    throw err;
  }

  const tempChatId = crypto.randomUUID();
  redirect(`/${locale}/chat/${tempChatId}`);
}
