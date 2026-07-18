import { Message } from "./client";
import { generateId } from "../utils/generateId";

export async function saveMessage(
  db: D1Database,
  data: {
    chatId: string;
    userId: string;
    role: "user" | "assistant";
    content: string;
    attachments?: string[];
  }
): Promise<Message> {
  const id = generateId();
  const now = Math.floor(Date.now() / 1000);
  const attachmentsJson = data.attachments?.length ? JSON.stringify(data.attachments) : null;

  await db
    .prepare(
      "INSERT INTO messages (id, chat_id, user_id, role, content, attachments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, data.chatId, data.userId, data.role, data.content, attachmentsJson, now)
    .run();

  return {
    id,
    chat_id: data.chatId,
    user_id: data.userId,
    role: data.role,
    content: data.content,
    attachments: attachmentsJson,
    created_at: now,
  };
}

export async function getMessagesByChatId(db: D1Database, chatId: string): Promise<Message[]> {
  const result = await db
    .prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC")
    .bind(chatId)
    .all<Message>();
  return result.results ?? [];
}

export async function getMessageCount(db: D1Database, chatId: string): Promise<number> {
  const result = await db
    .prepare("SELECT COUNT(*) as count FROM messages WHERE chat_id = ?")
    .bind(chatId)
    .first<{ count: number }>();
  return result?.count ?? 0;
}

export async function deleteMessagesByChatId(db: D1Database, chatId: string): Promise<void> {
  await db.prepare("DELETE FROM messages WHERE chat_id = ?").bind(chatId).run();
}
