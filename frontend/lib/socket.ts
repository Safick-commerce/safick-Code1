import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "./apiConfig";
import type { SocketChatMessagePayload, SocketTypingPayload } from "../types/socket";

import type { ChatMessage, ConversationSummary } from "../utils/conversationApi";

export type JoinConversationResult = {
  ok: boolean;
  error?: string;
  conversation?: ConversationSummary;
  messages?: ChatMessage[];
};

const JOIN_ACK_MS = 5000;
const EMIT_ACK_MS = 12000;

let socket: Socket | null = null;
let currentToken: string | null = null;
const joinedConversationIds = new Set<string>();
const messageListeners = new Set<(payload: SocketChatMessagePayload) => void>();
const typingListeners = new Set<(payload: SocketTypingPayload) => void>();

function dispatchMessage(payload: SocketChatMessagePayload): void {
  messageListeners.forEach((fn) => fn(payload));
}

function dispatchTyping(payload: SocketTypingPayload): void {
  typingListeners.forEach((fn) => fn(payload));
}

function attachCoreListeners(s: Socket): void {
  s.off("message");
  s.off("typing");
  s.on("message", (payload: SocketChatMessagePayload) => dispatchMessage(payload));
  s.on("typing", (payload: SocketTypingPayload) => dispatchTyping(payload));
}

export function subscribeToMessages(
  listener: (payload: SocketChatMessagePayload) => void,
): () => void {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

export function subscribeToTyping(
  listener: (payload: SocketTypingPayload) => void,
): () => void {
  typingListeners.add(listener);
  return () => {
    typingListeners.delete(listener);
  };
}

export function getJoinedConversationIds(): ReadonlySet<string> {
  return joinedConversationIds;
}

export function isConversationRoomJoined(conversationId: string): boolean {
  return joinedConversationIds.has(conversationId);
}

async function rejoinConversationRooms(): Promise<void> {
  if (!socket?.connected || joinedConversationIds.size === 0) return;
  const ids = [...joinedConversationIds];
  joinedConversationIds.clear();
  await syncConversationRooms(ids);
}

/** Connect to the backend using the Supabase session access token. */
export function connectSocket(accessToken: string): Socket {
  if (socket?.connected && currentToken === accessToken) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  currentToken = accessToken;
  socket = io(getApiBaseUrl(), {
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 500,
  });

  attachCoreListeners(socket);

  socket.on("connect", () => {
    void rejoinConversationRooms();
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
  joinedConversationIds.clear();
}

export function getSocket(): Socket | null {
  return socket;
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/** Join conversation rooms for live message delivery (skips already-joined ids). */
export async function syncConversationRooms(conversationIds: string[]): Promise<void> {
  if (!socket?.connected) return;
  const pending = conversationIds.filter((id) => !joinedConversationIds.has(id));
  await Promise.all(pending.map((conversationId) => joinConversation(conversationId)));
}

export function joinConversation(
  conversationId: string,
): Promise<JoinConversationResult> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, error: "not_connected" });
      return;
    }
    if (joinedConversationIds.has(conversationId)) {
      resolve({ ok: true });
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      joinedConversationIds.add(conversationId);
      resolve({ ok: true, error: "ack_timeout" });
    }, JOIN_ACK_MS);

    socket.timeout(JOIN_ACK_MS).emit(
      "join_conversation",
      { conversationId },
      (
        err: Error | null,
        res: {
          ok?: boolean;
          error?: string;
          conversation?: ConversationSummary;
          messages?: ChatMessage[];
        },
      ) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) {
          resolve({ ok: false, error: err.message });
          return;
        }
        if (res?.ok === true) {
          joinedConversationIds.add(conversationId);
        }
        resolve({
          ok: res?.ok === true,
          error: res?.error,
          conversation: res?.conversation,
          messages: res?.messages,
        });
      },
    );
  });
}

export function leaveConversation(conversationId: string): void {
  joinedConversationIds.delete(conversationId);
  socket?.emit("leave_conversation", { conversationId });
}

export function sendConversationMessage(
  conversationId: string,
  text: string,
  clientId?: string,
): Promise<{ ok: boolean; message?: SocketChatMessagePayload; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, error: "not_connected" });
      return;
    }
    socket.timeout(EMIT_ACK_MS).emit(
      "send_message",
      { conversationId, text, clientId },
      (err: Error | null, res: { ok?: boolean; message?: SocketChatMessagePayload; error?: string }) => {
        if (err) {
          resolve({ ok: false, error: err.message });
          return;
        }
        resolve({
          ok: res?.ok === true,
          message: res?.message,
          error: res?.error,
        });
      },
    );
  });
}

export function emitTyping(
  roomType: "conversation" | "live",
  roomId: string,
  isTyping: boolean,
): void {
  if (!socket?.connected) return;
  socket.volatile.emit("typing", { roomType, roomId, isTyping });
}

export function joinLive(liveId: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, error: "not_connected" });
      return;
    }
    socket.emit("join_live", { liveId }, (res: { ok?: boolean; error?: string }) => {
      resolve({ ok: res?.ok === true, error: res?.error });
    });
  });
}

export function leaveLive(liveId: string): void {
  socket?.emit("leave_live", { liveId });
}

export function sendLiveMessage(
  liveId: string,
  text: string,
  clientId?: string,
): Promise<{ ok: boolean; message?: SocketChatMessagePayload; error?: string }> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, error: "not_connected" });
      return;
    }
    socket.emit(
      "live_message",
      { liveId, text, clientId },
      (res: { ok?: boolean; message?: SocketChatMessagePayload; error?: string }) => {
        resolve({
          ok: res?.ok === true,
          message: res?.message,
          error: res?.error,
        });
      },
    );
  });
}
