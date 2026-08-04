import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { listNotificationsQuerySchema } from "../types";
import * as notificationController from "../controllers/notification.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validateQuery(listNotificationsQuerySchema), notificationController.list);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

export default router;
