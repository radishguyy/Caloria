"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  Check,
  LogOut,
  ShieldCheck,
  Smartphone,
  Mail,
} from "lucide-react";
import { useNotificationStore } from "@/store/use-notification-store";
import { useAuthStore } from "@/store/use-auth-store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ProfileHeader } from "@/components/profile/profile-header";
import { logoutAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings } = useNotificationStore();
  const { user, logout } = useAuthStore();
  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  const [savedFeedback, setSavedFeedback] = useState(false);

  const handlePushToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribeFromPush();
      if (ok) {
        updateSettings({ webPushEnabled: false });
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
      }
    } else {
      const ok = await subscribeToPush();
      if (ok) {
        updateSettings({ webPushEnabled: true });
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
      }
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({
      [key]: !settings[key],
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleTimeChange = (
    key: "breakfastTime" | "lunchTime" | "dinnerTime",
    value: string
  ) => {
    updateSettings({
      [key]: value,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Client signOut warning:", e);
    }
    await logoutAction();
    logout();
    try {
      localStorage.removeItem("caloria-auth-storage");
    } catch {}
    window.location.href = "/login";
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
      <ProfileHeader title="Pengaturan" />

      {savedFeedback && (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-accent-green/15 px-3 py-1 text-xs font-bold text-text-primary animate-in fade-in">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Perubahan Tersimpan</span>
          </span>
        </div>
      )}

      <div className="space-y-5">
        {/* Web Push Notification Toggle Card */}
        <div className="rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-accent-green" />
                <span>Web Push Notifications (Browser / HP)</span>
              </h3>
              <p className="text-xs text-text-muted">
                {isSupported
                  ? "Kirimkan notifikasi langsung ke layar browser atau perangkat HP kamu."
                  : "Browser kamu saat ini belum mendukung Web Push Notifications."}
              </p>
              {pushError && (
                <p className="text-[11px] text-destructive font-medium mt-1">
                  {pushError}
                </p>
              )}
            </div>

            <button
              onClick={handlePushToggle}
              disabled={!isSupported || isPushLoading}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                isSubscribed ? "bg-accent-green" : "bg-border-default",
                (!isSupported || isPushLoading) && "opacity-50 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-pill bg-surface shadow-md ring-0 transition duration-200 ease-in-out",
                  isSubscribed ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Email Notification Toggle Card */}
        <div className="rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent-green" />
                <span>Notifikasi via Email</span>
              </h3>
              <p className="text-xs text-text-muted">
                Terima ringkasan jam makan, alert streak 10 malam, dan pemberitahuan co-op langsung ke inbox {user?.email ? <span className="font-semibold text-text-primary font-mono">({user.email})</span> : "email kamu"}.
              </p>
            </div>

            <button
              onClick={() => handleToggle("emailNotificationsEnabled")}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                settings.emailNotificationsEnabled ? "bg-accent-green" : "bg-border-default"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-pill bg-surface shadow-md ring-0 transition duration-200 ease-in-out",
                  settings.emailNotificationsEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Scheduled Reminders */}
        <div className="rounded-card border border-border-divider bg-surface p-6 space-y-5 shadow-xs">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent-green" />
            <span>Jadwal Pengingat Jam Makan</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Breakfast */}
            <div className="p-4 rounded-button bg-surface-subtle border border-border-divider space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">Sarapan</span>
                <span className="text-[10px] text-text-muted">Pagi</span>
              </div>
              <input
                type="time"
                value={settings.breakfastTime}
                onChange={(e) => handleTimeChange("breakfastTime", e.target.value)}
                className="input-field w-full px-3 py-1.5 text-xs font-semibold"
              />
            </div>

            {/* Lunch */}
            <div className="p-4 rounded-button bg-surface-subtle border border-border-divider space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">Makan Siang</span>
                <span className="text-[10px] text-text-muted">Siang</span>
              </div>
              <input
                type="time"
                value={settings.lunchTime}
                onChange={(e) => handleTimeChange("lunchTime", e.target.value)}
                className="input-field w-full px-3 py-1.5 text-xs font-semibold"
              />
            </div>

            {/* Dinner */}
            <div className="p-4 rounded-button bg-surface-subtle border border-border-divider space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">Makan Malam</span>
                <span className="text-[10px] text-text-muted">Malam</span>
              </div>
              <input
                type="time"
                value={settings.dinnerTime}
                onChange={(e) => handleTimeChange("dinnerTime", e.target.value)}
                className="input-field w-full px-3 py-1.5 text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Social & Streak Reminder Toggles */}
        <div className="rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent-green" />
            <span>Preferensi Notifikasi Lainnya</span>
          </h3>

          <div className="divide-y divide-border-divider/60 text-xs">
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-text-primary">
                  Alert Senggolan Teman (Poke Nudge)
                </p>
                <p className="text-text-muted text-[11px]">
                  Terima pemberitahuan seketika saat rekan squad menyenggolmu menjelang malam.
                </p>
              </div>
              <button
                onClick={() => handleToggle("friendPokes")}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out",
                  settings.friendPokes ? "bg-accent-green" : "bg-border-default"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-pill bg-surface shadow-md ring-0 transition duration-200 ease-in-out",
                    settings.friendPokes ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-text-primary">
                  Notifikasi Evaluasi Gizi & XP
                </p>
                <p className="text-text-muted text-[11px]">
                  Pengingat saat target protein harian belum terpenuhi menjelang jam tidur.
                </p>
              </div>
              <button
                onClick={() => handleToggle("nutritionEvaluations")}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out",
                  settings.nutritionEvaluations ? "bg-accent-green" : "bg-border-default"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-pill bg-surface shadow-md ring-0 transition duration-200 ease-in-out",
                    settings.nutritionEvaluations ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Information & Logout */}
        <div className="rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent-green" />
            <span>Informasi Akun</span>
          </h3>

          <div className="p-4 rounded-button bg-surface-subtle border border-border-divider text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Nama Pengguna:</span>
              <span className="font-bold text-text-primary">
                {user?.fullName || user?.username || "Pengguna Caloria"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Username:</span>
              <span className="font-mono text-foreground">
                {user?.username ? `@${user.username}` : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Email:</span>
              <span className="text-foreground">
                {user?.email || "-"}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-xs transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
