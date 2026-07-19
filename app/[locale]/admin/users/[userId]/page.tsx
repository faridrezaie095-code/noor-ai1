import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth";
import { isUserAdmin, getUserChats } from "@/lib/db/admin";
import { getUserById } from "@/lib/db/users";
import Link from "next/link";

export const runtime = "edge";

async function getEnv() {
  const { getRequestContext } = await import("@cloudflare/next-on-pages");
  return getRequestContext().env as { NOORAI_DB: D1Database; NOORAI_KV: KVNamespace };
}

export default async function AdminUserChatsPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId: targetUserId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("noorai_session")?.value;
  if (!token) redirect(`/${locale}/auth/login`);

  const env = await getEnv();
  const adminUserId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token!);
  if (!adminUserId) redirect(`/${locale}/auth/login`);

  const admin = await isUserAdmin(env.NOORAI_DB, adminUserId);
  if (!admin) redirect(`/${locale}/chat`);

  const targetUser = await getUserById(env.NOORAI_DB, targetUserId);
  const chats = await getUserChats(env.NOORAI_DB, targetUserId);

  return (
    <div className="p-6 max-w-3xl mx-auto text-[var(--text-primary)]">
      <Link href={`/${locale}/admin`} className="text-sm text-[var(--accent)] hover:underline">
        ← بازگشت به لیست کاربران
      </Link>
      <h1 className="text-xl font-bold my-4">گفتگوهای {targetUser?.username}</h1>
      <ul className="space-y-2">
        {chats.map((c: any) => (
          <li
            key={c.id}
            className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]"
          >
            <Link href={`/${locale}/admin/chats/${c.id}`} className="hover:underline">
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
