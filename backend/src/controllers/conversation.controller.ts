import { Request, Response, NextFunction } from "express";
import * as conversationService from "../services/conversation.service";
import * as messageService from "../services/message.service";
import { getIO } from "../socket";
import { listMessagesQuerySchema } from "../types";
import { conversationRoom } from "../utils/socketRooms";
import { parseUuid } from "../utils/uuid";
import { AppError } from "../middleware/errorHandler";

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const conversations = await conversationService.listConversations(userId);
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
}

export async function openConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { productId } = req.body as { productId: string };
    const conversation = await conversationService.openConversation(userId, productId);
    const messages = await messageService.listConversationMessages(conversation.id, userId, 50);
    res.status(201).json({ conversation, messages });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const conversationId = parseUuid(String(req.params.id));
    if (!conversationId) {
      res.status(400).json({ error: "Invalid conversation id" });
      return;
    }
    const parsedQuery = listMessagesQuerySchema.safeParse(req.validatedQuery ?? req.query);
    const limit = parsedQuery.success ? parsedQuery.data.limit : 50;
    const [conversation, messages] = await Promise.all([
      conversationService.getConversation(conversationId, userId),
      messageService.listConversationMessages(conversationId, userId, limit),
    ]);
    res.json({ conversation, messages });
  } catch (error) {
    next(error);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const conversationId = parseUuid(String(req.params.id));
    if (!conversationId) {
      res.status(400).json({ error: "Invalid conversation id" });
      return;
    }
    const parsedQuery = listMessagesQuerySchema.safeParse(req.validatedQuery ?? req.query);
    const limit = parsedQuery.success ? parsedQuery.data.limit : 50;
    const messages = await messageService.listConversationMessages(
      conversationId,
      userId,
      limit,
    );
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const conversationId = parseUuid(String(req.params.id));
    if (!conversationId) {
      res.status(400).json({ error: "Invalid conversation id" });
      return;
    }
    const { text, clientId } = req.body as { text: string; clientId?: string };
    try {
      await conversationService.assertConversationParticipant(conversationId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      throw error;
    }

    const message = messageService.buildConversationMessagePayload(
      conversationId,
      userId,
      text,
      clientId,
    );
    getIO()?.to(conversationRoom(conversationId)).emit("message", message);
    await messageService.persistConversationMessage(message);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}
