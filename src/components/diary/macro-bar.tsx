"use client";

import { useFoodStore } from "@/store/use-food-store";
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
}

export function MacroBar({ className }: MacroBarProps) {
  const isHydrated = useHydrated();
  const { targets, getConsumed, selectedDate, setSelectedDate } =
    useFoodStore();

  if (!isHydrated) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-border-divider bg-surface p-5 sm:p-6 shadow-xs text-foreground",
          className,
        )}
      >
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
    );
  }

  const consumed = getConsumed();
  const isSelectedToday = isToday(selectedDate);

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

  // 5 Nutrients vertically stacked: percentage for macros, grams for fiber & sugar
  const nutrients = [
    {
      id: "protein",
      label: "Protein",
      icon: Beef,
      percent: proteinPercent,
      valueDisplay: `${proteinPercent}%`,
      labelClass: "text-macro-protein",
      iconClass: "text-macro-protein",
      barClass: "bg-macro-protein",
      trackClass: "bg-macro-protein/20",
    },
    {
      id: "carbs",
      label: "Karbohidrat",
      icon: Wheat,
      percent: carbsPercent,
      valueDisplay: `${carbsPercent}%`,
      labelClass: "text-accent-orange-dark",
      iconClass: "text-accent-orange",
      barClass: "bg-accent-orange",
      trackClass: "bg-accent-orange/20",
    },
    {
      id: "fat",
      label: "Lemak",
      icon: Droplets,
      percent: fatPercent,
      valueDisplay: `${fatPercent}%`,
      labelClass: "text-macro-fat",
      iconClass: "text-macro-fat",
      barClass: "bg-macro-fat",
      trackClass: "bg-macro-fat/20",
    },
    {
      id: "fiber",
      label: "Serat",
      icon: Leaf,
      percent: fiberPercent,
      valueDisplay: `${consumed.fiber} / ${fiberTarget}g`,
      labelClass: "text-macro-fiber",
      iconClass: "text-macro-fiber",
      barClass: "bg-macro-fiber",
      trackClass: "bg-macro-fiber/20",
    },
    {
      id: "sugar",
      label: "Gula",
      icon: Cookie,
      percent: sugarPercent,
      valueDisplay: `${consumed.sugar} / ${sugarTarget}g`,
      labelClass: "text-macro-sugar",
      iconClass: "text-macro-sugar",
      barClass: "bg-macro-sugar",
      trackClass: "bg-macro-sugar/20",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-3xl border border-border-divider bg-surface p-5 sm:p-6 shadow-xs text-foreground",
        className,
      )}
    >
      {/* Top Calorie Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
            <Flame
              className="h-4 w-4 text-accent-green fill-accent-green shrink-0"
              aria-hidden="true"
            />
            <span>
              Target Kalori{" "}
              {isSelectedToday
                ? "Harian"
                : formatDateDisplay(selectedDate, "short")}
            </span>
            {!isSelectedToday && (
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
            <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary font-heading">
              {consumed.calories}
            </span>
            <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-muted font-heading">
              / {targets.calories}
            </span>
            <span className="text-sm font-semibold text-text-muted self-end mb-1">
              kcal
            </span>
          </div>
        </div>

        {/* Circular progress */}
        <div className="flex flex-col items-center justify-center shrink-0 self-start sm:self-center">
          <div className="relative flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24">
            <svg
              className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90"
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
            <span className="absolute text-xs sm:text-sm font-bold text-text-primary">
              {caloriePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 5 Nutrients vertically stacked horizontal progress bars */}
      <div className="space-y-3 pt-4">
        {nutrients.map((n) => (
          <div key={n.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold font-sans">
              <span className={cn("flex items-center gap-1.5", n.labelClass)}>
                <n.icon
                  className={cn("h-4 w-4 shrink-0", n.iconClass)}
                  aria-hidden="true"
                />
                <span>{n.label}</span>
              </span>
              <span className="text-foreground font-bold">{n.valueDisplay}</span>
            </div>
            <div
              className={cn(
                "h-2 w-full rounded-pill overflow-hidden",
                n.trackClass,
              )}
            >
              <div
                className={cn(
                  "h-full rounded-pill transition-all duration-500",
                  n.barClass,
                )}
                style={{ width: `${n.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
