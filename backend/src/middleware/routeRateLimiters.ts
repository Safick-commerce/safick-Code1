// Per-route rate limiters for abuse-prone endpoints.

import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

const FIFTEEN_MIN = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function userKey(req: Request): string {
  const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
  const userId = req.userId ?? "anon";
  return `${ip}:${userId}`;
}

/** Follow / unfollow spam protection. */
export const followRateLimiter = rateLimit({
  windowMs: Number(process.env.FOLLOW_RATE_LIMIT_WINDOW_MS) || FIFTEEN_MIN,
  max: Number(process.env.FOLLOW_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { error: "Too many follow actions. Please try again later." },
});

/** Live session start abuse protection. */
export const liveStartRateLimiter = rateLimit({
  windowMs: Number(process.env.LIVE_START_RATE_LIMIT_WINDOW_MS) || ONE_HOUR,
  max: Number(process.env.LIVE_START_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { error: "Too many live sessions started. Please try again later." },
});
