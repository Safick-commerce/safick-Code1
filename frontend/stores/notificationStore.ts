import { create } from "zustand";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRecord,
} from "../utils/notificationApi";

interface NotificationState {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fetchNotifications: (opts?: { refresh?: boolean }) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refreshing: false,
  error: null,

  fetchNotifications: async (opts) => {
    const refresh = opts?.refresh ?? false;
    set(refresh ? { refreshing: true, error: null } : { loading: true, error: null });
    try {
      const data = await fetchNotifications();
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        loading: false,
        refreshing: false,
        error: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load notifications";
      set({ loading: false, refreshing: false, error: message });
    }
  },

  markRead: async (id) => {
    const prev = get().notifications;
    const prevUnread = get().unreadCount;
    const target = prev.find((n) => n.id === id);
    if (!target || target.isRead) return;

    set({
      notifications: prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, prevUnread - 1),
    });

    try {
      await markNotificationRead(id);
    } catch {
      set({
        notifications: prev,
        unreadCount: prevUnread,
      });
    }
  },

  markAllRead: async () => {
    const prev = get().notifications;
    const prevUnread = get().unreadCount;
    set({
      notifications: prev.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
    try {
      await markAllNotificationsRead();
    } catch {
      set({ notifications: prev, unreadCount: prevUnread });
    }
  },

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      refreshing: false,
      error: null,
    }),
}));

export function useNotifications(): NotificationState {
  return useNotificationStore();
}

export { useNotificationStore };
