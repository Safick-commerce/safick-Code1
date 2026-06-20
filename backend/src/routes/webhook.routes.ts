// =============================================================================
// /api/webhooks — public, signed endpoints (no auth middleware)
// =============================================================================
// We use express.raw() here so the Maviance HMAC signature can be verified
// against the exact bytes that were transmitted. JSON parsing happens inside
// the controller AFTER the signature check.
// =============================================================================

import express, { type NextFunction, type Request, type Response, Router } from "express";
import * as orderController from "../controllers/order.controller";

const router = Router();

// Capture the raw payload so the signature verification can run against the
// exact wire bytes. The body parser in app.ts uses JSON for every other route
// so this scoped raw() only applies inside this router.
const captureRaw = express.raw({ type: "*/*", limit: "1mb" });

function attachRawBody(req: Request, _res: Response, next: NextFunction) {
  if (Buffer.isBuffer(req.body)) {
    (req as Request & { rawBody?: string }).rawBody = req.body.toString("utf8");
  }
  next();
}

router.post(
  "/maviance",
  captureRaw,
  attachRawBody,
  orderController.mavianceWebhook,
);

export default router;
