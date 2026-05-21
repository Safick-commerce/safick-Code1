import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate, validateQuery } from "../middleware/validate";
import {
  listMessagesQuerySchema,
  openConversationSchema,
  sendMessageBodySchema,
} from "../types";
import * as conversationController from "../controllers/conversation.controller";

const router = Router();

router.use(requireAuth);

router.get("/", conversationController.listConversations);
router.post("/", validate(openConversationSchema), conversationController.openConversation);
router.get("/:id", validateQuery(listMessagesQuerySchema), conversationController.getConversation);
router.get(
  "/:id/messages",
  validateQuery(listMessagesQuerySchema),
  conversationController.listMessages,
);
router.post(
  "/:id/messages",
  validate(sendMessageBodySchema),
  conversationController.sendMessage,
);

export default router;
