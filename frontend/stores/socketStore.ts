// =============================================================================
// socketStore — Zustand mirror of the Socket.IO connection lifecycle.
// =============================================================================
// The actual Socket.IO client instance lives in `frontend/lib/socket.ts`
// (singleton); this store only tracks connection STATUS and the latest error
// so React subscribers can re-render based on connection state without owning
// the underlying TCP connection. Side-effects (connect on auth, disconnect on
// logout, event handler wiring) live in `socketStoreEffects.ts`.
//
// Public hook shape (`useSocket()`) is re-exported from
// `context/SocketContext.tsx` so consumer callsites do not need to change.
// =============================================================================

import { create } from "zustand";
import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";

export type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface SocketStoreState {
  status: SocketStatus;
  connectionError: string | null;
  socketId: string | null;
  // Setters — internal use only (called from socketStoreEffects).
  setStatus: (status: SocketStatus, socketId?: string | null) => void;
  setConnectionError: (error: string | null) => void;
  // Convenience derived getters.
  isConnected: () => boolean;
  socket: () => Socket | null;
}

export const useSocketStore = create<SocketStoreState>((set, get) => ({
  status: "disconnected",
  connectionError: null,
  socketId: null,

  setStatus: (status, socketId = null) =>
    set((prev) => ({
      status,
      // Don't blow away the existing error message while we are still
      // `error` — only clear it on a successful (re)connect.
      connectionError: status === "connected" ? null : prev.connectionError,
      socketId,
    })),
  setConnectionError: (error) => set({ connectionError: error }),

  isConnected: () => get().status === "connected",
  socket: () => getSocket(),
}));
