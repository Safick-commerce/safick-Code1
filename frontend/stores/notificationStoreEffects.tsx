import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotificationStore } from "./notificationStore";

/** Loads in-app notifications when the user session is ready. */
export function NotificationsBootstrap() {
  const { isAuthenticated, isReady } = useAuth();
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const reset = useNotificationStore((s) => s.reset);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      reset();
      return;
    }
    void fetchNotifications();
  }, [isReady, isAuthenticated, fetchNotifications, reset]);

  return null;
}
