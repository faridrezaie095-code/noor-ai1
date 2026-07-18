export type KVStore = KVNamespace;

export async function kvGet(kv: KVStore, key: string): Promise<string | null> {
  return await kv.get(key);
}

export async function kvSet(kv: KVStore, key: string, value: string, ttl?: number): Promise<void> {
  if (ttl) {
    await kv.put(key, value, { expirationTtl: ttl });
  } else {
    await kv.put(key, value);
  }
}

export async function kvDelete(kv: KVStore, key: string): Promise<void> {
  await kv.delete(key);
}
