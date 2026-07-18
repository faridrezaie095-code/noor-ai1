"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChatItem } from "./ChatItem";

interface Chat {
  id: string;
  title: string;
  updated_at: number;
}

interface ChatGroup {
  label: string;
  chats: Chat[];
}

interface ChatListProps {
  initialChats: Chat[];
  searchQuery: string;
}

function groupChats(chats: Chat[], t: ReturnType<typeof useTranslations>): ChatGroup[] {
  const now = Date.now() / 1000;
  const oneDayAgo = now - 86400;
  const twoDaysAgo = now - 86400 * 2;
  const oneWeekAgo = now - 86400 * 7;

  const groups: Record<string, Chat[]> = { today: [], yesterday: [], thisWeek: [], older: [] };

  for (const chat of chats) {
    if (chat.updated_at >= oneDayAgo) groups.today.push(chat);
    else if (chat.updated_at >= twoDaysAgo) groups.yesterday.push(chat);
    else if (chat.updated_at >= oneWeekAgo) groups.thisWeek.push(chat);
    else groups.older.push(chat);
  }

  return [
    { label: t("today"), chats: groups.today },
    { label: t("yesterday"), chats: groups.yesterday },
    { label: t("thisWeek"), chats: groups.thisWeek },
    { label: t("older"), chats: groups.older },
  ].filter((g) => g.chats.length > 0);
}

export function ChatList({ initialChats, searchQuery }: ChatListProps) {
  const t = useTranslations("history");
  const [chats, setChats] = useState<Chat[]>(initialChats);

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  const handleDelete = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = searchQuery ? chats.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase())) : chats;

  if (filtered.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">{t("empty")}</p>
      </div>
    );
  }

  const grouped = searchQuery ? [{ label: "", chats: filtered }] : groupChats(filtered, t);

  return (
    <div className="space-y-4 overflow-y-auto flex-1 pb-2">
      {grouped.map((group) => (
        <div key={group.label}>
          {group.label && (
            <p className="px-3 mb-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{group.label}</p>
          )}
          <div className="space-y-0.5">
            {group.chats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
