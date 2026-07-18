"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check } from "lucide-react";
import { ImageMessage } from "./ImageMessage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
  isStreaming?: boolean;
  isImage?: boolean;
  imagePrompt?: string;
}

interface MessageBubbleProps {
  message: Message;
  locale: string;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") ?? "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-[#1a1a2e] px-4 py-2">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({ message, locale }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isRtl = locale === "fa";

  if (message.isImage && message.content && message.imagePrompt) {
    return (
      <div className={`flex ${isRtl ? "flex-row-reverse" : "flex-row"} mb-6`}>
        <div className="max-w-[80%]">
          <ImageMessage src={message.content} prompt={message.imagePrompt} />
          <p className="text-xs text-[var(--text-secondary)] mt-1 px-1">{message.imagePrompt}</p>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className={`flex ${isRtl ? "flex-row-reverse" : "flex-row"} mb-6 justify-end`}>
        <div className="max-w-[75%] space-y-2">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {message.attachments.map((url, i) =>
                url.startsWith("data:image/") ? (
                  <img key={i} src={url} alt="attachment" className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-[var(--border)]" />
                ) : (
                  <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                    📄 Attachment
                  </div>
                )
              )}
            </div>
          )}
          {message.content && (
            <div
              className="bg-[var(--user-bubble)] text-[var(--text-primary)] px-4 py-3 rounded-2xl rounded-ee-sm text-sm leading-relaxed"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex-shrink-0 mt-0.5 logo-pulse flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white" />
        </div>
        <div
          className={`flex-1 min-w-0 text-sm leading-relaxed text-[var(--text-primary)] prose ${message.isStreaming ? "streaming-cursor" : ""}`}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code({ className, children, ...props }) {
                const isBlock = className?.startsWith("language-");
                if (isBlock) {
                  return <CodeBlock className={className}>{String(children).replace(/\n$/, "")}</CodeBlock>;
                }
                return <code className={className} {...props}>{children}</code>;
              },
              pre({ children }) {
                return <>{children}</>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
