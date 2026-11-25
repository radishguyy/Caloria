"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  Compass,
  Play,
  RotateCcw,
  ShieldOff,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { useTour } from "@/components/tour/useTour";
import type { TourId } from "@/lib/tour/types";

const DEV_BYPASS_COOKIE = "caloria-dev-bypass";

const TOUR_PAGES: Array<{ id: TourId; label: string; href: string }> = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "diary", label: "Food Diary", href: "/diary" },
  { id: "diary-add", label: "Tambah Makanan", href: "/diary/add" },
  { id: "diary-archive", label: "Arsip Kalender", href: "/diary/archive" },
  { id: "quests", label: "Misi & Level", href: "/quests" },
  { id: "wardrobe", label: "Wardrobe CalPal", href: "/pet-customization/wardrobe" },
  { id: "shop", label: "Toko CalPal", href: "/pet-customization/shop" },
  { id: "social", label: "Social Hub", href: "/social" },
  { id: "profile", label: "Profil & Berat Badan", href: "/profile/overview" },
  { id: "settings", label: "Pengaturan", href: "/profile/settings" },
];

function enableDevBypassCookie() {
  document.cookie = `${DEV_BYPASS_COOKIE}=1; path=/; max-age=86400; SameSite=Lax`;
}

function disableDevBypassCookie() {
  document.cookie = `${DEV_BYPASS_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function dismissFloatingRemindersForTour() {
  try {
    sessionStorage.setItem("caloria-dismissed-push-reminder", "dismissed");
    sessionStorage.setItem("caloria-dismissed-coop-reminder", "dismissed");
    sessionStorage.setItem("caloria-dismissed-inapp-notif", "dismissed");
  } catch {}
}

export default function DevTourSandboxPage() {
  const router = useRouter();
  const { login, resetOnboarding } = useAuthStore();
  const { resetAll, resetTour, seen } = useTour();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const handleStartFullOnboarding = () => {
    enableDevBypassCookie();
    login("dev-tester@caloria.local", "devtester", false);
    resetOnboarding();
    resetAll();
    dismissFloatingRemindersForTour();
    router.push("/onboarding/profile-calculator");
  };

  const handleStartDashboardTour = () => {
    enableDevBypassCookie();
    login("dev-tester@caloria.local", "devtester", true);
    resetAll();
    dismissFloatingRemindersForTour();
    router.push("/dashboard");
  };

  const handleResetToursOnly = () => {
    enableDevBypassCookie();
    resetAll();
    dismissFloatingRemindersForTour();
    setStatusMsg("Semua status tour direset. Buka halaman mana saja di bawah untuk melihat tour.");
  };

  const handleDisableBypass = () => {
    disableDevBypassCookie();
    setStatusMsg("Mode dev bypass dimatikan. Proteksi login middleware kembali aktif normal.");
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="rounded-card bg-surface p-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-pill bg-accent-yellow px-3 py-1 text-[11px] font-bold text-text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Development Only</span>
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary font-heading">
          Sandbox Uji Onboarding & GlowTour
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Halaman khusus development untuk menguji alur onboarding awal dan semua walkthrough GlowTour tanpa perlu login atau membuat akun baru.
        </p>
      </div>

      {/* Primary Quick Actions */}
      <div className="rounded-card bg-surface p-6 space-y-4">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Play className="h-4 w-4 text-accent-green" aria-hidden="true" />
          <span>Aksi Cepat Pengujian</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleStartFullOnboarding}
            className="button-primary flex items-center justify-center gap-2 px-4 py-3 text-xs cursor-pointer"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Mulai Onboarding Awal → Dashboard</span>
          </button>

          <button
            type="button"
            onClick={handleStartDashboardTour}
            className="inline-flex items-center justify-center gap-2 rounded-button bg-surface-subtle px-4 py-3 text-xs font-bold text-text-primary hover:bg-accent-green-light/50 transition-colors cursor-pointer"
          >
            <Compass className="h-4 w-4 text-accent-green" aria-hidden="true" />
            <span>Langsung ke Dashboard + Reset Tour</span>
          </button>

          <button
            type="button"
            onClick={handleResetToursOnly}
            className="inline-flex items-center justify-center gap-2 rounded-button bg-surface-subtle px-4 py-2.5 text-xs font-semibold text-neutral-10 hover:bg-accent-green-light/30 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Aktifkan Bypass & Reset Semua Tour</span>
          </button>

          <button
            type="button"
            onClick={handleDisableBypass}
            className="inline-flex items-center justify-center gap-2 rounded-button bg-transparent px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Matikan Mode Dev Bypass</span>
          </button>
        </div>

        {statusMsg && (
          <p className="text-xs font-semibold text-text-primary pt-1">
            {statusMsg}
          </p>
        )}
      </div>

      {/* Direct Page Jump List */}
      <div className="rounded-card bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-text-primary">
            Lompat Langsung ke Halaman Tour (10 Halaman)
          </h2>
          <span className="text-[11px] text-text-muted">
            Otomatis aktifkan bypass saat diklik
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TOUR_PAGES.map((page) => {
            const isSeen = seen[page.id];
            return (
              <div
                key={page.id}
                className="flex items-center justify-between gap-2 rounded-2xl bg-surface-subtle px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isSeen ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-accent-green"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="h-4 w-4 shrink-0 text-text-muted"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {page.label}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {isSeen ? "Sudah dilihat" : "Belum dilihat"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isSeen && (
                    <button
                      type="button"
                      onClick={() => resetTour(page.id)}
                      className="rounded-xl px-2 py-1 text-[10px] font-bold text-text-muted hover:bg-surface hover:text-text-primary cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                  <Link
                    href={page.href}
                    onClick={() => {
                      enableDevBypassCookie();
                      login("dev-tester@caloria.local", "devtester", true);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-surface px-2.5 py-1 text-[11px] font-bold text-text-primary hover:bg-accent-green-light transition-colors"
                  >
                    <span>Buka</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
