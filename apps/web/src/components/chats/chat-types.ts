export type ChatSession = {
  id: string;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};
