export interface User {
  id: string;
  username: string;
  password_hash: string;
  locale: string;
  theme: string;
  created_at: number;
  updated_at: number;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  attachments: string | null;
  created_at: number;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}
