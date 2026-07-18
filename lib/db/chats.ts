import { Chat } from "./client";
import { generateId } from "../utils/generateId";

export async function createChat(
  db: D1Database,
  data: { userId: string; title?: string }
): Promise<Chat> {
  const id = generateId();
  const now = Math.floor(Date.now() / 1000);
  const title = data.title ?? "گفتگوی جدید";

  await db
    .prepare(
      "INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, data.userId, title, now, now)
    .run();

  return { id, user_id: data.userId, title, created_at: now, updated_at: now };
}

export async function getChatById(db: D1Database, chatId: string): Promise<Chat | null> {
  const result = await db.prepare("SELECT * FROM chats WHERE id = ?").bind(chatId).first<Chat>();
  return result ?? null;
}

export async function getChatsByUserId(db: D1Database, userId: string): Promise<Chat[]> {
  const result = await db
    .prepare("SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100")
    .bind(userId)
    .all<Chat>();
  return result.results ?? [];
}

export async function updateChatTitle(db: D1Database, chatId: string, title: string): Promise<void> {
  await db
    .prepare("UPDATE chats SET title = ?, updated_at = ? WHERE id = ?")
    .bind(title, Math.floor(Date.now() / 1000), chatId)
    .run();
}

export async function touchChat(db: D1Database, chatId: string): Promise<void> {
  await db
    .prepare("UPDATE chats SET updated_at = ? WHERE id = ?")
    .bind(Math.floor(Date.now() / 1000), chatId)
    .run();
}

export async function deleteChat(db: D1Database, chatId: string): Promise<void> {
  await db.prepare("DELETE FROM chats WHERE id = ?").bind(chatId).run();
}
