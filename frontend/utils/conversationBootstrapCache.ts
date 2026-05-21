import type { ChatMessage, ConversationSummary } from "./conversationApi";

export type ConversationBootstrap = {
  conversation: ConversationSummary;
  messages: ChatMessage[];
};

const cache = new Map<string, ConversationBootstrap>();

/** Store chat data before navigating so the thread screen can render immediately. */
export function primeConversationBootstrap(
  conversationId: string,
  data: ConversationBootstrap,
): void {
  cache.set(conversationId, data);
}

/** Read and remove cached bootstrap (one-shot handoff between screens). */
export function takeConversationBootstrap(conversationId: string): ConversationBootstrap | null {
  const hit = cache.get(conversationId) ?? null;
  if (hit) cache.delete(conversationId);
  return hit;
}
