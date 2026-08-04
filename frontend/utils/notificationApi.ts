import { apiFetch } from "../lib/apiFetch";

export type NotificationRecord = {
  id: string;
  type: "SELLER_LIVE";
  title: string;
  body: string | null;
  data: { sellerId?: string; liveEventId?: string } | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsListResponse = {
  notifications: NotificationRecord[];
  unreadCount: number;
  pagination: { limit: number; offset: number; hasMore: boolean };
};

export async function fetchNotifications(limit = 20, offset = 0): Promise<NotificationsListResponse> {
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiFetch<NotificationsListResponse>(`/api/notifications?${q.toString()}`);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<{ ok: true }>("/api/notifications/read-all", { method: "PATCH" });
}
