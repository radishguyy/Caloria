"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  Plus,
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  formatDateDisplay,
  isToday,
  isFuture,
  getTodayKey,
} from "@/lib/date-utils";
import { useFoodStore } from "@/store/use-food-store";
import { MEAL_TYPES } from "@/lib/constants";
import { MACRO_STYLES } from "@/lib/design-tokens";
import { CharacterSvg } from "@/components/pet/character-svg";
import { usePetStore } from "@/store/use-pet-store";
import { fetchUserArchiveSummariesAction } from "@/app/actions/diary";
import { cn } from "@/lib/utils";

interface DailyArchiveDetailProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
}

export function DailyArchiveDetail({
  selectedDate,
  onSelectDate,
}: DailyArchiveDetailProps) {
  const { targets, getDailySummary } = useFoodStore();
  const { species, getEffectiveColors } = usePetStore();

  const isSelectedToday = isToday(selectedDate);
  const isSelectedFuture = isFuture(selectedDate);
  const summary = getDailySummary(selectedDate);

  const [serverSummary, setServerSummary] = useState<any>(null);

  useEffect(() => {
    let isCancelled = false;
    if (summary.hasLogs) {
      setServerSummary(null);
      return;
    }
    fetchUserArchiveSummariesAction(selectedDate, selectedDate)
      .then((res) => {
        if (!isCancelled && res.success && res.data && res.data[selectedDate]) {
          setServerSummary(res.data[selectedDate]);
        } else if (!isCancelled) {
          setServerSummary(null);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn("[DailyArchiveDetail] fetchUserArchiveSummariesAction failed:", err);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedDate, summary.hasLogs]);

  const activeCalories = summary.hasLogs
    ? summary.consumed.calories
    : serverSummary?.totalCalories || 0;
  const activeProtein = summary.hasLogs
    ? summary.consumed.protein
    : serverSummary?.totalProtein || 0;
  const activeCarbs = summary.hasLogs
    ? summary.consumed.carbs
    : serverSummary?.totalCarbs || 0;
  const activeFat = summary.hasLogs
    ? summary.consumed.fat
    : serverSummary?.totalFat || 0;
  const activeFiber = summary.hasLogs
    ? summary.consumed.fiber
    : serverSummary?.totalFiber || 0;
  const activeSugar = summary.hasLogs
    ? summary.consumed.sugar
    : serverSummary?.totalSugar || 0;

  const consumed = {
    calories: activeCalories,
    protein: activeProtein,
    carbs: activeCarbs,
    fat: activeFat,
    fiber: activeFiber,
    sugar: activeSugar,
  };

  const hasLogs = summary.hasLogs || activeCalories > 0;
  const percentage = targets.calories > 0
    ? Math.round((activeCalories / targets.calories) * 100)
    : 0;
  const caloriePercent = Math.min(100, percentage);

  const status = summary.hasLogs
    ? summary.status
    : serverSummary?.isCalorieTargetMet
    ? "hit"
    : activeCalories < (targets.calories || 2000) * 0.85
    ? "under"
    : "over";

  const xpEarned = summary.hasLogs ? summary.xpEarned : serverSummary?.baseXpTotal || 0;
  const coinsEarned = summary.hasLogs ? summary.coinsEarned : 10;
  const logs = summary.logs;

  const effectiveColors = getEffectiveColors();

  const fiberTarget = targets.fiber ?? 28;
  const sugarTarget = targets.sugar ?? 45;

  // Macro percentages
  const proteinPercent = Math.min(
    100,
    Math.round((activeProtein / (targets.protein || 130)) * 100)
  );
  const carbsPercent = Math.min(
    100,
    Math.round((activeCarbs / (targets.carbs || 230)) * 100)
  );
  const fatPercent = Math.min(
    100,
    Math.round((activeFat / (targets.fat || 55)) * 100)
  );
  const fiberPercent = Math.min(
    100,
    Math.round((activeFiber / (fiberTarget || 28)) * 100)
  );
  const sugarPercent = Math.min(
    100,
    Math.round((activeSugar / (sugarTarget || 45)) * 100)
  );

  return (
    <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 shadow-xs space-y-5">
      {/* Date Header & Jump to Today */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-divider">
        <h3 className="text-lg sm:text-xl font-extrabold text-text-primary font-heading">
          Hari Ini
        </h3>

        {!isSelectedToday && (
          <button
            onClick={() => onSelectDate(getTodayKey())}
            className="text-xs font-bold text-text-primary hover:text-accent-orange-dark transition-colors px-2.5 py-1 rounded-navigation bg-surface-subtle border border-border-default hover:bg-accent-green-light shrink-0"
          >
            Kembali ke Hari Ini
          </button>
        )}
      </div>

      {/* Compliance Status Badge / Alert Banner */}
      {hasLogs ? (
        <div
          className={cn(
            "p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors",
            status === "hit" && "bg-accent-green/15 border-[#5B8E55]/40 text-text-primary",
            status === "under" && "bg-accent-yellow/40 border-accent-orange/30 text-neutral-10",
            status === "over" && "bg-macro-fat/10 border-macro-fat/30 text-neutral-10"
          )}
        >
          <div className="flex items-center gap-2.5">
            {status === "hit" ? (
              <CheckCircle2 className="h-5 w-5 text-[#5B8E55] shrink-0" />
            ) : status === "under" ? (
              <AlertCircle className="h-5 w-5 text-accent-orange-dark shrink-0" />
            ) : (
              <TrendingUp className="h-5 w-5 text-macro-fat shrink-0" />
            )}
            <p className="text-xs font-bold text-foreground">
              {status === "hit"
                ? "Target Kalori Tercapai (Goal Met)!"
                : status === "under"
                ? "Asupan Kalori Belum Mencapai Target"
                : "Asupan Melebihi Batas Kalori Target"}
            </p>
          </div>

          {/* Gamification Reward Badge */}
          {xpEarned > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface border border-border-default shrink-0 text-xs font-bold text-text-primary">
              <Award className="h-3.5 w-3.5 text-accent-green" />
              <span>+{xpEarned} XP</span>
              <span className="text-accent-orange ml-1">+{coinsEarned} 🪙</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Calories & Macro Breakdown Card (Dashboard Style - All Nutrients as Progress Bars) */}
      <div className="rounded-3xl border border-border-divider bg-surface p-5 shadow-xs space-y-4">
        {/* Top Calorie Progress Bar */}
        <div className="space-y-2 pb-4 border-b border-border-divider">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
              <Flame className="h-4 w-4 text-accent-green fill-accent-green" />
              <span>Total Kalori Terhitung</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {caloriePercent}%
            </span>
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary font-heading">
              {consumed.calories}
            </span>
            <span className="text-text-muted text-sm font-medium">
              / {targets.calories} kcal
            </span>
          </div>

          <div
            className={cn(
              "h-2.5 w-full rounded-pill overflow-hidden",
              MACRO_STYLES.calories.trackClass
            )}
          >
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-pill",
                status === "over"
                  ? "bg-macro-fat"
                  : status === "under" && hasLogs
                  ? "bg-accent-orange"
                  : MACRO_STYLES.calories.bgClass
              )}
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
        </div>

        {/* 3 Main Macro Breakdown Progress Bars */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Protein */}
          <div
            className={cn(
              "flex flex-col gap-1.5 p-3 rounded-2xl border transition-all",
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
              <span className="text-[11px] text-text-muted">
                {proteinPercent}%
              </span>
            </div>
            <div
              className={cn(
                "h-1.5 w-full rounded-pill overflow-hidden",
                MACRO_STYLES.protein.trackClass
              )}
            >
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-pill",
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
              "flex flex-col gap-1.5 p-3 rounded-2xl border transition-all",
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
              <span className="text-[11px] text-text-muted">
                {carbsPercent}%
              </span>
            </div>
            <div
              className={cn(
                "h-1.5 w-full rounded-pill overflow-hidden",
                MACRO_STYLES.carbs.trackClass
              )}
            >
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-pill",
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
              "flex flex-col gap-1.5 p-3 rounded-2xl border transition-all",
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
              <span className="text-[11px] text-text-muted">
                {fatPercent}%
              </span>
            </div>
            <div
              className={cn(
                "h-1.5 w-full rounded-pill overflow-hidden",
                MACRO_STYLES.fat.trackClass
              )}
            >
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-pill",
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

        {/* Fiber & Sugar Progress Bars */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border-divider">
          {/* Fiber */}
          <div
            className={cn(
              "flex flex-col gap-1.5 p-3 rounded-2xl border transition-all",
              MACRO_STYLES.fiber.subtleBgClass,
              MACRO_STYLES.fiber.borderClass
            )}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "font-semibold",
                  MACRO_STYLES.fiber.textClass
                )}
              >
                Serat (Fiber)
              </span>
              <span className="text-[11px] text-text-muted">
                {fiberPercent}%
              </span>
            </div>
            <div
              className={cn(
                "h-1.5 w-full rounded-pill overflow-hidden",
                MACRO_STYLES.fiber.trackClass
              )}
            >
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-pill",
                  MACRO_STYLES.fiber.bgClass
                )}
                style={{ width: `${fiberPercent}%` }}
              />
            </div>
            <div className="text-xs font-bold text-foreground">
              {consumed.fiber}
              <span className="text-[10px] text-text-muted font-normal">
                {" "}
                / {fiberTarget}g
              </span>
            </div>
          </div>

          {/* Sugar */}
          <div
            className={cn(
              "flex flex-col gap-1.5 p-3 rounded-2xl border transition-all",
              MACRO_STYLES.sugar.subtleBgClass,
              MACRO_STYLES.sugar.borderClass
            )}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "font-semibold",
                  MACRO_STYLES.sugar.textClass
                )}
              >
                Gula (Sugar)
              </span>
              <span className="text-[11px] text-text-muted">
                {sugarPercent}%
              </span>
            </div>
            <div
              className={cn(
                "h-1.5 w-full rounded-pill overflow-hidden",
                MACRO_STYLES.sugar.trackClass
              )}
            >
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-pill",
                  MACRO_STYLES.sugar.bgClass
                )}
                style={{ width: `${sugarPercent}%` }}
              />
            </div>
            <div className="text-xs font-bold text-foreground">
              {consumed.sugar}
              <span className="text-[10px] text-text-muted font-normal">
                {" "}
                / {sugarTarget}g
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Slots Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-text-primary">
            Menu Makanan
          </h4>
          <span className="text-xs text-text-muted font-medium">
            {logs.length} item dicatat
          </span>
        </div>

        {/* Empty State */}
        {!hasLogs ? (
          <div className="py-8 px-4 rounded-2xl border border-dashed border-border-divider bg-surface-subtle text-center space-y-3">
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-pill bg-accent-yellow/50 border border-accent-yellow">
              <CharacterSvg
                characterId={species}
                colors={effectiveColors}
                size="sm"
                className="w-12 h-12"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Tidak ada menu dicatat di tanggal ini!
              </p>
              <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
                Pet tampak penasaran menunggu asupan nutrisimu. Mulai catat makanan untuk melengkapi arsip jurnal gizi.
              </p>
            </div>

            {!isSelectedFuture && (
              <Link
                href={`/diary/add?date=${selectedDate}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-navigation bg-accent-green hover:bg-accent-green/90 text-text-inverse text-xs font-bold transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Catat Makanan</span>
              </Link>
            )}
          </div>
        ) : (
          /* List of meals */
          <div className="space-y-3">
            {MEAL_TYPES.map((meal) => {
              const mealLogs = logs.filter((l) => l.mealType === meal.id);
              if (mealLogs.length === 0) return null;

              const mealCal = mealLogs.reduce((sum, item) => sum + item.calories, 0);

              return (
                <div
                  key={meal.id}
                  className="p-3.5 rounded-2xl border border-border-divider bg-surface space-y-2"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-border-divider/60">
                    <span className="text-xs font-bold text-text-primary font-heading">
                      {meal.label}
                    </span>
                    <span className="text-xs font-extrabold text-foreground">
                      {mealCal} kcal
                    </span>
                  </div>

                  <div className="divide-y divide-border-divider/50">
                    {mealLogs.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-[11px] text-text-muted">
                            {item.servingSize} {item.servingUnit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action CTA Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
        {!isSelectedFuture && (
          <Link
            href={`/diary/add?date=${selectedDate}`}
            className="w-full sm:flex-1 rounded-button bg-accent-green-light hover:bg-accent-green-light/85 text-text-primary font-bold transition-colors flex items-center justify-center gap-2 py-2.5 text-xs shadow-none"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Makanan</span>
          </Link>
        )}

        <Link
          href="/diary"
          className="w-full sm:w-auto px-4 py-2.5 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-primary text-xs font-bold transition-colors text-center"
        >
          Ke Food Diary Utama &rarr;
        </Link>
      </div>
    </div>
  );
}
