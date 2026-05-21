// =============================================================================
// Message Service — persist + map chat payloads
// =============================================================================

import { randomUUID } from "crypto";
import { prisma } from "../config/database";
import type { MessageResponse } from "../types";
import type { SocketChatMessagePayload } from "../types/socketEvents";
import { assertConversationParticipant } from "./conversation.service";

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: Date;
};

export function toMessageResponse(row: MessageRow): MessageResponse {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.body,
    createdAt: row.created_at.toISOString(),
  };
}

export function toSocketMessagePayload(
  row: MessageRow,
  clientId?: string,
): SocketChatMessagePayload {
  return {
    id: row.id,
    roomType: "conversation",
    roomId: row.conversation_id,
    senderId: row.sender_id,
    text: row.body,
    createdAt: row.created_at.toISOString(),
    clientId,
  };
}

/** Build a wire payload before DB write so we can broadcast immediately. */
export function buildConversationMessagePayload(
  conversationId: string,
  senderId: string,
  text: string,
  clientId?: string,
  id: string = randomUUID(),
  createdAt: Date = new Date(),
): SocketChatMessagePayload {
  return {
    id,
    roomType: "conversation",
    roomId: conversationId,
    senderId,
    text: text.trim(),
    createdAt: createdAt.toISOString(),
    clientId,
  };
}

export async function persistConversationMessage(
  payload: SocketChatMessagePayload,
): Promise<void> {
  const createdAt = new Date(payload.createdAt);
  await prisma.messages.create({
    data: {
      id: payload.id,
      conversation_id: payload.roomId,
      sender_id: payload.senderId,
      body: payload.text,
      message_type: "text",
      created_at: createdAt,
    },
  });

  await prisma.conversations.update({
    where: { id: payload.roomId },
    data: { last_message_at: createdAt },
  });
}

export async function createConversationMessage(
  conversationId: string,
  senderId: string,
  text: string,
  clientId?: string,
): Promise<SocketChatMessagePayload> {
  await assertConversationParticipant(conversationId, senderId);
  const payload = buildConversationMessagePayload(conversationId, senderId, text, clientId);
  await persistConversationMessage(payload);
  return payload;
}

export async function listConversationMessages(
  conversationId: string,
  userId: string,
  limit = 50,
): Promise<MessageResponse[]> {
  await assertConversationParticipant(conversationId, userId);

  const rows = await prisma.messages.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: "asc" },
    take: limit,
  });

  return rows.map(toMessageResponse);
}
