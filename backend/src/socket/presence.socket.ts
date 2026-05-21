import type { Socket } from "socket.io";

/** Fired on connect — useful for debugging; extend for online friends later. */
export function registerPresenceHandlers(socket: Socket): void {
  socket.on("ping_presence", (_raw, ack) => {
    ack?.({ ok: true, userId: socket.data.userId, at: new Date().toISOString() });
  });
}
