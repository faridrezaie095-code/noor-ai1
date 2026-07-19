import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth";
import { isUserAdmin, getChatMessages } from "@/lib/db/admin";

export const runtime = "edge";

async function getEnv() {
  const { getRequestContext } = await import("@cloudflare/next-on-pages");
  return getRequestContext().env as { NOORAI_DB: D1Database; NOORAI_KV: KVNamespace };
}

export default async function AdminChatViewPage({
  params,
}: {
  params: Promise<{ locale: string; chatId: string }>;
}) {
  const { locale, chatId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("noorai_session")?.value;
  if (!token) redirect(`/${locale}/auth/login`);

  const env = await getEnv();
  const adminUserId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token!);
  if (!adminUserId) redirect(`/${locale}/auth/login`);

  const admin = await isUserAdmin(env.NOORAI_DB, adminUserId);
  if (!admin) redirect(`/${locale}/chat`);

  const messages = await getChatMessages(env.NOORAI_DB, chatId);

  return (
    <div className="p-6 max-w-2xl mx-auto text-[var(--text-primary)] space-y-3">
      {messages.map((m: any) => (
        <div
          key={m.id}
          className={`p-3 rounded-xl ${
            m.role === "user" ? "bg-[var(--accent)]/20 ms-auto" : "bg-[var(--surface)]"
          } max-w-[80%]`}
        >
          <div className="text-xs text-[var(--text-secondary)] mb-1">
            {m.role === "user" ? "کاربر" : "دستیار"}
          </div>
          <div className="whitespace-pre-wrap text-sm">{m.content}</div>
        </div>
      ))}
    </div>
  );
}
