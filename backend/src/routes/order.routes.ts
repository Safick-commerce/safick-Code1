// =============================================================================
// /api/checkout, /api/orders — escrow checkout and order management
// =============================================================================

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { checkoutBodySchema, disputeBodySchema, orderActionSchema } from "../types";
import * as orderController from "../controllers/order.controller";

// ----- Checkout -----
const checkoutRouter = Router();
checkoutRouter.use(requireAuth);
checkoutRouter.post("/", validate(checkoutBodySchema), orderController.createCheckout);
checkoutRouter.get("/:id", orderController.getCheckoutStatus);

// ----- Buyer-facing orders -----
const ordersRouter = Router();
ordersRouter.use(requireAuth);
ordersRouter.get("/", orderController.listBuyerOrders);
ordersRouter.get("/:id", orderController.getBuyerOrder);
ordersRouter.post(
  "/:id/confirm-delivery",
  validate(orderActionSchema),
  orderController.buyerConfirm,
);
ordersRouter.post(
  "/:id/dispute",
  validate(disputeBodySchema),
  orderController.buyerDispute,
);

// ----- Seller-facing orders -----
const sellerOrdersRouter = Router();
sellerOrdersRouter.use(requireAuth);
sellerOrdersRouter.get("/", orderController.listSellerOrders);
sellerOrdersRouter.get("/:id", orderController.getSellerOrder);
sellerOrdersRouter.post(
  "/:id/accept",
  validate(orderActionSchema),
  orderController.sellerAccept,
);
sellerOrdersRouter.post(
  "/:id/reject",
  validate(orderActionSchema),
  orderController.sellerReject,
);
sellerOrdersRouter.post(
  "/:id/ship",
  validate(orderActionSchema),
  orderController.sellerShip,
);
sellerOrdersRouter.post(
  "/:id/deliver",
  validate(orderActionSchema),
  orderController.sellerDeliver,
);

export { checkoutRouter, ordersRouter, sellerOrdersRouter };
