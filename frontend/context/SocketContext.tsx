// =============================================================================
// SocketContext — thin compatibility shim around the Zustand socketStore.
// =============================================================================
// Phase 7, Zustand Wave 4: connection lifecycle now lives in
// `frontend/stores/socketStore.ts` + `socketStoreEffects.ts`. This file
// remains so existing callsites can keep importing `useSocket()`,
// `useSocketEvent()`, and `SocketProvider` from `context/SocketContext`
// without touching every consumer at once.
// =============================================================================

import { useEffect, useRef, type ReactNode } from "react";
import { useSocketStore } from "../stores/socketStore";
import { bootSocket } from "../stores/socketStoreEffects";

export function SocketProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const teardown = bootSocket();
    return teardown;
  }, []);
  return <>{children}</>;
}

export function useSocket() {
  // Subscribe to status + error; the socket reference itself comes from a
  // selector to avoid React re-rendering every consumer when the underlying
  // socket instance is re-created (which still happens on token refresh).
  const status = useSocketStore((s) => s.status);
  const connectionError = useSocketStore((s) => s.connectionError);
  const socket = useSocketStore.getState().socket();

  return {
    socket,
    isConnected: status === "connected",
    connectionError,
  };
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
