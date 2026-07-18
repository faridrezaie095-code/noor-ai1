"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const nextLocale = locale === "fa" ? "en" : "fa";
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={switchLocale}
      className="px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
    >
      {locale === "fa" ? "EN" : "فا"}
    </button>
  );
}
