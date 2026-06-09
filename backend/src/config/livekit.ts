import { AppError } from "../middleware/errorHandler";

export type LivekitConfig = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

export function getLivekitConfig(): LivekitConfig {
  const url = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

  if (!url || !apiKey || !apiSecret) {
    throw new AppError(
      "LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in backend/.env.",
      503,
    );
  }

  return { url, apiKey, apiSecret };
}
