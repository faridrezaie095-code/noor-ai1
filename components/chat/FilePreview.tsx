"use client";

import { X, FileText } from "lucide-react";

interface FilePreviewProps {
  file: { name: string; type: string; url: string };
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/");

  return (
    <div className="relative inline-block">
      {isImage ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 max-w-[200px]">
          <FileText size={16} className="text-[var(--accent)] flex-shrink-0" />
          <span className="text-xs text-[var(--text-primary)] truncate">{file.name}</span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Remove file"
      >
        <X size={11} />
      </button>
    </div>
  );
}
