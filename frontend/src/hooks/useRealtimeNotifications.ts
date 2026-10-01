import { useEffect } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth.store";
import { useNotificationsStore } from "@/store/notifications.store";
import { connectNotificationsSocket, disconnectNotificationsSocket } from "@/services/socket.service";
import type { Notification } from "@/lib/types";

interface IncomingNotificationPayload {
  notification_id?: string | null;
  title?: string;
  body?: string;
  link?: string | null;
  type?: string;
}

/**
 * Ecoute les notifications poussees en temps reel par notifications-service
 * (Socket.IO) et les fusionne dans le store local, en plus de la liste
 * recuperee par polling REST au chargement de chaque page. Monte une seule
 * fois au niveau racine de l'application : actif tant qu'un utilisateur est
 * connecte.
 */
export function useRealtimeNotifications(): void {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      disconnectNotificationsSocket();
      return;
    }

    const socket = connectNotificationsSocket(token);

    const handleNotification = (payload: IncomingNotificationPayload) => {
      const notification: Notification = {
        id: payload.notification_id ?? `realtime-${Date.now()}`,
        title: payload.title ?? "Nouvelle notification",
        description: payload.body ?? "",
        createdAt: new Date().toISOString(),
        read: false,
        link: payload.link ?? undefined,
        category: payload.type,
      };

      const { notifications, unreadCount, setNotifications, setUnreadCount } =
        useNotificationsStore.getState();
      setNotifications([notification, ...notifications]);
      setUnreadCount(unreadCount + 1);

      toast(notification.title, {
        description: notification.description || undefined,
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [token]);
}
