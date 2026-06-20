// =============================================================================
// /api/admin — moderation queue + refund actions.
// =============================================================================
// Gated by `x-admin-token: <ADMIN_API_KEY>` so we don't need a separate admin
// auth flow for the MVP. Replace with a real role-based check when an admin
// surface lands post-launch (rule: backend-security-auth).
// =============================================================================

import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import * as adminController from "../controllers/admin.controller";

const router = Router();
router.use(requireAdmin);
router.get("/disputes", adminController.listDisputes);
router.post("/orders/:id/refund", adminController.refundOrder);

export default router;
