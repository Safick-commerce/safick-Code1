/** Minimum time the branded splash stays visible before startup routing (ms). */
export const MIN_SPLASH_MS = 1500;

let splashStartMs: number | null = null;

/** Call when the in-app splash first mounts (font load, bootstrap, or index). */
export function markSplashStart() {
  if (splashStartMs === null) {
    splashStartMs = Date.now();
  }
}

/** Ms to wait so total splash time is at least MIN_SPLASH_MS. */
export function splashDelayRemaining(minMs: number = MIN_SPLASH_MS): number {
  if (splashStartMs === null) {
    return minMs;
  }
  return Math.max(0, minMs - (Date.now() - splashStartMs));
}
