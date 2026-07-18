"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

interface ImageMessageProps {
  src: string;
  prompt: string;
}

export function ImageMessage({ src, prompt }: ImageMessageProps) {
  const t = useTranslations("chat");
  const [hovered, setHovered] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `noor-ai-${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="relative inline-block rounded-xl overflow-hidden max-w-sm">
      <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <img src={src} alt={prompt} className="w-full h-auto rounded-xl" />
        {hovered && (
          <div className="absolute inset-0 bg-black/30 flex items-end justify-end p-3 rounded-xl">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-[var(--text-primary)] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
            >
              <Download size={13} />
              {t("download")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
