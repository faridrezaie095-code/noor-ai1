"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
  isStreaming?: boolean;
  isImage?: boolean;
  imagePrompt?: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  locale: string;
}

export function MessageList({ messages, isLoading, locale }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-6 pb-2">
      <div className="max-w-[780px] mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} locale={locale} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-start gap-3 mb-6">
            <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex-shrink-0 mt-0.5 logo-pulse flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
