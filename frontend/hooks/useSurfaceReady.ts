import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  /** When false, surface stays not-ready and callbacks no-op. */
  enabled?: boolean;
  /** Dismiss overlay after this many onAssetLoad calls. */
  minLoads?: number;
  /** Always dismiss overlay after this many ms (fallback). */
  timeoutMs?: number;
  /** Change to reset the ready state (e.g. filter changed). */
  resetKey?: string | number;
};

/**
 * Keeps a skeleton overlay visible until enough images/assets report loaded,
 * or a timeout fires — same pattern as For You feed first-frame ready.
 */
export function useSurfaceReady({
  enabled = true,
  minLoads = 4,
  timeoutMs = 3000,
  resetKey = 0,
}: Options = {}) {
  const [surfaceReady, setSurfaceReady] = useState(false);
  const loadCountRef = useRef(0);
  const firedRef = useRef(false);

  const markSurfaceReady = useCallback(() => {
    if (!enabled || firedRef.current) return;
    firedRef.current = true;
    setSurfaceReady(true);
  }, [enabled]);

  const onAssetLoad = useCallback(() => {
    if (!enabled || firedRef.current) return;
    loadCountRef.current += 1;
    if (loadCountRef.current >= minLoads) {
      markSurfaceReady();
    }
  }, [enabled, minLoads, markSurfaceReady]);

  useEffect(() => {
    if (!enabled) {
      loadCountRef.current = 0;
      firedRef.current = false;
      setSurfaceReady(false);
      return;
    }

    loadCountRef.current = 0;
    firedRef.current = false;
    setSurfaceReady(false);

    const timer = setTimeout(markSurfaceReady, timeoutMs);
    return () => clearTimeout(timer);
  }, [enabled, timeoutMs, resetKey, markSurfaceReady]);

  return { surfaceReady, onAssetLoad, markSurfaceReady };
}
