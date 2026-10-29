"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  Flame,
  ArrowRight,
} from "lucide-react";
import {
  getWeekDays,
  formatDateKey,
  formatDateDisplay,
  addDays,
} from "@/lib/date-utils";
import { useFoodStore } from "@/store/use-food-store";
import { useSocialStore } from "@/store/use-social-store";
import { useHydrated } from "@/hooks/use-hydrated";
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
  const { coopStreakDays } = useSocialStore();

  const [weekOffset, setWeekOffset] = useState(0);

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
          className
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

  return (
    <section
      className={cn(
        "rounded-card border border-border-divider bg-surface p-4 sm:p-5 shadow-xs space-y-3.5",
        className
      )}
      aria-label="Kalender Mingguan Nutrisi"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-navigation bg-accent-green/15 text-text-primary">
            <Calendar className="h-4 w-4 text-accent-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-text-primary font-heading">
                Kalender sehat kamu
              </h3>
            </div>
            <p className="text-[11px] text-text-muted hidden sm:block">
              {weekDays.length > 0 &&
                `${formatDateDisplay(weekDays[0].dateKey, "short")} – ${formatDateDisplay(
                  weekDays[6].dateKey,
                  "short"
                )}`}
            </p>
          </div>
        </div>

        {/* Right side: Navigation & Full Archive Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-surface-subtle border border-border-divider rounded-navigation p-0.5">
            <button
              onClick={handlePrevWeek}
              aria-label="Minggu Sebelumnya"
              className="p-1 rounded-input hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {!isViewingCurrentWeek && (
              <button
                onClick={handleResetToCurrentWeek}
                className="px-2 py-0.5 text-[10px] font-bold text-text-primary hover:bg-surface rounded-input transition-colors"
                title="Kembali ke Minggu Ini"
              >
                Hari Ini
              </button>
            )}

            <button
              onClick={handleNextWeek}
              aria-label="Minggu Berikutnya"
              className="p-1 rounded-input hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
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

      {/* 7-Day Horizontal Strip */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {weekDays.map((day) => {
          const summary = getDailySummary(day.dateKey);
          const isSelected = selectedDate === day.dateKey;
          const isCellFuture = day.isFuture;
          const status = summary.status;

          return (
            <button
              key={day.dateKey}
              onClick={() => !isCellFuture && handleDayClick(day.dateKey)}
              disabled={isCellFuture}
              aria-pressed={isSelected}
              className={cn(
                "group flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl border text-center transition-all duration-150 select-none",
                // Current / past / future styling
                isCellFuture
                  ? "opacity-40 cursor-not-allowed bg-surface-subtle/50 border-border-divider/50"
                  : "cursor-pointer hover:border-accent-green/50 hover:scale-[1.02] active:translate-y-[2px]",
                // Selected styling
                isSelected
                  ? "border-2 border-[#FF9233] bg-[#FCF8E3] shadow-xs ring-2 ring-[#FF9233]/20"
                  : "bg-surface border-border-divider",
                // Today styling if not selected
                day.isToday && !isSelected && "ring-1.5 ring-accent-green/60 border-accent-green/80"
              )}
            >
              {/* Day Name (Sen, Sel, ...) */}
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-bold font-heading uppercase tracking-wider",
                  day.isToday
                    ? "text-accent-green"
                    : isSelected
                    ? "text-accent-orange-dark"
                    : "text-text-muted"
                )}
              >
                {day.dayShortName}
              </span>

              {/* Day Number */}
              <span
                className={cn(
                  "my-1 text-xs sm:text-sm font-extrabold font-sans",
                  day.isToday
                    ? "flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-pill bg-accent-green text-text-inverse shadow-xs"
                    : isSelected
                    ? "text-accent-orange-dark"
                    : "text-foreground"
                )}
              >
                {day.dayNumber}
              </span>

              {/* Status Indicator Dot or Checkmark */}
              <div className="h-3.5 flex items-center justify-center">
                {!isCellFuture ? (
                  status === "hit" ? (
                    <span className="flex items-center justify-center w-3 h-3 rounded-full bg-[#5B8E55] text-white">
                      <Check className="h-2 w-2 stroke-[3]" />
                    </span>
                  ) : status === "under" ? (
                    <span
                      className="w-2 h-2 rounded-full bg-[#F59E0B]"
                      title="Di bawah target"
                    />
                  ) : status === "over" ? (
                    <span
                      className="w-2 h-2 rounded-full bg-[#F43F5E]"
                      title="Melebihi target"
                    />
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-neutral-7/40"
                      title="Belum dicatat"
                    />
                  )
                ) : (
                  <span className="w-1 h-1 rounded-full bg-neutral-7/20" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

