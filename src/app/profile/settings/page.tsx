"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Clock,
  Check,
  LogOut,
  ShieldCheck,
  Compass,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import { useNotificationStore } from "@/store/use-notification-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingDemoStore } from "@/store/use-onboarding-demo-store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTour } from "@/components/tour/useTour";
import { useAutoTour } from "@/components/tour/useAutoTour";
import { logoutAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SettingSwitchProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  label: string;
  description: string;
  errorText?: string | null;
  onToggle: () => void;
}

function SettingSwitchRow({
  id,
  checked,
  disabled = false,
  label,
  description,
  errorText,
  onToggle,
}: SettingSwitchProps) {
  return (
    <div className="py-4 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <label
          htmlFor={id}
          className="block text-base sm:text-lg font-extrabold text-neutral-10 cursor-pointer"
        >
          {label}
        </label>
        <p className="text-sm sm:text-base text-neutral-10 leading-relaxed break-words">
          {description}
        </p>
        {errorText && (
          <p className="text-sm font-semibold text-rose-700 pt-0.5">
            {errorText}
          </p>
        )}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "min-h-11 min-w-14 inline-flex items-center justify-center shrink-0 cursor-pointer rounded-navigation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "relative inline-flex h-8 w-14 items-center rounded-pill p-1 transition-colors duration-200",
            checked ? "bg-[#529028]" : "bg-[#64748B]",
          )}
        >
          <span
            className={cn(
              "inline-block h-6 w-6 rounded-pill bg-white transition-transform duration-200",
              checked ? "translate-x-6" : "translate-x-0",
            )}
          />
        </span>
      </button>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings } = useNotificationStore();
  const { user, logout } = useAuthStore();
  const { startTour, resetTour, resetAll } = useTour();
  useAutoTour("settings");
  const [tourFeedback, setTourFeedback] = useState<string | null>(null);
  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (user?.email && user?.username) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (!u) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", u.id)
        .maybeSingle();
      useAuthStore.getState().setUserFromSession({
        id: u.id,
        email: u.email || null,
        username:
          prof?.username ||
          u.user_metadata?.username ||
          u.email?.split("@")[0] ||
          "user",
        fullName:
          prof?.full_name ||
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          prof?.username ||
          null,
        avatarUrl:
          prof?.avatar_url ||
          u.user_metadata?.avatar_url ||
          u.user_metadata?.picture ||
          null,
        isOnboardingCompleted: true,
      });
    });
  }, [user?.email, user?.username]);

  const showSavedNotice = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribeFromPush();
      if (ok) {
        updateSettings({ webPushEnabled: false });
        showSavedNotice();
      }
    } else {
      const ok = await subscribeToPush();
      if (ok) {
        updateSettings({ webPushEnabled: true });
        showSavedNotice();
      }
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({
      [key]: !settings[key],
    });
    showSavedNotice();
  };

  const handleTimeChange = (
    key: "breakfastTime" | "lunchTime" | "dinnerTime",
    value: string,
  ) => {
    updateSettings({
      [key]: value,
    });
    showSavedNotice();
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

  const handleStartOnboardingDemo = () => {
    useOnboardingDemoStore.getState().resetDemo();
    router.push("/onboarding/profile-calculator?demo=1");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6 pb-28 lg:pb-12">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-divider">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            aria-label="Kembali ke Dashboard"
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-neutral-10 hover:text-[#244710] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary font-heading">
            Pengaturan
          </h1>
        </div>

        <div
          role="status"
          aria-live="polite"
          className={cn(
            "inline-flex items-center gap-2 rounded-navigation bg-accent-green-light px-4 py-2 text-sm sm:text-base font-extrabold text-[#244710] transition-opacity",
            savedFeedback ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Tersimpan</span>
        </div>
      </header>

      <div className="space-y-5">
        {/* Notifications */}
        <section
          data-tour="settings-notifications"
          aria-labelledby="settings-notifications-heading"
          className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4"
        >
          <h2
            id="settings-notifications-heading"
            className="text-lg sm:text-xl font-extrabold text-[#244710] font-heading flex items-center gap-2.5"
          >
            <Bell
              className="h-5 w-5 text-[#529028] shrink-0"
              aria-hidden="true"
            />
            <span>Notifikasi</span>
          </h2>

          <div className="divide-y divide-border-divider/60">
            <SettingSwitchRow
              id="setting-web-push"
              checked={isSubscribed}
              disabled={!isSupported || isPushLoading}
              label="Notifikasi HP & Browser"
              description={
                isSupported
                  ? "Kirim pengingat langsung ke layar HP atau browser."
                  : "Browser ini belum mendukung notifikasi push."
              }
              errorText={pushError}
              onToggle={handlePushToggle}
            />

            <SettingSwitchRow
              id="setting-email-notif"
              checked={settings.emailNotificationsEnabled}
              label="Notifikasi Email"
              description={
                user?.email
                  ? `Kirim ringkasan harian ke ${user.email}.`
                  : "Kirim ringkasan harian ke email akunmu."
              }
              onToggle={() => handleToggle("emailNotificationsEnabled")}
            />

            <SettingSwitchRow
              id="setting-friend-pokes"
              checked={settings.friendPokes}
              label="Pengingat Teman"
              description="Beri tahu saat teman memberi pengingat makan."
              onToggle={() => handleToggle("friendPokes")}
            />

            <SettingSwitchRow
              id="setting-nutrition-eval"
              checked={settings.nutritionEvaluations}
              label="Pengingat Gizi & XP"
              description="Ingatkan jika target protein atau kalori harian belum tercapai."
              onToggle={() => handleToggle("nutritionEvaluations")}
            />
          </div>
        </section>

        {/* Meal Schedule */}
        <section
          data-tour="settings-schedule"
          aria-labelledby="settings-schedule-heading"
          className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4"
        >
          <h2
            id="settings-schedule-heading"
            className="text-lg sm:text-xl font-extrabold text-[#244710] font-heading flex items-center gap-2.5"
          >
            <Clock
              className="h-5 w-5 text-[#529028] shrink-0"
              aria-hidden="true"
            />
            <span>Jadwal Jam Makan</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="time-breakfast"
                className="block text-base font-extrabold text-[#244710]"
              >
                Sarapan
              </label>
              <input
                id="time-breakfast"
                type="time"
                value={settings.breakfastTime}
                onChange={(e) =>
                  handleTimeChange("breakfastTime", e.target.value)
                }
                className="input-field min-h-12 w-full rounded-navigation px-4 py-2.5 text-lg font-extrabold text-[#244710]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="time-lunch"
                className="block text-base font-extrabold text-[#244710]"
              >
                Makan Siang
              </label>
              <input
                id="time-lunch"
                type="time"
                value={settings.lunchTime}
                onChange={(e) => handleTimeChange("lunchTime", e.target.value)}
                className="input-field min-h-12 w-full rounded-navigation px-4 py-2.5 text-lg font-extrabold text-[#244710]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="time-dinner"
                className="block text-base font-extrabold text-[#244710]"
              >
                Makan Malam
              </label>
              <input
                id="time-dinner"
                type="time"
                value={settings.dinnerTime}
                onChange={(e) => handleTimeChange("dinnerTime", e.target.value)}
                className="input-field min-h-12 w-full rounded-navigation px-4 py-2.5 text-lg font-extrabold text-[#244710]"
              />
            </div>
          </div>
        </section>

        {/* App Guide */}
        <section
          data-tour="settings-guide"
          aria-labelledby="settings-guide-heading"
          className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4"
        >
          <div className="space-y-1">
            <h2
              id="settings-guide-heading"
              className="text-lg sm:text-xl font-extrabold text-[#244710] font-heading flex items-center gap-2.5"
            >
              <Compass
                className="h-5 w-5 text-[#529028] shrink-0"
                aria-hidden="true"
              />
              <span>Panduan Aplikasi</span>
            </h2>
            <p className="text-sm sm:text-base text-neutral-10 leading-relaxed">
              Lihat ulang cara memakai Caloria atau coba pengisian data diri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                resetTour("settings");
                startTour("settings");
              }}
              className="min-h-12 px-5 py-3 rounded-navigation bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-sm sm:text-base font-extrabold inline-flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]"
            >
              <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Panduan Halaman Ini</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetAll();
                setTourFeedback(
                  "Semua panduan direset. Panduan akan tampil saat halaman dibuka.",
                );
                setTimeout(() => setTourFeedback(null), 4000);
              }}
              className="min-h-12 px-5 py-3 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-[#244710] text-sm sm:text-base font-bold inline-flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Ulangi Semua Panduan</span>
            </button>

            <button
              type="button"
              onClick={handleStartOnboardingDemo}
              className="min-h-12 px-5 py-3 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-[#244710] text-sm sm:text-base font-bold inline-flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]"
            >
              <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Demo Data Diri</span>
            </button>
          </div>

          {tourFeedback && (
            <p className="text-sm sm:text-base font-bold text-[#244710]">
              {tourFeedback}
            </p>
          )}
        </section>

        {/* Account */}
        <section
          aria-labelledby="settings-account-heading"
          className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4"
        >
          <h2
            id="settings-account-heading"
            className="text-lg sm:text-xl font-extrabold text-[#244710] font-heading flex items-center gap-2.5"
          >
            <ShieldCheck
              className="h-5 w-5 text-[#529028] shrink-0"
              aria-hidden="true"
            />
            <span>Akun</span>
          </h2>

          <dl className="divide-y divide-border-divider/60 text-base">
            <div className="py-3 first:pt-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <dt className="font-semibold text-neutral-10">Nama</dt>
              <dd className="font-extrabold text-[#244710]">
                {user?.fullName || user?.username || "Pengguna Caloria"}
              </dd>
            </div>
            <div className="py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <dt className="font-semibold text-neutral-10">Username</dt>
              <dd className="font-bold text-neutral-10">
                {user?.username ? `@${user.username}` : "-"}
              </dd>
            </div>
            <div className="py-3 last:pb-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <dt className="font-semibold text-neutral-10">Email</dt>
              <dd className="font-bold text-neutral-10 break-all">
                {user?.email || "-"}
              </dd>
            </div>
          </dl>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-12 px-6 py-3 rounded-navigation border border-rose-600/35 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-base inline-flex items-center gap-2.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
