"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { NewChatButton } from "./NewChatButton";
import { ChatList } from "./ChatList";
import { UserMenu } from "../shared/UserMenu";
import { ThemeToggle } from "../shared/ThemeToggle";
import { LocaleSwitcher } from "../shared/LocaleSwitcher";

interface Chat {
  id: string;
  title: string;
  updated_at: number;
}

interface SidebarProps {
  chats: Chat[];
  user: { username: string };
  locale: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ chats, user, locale, isOpen, onClose }: SidebarProps) {
  const t = useTranslations("history");
  const [searchQuery, setSearchQuery] = useState("");
  const isRtl = locale === "fa";

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />}

      <aside
        className={`
          fixed top-0 bottom-0 z-40 flex flex-col
          w-[260px] bg-[var(--surface)] border-e border-[var(--border)]
          transition-transform duration-200
          lg:relative lg:translate-x-0 lg:z-auto
          ${isRtl ? "right-0" : "left-0"}
          ${isOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[var(--accent)] logo-pulse flex items-center justify-center flex-shrink-0">
              <div className="w-3.5 h-3.5 rounded-full bg-white" />
            </div>
            <span className="font-bold text-[var(--text-primary)] text-base tracking-tight">Noor AI</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-secondary)]">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 overflow-hidden px-3 py-3 gap-3">
          <NewChatButton />

          <div className="relative">
            <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-secondary)] ${isRtl ? "right-3" : "left-3"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search")}
              dir={isRtl ? "rtl" : "ltr"}
              className={`w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none py-2 focus:border-[var(--accent)] transition-colors ${isRtl ? "pr-9 pl-3" : "pl-9 pr-3"}`}
            />
          </div>

          <ChatList initialChats={chats} searchQuery={searchQuery} />
        </div>

        <div className="border-t border-[var(--border)] p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
          <UserMenu user={user} />
        </div>
      </aside>
    </>
  );
}
