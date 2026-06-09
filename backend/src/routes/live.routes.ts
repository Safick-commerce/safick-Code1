import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { parseUuid } from "../utils/uuid";
import {
  startLiveSession,
  getViewerToken,
  endLiveSession,
  listLiveFeed,
} from "../services/live.service";

const router = Router();

const startSchema = z.object({
  title: z.string().trim().min(6).max(120),
  category: z.string().trim().optional(),
  audience: z.enum(["public", "followers"]).optional(),
  productId: z.string().uuid().optional(),
});

router.get("/feed", requireAuth, async (_req, res, next) => {
  try {
    const items = await listLiveFeed();
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/start", requireAuth, async (req, res, next) => {
  try {
    const body = startSchema.parse(req.body);
    const result = await startLiveSession({
      sellerId: req.userId!,
      title: body.title,
      category: body.category,
      audience: body.audience,
      productId: body.productId,
    });

    res.status(201).json({
      liveId: result.event.id,
      roomName: result.event.livekit_room_name,
      token: result.token,
      url: result.url,
      event: result.event,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:liveId/token", requireAuth, async (req, res, next) => {
  try {
    const liveId = parseUuid(String(req.params.liveId));
    if (!liveId) {
      res.status(400).json({ error: "Invalid live id" });
      return;
    }
    const result = await getViewerToken(liveId, req.userId!);
    res.json({
      token: result.token,
      url: result.url,
      event: result.event,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:liveId/end", requireAuth, async (req, res, next) => {
  try {
    const liveId = parseUuid(String(req.params.liveId));
    if (!liveId) {
      res.status(400).json({ error: "Invalid live id" });
      return;
    }
    await endLiveSession(liveId, req.userId!);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
