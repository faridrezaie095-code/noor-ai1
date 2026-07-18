export const runtime = "edge";

import { validateSession } from "@/lib/auth";

interface CloudflareEnv {
  NOORAI_DB: D1Database;
  NOORAI_KV: KVNamespace;
}

function getEnv(): CloudflareEnv {
  return process.env as unknown as CloudflareEnv;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "file_too_big" }, { status: 413 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "Invalid file type" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${file.type};base64,${base64}`;

    return Response.json({ url: dataUrl, name: file.name, type: file.type, size: file.size });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
