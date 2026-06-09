import { randomUUID } from "crypto";
import type { Socket } from "socket.io";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import {
  assertConversationParticipant,
  getConversation,
} from "../services/conversation.service";
import {
  buildConversationMessagePayload,
  persistConversationMessage,
  listConversationMessages,
} from "../services/message.service";
import { prisma } from "../config/database";
import { parseUuid } from "../utils/uuid";
import { conversationRoom, liveRoom } from "../utils/socketRooms";
import type { SocketChatMessagePayload, SocketTypingPayload } from "../types/socketEvents";

const uuidSchema = z.string().refine((v) => parseUuid(v) !== null, "Invalid id");

const joinConversationSchema = z.object({
  conversationId: uuidSchema,
});

const joinLiveSchema = z.object({
  liveId: uuidSchema,
});

const sendMessageSchema = z.object({
  conversationId: uuidSchema,
  text: z.string().trim().min(1).max(4000),
  clientId: z.string().max(64).optional(),
});

const liveMessageSchema = z.object({
  liveId: uuidSchema,
  text: z.string().trim().min(1).max(4000),
  clientId: z.string().max(64).optional(),
});

const typingSchema = z.object({
  roomType: z.enum(["conversation", "live"]),
  roomId: uuidSchema,
  isTyping: z.boolean(),
});

function emitValidationError(socket: Socket, message: string): void {
  socket.emit("error", { code: "validation_error", message } satisfies { code: string; message: string });
}

function buildMessage(
  roomType: "conversation" | "live",
  roomId: string,
  senderId: string,
  text: string,
  clientId?: string,
): SocketChatMessagePayload {
  return {
    id: randomUUID(),
    roomType,
    roomId,
    senderId,
    text,
    createdAt: new Date().toISOString(),
    clientId,
  };
}

/** Registers conversation + live chat handlers on an authenticated socket. */
export function registerChatHandlers(socket: Socket): void {
  const userId = socket.data.userId;

  socket.on("join_conversation", async (raw, ack) => {
    const parsed = joinConversationSchema.safeParse(raw);
    if (!parsed.success) {
      emitValidationError(socket, parsed.error.issues[0]?.message ?? "Invalid payload");
      ack?.({ ok: false, error: "validation_error" });
      return;
    }

    const { conversationId } = parsed.data;
    try {
      await assertConversationParticipant(conversationId, userId);
    } catch (error) {
      const message = error instanceof AppError ? error.message : "Forbidden";
      ack?.({ ok: false, error: message });
      return;
    }
    await socket.join(conversationRoom(conversationId));
    try {
      const [conversation, messages] = await Promise.all([
        getConversation(conversationId, userId),
        listConversationMessages(conversationId, userId, 50),
      ]);
      ack?.({ ok: true, conversationId, conversation, messages });
    } catch (error) {
      const message = error instanceof AppError ? error.message : "Failed to load conversation";
      ack?.({ ok: true, conversationId, warning: message });
    }
  });

  socket.on("leave_conversation", async (raw) => {
    const parsed = joinConversationSchema.safeParse(raw);
    if (!parsed.success) return;
    await socket.leave(conversationRoom(parsed.data.conversationId));
  });

  socket.on("send_message", async (raw, ack) => {
    const parsed = sendMessageSchema.safeParse(raw);
    if (!parsed.success) {
      emitValidationError(socket, parsed.error.issues[0]?.message ?? "Invalid message");
      ack?.({ ok: false, error: "validation_error" });
      return;
    }

    const { conversationId, text, clientId } = parsed.data;
    const room = conversationRoom(conversationId);
    if (!socket.rooms.has(room)) {
      emitValidationError(socket, "Join the conversation before sending messages");
      ack?.({ ok: false, error: "not_joined" });
      return;
    }

    try {
      await assertConversationParticipant(conversationId, userId);
    } catch (error) {
      const message = error instanceof AppError ? error.message : "Forbidden";
      ack?.({ ok: false, error: message });
      return;
    }

    const payload = buildConversationMessagePayload(conversationId, userId, text, clientId);
    socket.to(room).emit("message", payload);

    try {
      await persistConversationMessage(payload);
      ack?.({ ok: true, message: payload });
    } catch (error) {
      const message = error instanceof AppError ? error.message : "Failed to send message";
      ack?.({ ok: false, error: message });
    }
  });

  socket.on("join_live", async (raw, ack) => {
    const parsed = joinLiveSchema.safeParse(raw);
    if (!parsed.success) {
      emitValidationError(socket, parsed.error.issues[0]?.message ?? "Invalid payload");
      ack?.({ ok: false, error: "validation_error" });
      return;
    }

    const { liveId } = parsed.data;
    const event = await prisma.live_events.findFirst({
      where: { id: liveId, status: "live" },
    });
    if (!event) {
      ack?.({ ok: false, error: "live_not_active" });
      return;
    }
    await socket.join(liveRoom(liveId));
    ack?.({ ok: true, liveId });
  });

  socket.on("leave_live", async (raw) => {
    const parsed = joinLiveSchema.safeParse(raw);
    if (!parsed.success) return;
    await socket.leave(liveRoom(parsed.data.liveId));
  });

  socket.on("live_message", async (raw, ack) => {
    const parsed = liveMessageSchema.safeParse(raw);
    if (!parsed.success) {
      emitValidationError(socket, parsed.error.issues[0]?.message ?? "Invalid message");
      ack?.({ ok: false, error: "validation_error" });
      return;
    }

    const { liveId, text, clientId } = parsed.data;
    const room = liveRoom(liveId);
    if (!socket.rooms.has(room)) {
      emitValidationError(socket, "Join the live room before sending messages");
      ack?.({ ok: false, error: "not_joined" });
      return;
    }

    const payload = buildMessage("live", liveId, userId, text, clientId);
    socket.to(room).emit("live_message", payload);
    ack?.({ ok: true, message: payload });
  });

  socket.on("typing", async (raw) => {
    const parsed = typingSchema.safeParse(raw);
    if (!parsed.success) return;

    const { roomType, roomId, isTyping } = parsed.data;
    const room = roomType === "conversation" ? conversationRoom(roomId) : liveRoom(roomId);

    if (roomType === "conversation" && !socket.rooms.has(room)) {
      try {
        await assertConversationParticipant(roomId, userId);
        await socket.join(room);
      } catch {
        return;
      }
    } else if (!socket.rooms.has(room)) {
      return;
    }

    const payload: SocketTypingPayload = { roomType, roomId, userId, isTyping };
    socket.to(room).volatile.emit("typing", payload);
  });
}
