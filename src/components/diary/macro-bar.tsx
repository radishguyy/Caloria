"use client";

import React from "react";
import { useFoodStore } from "@/store/use-food-store";
import type { MacroCurrent, MacroTargets } from "@/types";
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  RotateCcw,
  Leaf,
  Cookie,
} from "lucide-react";
import { isToday, formatDateDisplay, getTodayKey } from "@/lib/date-utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

interface MacroBarProps {
  className?: string;
  footer?: React.ReactNode;
  selectedDate?: string;
  consumed?: MacroCurrent;
  targets?: MacroTargets;
  showTodayReset?: boolean;
  compact?: boolean;
  dataTour?: string | null;
}

export function MacroBar({
  className,
  footer,
  selectedDate: selectedDateProp,
  consumed: consumedProp,
  targets: targetsProp,
  showTodayReset = true,
  compact = false,
  dataTour = "dashboard-macro",
}: MacroBarProps) {
  const isHydrated = useHydrated();
  const {
    targets: storeTargets,
    getConsumed,
    selectedDate: storeSelectedDate,
    setSelectedDate,
  } = useFoodStore();

  if (!isHydrated) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-border-divider bg-surface p-5 sm:p-6 shadow-xs text-foreground",
          footer && "flex flex-col justify-between",
          className,
        )}
      >
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
            <div className="space-y-2">
              <div className="h-4 w-36 bg-surface-subtle animate-pulse rounded-navigation" />
              <div className="h-12 w-44 bg-surface-subtle animate-pulse rounded-navigation" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-surface-subtle animate-pulse" />
            </div>
          </div>
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-6 rounded-navigation bg-surface-subtle animate-pulse"
              />
            ))}
          </div>
        </div>
        {footer && (
          <div className="pt-6 space-y-4 animate-pulse">
            <div className="flex items-center justify-between gap-2">
              <div className="h-6 w-28 rounded-pill bg-surface-subtle" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 rounded-pill bg-surface-subtle" />
                <div className="h-9 w-28 rounded-pill bg-surface-subtle" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface-subtle rounded-2xl" />
              ))}
            </div>
            <div className="h-12 w-full rounded-button bg-surface-subtle" />
          </div>
        )}
      </div>
    );
  }

  const effectiveDate = selectedDateProp ?? storeSelectedDate;
  const consumed = consumedProp ?? getConsumed(effectiveDate);
  const targets = targetsProp ?? storeTargets;
  const isSelectedToday = isToday(effectiveDate);

  const caloriePercent = Math.min(
    100,
    Math.round((consumed.calories / Math.max(1, targets.calories)) * 100) || 0,
  );

  const proteinPercent = Math.min(
    100,
    Math.round((consumed.protein / Math.max(1, targets.protein)) * 100) || 0,
  );

  const carbsPercent = Math.min(
    100,
    Math.round((consumed.carbs / Math.max(1, targets.carbs)) * 100) || 0,
  );

  const fatPercent = Math.min(
    100,
    Math.round((consumed.fat / Math.max(1, targets.fat)) * 100) || 0,
  );

  const fiberTarget = targets.fiber ?? 28;
  const fiberPercent = Math.min(
    100,
    Math.round((consumed.fiber / Math.max(1, fiberTarget)) * 100) || 0,
  );

  const sugarTarget = targets.sugar ?? 45;
  const sugarPercent = Math.min(
    100,
    Math.round((consumed.sugar / Math.max(1, sugarTarget)) * 100) || 0,
  );

  // Circle: r=40, circumference = 2 * PI * 40 ≈ 251
  const r = 40;
  const circ = Math.round(2 * Math.PI * r);

  // 5 Nutrients vertically stacked in monochrome green/grey with percentage display
  const nutrients = [
    {
      id: "protein",
      label: "Protein",
      icon: Beef,
      percent: proteinPercent,
      valueDisplay: `${proteinPercent}%`,
    },
    {
      id: "carbs",
      label: "Karbohidrat",
      icon: Wheat,
      percent: carbsPercent,
      valueDisplay: `${carbsPercent}%`,
    },
    {
      id: "fat",
      label: "Lemak",
      icon: Droplets,
      percent: fatPercent,
      valueDisplay: `${fatPercent}%`,
    },
    {
      id: "fiber",
      label: "Serat",
      icon: Leaf,
      percent: fiberPercent,
      valueDisplay: `${fiberPercent}%`,
    },
    {
      id: "sugar",
      label: "Gula",
      icon: Cookie,
      percent: sugarPercent,
      valueDisplay: `${sugarPercent}%`,
    },
  ];

  return (
    <div
      data-tour={dataTour ?? undefined}
      className={cn(
        "rounded-3xl border border-border-divider bg-surface shadow-xs text-foreground",
        compact ? "p-5" : "p-5 sm:p-6",
        footer && "flex flex-col justify-between",
        className,
      )}
    >
      <div>
        {/* Top Calorie Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-text-muted text-xs sm:text-sm font-semibold uppercase tracking-wider">
              <Flame
                className="h-4 w-4 text-accent-green fill-accent-green shrink-0"
                aria-hidden="true"
              />
              <span>
                Target Kalori{" "}
                {isSelectedToday
                  ? "Harian"
                  : formatDateDisplay(effectiveDate, "short")}
              </span>
              {showTodayReset && !isSelectedToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayKey())}
                  className="inline-flex min-h-8 items-center gap-1 px-2.5 py-1 rounded-pill bg-accent-yellow text-text-primary text-[11px] font-bold hover:bg-accent-green-light focus-visible:bg-accent-green-light focus-visible:outline-none transition-colors normal-case cursor-pointer"
                  title="Kembali ke Hari Ini"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Hari Ini</span>
                </button>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
              <span
                className={cn(
                  "font-extrabold tracking-tight text-text-primary font-heading tabular-nums",
                  compact ? "text-3xl sm:text-4xl" : "text-3xl sm:text-5xl",
                )}
              >
                {consumed.calories}
              </span>
              <span
                className={cn(
                  "font-extrabold tracking-tight text-text-muted font-heading tabular-nums",
                  compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl",
                )}
              >
                / {targets.calories}
              </span>
              <span className="text-sm font-semibold text-text-muted self-end mb-1">
                kcal
              </span>
            </div>
          </div>

          {/* Circular progress */}
          <div className="flex flex-col items-center justify-center shrink-0 self-start sm:self-center">
            <div
              className={cn(
                "relative flex items-center justify-center",
                compact ? "h-20 w-20" : "h-20 w-20 sm:h-24 sm:w-24",
              )}
            >
              <svg
                className={cn(
                  "-rotate-90",
                  compact ? "w-20 h-20" : "w-20 h-20 sm:w-24 sm:h-24",
                )}
                viewBox="0 0 96 96"
                aria-hidden="true"
              >
                <circle
                  cx="48"
                  cy="48"
                  r={r}
                  className="stroke-accent-yellow"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={r}
                  className="stroke-accent-green transition-all duration-700"
                  strokeWidth="6"
                  strokeDasharray={circ}
                  strokeDashoffset={
                    circ - (circ * Math.min(caloriePercent, 100)) / 100
                  }
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span
                className={cn(
                  "absolute font-extrabold text-text-primary tabular-nums",
                  compact ? "text-sm" : "text-base sm:text-lg",
                )}
              >
                {caloriePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* 5 Nutrients vertically stacked horizontal progress bars */}
        <div className="space-y-3.5 pt-4">
          {nutrients.map((n) => (
            <div key={n.id} className="space-y-1.5">
              <div
                className={cn(
                  "flex items-center justify-between font-bold font-sans",
                  compact ? "text-sm" : "text-sm sm:text-base",
                )}
              >
                <span className="flex items-center gap-2 text-text-primary">
                  <n.icon
                    className={cn(
                      "shrink-0 text-accent-green",
                      compact ? "h-4 w-4" : "h-4.5 w-4.5",
                    )}
                    aria-hidden="true"
                  />
                  <span>{n.label}</span>
                </span>
                <span className="text-foreground font-extrabold tabular-nums">
                  {n.valueDisplay}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-pill overflow-hidden bg-border-divider/40">
                <div
                  className="h-full rounded-pill transition-all duration-500 bg-accent-green"
                  style={{ width: `${n.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {footer}
    </div>
  );
}
