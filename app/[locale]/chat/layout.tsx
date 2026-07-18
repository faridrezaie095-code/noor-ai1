import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileHeader } from "@/components/sidebar/MobileHeader";
import { Toaster } from "sonner";

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

export default async function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("noorai_session")?.value;

  if (!token) {
    redirect(`/${locale}/auth/login`);
  }

  let user = { username: "user" };
  let chats: Array<{ id: string; title: string; updated_at: number }> = [];

  try {
    const env = await getCloudflareContext();
    if (env) {
      const { validateSession } = await import("@/lib/auth");
      const { getUserById } = await import("@/lib/db/users");
      const { getChatsByUserId } = await import("@/lib/db/chats");

      const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token);
      if (!userId) {
        redirect(`/${locale}/auth/login`);
      }

      const dbUser = await getUserById(env.NOORAI_DB, userId);
      if (dbUser) {
        user = { username: dbUser.username };
      }

      chats = await getChatsByUserId(env.NOORAI_DB, userId);
    }
  } catch (err) {
    throw err;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          },
        }}
      />

      <div className="hidden lg:flex">
        <Sidebar chats={chats} user={user} locale={locale} />
      </div>

      <MobileHeader chats={chats} user={user} locale={locale} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
