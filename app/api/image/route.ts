export const runtime = "edge";

import { generateImage } from "@/lib/ai/imagegen";
import { validateSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/kv/ratelimit";

interface CloudflareEnv {
  NOORAI_DB: D1Database;
  NOORAI_KV: KVNamespace;
  HUGGINGFACE_API_KEY: string;
}

function getEnv(): CloudflareEnv {
  return process.env as unknown as CloudflareEnv;
}

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

  const rateLimitResult = await checkRateLimit(env.NOORAI_KV, userId, "image");
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: "image_limit", remaining: 0, resetAt: rateLimitResult.resetAt },
      { status: 429 }
    );
  }

  const { prompt } = (await request.json()) as { prompt: string };
  if (!prompt) {
    return Response.json({ error: "Prompt required" }, { status: 400 });
  }

  try {
    const imageBase64 = await generateImage(prompt, env.HUGGINGFACE_API_KEY);
    return Response.json({ image: imageBase64 });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json({ error: "Image generation failed" }, { status: 500 });
  }
}
