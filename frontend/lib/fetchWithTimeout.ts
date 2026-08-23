const DEFAULT_MS = 15_000;

/** fetch with AbortSignal timeout — avoids endless spinners when the API LAN IP is unreachable. */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function isFetchTimeoutError(e: unknown): boolean {
  if (e && typeof e === "object" && "name" in e) {
    return (e as { name: string }).name === "AbortError";
  }
  return false;
}
