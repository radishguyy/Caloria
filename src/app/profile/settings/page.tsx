"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  Send,
  Sparkles,
  ArrowLeft,
  Check,
  LogOut,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useNotificationStore } from "@/store/use-notification-store";
import { useAuthStore } from "@/store/use-auth-store";
import { cn } from "@/lib/utils";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings } = useNotificationStore();
  const { user, logout } = useAuthStore();

  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({
      [key]: !settings[key],
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleTimeChange = (key: "breakfastTime" | "lunchTime" | "dinnerTime", value: string) => {
    updateSettings({
      [key]: value,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile/overview"
              className="p-1.5 rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pengaturan Notifikasi & Akun
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-8 sm:ml-0">
            Atur jadwal Web Push reminder jam makan, alert senggolan teman, dan preferensi akun kamu.
          </p>
        </div>

        {savedFeedback && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in">
            <Check className="h-3.5 w-3.5" />
            <span>Perubahan Tersimpan</span>
          </span>
        )}
      </div>

      {/* Sub-Tabs: Overview vs Achievements vs Settings */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <Link
          href="/profile/overview"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Overview & Berat Badan
        </Link>
        <Link
          href="/profile/achievements"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Galeri Achievement
        </Link>
        <Link
          href="/profile/settings"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-foreground text-background"
        >
          Pengaturan Notifikasi
        </Link>
      </div>

      <div className="space-y-5">
        {/* Web Push Notification Toggle Card */}
        <div className="rounded-3xl border bg-card p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-orange-500" />
                <span>Web Push Notifications (Browser / HP)</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Kirimkan notifikasi langsung ke layar browser atau perangkat HP kamu.
              </p>
            </div>

            <button
              onClick={() => handleToggle("webPushEnabled")}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                settings.webPushEnabled ? "bg-orange-500" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                  settings.webPushEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Scheduled Reminders */}
        <div className="rounded-3xl border bg-card p-6 space-y-5 shadow-xs">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>Jadwal Pengingat Jam Makan</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Breakfast */}
            <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Sarapan</span>
                <span className="text-[10px] text-muted-foreground">Pagi</span>
              </div>
              <input
                type="time"
                value={settings.breakfastTime}
                onChange={(e) => handleTimeChange("breakfastTime", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold outline-none"
              />
            </div>

            {/* Lunch */}
            <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Makan Siang</span>
                <span className="text-[10px] text-muted-foreground">Siang</span>
              </div>
              <input
                type="time"
                value={settings.lunchTime}
                onChange={(e) => handleTimeChange("lunchTime", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold outline-none"
              />
            </div>

            {/* Dinner */}
            <div className="p-4 rounded-2xl bg-muted/30 border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Makan Malam</span>
                <span className="text-[10px] text-muted-foreground">Malam</span>
              </div>
              <input
                type="time"
                value={settings.dinnerTime}
                onChange={(e) => handleTimeChange("dinnerTime", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold outline-none"
              />
            </div>
          </div>
        </div>

        {/* Social & Streak Reminder Toggles */}
        <div className="rounded-3xl border bg-card p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-500" />
            <span>Preferensi Notifikasi Lainnya</span>
          </h3>

          <div className="divide-y divide-border/60 text-xs">
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-foreground">Alert Senggolan Teman (Poke Nudge)</p>
                <p className="text-muted-foreground text-[11px]">
                  Terima pemberitahuan seketika saat rekan squad menyenggolmu menjelang malam.
                </p>
              </div>
              <button
                onClick={() => handleToggle("friendPokes")}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                  settings.friendPokes ? "bg-orange-500" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    settings.friendPokes ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-foreground">Notifikasi Evaluasi Gizi & XP</p>
                <p className="text-muted-foreground text-[11px]">
                  Pengingat saat target protein harian belum terpenuhi menjelang jam tidur.
                </p>
              </div>
              <button
                onClick={() => handleToggle("nutritionEvaluations")}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                  settings.nutritionEvaluations ? "bg-orange-500" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    settings.nutritionEvaluations ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Information & Logout */}
        <div className="rounded-3xl border bg-card p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Informasi Akun</span>
          </h3>

          <div className="p-4 rounded-2xl bg-muted/30 border text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama Pengguna:</span>
              <span className="font-bold text-foreground">{user?.fullName || "Iman Nur"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-mono text-foreground">@{user?.username || "iman_dev"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="text-foreground">{user?.email || "iman@caloria.app"}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-xs transition-colors"
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

