"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface MobileHeaderProps {
  chats: Array<{ id: string; title: string; updated_at: number }>;
  user: { username: string };
  locale: string;
}

export function MobileHeader({ chats, user, locale }: MobileHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 h-14 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)]">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)]">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent)] logo-pulse flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="font-bold text-sm text-[var(--text-primary)]">Noor AI</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="lg:hidden h-14 flex-shrink-0" />

      <Sidebar chats={chats} user={user} locale={locale} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
