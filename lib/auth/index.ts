import { createUser, getUserByUsername } from "../db/users";
import { createSession, getSessionByToken, deleteSession } from "../db/sessions";
import { cacheSession, getCachedSession, invalidateSessionCache } from "../kv/cache";

// 30 days in seconds
const SESSION_DURATION = 60 * 60 * 24 * 30;

// Username rules: 3-20 chars, letters/numbers/underscore only
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

export async function registerUser(
  db: D1Database,
  kv: KVNamespace,
  data: { username: string; password: string }
): Promise<{ token: string; userId: string } | { error: string } > {
  if (!isValidUsername(data.username)) {
    return { error: "invalid_username" };
  }
  if (data.password.length < 6) {
    return { error: "weak_password" };
  }

  const existing = await getUserByUsername(db, data.username);
  if (existing) {
    return { error: "username_taken" };
  }

  const passwordHash = await hashPassword(data.password);
  const user = await createUser(db, { username: data.username, password_hash: passwordHash });

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const session = await createSession(db, { userId: user.id, expiresAt });

  await cacheSession(kv, session.token, user.id);

  return { token: session.token, userId: user.id };
}

export async function loginUser(
  db: D1Database,
  kv: KVNamespace,
  data: { username: string; password: string }
): Promise<{ token: string; userId: string; username: string } | null> {
  const user = await getUserByUsername(db, data.username);
  if (!user) return null;

  const valid = await verifyPassword(data.password, user.password_hash);
  if (!valid) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const session = await createSession(db, { userId: user.id, expiresAt });

  await cacheSession(kv, session.token, user.id);

  return { token: session.token, userId: user.id, username: user.username };
}

export async function logoutUser(db: D1Database, kv: KVNamespace, token: string): Promise<void> {
  await deleteSession(db, token);
  await invalidateSessionCache(kv, token);
}

export async function validateSession(
  db: D1Database,
  kv: KVNamespace,
  token: string
): Promise<string | null> {
  const cached = await getCachedSession(kv, token);
  if (cached) return cached;

  const session = await getSessionByToken(db, token);
  if (!session) return null;

  await cacheSession(kv, token, session.user_id);
  return session.user_id;
}
