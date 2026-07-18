export const runtime = "edge";

import { loginUser, registerUser, logoutUser } from "@/lib/auth";

interface CloudflareEnv {
  NOORAI_DB: D1Database;
  NOORAI_KV: KVNamespace;
}

function getEnv(): CloudflareEnv {
  return process.env as unknown as CloudflareEnv;
}

export async function POST(request: Request) {
  const env = getEnv();
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "login") {
      const { username, password } = (await request.json()) as {
        username: string;
        password: string;
      };
      if (!username || !password) {
        return Response.json({ error: "username_and_password_required" }, { status: 400 });
      }

      const result = await loginUser(env.NOORAI_DB, env.NOORAI_KV, { username, password });
      if (!result) {
        return Response.json({ error: "invalid_credentials" }, { status: 401 });
      }

      const response = Response.json({ success: true, username: result.username });
      const headers = new Headers(response.headers);
      headers.set(
        "Set-Cookie",
        `noorai_session=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`
      );
      return new Response(response.body, { status: 200, headers });
    }

    if (action === "register") {
      const { username, password } = (await request.json()) as {
        username: string;
        password: string;
      };
      if (!username || !password) {
        return Response.json({ error: "username_and_password_required" }, { status: 400 });
      }

      const result = await registerUser(env.NOORAI_DB, env.NOORAI_KV, { username, password });
      if ("error" in result) {
        const statusMap: Record<string, number> = {
          invalid_username: 400,
          weak_password: 400,
          username_taken: 409,
        };
        return Response.json(
          { error: result.error },
          { status: statusMap[result.error] ?? 400 }
        );
      }

      const response = Response.json({ success: true });
      const headers = new Headers(response.headers);
      headers.set(
        "Set-Cookie",
        `noorai_session=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`
      );
      return new Response(response.body, { status: 200, headers });
    }

    if (action === "logout") {
      const cookie = request.headers.get("cookie") ?? "";
      const token = cookie.match(/noorai_session=([^;]+)/)?.[1];
      if (token) {
        await logoutUser(env.NOORAI_DB, env.NOORAI_KV, token);
      }

      const headers = new Headers();
      headers.set("Set-Cookie", "noorai_session=; Path=/; HttpOnly; Max-Age=0");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return Response.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    console.error("Auth error:", err);
    return Response.json({ error: "internal_server_error" }, { status: 500 });
  }
}
