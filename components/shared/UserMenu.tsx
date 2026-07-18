"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";

interface UserMenuProps {
  user: { username: string };
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth?action=logout", { method: "POST" });
    router.push(`/${locale}/auth/login`);
    router.refresh();
  };

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--surface)] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-start">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate leading-tight">
            {user.username}
          </p>
        </div>
        <ChevronUp
          size={14}
          className={`flex-shrink-0 text-[var(--text-secondary)] transition-transform ${open ? "" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full start-0 end-0 mb-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={15} />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
