import { io, type Socket } from "socket.io-client";

const NOTIFICATIONS_URL = import.meta.env.VITE_NOTIFICATIONS_URL ?? "http://localhost:8085";

let socket: Socket | null = null;

/**
 * Connexion Socket.IO vers notifications-service pour les notifications
 * temps reel (cf. chapitre 3 §3.5.4 du rapport). Le token est transmis via
 * `auth.token`, lu par le middleware d'authentification du service
 * (socket/socketHandler.js) qui revalide le JWT avant d'accepter la
 * connexion et rejoint une room nommee par l'e-mail de l'utilisateur.
 */
export function connectNotificationsSocket(token: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  disconnectNotificationsSocket();

  socket = io(NOTIFICATIONS_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 2000,
  });

  return socket;
}

export function disconnectNotificationsSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getNotificationsSocket(): Socket | null {
  return socket;
}
