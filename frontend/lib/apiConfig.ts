/**
 * Base URL for the Safick Express API (REST + Socket.IO).
 * Set EXPO_PUBLIC_API_URL in frontend/.env — use your PC Wi‑Fi IP on physical devices.
 * Example: http://192.168.0.49:4000
 */
export function getApiBaseUrl(): string {
  let url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!url) return "http://localhost:4000";

  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (
      !parsed.port &&
      (parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname))
    ) {
      parsed.port = "4000";
    }
    return parsed.origin;
  } catch {
    return url.replace(/\/$/, "");
  }
}
