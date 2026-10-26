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
        return <Utensils className="h-4 w-4 text-brand-green-dark" />;
      case "poke":
        return <Flame className="h-4 w-4 text-brand-orange" />;
      case "achievement":
        return <Award className="h-4 w-4 text-brown" />;
      case "nutrition_eval":
      default:
        return <Sparkles className="h-4 w-4 text-brand-green" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex h-full w-full max-w-sm flex-col border-l border-warm-border bg-surface shadow-2xl animate-in slide-in-from-right duration-300 sm:max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-border p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-brand-green-light p-2 text-brand-green-ink">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                Notification Center
              </h2>
              <p className="text-xs text-ink-muted">
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
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-brand-green-light hover:text-brand-green-ink"
                title="Tandai semua dibaca"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Baca Semua</span>
              </button>
            )}
            <button
              onClick={() => setDrawerOpen(false)}
              className="btn-icon h-9 w-9"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="space-y-2 py-20 text-center text-xs text-ink-muted">
              <Bell className="mx-auto h-8 w-8 text-ink-muted/40" />
              <p>Belum ada notifikasi saat ini.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "cursor-pointer space-y-1.5 rounded-2xl border p-3 transition-all",
                  notif.isRead
                    ? "border-transparent bg-transparent opacity-80 hover:bg-brand-green-light/60"
                    : "border-warm-border bg-highlight/70"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl border border-warm-border bg-surface-raised p-1.5 shadow-xs">
                      {getIcon(notif.type)}
                    </div>
                    <h3 className="text-xs font-bold text-ink">
                      {notif.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-ink-muted">
                    {notif.timestamp}
                  </span>
                </div>

                <p className="pl-8 text-xs leading-relaxed text-ink-muted">
                  {notif.message}
                </p>

                {notif.actionUrl && (
                  <div className="pl-8 pt-1">
                    <Link
                      href={notif.actionUrl}
                      onClick={() => setDrawerOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green-dark hover:underline"
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
        <div className="flex items-center justify-between border-t border-warm-border bg-surface-sunken/60 p-4 text-xs">
          <Link
            href="/profile/settings"
            onClick={() => setDrawerOpen(false)}
            className="font-medium text-ink-muted transition-colors hover:text-brand-green-dark"
          >
            Pengaturan Jadwal Notifikasi
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="btn-secondary min-h-0 px-3 py-1.5 text-xs shadow-[0_3px_0_var(--warm-border-strong)] active:translate-y-[3px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
