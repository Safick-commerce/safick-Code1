import type { NextFunction, Request, Response } from "express";
import * as notificationService from "../services/notification.service";
import { parseUuid } from "../utils/uuid";

function requireUserId(req: Request, res: Response): string | null {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.userId;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const parsed = req.validatedQuery as { limit: number; offset: number } | undefined;
    const limit = parsed?.limit ?? 20;
    const offset = parsed?.offset ?? 0;
    const payload = await notificationService.listNotifications({
      userId,
      limit,
      offset,
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = parseUuid(String(req.params.id));
    if (!id) {
      res.status(400).json({ error: "Invalid notification id" });
      return;
    }
    const result = await notificationService.markNotificationRead(userId, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const result = await notificationService.markAllNotificationsRead(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
