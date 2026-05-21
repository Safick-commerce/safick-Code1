/** Origins allowed for Express CORS and Socket.IO (comma-separated in CORS_ORIGINS). */
export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (raw) {
    return raw.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return ["http://localhost:8081", "http://localhost:19006"];
}
