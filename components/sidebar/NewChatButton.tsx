"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export function NewChatButton() {
  const t = useTranslations("chat");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(false);

  const handleNewChat = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/history", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create chat");
      const data = (await res.json()) as { chat: { id: string } };
      router.push(`/${locale}/chat/${data.chat.id}`);
    } catch {
      router.push(`/${locale}/chat`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleNewChat}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--user-bubble)] text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all disabled:opacity-50"
    >
      <Plus size={16} />
      {t("newChat")}
    </button>
  );
}
