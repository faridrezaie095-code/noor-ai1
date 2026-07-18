import { User } from "./client";
import { generateId } from "../utils/generateId";

export async function createUser(
  db: D1Database,
  data: { username: string; password_hash: string }
): Promise<User> {
  const id = generateId();
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      "INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, data.username, data.password_hash, now, now)
    .run();

  return {
    id,
    username: data.username,
    password_hash: data.password_hash,
    locale: "fa",
    theme: "light",
    created_at: now,
    updated_at: now,
  };
}

export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
  const result = await db
    .prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first<User>();
  return result ?? null;
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>();
  return result ?? null;
}

export async function updateUserLocale(db: D1Database, userId: string, locale: string): Promise<void> {
  await db
    .prepare("UPDATE users SET locale = ?, updated_at = ? WHERE id = ?")
    .bind(locale, Math.floor(Date.now() / 1000), userId)
    .run();
}

export async function updateUserTheme(db: D1Database, userId: string, theme: string): Promise<void> {
  await db
    .prepare("UPDATE users SET theme = ?, updated_at = ? WHERE id = ?")
    .bind(theme, Math.floor(Date.now() / 1000), userId)
    .run();
}
