const LIMITS = { chat: 50, image: 5 } as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

export async function checkRateLimit(
  kv: KVNamespace,
  userId: string,
  type: "chat" | "image"
): Promise<RateLimitResult> {
  const today = new Date().toISOString().split("T")[0];
  const key = `ratelimit:${userId}:${today}`;

  const raw = await kv.get(key);
  const counts: Record<string, number> = raw ? JSON.parse(raw) : { chat: 0, image: 0 };
  const used = counts[type] || 0;
  const allowed = used < LIMITS[type];

  if (allowed) {
    counts[type] = used + 1;
    await kv.put(key, JSON.stringify(counts), { expirationTtl: 86400 });
  }

  return {
    allowed,
    remaining: Math.max(0, LIMITS[type] - used - (allowed ? 1 : 0)),
    resetAt: `${today}T20:30:00Z`,
  };
}
