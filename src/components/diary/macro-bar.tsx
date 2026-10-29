"use client";

import { useFoodStore } from "@/store/use-food-store";
import { Flame, Beef, Wheat, Droplets, RotateCcw } from "lucide-react";
import { MACRO_STYLES } from "@/lib/design-tokens";
import { isToday, formatDateDisplay, getTodayKey } from "@/lib/date-utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export function MacroBar() {
  const isHydrated = useHydrated();
  const {
    targets,
    getConsumed,
    getCaloriesRemaining,
    getDepkesEvaluation,
    selectedDate,
    setSelectedDate,
  } = useFoodStore();

  if (!isHydrated) {
    return (
      <div className="rounded-card border border-border-divider bg-surface p-6 shadow-xs text-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-surface-subtle animate-pulse rounded-navigation" />
            <div className="h-9 w-44 bg-surface-subtle animate-pulse rounded-navigation" />
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1 text-right">
              <div className="h-3 w-12 bg-surface-subtle animate-pulse rounded-navigation ml-auto" />
              <div className="h-5 w-20 bg-surface-subtle animate-pulse rounded-navigation ml-auto" />
            </div>
            <div className="h-12 w-12 rounded-pill bg-surface-subtle animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-4">
          <div className="h-20 rounded-button bg-surface-subtle animate-pulse" />
          <div className="h-20 rounded-button bg-surface-subtle animate-pulse" />
          <div className="h-20 rounded-button bg-surface-subtle animate-pulse" />
        </div>
      </div>
    );
  }

  const consumed = getConsumed();
  const caloriesRemaining = getCaloriesRemaining();
  const depkes = getDepkesEvaluation();
  const isSelectedToday = isToday(selectedDate);

  const caloriePercent = Math.min(
    100,
    Math.round((consumed.calories / targets.calories) * 100) || 0
  );

  const proteinPercent = Math.min(
    100,
    Math.round((consumed.protein / targets.protein) * 100) || 0
  );

  const carbsPercent = Math.min(
    100,
    Math.round((consumed.carbs / targets.carbs) * 100) || 0
  );

  const fatPercent = Math.min(
    100,
    Math.round((consumed.fat / targets.fat) * 100) || 0
  );

  return (
    <div className="rounded-card border border-border-divider bg-surface p-6 shadow-xs text-foreground">
      {/* Top Calorie Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
            <Flame className="h-4 w-4 text-accent-green fill-accent-green" />
            <span>Target Kalori {isSelectedToday ? "Harian" : formatDateDisplay(selectedDate, "short")}</span>
            {!isSelectedToday && (
              <button
                onClick={() => setSelectedDate(getTodayKey())}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-pill bg-accent-yellow text-text-primary text-[10px] font-bold hover:bg-accent-green-light transition-colors normal-case"
                title="Kembali ke Hari Ini"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>Hari Ini</span>
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <span className="text-3xl font-extrabold tracking-tight text-text-primary font-heading">
              {consumed.calories}
            </span>
            <span className="text-text-muted text-sm font-medium">
              / {targets.calories} kcal
            </span>
            {isHydrated && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-bold text-white shadow-2xs font-sans ml-1"
                style={{ backgroundColor: depkes.colorHex }}
              >
                {depkes.badgeText}
              </span>
            )}
          </div>
          {isHydrated && (
            <p className="text-[11px] text-text-muted mt-1 font-sans">
              {depkes.guidanceText}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-text-muted font-medium">Tersisa</span>
            <p
              className={cn(
                "text-base font-bold",
                caloriesRemaining > 0 ? "text-text-primary" : "text-accent-orange-dark"
              )}
            >
              {caloriesRemaining} kcal
            </p>
          </div>

          <div className="h-12 w-12 rounded-pill border-4 border-accent-yellow flex items-center justify-center relative">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-accent-yellow"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-accent-green transition-all duration-700"
                strokeWidth="4"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * Math.min(caloriePercent, 100)) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-text-primary">
              {caloriePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Macronutrient Breakdown */}
      <div className="grid grid-cols-3 gap-3 pt-4">
        {/* Protein */}
        <div
          className={cn(
            "flex flex-col gap-1.5 p-3 rounded-button border",
            MACRO_STYLES.protein.subtleBgClass,
            MACRO_STYLES.protein.borderClass
          )}
        >
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                "flex items-center gap-1 font-semibold",
                MACRO_STYLES.protein.textClass
              )}
            >
              <Beef className="h-3.5 w-3.5" />
              {MACRO_STYLES.protein.label}
            </span>
            <span className="text-[11px] text-text-muted">{proteinPercent}%</span>
          </div>
          <div
            className={cn(
              "h-1.5 w-full rounded-pill overflow-hidden",
              MACRO_STYLES.protein.trackClass
            )}
          >
            <div
              className={cn(
                "h-full transition-all duration-500",
                MACRO_STYLES.protein.bgClass
              )}
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-foreground">
            {consumed.protein}
            <span className="text-[10px] text-text-muted font-normal">
              {" "}
              / {targets.protein}g
            </span>
          </div>
        </div>

        {/* Carbs */}
        <div
          className={cn(
            "flex flex-col gap-1.5 p-3 rounded-button border",
            MACRO_STYLES.carbs.subtleBgClass,
            MACRO_STYLES.carbs.borderClass
          )}
        >
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                "flex items-center gap-1 font-semibold",
                MACRO_STYLES.carbs.textClass
              )}
            >
              <Wheat className="h-3.5 w-3.5" />
              {MACRO_STYLES.carbs.label}
            </span>
            <span className="text-[11px] text-text-muted">{carbsPercent}%</span>
          </div>
          <div
            className={cn(
              "h-1.5 w-full rounded-pill overflow-hidden",
              MACRO_STYLES.carbs.trackClass
            )}
          >
            <div
              className={cn(
                "h-full transition-all duration-500",
                MACRO_STYLES.carbs.bgClass
              )}
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-foreground">
            {consumed.carbs}
            <span className="text-[10px] text-text-muted font-normal">
              {" "}
              / {targets.carbs}g
            </span>
          </div>
        </div>

        {/* Fat */}
        <div
          className={cn(
            "flex flex-col gap-1.5 p-3 rounded-button border",
            MACRO_STYLES.fat.subtleBgClass,
            MACRO_STYLES.fat.borderClass
          )}
        >
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                "flex items-center gap-1 font-semibold",
                MACRO_STYLES.fat.textClass
              )}
            >
              <Droplets className="h-3.5 w-3.5" />
              {MACRO_STYLES.fat.label}
            </span>
            <span className="text-[11px] text-text-muted">{fatPercent}%</span>
          </div>
          <div
            className={cn(
              "h-1.5 w-full rounded-pill overflow-hidden",
              MACRO_STYLES.fat.trackClass
            )}
          >
            <div
              className={cn(
                "h-full transition-all duration-500",
                MACRO_STYLES.fat.bgClass
              )}
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-foreground">
            {consumed.fat}
            <span className="text-[10px] text-text-muted font-normal">
              {" "}
              / {targets.fat}g
            </span>
          </div>
        </div>
      </div>

      {/* Fiber & Sugar Micronutrient Details */}
      <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-border-divider text-xs">
        <div className="flex items-center justify-between px-3 py-2 rounded-input bg-surface-subtle">
          <span className="text-text-muted">Serat (Fiber)</span>
          <span className="font-semibold text-text-primary">
            {consumed.fiber}{" "}
            <span className="text-[10px] text-text-muted font-normal">
              / {targets.fiber ?? 28}g
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded-input bg-surface-subtle">
          <span className="text-text-muted">Gula (Sugar)</span>
          <span className="font-semibold text-macro-sugar">
            {consumed.sugar}{" "}
            <span className="text-[10px] text-text-muted font-normal">
              / {targets.sugar ?? 45}g
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
