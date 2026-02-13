import type OpenAI from "openai";
import { ChatRole } from "../../../common/enums";
import type { ChatMessage } from "../entities/chat-message.entity";

type ChatCompletionMessageParam = OpenAI.ChatCompletionMessageParam;

const DEFAULT_MAX_MESSAGES = 40;

const ROLE_MAP: Record<string, "user" | "assistant"> = {
  [ChatRole.User]: "user",
  [ChatRole.Assistant]: "assistant",
};

type BuildConversationHistoryOptions = {
  timeZone?: string;
};

const formatMessageTimestamp = (value: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  return `${year}-${month}-${day} ${hour}:${minute}`;
};

function isStoredToolMessage(
  msg: unknown,
): msg is { role: "tool"; tool_call_id: string; content: string } {
  if (typeof msg !== "object" || msg === null) return false;
  const obj = msg as Record<string, unknown>;
  return obj.role === "tool" && typeof obj.tool_call_id === "string";
}

function isStoredAssistantToolCall(
  msg: unknown,
): msg is { role: "assistant"; content: string | null; tool_calls: unknown[] } {
  if (typeof msg !== "object" || msg === null) return false;
  const obj = msg as Record<string, unknown>;
  return obj.role === "assistant" && Array.isArray(obj.tool_calls);
}

function extractToolMessages(
  metadata: Record<string, unknown> | null,
): ChatCompletionMessageParam[] {
  if (!metadata) return [];
  const stored = metadata.toolMessages;
  if (!Array.isArray(stored)) return [];

  return stored.reduce<ChatCompletionMessageParam[]>((acc, entry) => {
    if (isStoredAssistantToolCall(entry)) {
      return [...acc, entry as ChatCompletionMessageParam];
    }
    if (isStoredToolMessage(entry)) {
      return [...acc, entry as ChatCompletionMessageParam];
    }
    return acc;
  }, []);
}

export function buildConversationHistory(
  messages: ReadonlyArray<ChatMessage>,
  maxMessages = DEFAULT_MAX_MESSAGES,
  options?: BuildConversationHistoryOptions,
): ChatCompletionMessageParam[] {
  const timeZone = options?.timeZone || "UTC";
  const recent = messages.slice(-maxMessages);

  return recent.reduce<ChatCompletionMessageParam[]>((acc, msg) => {
    const role = ROLE_MAP[msg.role];
    if (!role || !msg.content) {
      return acc;
    }

    const timestamp = formatMessageTimestamp(msg.createdAt, timeZone);

    if (role === "assistant") {
      const toolMsgs = extractToolMessages(msg.metadata);
      const content = `[${timestamp} ${timeZone}] ${msg.content}`;
      return [...acc, ...toolMsgs, { role, content }];
    }

    const content = `[${timestamp} ${timeZone}] ${msg.content}`;
    return [...acc, { role, content }];
  }, []);
}
