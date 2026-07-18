export const runtime = "edge";

import { validateSession } from "@/lib/auth";
import { getChatsByUserId, createChat } from "@/lib/db/chats";

interface CloudflareEnv {
  NOORAI_DB: D1Database;
  NOORAI_KV: KVNamespace;
}

function getEnv(): CloudflareEnv {
  return process.env as unknown as CloudflareEnv;
}

export async function GET(request: Request) {
  const env = getEnv();
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.match(/noorai_session=([^;]+)/)?.[1];

  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token);
  if (!userId) return Response.json({ error: "Session expired" }, { status: 401 });

  const chats = await getChatsByUserId(env.NOORAI_DB, userId);
  return Response.json({ chats });
}

export async function POST(request: Request) {
  const env = getEnv();
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.match(/noorai_session=([^;]+)/)?.[1];

  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await validateSession(env.NOORAI_DB, env.NOORAI_KV, token);
  if (!userId) return Response.json({ error: "Session expired" }, { status: 401 });

  const chat = await createChat(env.NOORAI_DB, { userId });
  return Response.json({ chat });
}
