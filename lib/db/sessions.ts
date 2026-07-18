import { Session } from "./client";
import { generateId } from "../utils/generateId";

export async function createSession(
  db: D1Database,
  data: { userId: string; expiresAt: number }
): Promise<Session> {
  const id = generateId();
  const token = generateId() + generateId();
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      "INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, data.userId, token, data.expiresAt, now)
    .run();

  return { id, user_id: data.userId, token, expires_at: data.expiresAt, created_at: now };
}

export async function getSessionByToken(db: D1Database, token: string): Promise<Session | null> {
  const result = await db
    .prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > ?")
    .bind(token, Math.floor(Date.now() / 1000))
    .first<Session>();
  return result ?? null;
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export async function deleteExpiredSessions(db: D1Database): Promise<void> {
  await db
    .prepare("DELETE FROM sessions WHERE expires_at < ?")
    .bind(Math.floor(Date.now() / 1000))
    .run();
}
