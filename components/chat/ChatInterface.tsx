"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
  isStreaming?: boolean;
  isImage?: boolean;
  imagePrompt?: string;
}

interface ChatInterfaceProps {
  chatId: string;
  initialMessages?: Message[];
  locale: string;
}

export function ChatInterface({ chatId, initialMessages = [], locale }: ChatInterfaceProps) {
  const tErr = useTranslations("errors");
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(
    async (content: string, attachments: string[], isImageMode: boolean) => {
      if (isLoading) return;

      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, attachments };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      if (isImageMode) {
        const placeholderMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          isStreaming: true,
          isImage: true,
          imagePrompt: content,
        };
        setMessages((prev) => [...prev, placeholderMsg]);

        try {
          const res = await fetch("/api/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: content }),
          });

          if (res.status === 429) {
            toast.error(tErr("imageLimitReached"));
            setMessages((prev) => prev.filter((m) => m.id !== placeholderMsg.id));
            setIsLoading(false);
            return;
          }
          if (!res.ok) throw new Error("Image generation failed");

          const data = (await res.json()) as { image: string };
          setMessages((prev) =>
            prev.map((m) => (m.id === placeholderMsg.id ? { ...m, content: data.image, isStreaming: false } : m))
          );
        } catch {
          toast.error(tErr("generic"));
          setMessages((prev) => prev.filter((m) => m.id !== placeholderMsg.id));
        } finally {
          setIsLoading(false);
        }
        return;
      }

      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "", isStreaming: true }]);

      try {
        const apiMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-locale": locale },
          body: JSON.stringify({ messages: apiMessages, chatId }),
        });

        if (res.status === 429) {
          toast.error(tErr("rateLimit"));
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
          setIsLoading(false);
          return;
        }
        if (!res.ok || !res.body) throw new Error("Chat request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m)));
              router.refresh();
              break;
            }
            try {
              const parsed = JSON.parse(data) as { token?: string; error?: string; chatId?: string };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.token) {
                fullContent += parsed.token;
                setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullContent } : m)));
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
      } catch {
        toast.error(tErr("generic"));
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, chatId, locale, isLoading, router, tErr]
  );

  const handleSuggestion = useCallback((text: string) => handleSend(text, [], false), [handleSend]);

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <EmptyState onSuggestion={handleSuggestion} locale={locale} />
      ) : (
        <MessageList messages={messages} isLoading={isLoading} locale={locale} />
      )}
      <ChatInput onSend={handleSend} isLoading={isLoading} locale={locale} />
    </div>
  );
}
