"use client";

import { useTranslations } from "next-intl";

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
  locale: string;
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  const t = useTranslations("chat");

  const suggestions = [
    { key: "email" as const, emoji: "📝" },
    { key: "code" as const, emoji: "💻" },
    { key: "image" as const, emoji: "🎨" },
    { key: "travel" as const, emoji: "✈️" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-[580px] w-full text-center space-y-8">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] logo-pulse flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 rounded-full bg-white/90" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t("emptyTitle")}</h1>
          <p className="text-[var(--text-secondary)] text-sm">{t("emptySubtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {suggestions.map(({ key, emoji }) => (
            <button
              key={key}
              onClick={() => onSuggestion(t(`suggestions.${key}`))}
              className="group flex items-center gap-3 bg-[var(--surface)] hover:bg-[var(--user-bubble)] border border-[var(--border)] hover:border-[var(--accent)]/30 rounded-xl px-4 py-3.5 text-sm text-[var(--text-primary)] transition-all text-start"
            >
              <span className="text-xl flex-shrink-0">{emoji}</span>
              <span className="font-medium leading-snug group-hover:text-[var(--accent)] transition-colors">
                {t(`suggestions.${key}`)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
