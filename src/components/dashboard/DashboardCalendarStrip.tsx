"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowRight,
  Snowflake,
  Moon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getWeekDays, formatDateKey, addDays } from "@/lib/date-utils";
import { useFoodStore } from "@/store/use-food-store";
import { useSocialStore } from "@/store/use-social-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { activateRestDayAction } from "@/app/actions/streak";
import { getStreakSocietyTier } from "@/lib/streak-utils";
import { cn } from "@/lib/utils";

interface DashboardCalendarStripProps {
  className?: string;
  onSelectDate?: (dateKey: string) => void;
}

export function DashboardCalendarStrip({
  className,
  onSelectDate,
}: DashboardCalendarStripProps) {
  const isHydrated = useHydrated();
  const { selectedDate, setSelectedDate, getDailySummary } = useFoodStore();
  const {
    coopStreakDays,
    streakFreezes,
    restPasses,
    lastRestDayDate,
    setStreakMeta,
  } = useSocialStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [isActivatingRest, setIsActivatingRest] = useState(false);

  const todayKey = isHydrated ? formatDateKey(new Date()) : "";
  const societyTier = getStreakSocietyTier(coopStreakDays);
  const isRestToday = Boolean(todayKey && lastRestDayDate === todayKey);

  const handleActivateRestDay = async () => {
    setIsActivatingRest(true);
    try {
      const res = await activateRestDayAction();
      if (res.success) {
        setStreakMeta({
          restPasses: res.restPasses,
          lastRestDayDate: res.lastRestDayDate ?? todayKey,
          ...(coopStreakDays > 0 ? { lastLoggedDate: todayKey } : {}),
        });
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal mengaktifkan Rest Day.");
    } finally {
      setIsActivatingRest(false);
    }
  };

  const baseDate = isHydrated ? addDays(new Date(), weekOffset * 7) : null;
  const weekDays = baseDate ? getWeekDays(baseDate) : [];

  const handlePrevWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleResetToCurrentWeek = () => {
    setWeekOffset(0);
    const todayKey = formatDateKey(new Date());
    setSelectedDate(todayKey);
    onSelectDate?.(todayKey);
  };

  const handleDayClick = (dateKey: string) => {
    setSelectedDate(dateKey);
    onSelectDate?.(dateKey);
  };

  if (!isHydrated || !baseDate) {
    return (
      <div
        className={cn(
          "rounded-card border border-border-divider bg-surface p-4 sm:p-5 shadow-xs animate-pulse",
          className,
        )}
      >
        <div className="h-5 w-40 bg-surface-subtle rounded-pill mb-3" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-subtle rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Check if we are viewing the current week
  const isViewingCurrentWeek = weekOffset === 0;

  // Display month name based on displayed month
  const displayedMonthName = baseDate.toLocaleDateString("id-ID", {
    month: "long",
  });

  return (
    <section
      className={cn(
        "rounded-card border border-border-divider bg-surface p-4 sm:p-5 shadow-xs space-y-3.5",
        className,
      )}
      aria-label={`Kalender ${displayedMonthName}`}
    >
      {/* Top Header Row: Title format "Kalender [Nama Bulan]", showing month name instead of date range */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-navigation bg-accent-green/15 text-text-primary">
            <Calendar className="h-4 w-4 text-accent-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-text-primary font-heading capitalize">
                Kalender {displayedMonthName}
              </h3>
            </div>
            <p className="text-[11px] text-text-muted hidden sm:block capitalize">
              {displayedMonthName} {baseDate.getFullYear()}
            </p>
          </div>
        </div>

        {/* Right side: Navigation & Full Archive Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-surface-subtle border border-border-divider rounded-navigation p-0.5">
            <button
              type="button"
              onClick={handlePrevWeek}
              aria-label="Minggu Sebelumnya"
              className="p-1 rounded-input hover:bg-surface text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {!isViewingCurrentWeek && (
              <button
                type="button"
                onClick={handleResetToCurrentWeek}
                className="px-2 py-0.5 text-[10px] font-bold text-text-primary hover:bg-surface rounded-input transition-colors cursor-pointer"
                title="Kembali ke Minggu Ini"
              >
                Hari Ini
              </button>
            )}

            <button
              type="button"
              onClick={handleNextWeek}
              aria-label="Minggu Berikutnya"
              className="p-1 rounded-input hover:bg-surface text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <Link
            href="/diary/archive"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-navigation border border-border-default bg-surface-subtle hover:bg-accent-green-light text-text-primary text-xs font-bold transition-colors"
          >
            <span>Arsip Lengkap</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Streak Protection & Society Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-divider/70 bg-surface-subtle/60 px-3 py-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          {societyTier && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-bold border",
                societyTier.tier === "gold"
                  ? "bg-amber-100 border-amber-300 text-amber-900"
                  : societyTier.tier === "silver"
                    ? "bg-slate-100 border-slate-300 text-slate-800"
                    : "bg-orange-100 border-orange-300 text-orange-900",
              )}
              title={`Streak Society: ${societyTier.label} (≥ ${societyTier.minDays} hari)`}
            >
              <Sparkles className="h-3 w-3" />
              <span>{societyTier.label}</span>
            </span>
          )}
          <Link
            href="/pet-customization/shop"
            className="inline-flex items-center gap-1 rounded-pill bg-sky-50 border border-sky-200 px-2 py-0.5 font-bold text-sky-700 hover:bg-sky-100 transition-colors"
            title="Stok Streak Freeze kamu (kelola di Plaza Shop)"
          >
            <Snowflake className="h-3 w-3 text-sky-500" />
            <span>Freeze: {streakFreezes}</span>
          </Link>
        </div>

        {isRestToday ? (
          <span className="inline-flex items-center gap-1 rounded-pill bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 font-bold text-indigo-700">
            <Moon className="h-3 w-3" />
            <span>Rest Day Aktif</span>
          </span>
        ) : restPasses > 0 ? (
          <button
            type="button"
            onClick={handleActivateRestDay}
            disabled={isActivatingRest}
            className="inline-flex items-center gap-1 rounded-pill bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 font-bold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="Gunakan 1 Rest Day Pass agar streak aman hari ini tanpa log"
          >
            {isActivatingRest ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Moon className="h-3 w-3" />
            )}
            <span>Rest Day ({restPasses})</span>
          </button>
        ) : (
          <Link
            href="/pet-customization/shop"
            className="inline-flex items-center gap-1 rounded-pill bg-surface border border-border-default px-2 py-0.5 font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            <Moon className="h-3 w-3" />
            <span>Beli Rest Pass</span>
          </Link>
        )}
      </div>

      {/* 7-Day Horizontal Strip
          - Dots removed
          - Background colors:
            * canvas/white = no food logged
            * light green = logged but target unmet
            * primary green = target achieved
      */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {weekDays.map((day) => {
          const summary = getDailySummary(day.dateKey);
          const isSelected = selectedDate === day.dateKey;
          const isCellFuture = day.isFuture;
          const status = summary.status;
          const hasLogs = summary.hasLogs;

          const statusBgClass = (() => {
            if (isSelected)
              return "border-2 border-[#FF9233] bg-[#FCF8E3] shadow-xs ring-2 ring-[#FF9233]/20 text-accent-orange-dark font-bold";
            if (isCellFuture)
              return "bg-surface-subtle/50 border border-border-divider/50 text-text-muted";
            if (!hasLogs || status === "empty")
              return "bg-surface border border-border-divider text-foreground";
            if (status === "hit")
              return "bg-accent-green border border-accent-green text-text-inverse font-bold";
            // logged but target unmet (under or over)
            return "bg-accent-green-light border border-accent-green/40 text-text-primary font-semibold";
          })();

          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => !isCellFuture && handleDayClick(day.dateKey)}
              disabled={isCellFuture}
              aria-pressed={isSelected}
              className={cn(
                "group flex flex-col items-center justify-center py-2.5 px-1.5 sm:py-3 sm:px-2 rounded-2xl text-center transition-all duration-150 select-none",
                statusBgClass,
                isCellFuture
                  ? "opacity-40 cursor-not-allowed"
                  : "cursor-pointer hover:border-accent-green/50 hover:scale-[1.02] active:translate-y-[2px]",
                day.isToday &&
                  !isSelected &&
                  "ring-1.5 ring-accent-green/60 border-accent-green/80",
              )}
            >
              {/* Day Name (Sen, Sel, ...) */}
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-bold font-heading uppercase tracking-wider",
                  isSelected
                    ? "text-accent-orange-dark"
                    : status === "hit"
                      ? "text-text-inverse opacity-90"
                      : day.isToday
                        ? "text-accent-green"
                        : "text-text-muted",
                )}
              >
                {day.dayShortName}
              </span>

              {/* Day Number */}
              <span
                className={cn(
                  "mt-1 text-sm sm:text-base font-extrabold font-heading",
                  isSelected
                    ? "text-accent-orange-dark"
                    : status === "hit"
                      ? "text-text-inverse"
                      : "text-foreground",
                )}
              >
                {day.dayNumber}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
