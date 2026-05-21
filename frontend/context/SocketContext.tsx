// =============================================================================
// SocketContext — real-time connection to the Express + Socket.IO backend
// =============================================================================
// Mounted in app/_layout.tsx inside AuthProvider (needs a logged-in session).
//
// Responsibilities:
//   - On login: connect to EXPO_PUBLIC_API_URL with session.access_token (see lib/socket.ts).
//   - On logout: disconnect and clear connection state.
//   - Expose isConnected + connectionError for UI (e.g. usermessage header).
//
// Room join/send helpers live in lib/socket.ts (joinConversation, send_message, etc.).
// useSocketEvent(event, handler) — subscribe in screens; cleans up on unmount.
//
// Backend verifies the same Supabase token as REST; no separate Socket.IO account.
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { session, isAuthenticated, isReady } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated || !session?.access_token) {
      disconnectSocket();
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    const s = connectSocket(session.access_token);

    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      setConnectionError(err.message);
      setIsConnected(false);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);

    if (s.connected) {
      onConnect();
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      disconnectSocket();
      setIsConnected(false);
    };
  }, [isReady, isAuthenticated, session?.access_token]);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: getSocket(),
      isConnected,
      connectionError,
    }),
    [isConnected, connectionError],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return ctx;
}

type SocketEventHandler = (payload: unknown) => void;

/** Subscribe to socket events; cleans up on unmount. No-op when disconnected. */
export function useSocketEvent(
  event: string,
  handler: SocketEventHandler,
  deps: unknown[] = [],
): void {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;
    const listener = (...args: unknown[]) => {
      handlerRef.current(args[0]);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- socket.io client typings are event-name generic
    const on = listener as (...args: any[]) => void;
    socket.on(event, on);
    return () => {
      socket.off(event, on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps control when subscription refreshes
  }, [socket, event, ...deps]);
}
