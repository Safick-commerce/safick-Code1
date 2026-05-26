// =============================================================================
// Conversation Service — product-linked threads
// =============================================================================

import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import type { ConversationListItemResponse, ConversationResponse } from "../types";

type ConversationWithRelations = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: Date;
  last_message_at: Date | null;
  products: { id: string; title: string; image_url: string | null; price: number | { toNumber(): number } };
  buyer: { id: string; display_name: string | null; full_name: string | null; username: string | null; avatar_url: string | null };
  seller: { id: string; display_name: string | null; full_name: string | null; username: string | null; avatar_url: string | null };
  messages?: { body: string; created_at: Date; sender_id: string }[];
};

function displayName(
  profile: { display_name: string | null; full_name: string | null; username: string | null },
): string {
  return profile.display_name ?? profile.full_name ?? profile.username ?? "User";
}

function toConversationResponse(
  row: ConversationWithRelations,
  viewerId: string,
): ConversationResponse {
  const peer = row.buyer_id === viewerId ? row.seller : row.buyer;
  const last = row.messages?.[0];
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.products.title,
    productImageUrl: row.products.image_url,
    productPrice:
      typeof row.products.price === "number"
        ? row.products.price
        : row.products.price.toNumber(),
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    peer: {
      id: peer.id,
      displayName: displayName(peer),
      avatarUrl: peer.avatar_url,
    },
    lastMessage: last
      ? {
          body: last.body,
          createdAt: last.created_at.toISOString(),
          senderId: last.sender_id,
        }
      : null,
    createdAt: row.created_at.toISOString(),
    lastMessageAt: row.last_message_at?.toISOString() ?? null,
  };
}

export async function assertConversationParticipant(
  conversationId: string,
  userId: string,
): Promise<{ buyer_id: string; seller_id: string }> {
  const conv = await prisma.conversations.findUnique({
    where: { id: conversationId },
    select: { buyer_id: true, seller_id: true },
  });
  if (!conv) {
    throw new AppError("Conversation not found", 404);
  }
  if (conv.buyer_id !== userId && conv.seller_id !== userId) {
    throw new AppError("Forbidden", 403);
  }
  return conv;
}

/** Get or create a conversation for buyer + product. */
export async function openConversation(
  buyerId: string,
  productId: string,
): Promise<ConversationResponse> {
  const product = await prisma.products.findUnique({
    where: { id: productId },
    select: { id: true, seller_id: true },
  });
  if (!product?.seller_id) {
    throw new AppError("Product not found", 404);
  }
  if (product.seller_id === buyerId) {
    throw new AppError("Cannot start a conversation on your own listing", 400);
  }

  const include = {
    products: { select: { id: true, title: true, image_url: true, price: true } },
    buyer: {
      select: { id: true, display_name: true, full_name: true, username: true, avatar_url: true },
    },
    seller: {
      select: { id: true, display_name: true, full_name: true, username: true, avatar_url: true },
    },
    messages: { orderBy: { created_at: "desc" as const }, take: 1 },
  };

  const existing = await prisma.conversations.findUnique({
    where: {
      product_id_buyer_id: {
        product_id: productId,
        buyer_id: buyerId,
      },
    },
    include,
  });
  if (existing) {
    return toConversationResponse(existing as ConversationWithRelations, buyerId);
  }

  const created = await prisma.conversations.create({
    data: {
      product_id: productId,
      buyer_id: buyerId,
      seller_id: product.seller_id,
    },
    include,
  });

  return toConversationResponse(created as ConversationWithRelations, buyerId);
}

export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<ConversationResponse> {
  await assertConversationParticipant(conversationId, userId);

  const row = await prisma.conversations.findUnique({
    where: { id: conversationId },
    include: {
      products: { select: { id: true, title: true, image_url: true, price: true } },
      buyer: {
        select: { id: true, display_name: true, full_name: true, username: true, avatar_url: true },
      },
      seller: {
        select: { id: true, display_name: true, full_name: true, username: true, avatar_url: true },
      },
      messages: { orderBy: { created_at: "desc" }, take: 1 },
    },
  });
  if (!row) {
    throw new AppError("Conversation not found", 404);
  }
  return toConversationResponse(row as ConversationWithRelations, userId);
}

export async function listConversations(userId: string): Promise<ConversationListItemResponse[]> {
  const rows = await prisma.conversations.findMany({
    where: {
      OR: [{ buyer_id: userId }, { seller_id: userId }],
    },
    orderBy: [{ last_message_at: "desc" }, { created_at: "desc" }],
    include: {
      products: { select: { id: true, title: true, image_url: true, price: true } },
      buyer: {
        select: { id: true, display_name: true, full_name: true, username: true, avatar_url: true },
      },
      seller: {
        select: { id: true, display_name: true, full_name: true, username: true, avatar_url: true },
      },
      messages: { orderBy: { created_at: "desc" }, take: 1 },
    },
  });

  return rows.map((row) => toConversationResponse(row as ConversationWithRelations, userId));
}
