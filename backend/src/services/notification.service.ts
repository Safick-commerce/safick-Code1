import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export type ListNotificationsInput = {
  userId: string;
  limit?: number;
  offset?: number;
};

function clampLimit(limit?: number): number {
  if (limit == null || Number.isNaN(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

function clampOffset(offset?: number): number {
  if (offset == null || Number.isNaN(offset)) return 0;
  return Math.max(0, Math.floor(offset));
}

function serializeNotification(row: {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: unknown;
  is_read: boolean;
  created_at: Date;
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data,
    isRead: row.is_read,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listNotifications(input: ListNotificationsInput) {
  const limit = clampLimit(input.limit);
  const offset = clampOffset(input.offset);

  const [rows, unreadCount, total] = await Promise.all([
    prisma.notifications.findMany({
      where: { user_id: input.userId },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.notifications.count({
      where: { user_id: input.userId, is_read: false },
    }),
    prisma.notifications.count({
      where: { user_id: input.userId },
    }),
  ]);

  return {
    notifications: rows.map(serializeNotification),
    unreadCount,
    pagination: {
      limit,
      offset,
      hasMore: offset + rows.length < total,
    },
  };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const updated = await prisma.notifications.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { is_read: true },
  });
  if (updated.count === 0) {
    throw new AppError("Notification not found", 404);
  }
  return { ok: true as const };
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notifications.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
  return { ok: true as const };
}

/** Best-effort fan-out when a seller starts a live session. Never throws. */
export async function notifyFollowersSellerLive(params: {
  sellerId: string;
  liveEventId: string;
  sellerName: string;
}): Promise<void> {
  try {
    const followers = await prisma.follows.findMany({
      where: { followee_id: params.sellerId },
      select: { follower_id: true },
    });
    if (followers.length === 0) return;

    const title = `${params.sellerName} is live now!`;
    const data = {
      sellerId: params.sellerId,
      liveEventId: params.liveEventId,
    };

    await prisma.notifications.createMany({
      data: followers.map((f) => ({
        user_id: f.follower_id,
        type: "SELLER_LIVE" as const,
        title,
        body: title,
        data,
      })),
    });
  } catch (err) {
    console.error("[notifyFollowersSellerLive]", err);
  }
}
