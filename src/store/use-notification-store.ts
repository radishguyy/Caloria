import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppNotification } from "@/types";

interface NotificationSettings {
  mealReminders: boolean;
  friendPokes: boolean;
  nutritionEvaluations: boolean;
  webPushEnabled: boolean;
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

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    type: "poke",
    title: "Pengingat Senggolan Teman! ⚔️",
    message:
      "Afza belum mencatat makan hari ini. Ayo senggol dia di halaman Social agar Co-op Streak 7 hari party kalian tetap aman!",
    timestamp: "10 menit yang lalu",
    isRead: false,
    actionUrl: "/social",
  },
  {
    id: "notif-2",
    type: "nutrition_eval",
    title: "Evaluasi Gizi Harian",
    message:
      "Kamu masih membutuhkan sekitar 25g protein lagi hari ini untuk mengoptimalkan pemulihan dan menaikkan level Pet!",
    timestamp: "2 jam yang lalu",
    isRead: false,
    actionUrl: "/diary/add",
  },
  {
    id: "notif-3",
    type: "meal_reminder",
    title: "Pengingat Jam Makan Siang",
    message:
      "Sudah masuk jam makan siang (12:30). Jangan lupa isi bahan bakar tubuhmu dan catat menu pilihanmu ya!",
    timestamp: "5 jam yang lalu",
    isRead: true,
    actionUrl: "/diary",
  },
  {
    id: "notif-4",
    type: "achievement",
    title: "Badge Baru Terbuka!",
    message:
      "Selamat! Kamu telah membuka lencana 'Konsistensi Mingguan' (7 Hari Streak berturut-turut).",
    timestamp: "Kemarin",
    isRead: true,
    actionUrl: "/profile/achievements",
  },
];

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      isDrawerOpen: false,
      settings: {
        mealReminders: true,
        friendPokes: true,
        nutritionEvaluations: true,
        webPushEnabled: true,
        breakfastTime: "08:00",
        lunchTime: "12:30",
        dinnerTime: "19:00",
      },
      notifications: DEFAULT_NOTIFICATIONS,

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
