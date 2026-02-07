import type OpenAI from "openai";
import { ChatRole } from "../../../common/enums";
import type { ChatMessage } from "../entities/chat-message.entity";

type ChatCompletionMessageParam = OpenAI.ChatCompletionMessageParam;

const DEFAULT_MAX_MESSAGES = 40;

const ROLE_MAP: Record<string, "user" | "assistant"> = {
  [ChatRole.User]: "user",
  [ChatRole.Assistant]: "assistant",
};

export function buildConversationHistory(
  messages: ReadonlyArray<ChatMessage>,
  maxMessages = DEFAULT_MAX_MESSAGES,
): ChatCompletionMessageParam[] {
  const recent = messages.slice(-maxMessages);

  return recent.reduce<ChatCompletionMessageParam[]>((acc, msg) => {
    const role = ROLE_MAP[msg.role];
    if (!role || !msg.content) {
      return acc;
    }
    return [...acc, { role, content: msg.content }];
  }, []);
}
