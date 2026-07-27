// =============================================================================
// Follow controller
// =============================================================================

import { Request, Response, NextFunction } from "express";
import * as followService from "../services/follow.service";
import { parseUuid } from "../utils/uuid";
import { followListQuerySchema } from "../types/follow";

// If user id is not found the request will be rejected with a 401, which is an unauthorized error
// If user id is found the user id will be returned
function requireUserId(req: Request, res: Response): string | null {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

// If seller id is not a valid UUID the request will be rejected with a 400, which is a bad request error
function parseSellerParam(req: Request, res: Response): string | null {
  const sellerId = parseUuid(String(req.params.sellerId));
  if (!sellerId) {
    res.status(400).json({ error: "Invalid seller id" });
    return null;
  }
  // If seller exists the seller id will be returned
  return sellerId;
}

export async function listFollowing(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = followListQuerySchema.safeParse(req.validatedQuery ?? req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query" });
      return;
    }

    const result = await followService.listFollowing(userId, parsed.data.limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function checkFollowing(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const sellerId = parseSellerParam(req, res);
    if (!sellerId) return;

    const following = await followService.isFollowing(userId, sellerId);
    res.json({ following });
  } catch (error) {
    next(error);
  }
}

export async function getFollowCounts(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = parseSellerParam(req, res);
    if (!profileId) return;

    const counts = await followService.getFollowCounts(profileId);
    res.json(counts);
  } catch (error) {
    next(error);
  }
}

// If user or seller exist the the request will be validated and the follow will be created
// If user or seller does not exist the request will be rejected with a 404 error
// 201 status code is returned if the follow is created successfully
export async function follow(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const sellerId = parseSellerParam(req, res);
    if (!sellerId) return;

    const result = await followService.followSeller(userId, sellerId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function unfollow(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const sellerId = parseSellerParam(req, res);
    if (!sellerId) return;

    const result = await followService.unfollowSeller(userId, sellerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
