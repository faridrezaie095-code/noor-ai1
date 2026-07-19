import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth";
import { isUserAdmin, getAllUsersWithStats } from "@/lib/db/admin";
import Link from "next/link";

export const runtime = "edge";

async function getEnv() {
  const { getRequestContext } = await import("@cloudflare/next-on-pages");
  return getRequestContext().env as { NOORAI_DB: D1Database; NOORAI_KV: KVNamespace };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("noorai_session")?.value;
  if (!token) redirect(`/${locale}/auth/login`);

  const env = await getEnv();
  const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token!);
  if (!userId) redirect(`/${locale}/auth/login`);

  const admin = await isUserAdmin(env.NOORAI_DB, userId);
  if (!admin) redirect(`/${locale}/chat`);

  const users = await getAllUsersWithStats(env.NOORAI_DB);

  return (
    <div className="p-6 max-w-5xl mx-auto text-[var(--text-primary)]">
      <h1 className="text-xl font-bold mb-6">پنل ادمین — کاربران</h1>
      <table className="w-full text-sm border border-[var(--border)] rounded-xl overflow-hidden">
        <thead className="bg-[var(--surface)]">
          <tr>
            <th className="p-3 text-right">یوزرنیم</th>
            <th className="p-3 text-right">تعداد چت</th>
            <th className="p-3 text-right">تعداد پیام</th>
            <th className="p-3 text-right">تاریخ ثبت‌نام</th>
            <th className="p-3 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-[var(--border)]">
              <td className="p-3">
                {u.username}
                {u.is_admin ? " (ادمین)" : ""}
              </td>
              <td className="p-3">{u.chat_count}</td>
              <td className="p-3">{u.message_count}</td>
              <td className="p-3">
                {new Date(u.created_at * 1000).toLocaleDateString("fa-IR")}
              </td>
              <td className="p-3">
                <Link
                  href={`/${locale}/admin/users/${u.id}`}
                  className="text-[var(--accent)] hover:underline"
                >
                  مشاهده گفتگوها
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
