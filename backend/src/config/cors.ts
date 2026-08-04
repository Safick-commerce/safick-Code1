/** Origins allowed for Express CORS and Socket.IO (comma-separated in CORS_ORIGINS). */
export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (raw) {
    const origins = raw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .filter((o) => o !== "*");
    if (origins.length === 0) {
      console.warn("[CORS] CORS_ORIGINS is set but contains no valid origins (wildcard * is rejected).");
    }
    return origins;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[CORS] CORS_ORIGINS is not set in production. Set it to your Expo web URL(s) — no wildcard.",
    );
    return [];
  }

  return ["http://localhost:8081", "http://localhost:19006"];
}
