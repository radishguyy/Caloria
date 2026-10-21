"use client";

import { useNotificationStore } from "@/store/use-notification-store";
import {
  Bell,
  X,
  CheckCheck,
  Utensils,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotificationDrawer() {
  const {
    notifications,
    isDrawerOpen,
    setDrawerOpen,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
  } = useNotificationStore();

  if (!isDrawerOpen) return null;

  const unreadCount = getUnreadCount();

  const getIcon = (type: string) => {
    switch (type) {
      case "meal_reminder":
        return <Utensils className="h-4 w-4 text-orange-500" />;
      case "poke":
        return <Flame className="h-4 w-4 text-rose-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-amber-500" />;
      case "nutrition_eval":
      default:
        return <Sparkles className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Notification Center
              </h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} notifikasi baru belum dibaca`
                  : "Semua notifikasi telah dibaca"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1 hover:bg-muted"
                title="Tandai semua dibaca"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Baca Semua</span>
              </button>
            )}
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground text-xs space-y-2">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p>Belum ada notifikasi saat ini.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "p-3 rounded-2xl transition-all cursor-pointer pt-3 space-y-1.5",
                  notif.isRead
                    ? "bg-transparent hover:bg-muted/40 opacity-80"
                    : "bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background border shadow-xs">
                      {getIcon(notif.type)}
                    </div>
                    <h3 className="text-xs font-bold text-foreground">
                      {notif.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {notif.timestamp}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                  {notif.message}
                </p>

                {notif.actionUrl && (
                  <div className="pl-8 pt-1">
                    <Link
                      href={notif.actionUrl}
                      onClick={() => setDrawerOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      <span>Buka Aksi Terkait</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
          <Link
            href="/profile/settings"
            onClick={() => setDrawerOpen(false)}
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            Pengaturan Jadwal Notifikasi
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

