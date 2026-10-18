"use client";

import Link from "next/link";
import { UserCircle, Trophy, TrendingDown, Bell, ArrowLeft, Compass } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useSocialStore } from "@/store/use-social-store";

export default function ProfilePage() {
  const { goalPlan } = useFoodStore();
  const { coopStreakDays, highestCoopStreak } = useSocialStore();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <UserCircle className="h-3.5 w-3.5" />
            Assigned Module: Afza
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            Profil & Galeri Achievement
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grafik riwayat perubahan berat badan menuju target, koleksi Badge Achievement, dan pengaturan notifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
          >
            <Compass className="h-4 w-4" />
            <span>Atur Ulang Target / BMI</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <TrendingDown className="h-4 w-4 text-emerald-500" />
            <span>Progres Berat Badan</span>
          </div>
          <p className="text-xl font-bold">
            {goalPlan.currentWeightKg} kg &rarr; {goalPlan.targetWeightKg} kg
          </p>
          <p className="text-xs text-muted-foreground">
            Hari ke-{goalPlan.currentDayNumber} dari {goalPlan.totalProjectedDays} hari
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>Rekor Co-op Streak</span>
          </div>
          <p className="text-xl font-bold">{highestCoopStreak} Hari</p>
          <p className="text-xs text-muted-foreground">
            Streak aktif saat ini: {coopStreakDays} hari
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Bell className="h-4 w-4 text-blue-500" />
            <span>Status Notifikasi</span>
          </div>
          <p className="text-xl font-bold">Aktif</p>
          <p className="text-xs text-muted-foreground">
            Pengingat jam makan & senggolan teman
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-3">
        <h2 className="text-base font-semibold">
          Placeholder Workspace untuk Afza (`src/app/profile/page.tsx`)
        </h2>
        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
          Area ini disiapkan untuk grafik riwayat berat badan, koleksi Milestone Badges (Consistency, Protein Champion, Calorie Sniper, Duo Unstoppable), dan pengaturan Web Push Notification.
        </p>
      </div>
    </div>
  );
}

