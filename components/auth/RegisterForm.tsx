"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tErr = useTranslations("errors");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isRtl = locale === "fa";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push(`/${locale}/chat`);
        router.refresh();
      } else {
        const data = (await res.json()) as { error: string };
        const errorMap: Record<string, string> = {
          username_taken: tErr("usernameTaken"),
          invalid_username: tErr("invalidUsername"),
          weak_password: tErr("weakPassword"),
        };
        toast.error(errorMap[data.error] ?? tErr("generic"));
      }
    } catch {
      toast.error(tErr("generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] logo-pulse flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("registerTitle")}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("registerSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t("username")}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] transition-colors"
            placeholder={isRtl ? "نام کاربری" : "username"}
          />
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{t("usernameHint")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t("password")}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              dir="ltr"
              className={`w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] transition-colors ${isRtl ? "pl-10" : "pr-10"}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${isRtl ? "left-3" : "right-3"}`}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{t("passwordHint")}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {t("register")}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        {t("hasAccount")}{" "}
        <Link href={`/${locale}/auth/login`} className="text-[var(--accent)] hover:underline font-medium">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
