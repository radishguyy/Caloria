"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-divider pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/diary"
            aria-label="Kembali ke Food Diary"
            className="shrink-0 rounded-xl border border-border-default p-1.5 text-text-muted transition-colors hover:bg-accent-green-light hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <h1 className="text-xl font-extrabold leading-tight tracking-tight text-text-primary font-heading sm:text-2xl">
            Arsip & Recap Mingguan
          </h1>
        </div>

        <Link
          href="/diary/add"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-green px-4 py-2 text-xs font-bold text-text-inverse transition-colors hover:bg-accent-green/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Catat Makanan</span>
        </Link>
      </header>

      {/* Weekly / Monthly Recap Shelf */}
      <CaloriaWrappedShelf />

      {/* Main Two-Column Grid: Calendar on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <CalendarGrid
            selectedDate={activeDate}
            onSelectDate={handleSelectDate}
            currentMonthDate={currentMonthDate}
            onChangeMonth={handleChangeMonth}
          />
        </div>

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
