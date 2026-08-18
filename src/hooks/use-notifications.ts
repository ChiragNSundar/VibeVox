// Notification state context and hook for tracking pipeline stage progress.

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import type { ProgressEvent } from "@/lib/local-pipeline";

export type NotificationItem = {
  id: string;
  timestamp: number;
  stage: ProgressEvent["stage"];
  message: string;
  iteration?: number;
  score?: number;
  read: boolean;
};

type NotificationContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (event: ProgressEvent) => void;
  clearNotifications: () => void;
  markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (event: ProgressEvent) => {
    const item: NotificationItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      stage: event.stage,
      message: event.message,
      iteration: event.iteration,
      score: event.score,
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 50));
  };

  const clearNotifications = () => setNotifications([]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        clearNotifications,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}
