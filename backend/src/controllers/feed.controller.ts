// =============================================================================
// For You feed controller
// =============================================================================
// GET  /api/products/feed/for-you                    — optional auth (personalized vs random)
// GET  /api/products/seller/:sellerId/view-counts    — public profile grid counts
// POST /api/products/:id/view                         — optional auth (viewer_id or clientId)
// =============================================================================

import { Request, Response, NextFunction } from "express";
import * as feedService from "../services/feed.service";
import { AppError } from "../middleware/errorHandler";
import { parseUuid } from "../utils/uuid";
import {
  forYouFeedQuerySchema,
  recordProductViewBodySchema,
} from "../types/feed";

/**
 * GET /api/products/feed/for-you
 *
 * Query: cursor?, limit? (validated by validateQuery on the route)
 * Auth: optional — Bearer token enables interest-based feed when onboarding is done.
 * Response: ForYouFeedResponse
 */
export async function getForYouFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = forYouFeedQuerySchema.safeParse(req.validatedQuery ?? req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const feed = await feedService.getForYouFeed({
      viewerId: req.userId,
      limit: parsed.data.limit,
      cursor: parsed.data.cursor,
    });

    res.json(feed);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/products/:id/view
 *
 * Records a product video view (deduped in feed.service).
 * Auth: optional — signed-in users use JWT; guests must send body.clientId.
 * Response: RecordProductViewResponse
 */
export async function recordProductView(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = parseUuid(String(req.params.id));
    if (!productId) {
      res.status(400).json({ error: "Invalid product id" });
      return;
    }

    const parsedBody = recordProductViewBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new AppError(parsedBody.error.issues[0]?.message ?? "Invalid body", 400);
    }

    const viewerId = req.userId;
    const clientId = parsedBody.data.clientId;

    if (!viewerId && !clientId) {
      res.status(400).json({
        error: "clientId is required when not signed in",
      });
      return;
    }

    const result = await feedService.recordProductView({
      productId,
      viewerId,
      clientId,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/seller/:sellerId/view-counts
 *
 * Public aggregate counts for profile clip grids (RLS blocks direct Supabase reads).
 * Response: SellerProductViewCountsResponse
 */
export async function getSellerProductViewCounts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sellerId = parseUuid(String(req.params.sellerId));
    if (!sellerId) {
      res.status(400).json({ error: "Invalid seller id" });
      return;
    }

    const result = await feedService.getSellerProductViewCounts(sellerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
