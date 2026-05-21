// =============================================================================
// Socket.IO — real-time chat (product DMs + live rooms)
// =============================================================================
// No signup required: runs on the same HTTP server as Express.
// Clients connect with: io(API_URL, { auth: { token: supabaseAccessToken } })
// =============================================================================

import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { getCorsOrigins } from "../config/cors";
import {
  authFailureMessage,
  isSupabaseAuthConfigured,
  verifySupabaseAccessToken,
} from "../utils/supabaseJwt";
import { registerChatHandlers } from "./chat.socket";
import { registerPresenceHandlers } from "./presence.socket";

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function initSocket(httpServer: HttpServer): Server {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: getCorsOrigins(),
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    if (!isSupabaseAuthConfigured()) {
      next(new Error("Server auth not configured"));
      return;
    }

    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token.trim()) {
      next(new Error("Authentication required"));
      return;
    }

    const result = await verifySupabaseAccessToken(token.trim());
    if (!result.ok) {
      next(new Error(authFailureMessage(result)));
      return;
    }

    socket.data.userId = result.userId;
    next();
  });

  io.on("connection", (socket) => {
    registerChatHandlers(socket);
    registerPresenceHandlers(socket);

    socket.emit("connected", {
      userId: socket.data.userId,
      socketId: socket.id,
    });
  });

  return io;
}

export async function closeSocket(): Promise<void> {
  if (!io) return;
  await new Promise<void>((resolve) => {
    io!.close(() => resolve());
  });
  io = null;
}
