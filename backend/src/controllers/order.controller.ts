// =============================================================================
// Order / Checkout Controller
// =============================================================================

import type { NextFunction, Request, Response } from "express";
import * as orderService from "../services/order.service";
import * as maviance from "../services/maviance.service";
import { mavianceWebhookSchema } from "../types";
import type { CheckoutInput, DisputeInput } from "../types";
import { parseUuid } from "../utils/uuid";

function requireUserId(req: Request, res: Response): string | null {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.userId;
}

function readOrderId(req: Request, res: Response): string | null {
  const id = parseUuid(String(req.params.id));
  if (!id) {
    res.status(400).json({ error: "Invalid order id" });
    return null;
  }
  return id;
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const checkout = await orderService.createCheckout(userId, req.body as CheckoutInput);
    res.status(201).json({ checkout });
  } catch (error) {
    next(error);
  }
}

export async function getCheckoutStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = parseUuid(String(req.params.id));
    if (!id) {
      res.status(400).json({ error: "Invalid checkout id" });
      return;
    }
    const checkout = await orderService.getCheckoutStatus(userId, id);
    res.json({ checkout });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function listBuyerOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const orders = await orderService.listBuyerOrders(userId);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function listSellerOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const orders = await orderService.listSellerOrders(userId);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getBuyerOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readOrderId(req, res);
    if (!id) return;
    const order = await orderService.getBuyerOrder(userId, id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function getSellerOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readOrderId(req, res);
    if (!id) return;
    const order = await orderService.getSellerOrder(userId, id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function buyerConfirm(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readOrderId(req, res);
    if (!id) return;
    const order = await orderService.buyerConfirmDelivery(userId, id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function buyerDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readOrderId(req, res);
    if (!id) return;
    const order = await orderService.buyerOpenDispute(
      userId,
      id,
      req.body as DisputeInput,
    );
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function sellerAccept(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readOrderId(req, res);
    if (!id) return;
    const order = await orderService.sellerAccept(userId, id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function sellerReject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readOrderId(req, res);
    if (!id) return;
    const order = await orderService.sellerReject(userId, id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function sellerShip(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readOrderId(req, res);
    if (!id) return;
    const order = await orderService.sellerMarkShipped(userId, id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function sellerDeliver(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = readOrderId(req, res);
    if (!id) return;
    const order = await orderService.sellerMarkDelivered(userId, id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Maviance webhook
// ---------------------------------------------------------------------------
// IMPORTANT: this route is mounted with the express.raw() body parser so we
// can verify the HMAC signature against the *exact* bytes Maviance sent.
// JSON parsing happens AFTER signature verification.

export async function mavianceWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const rawBody = (req as Request & { rawBody?: string }).rawBody ?? "";
    const signature = maviance.extractSignatureHeader(req.headers);

    if (!maviance.verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody || "{}");
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }

    const payload = mavianceWebhookSchema.safeParse(parsed);
    if (!payload.success) {
      res.status(400).json({ error: "Invalid payload", details: payload.error.flatten() });
      return;
    }

    await orderService.applyWebhook(payload.data);
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
}
