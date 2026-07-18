"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Paperclip, Sparkles, ArrowUp, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilePreview } from "./FilePreview";
import { toast } from "sonner";

interface AttachedFile {
  name: string;
  type: string;
  url: string;
}

interface ChatInputProps {
  onSend: (content: string, attachments: string[], isImageMode: boolean) => void;
  isLoading: boolean;
  locale: string;
}

export function ChatInput({ onSend, isLoading, locale }: ChatInputProps) {
  const t = useTranslations("chat");
  const tErr = useTranslations("errors");
  const [content, setContent] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [imageMode, setImageMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRtl = locale === "fa";

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;
    const urls = attachedFiles.map((f) => f.url);
    onSend(trimmed, urls, imageMode);
    setContent("");
    setAttachedFiles([]);
    setImageMode(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(tErr("fileTooBig"));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { url: string; name: string; type: string };
      setAttachedFiles((prev) => [...prev, { name: data.name, type: data.type, url: data.url }]);
    } catch {
      toast.error(tErr("generic"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = content.trim().length > 0 && !isLoading;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl px-4 pt-3 pb-4">
      <div className="max-w-[780px] mx-auto">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((file, i) => (
              <FilePreview key={i} file={file} onRemove={() => removeFile(i)} />
            ))}
          </div>
        )}

        {imageMode && (
          <div className="flex items-center gap-2 mb-2 text-xs text-[var(--accent)] font-medium">
            <Sparkles size={13} />
            {t("imageMode")}
          </div>
        )}

        <div className={`flex items-end gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-3 py-2.5 focus-within:border-[var(--accent)] transition-colors ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isLoading}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
            title={t("attach")}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>

          <button
            type="button"
            onClick={() => setImageMode(!imageMode)}
            disabled={isLoading}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
              imageMode ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title={t("imageMode")}
          >
            <Sparkles size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={imageMode ? (isRtl ? "تصویری که می‌خوای توصیف کن..." : "Describe the image you want...") : t("placeholder")}
            rows={1}
            dir={isRtl ? "rtl" : "ltr"}
            className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none min-h-[28px] max-h-[200px] py-0.5 leading-relaxed"
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              canSend ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-sm" : "bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed"
            }`}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-2">
          {isRtl ? "Noor AI ممکنه اشتباه کنه. اطلاعات مهم رو بررسی کن." : "Noor AI can make mistakes. Check important info."}
        </p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
    </div>
  );
}
