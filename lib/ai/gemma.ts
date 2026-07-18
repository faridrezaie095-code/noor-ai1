import { GoogleGenerativeAI } from "@google/generative-ai";

// Single model in use: Gemma 4 26B (Mixture-of-Experts variant).
// Released April 2026, available via the Gemini API / Google AI Studio free tier.
// If you want the larger flagship instead, swap to "gemma-4-31b-it"
// (dense 31B — higher quality, but heavier and slower on the free tier).
const MODEL_NAME = "gemma-4-26b-a4b-it";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
}

export async function streamGemmaResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
  onChunk: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: systemPrompt,
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 4096,
    thinkingConfig: {
      thinkingLevel: "minimal",
    },
  } as any,
});

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: msg.attachments?.length
      ? [
          ...msg.attachments.map((b64) => ({
            inlineData: {
              data: b64.split(",")[1],
              mimeType: b64.split(";")[0].split(":")[1],
            },
          })),
          { text: msg.content },
        ]
      : [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1];

  const parts = lastMessage.attachments?.length
    ? [
        ...lastMessage.attachments.map((b64) => ({
          inlineData: {
            data: b64.split(",")[1],
            mimeType: b64.split(";")[0].split(":")[1],
          },
        })),
        { text: lastMessage.content },
      ]
    : lastMessage.content;

  const result = await chat.sendMessageStream(parts);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) onChunk(text);
  }
  onDone();
}
