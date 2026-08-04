import { useEffect } from "react";
import { sendLiveHeartbeat } from "../lib/liveApi";

const HEARTBEAT_INTERVAL_MS = 30_000;

/** Seller-only: ping backend while live so zombie sessions can be swept. */
export function useSellerHeartbeat(liveId: string | null, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !liveId) return;

    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      try {
        await sendLiveHeartbeat(liveId);
      } catch {
        // Best-effort; stale sweep handles prolonged outage.
      }
    };

    void ping();
    const id = setInterval(() => {
      void ping();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, liveId]);
}
