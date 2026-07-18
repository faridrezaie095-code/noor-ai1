import { kvGet, kvSet, kvDelete } from "./client";

export async function cacheSession(kv: KVNamespace, token: string, userId: string): Promise<void> {
  await kvSet(kv, `session_cache:${token}`, userId, 3600);
}

export async function getCachedSession(kv: KVNamespace, token: string): Promise<string | null> {
  return await kvGet(kv, `session_cache:${token}`);
}

export async function invalidateSessionCache(kv: KVNamespace, token: string): Promise<void> {
  await kvDelete(kv, `session_cache:${token}`);
}
