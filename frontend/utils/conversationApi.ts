import { apiFetch } from "../lib/apiFetch";

export type ConversationPeer = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ConversationSummary = {
  id: string;
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  productPrice: number;
  buyerId: string;
  sellerId: string;
  peer: ConversationPeer;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  createdAt: string;
  lastMessageAt: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  /** "text" | "order_card" | "system". Defaults to "text" if older payloads omit it. */
  messageType?: string;
  /** Set for messageType === "order_card"; lets the chat UI link into the order. */
  orderId?: string | null;
};

export type ConversationBootstrap = {
  conversation: ConversationSummary;
  messages: ChatMessage[];
};

export async function listConversations(): Promise<ConversationSummary[]> {
  const data = await apiFetch<{ conversations: ConversationSummary[] }>("/api/conversations");
  return data.conversations;
}

export async function openConversation(productId: string): Promise<ConversationBootstrap> {
  return apiFetch<ConversationBootstrap>("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

/** Single round-trip: conversation metadata + recent messages. */
export async function getConversationChat(conversationId: string): Promise<ConversationBootstrap> {
  return apiFetch<ConversationBootstrap>(`/api/conversations/${conversationId}`);
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const data = await apiFetch<{ messages: ChatMessage[] }>(
    `/api/conversations/${conversationId}/messages`,
  );
  return data.messages;
}

export async function getConversation(conversationId: string): Promise<ConversationSummary> {
  const data = await getConversationChat(conversationId);
  return data.conversation;
}
