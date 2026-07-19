export interface AdminUser {
  id: string;
  username: string;
  is_admin: number;
  created_at: number;
  chat_count: number;
  message_count: number;
}

export async function isUserAdmin(db: D1Database, userId: string): Promise<boolean> {
  const result = await db
    .prepare("SELECT is_admin FROM users WHERE id = ?")
    .bind(userId)
    .first<{ is_admin: number }>();
  return result?.is_admin === 1;
}

export async function getAllUsersWithStats(db: D1Database): Promise<AdminUser[]> {
  const result = await db
    .prepare(
      `SELECT
        u.id, u.username, u.is_admin, u.created_at,
        COUNT(DISTINCT c.id) as chat_count,
        COUNT(DISTINCT m.id) as message_count
      FROM users u
      LEFT JOIN chats c ON c.user_id = u.id
      LEFT JOIN messages m ON m.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC`
    )
    .all<AdminUser>();
  return result.results;
}

export async function getUserChats(db: D1Database, userId: string) {
  const result = await db
    .prepare(
      "SELECT id, title, created_at, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC"
    )
    .bind(userId)
    .all();
  return result.results;
}

export async function getChatMessages(db: D1Database, chatId: string) {
  const result = await db
    .prepare(
      "SELECT id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC"
    )
    .bind(chatId)
    .all();
  return result.results;
}
