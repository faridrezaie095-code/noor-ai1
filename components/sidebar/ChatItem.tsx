"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Trash2, MessageSquare } from "lucide-react";

interface Chat {
  id: string;
  title: string;
  updated_at: number;
}

interface ChatItemProps {
  chat: Chat;
  onDelete: (id: string) => void;
}

export function ChatItem({ chat, onDelete }: ChatItemProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const [deleting, setDeleting] = useState(false);
  const isActive = pathname.includes(chat.id);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      await fetch(`/api/history/${chat.id}`, { method: "DELETE" });
      onDelete(chat.id);
      if (isActive) router.push(`/${locale}/chat`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={() => router.push(`/${locale}/chat/${chat.id}`)}
      className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-start ${
        isActive ? "bg-[var(--user-bubble)] text-[var(--accent)] font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
      }`}
    >
      <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
      <span className="flex-1 truncate">{chat.title}</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--text-secondary)] hover:text-red-500 transition-all"
        aria-label="Delete chat"
      >
        <Trash2 size={12} />
      </button>
    </button>
  );
}
