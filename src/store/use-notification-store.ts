import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppNotification } from "@/types";

interface NotificationSettings {
  mealReminders: boolean;
  friendPokes: boolean;
  nutritionEvaluations: boolean;
  webPushEnabled: boolean;
  emailNotificationsEnabled: boolean;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
}

interface NotificationStoreState {
  notifications: AppNotification[];
  settings: NotificationSettings;
  isDrawerOpen: boolean;

  // Actions
  toggleDrawer: () => void;
  setDrawerOpen: (isOpen: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (
    notif: Omit<AppNotification, "id" | "timestamp" | "isRead">,
  ) => AppNotification;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  getUnreadCount: () => number;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      isDrawerOpen: false,
      settings: {
        mealReminders: true,
        friendPokes: true,
        nutritionEvaluations: true,
        webPushEnabled: true,
        emailNotificationsEnabled: true,
        breakfastTime: "08:00",
        lunchTime: "12:30",
        dinnerTime: "19:00",
      },
      notifications: [],

      toggleDrawer: () =>
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      setDrawerOpen: (isOpen: boolean) => set({ isDrawerOpen: isOpen }),

      markAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
        })),

      addNotification: (notif) => {
        const newNotif: AppNotification = {
          ...notif,
          id: `notif-${Date.now()}`,
          timestamp: "Baru saja",
          isRead: false,
        };

        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));

        return newNotif;
      },

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        })),

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },
    }),
    {
      name: "caloria-notification-storage",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || version < 2) {
          return {
            ...persistedState,
            notifications: DEFAULT_NOTIFICATIONS,
          };
        }
        return persistedState;
      },
    },
  ),
);
