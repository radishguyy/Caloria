"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Award,
  ChevronRight,
} from "lucide-react";
import { CalendarGrid } from "@/components/diary/archive/CalendarGrid";
import { DailyArchiveDetail } from "@/components/diary/archive/DailyArchiveDetail";
import { CaloriaWrappedShelf } from "@/components/diary/archive/CaloriaWrappedShelf";
import { useFoodStore } from "@/store/use-food-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  parseDateKey,
  getTodayKey,
  isFuture,
} from "@/lib/date-utils";

function CalendarSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-surface-subtle rounded-navigation" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-[480px] bg-surface rounded-card border border-border-divider" />
        <div className="lg:col-span-5 h-[480px] bg-surface rounded-card border border-border-divider" />
      </div>
    </div>
  );
}

function DiaryArchiveContent() {
  const isHydrated = useHydrated();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { selectedDate, setSelectedDate } = useFoodStore();

  const queryDate = searchParams?.get("date");
  const validQueryDate =
    queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate) && !isFuture(queryDate)
      ? queryDate
      : null;

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    if (validQueryDate) return parseDateKey(validQueryDate);
    return new Date();
  });

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    // Sync to URL search params cleanly without full page reload
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    newParams.set("date", dateKey);
    router.replace(`/diary/archive?${newParams.toString()}`, { scroll: false });
  };

  const handleChangeMonth = (newDate: Date) => {
    setCurrentMonthDate(newDate);
  };

  if (!isHydrated) {
    return <CalendarSkeleton />;
  }

  const activeDate = validQueryDate || selectedDate || getTodayKey();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/diary"
              className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
              title="Kembali ke Food Diary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-accent-orange uppercase tracking-wider font-heading">
              <span>Arsip Gamifikasi</span>
              <span>•</span>
              <span>Kalender Nutrisi</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary font-heading mt-1">
            Arsip Diary & Evaluasi Kepatuhan Gizi
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Telusuri riwayat asupan makanan, kepatuhan makro, serta perolehan XP dan Caloria Coins sepanjang perjalananmu.
          </p>
        </div>

        {/* Quick Nav Shortcut */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-primary text-xs font-bold transition-colors"
          >
            <span>Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          </Link>
          <Link
            href="/diary/add"
            className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>+ Catat Makanan</span>
          </Link>
        </div>
      </div>

      {/* Caloria Wrapped Shelf: Time-Gated Story Recaps & Milestones */}
      <CaloriaWrappedShelf />

      {/* Main Two-Column Grid: Calendar on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar Grid & Month Insights (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <CalendarGrid
            selectedDate={activeDate}
            onSelectDate={handleSelectDate}
            currentMonthDate={currentMonthDate}
            onChangeMonth={handleChangeMonth}
          />

          {/* Gamified Nutrition Archive Tip Card */}
          <div className="rounded-card border border-border-divider bg-surface p-5 text-xs text-neutral-10 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-text-primary font-bold">
              <Award className="h-4 w-4 text-accent-green" />
              <span>Panduan Arsip & Evaluasi RPG Caloria:</span>
            </div>
            <p className="text-text-muted leading-relaxed">
              Setiap hari di mana total kalori berada di zona target (85% – 110%) akan ditandai dengan indikator hijau segar dan memberikan <strong>Bonus Jackpot +50 XP</strong>. Klik tanggal mana saja pada kalender untuk memeriksa riwayat menu makanan atau menambahkan catatan retroaktif.
            </p>
          </div>
        </div>

        {/* Right Column: Daily Archive Detail Drawer / Inspector (Col 5) */}
        <div className="lg:col-span-5 sticky top-20">
          <DailyArchiveDetail
            selectedDate={activeDate}
            onSelectDate={handleSelectDate}
          />
        </div>
      </div>
    </div>
  );
}

export default function DiaryArchivePage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <DiaryArchiveContent />
    </Suspense>
  );
}
