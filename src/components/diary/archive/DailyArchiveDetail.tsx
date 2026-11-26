"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  Moon,
  Snowflake,
  RotateCcw,
} from "lucide-react";
import {
  formatDateDisplay,
  formatDateKey,
  addDays,
  isToday,
  isFuture,
  getTodayKey,
} from "@/lib/date-utils";
import { useFoodStore } from "@/store/use-food-store";
import { useSocialStore } from "@/store/use-social-store";
import { MEAL_TYPES } from "@/lib/constants";
import { MacroBar } from "@/components/diary/macro-bar";
import { fetchUserArchiveSummariesAction } from "@/app/actions/diary";
import { cn } from "@/lib/utils";

interface ArchiveSummaryRecord {
  date?: string;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFiber?: number;
  totalSugar?: number;
  isCalorieTargetMet?: boolean;
  baseXpTotal?: number;
}

interface DailyArchiveDetailProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
}

export function DailyArchiveDetail({
  selectedDate,
  onSelectDate,
}: DailyArchiveDetailProps) {
  const { targets, getDailySummary } = useFoodStore();
  const { lastFreezeUsedDate, lastRestDayDate } = useSocialStore();

  const isSelectedToday = isToday(selectedDate);
  const isSelectedYesterday =
    selectedDate === formatDateKey(addDays(new Date(), -1));
  const isSelectedFuture = isFuture(selectedDate);
  const isFreezeDay = selectedDate === lastFreezeUsedDate;
  const isRestDay = selectedDate === lastRestDayDate;
  const summary = getDailySummary(selectedDate);

  const [retryToken, setRetryToken] = useState(0);
  const requestKey = `${selectedDate}:${retryToken}`;
  const [remoteState, setRemoteState] = useState<{
    key: string;
    data: ArchiveSummaryRecord | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (summary.hasLogs) {
      return;
    }

    fetchUserArchiveSummariesAction(selectedDate, selectedDate)
      .then((res) => {
        if (isCancelled) return;
        const record =
          res.success && res.data && res.data[selectedDate]
            ? (res.data[selectedDate] as ArchiveSummaryRecord)
            : null;
        setRemoteState({
          key: requestKey,
          data: record,
          error: null,
        });
      })
      .catch((err) => {
        if (isCancelled) return;
        console.warn(
          "[DailyArchiveDetail] fetchUserArchiveSummariesAction failed:",
          err,
        );
        setRemoteState({
          key: requestKey,
          data: null,
          error: "Gagal memuat ringkasan nutrisi dari server.",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedDate, summary.hasLogs, requestKey]);

  const isLoadingSummary = !summary.hasLogs && remoteState?.key !== requestKey;
  const serverSummary =
    !summary.hasLogs && remoteState?.key === requestKey
      ? remoteState.data
      : null;
  const summaryError =
    !summary.hasLogs && remoteState?.key === requestKey
      ? remoteState.error
      : null;

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

  const status = summary.hasLogs
    ? summary.status
    : serverSummary?.isCalorieTargetMet
      ? "hit"
      : activeCalories < (targets.calories || 2000) * 0.85
        ? "under"
        : "over";

  const xpEarned = summary.hasLogs
    ? summary.xpEarned
    : serverSummary?.baseXpTotal || 0;
  const coinsEarned = summary.hasLogs ? summary.coinsEarned : 10;
  const logs = summary.logs;

  const fiberTarget = targets.fiber ?? 28;
  const sugarTarget = targets.sugar ?? 45;

  const proteinPercent = Math.min(
    100,
    Math.round((activeProtein / (targets.protein || 130)) * 100),
  );
  const fiberPercent = Math.min(
    100,
    Math.round((activeFiber / (fiberTarget || 28)) * 100),
  );

  const dayLabel = isSelectedToday
    ? "Hari ini"
    : isSelectedYesterday
      ? "Kemarin"
      : "Di hari ini";

  const dailyTip = (() => {
    if (!hasLogs) {
      if (isRestDay) {
        return {
          text: `${dayLabel} ditandai Rest Day — streak kamu tetap aman.`,
          tone: "info" as const,
          icon: "rest" as const,
        };
      }
      if (isFreezeDay) {
        return {
          text: `${dayLabel} dilindungi Streak Freeze.`,
          tone: "info" as const,
          icon: "freeze" as const,
        };
      }
      return {
        text: isSelectedToday
          ? "Hari ini kamu belum mengisi catatan makanan."
          : `${dayLabel} kamu belum mengisi catatan makanan.`,
        tone: "muted" as const,
        icon: "tip" as const,
      };
    }

    if (activeSugar > sugarTarget) {
      return {
        text: `${dayLabel} asupan gula melebihi batas — kurangi minuman atau camilan manis.`,
        tone: "warn" as const,
        icon: "tip" as const,
      };
    }
    if (proteinPercent < 75) {
      return {
        text: `${dayLabel} protein masih kurang — coba tambah telur, ayam, ikan, atau tempe.`,
        tone: "warn" as const,
        icon: "tip" as const,
      };
    }
    if (fiberPercent < 60) {
      return {
        text: `${dayLabel} serat masih kurang — tambah sayur atau buah di menu berikutnya.`,
        tone: "warn" as const,
        icon: "tip" as const,
      };
    }
    if (status === "over") {
      return {
        text: `${dayLabel} kalori melebihi target — jaga porsi sedikit lebih ringan berikutnya.`,
        tone: "warn" as const,
        icon: "tip" as const,
      };
    }
    if (status === "under") {
      return {
        text: `${dayLabel} kalori masih di bawah target — pastikan asupan energimu cukup.`,
        tone: "warn" as const,
        icon: "tip" as const,
      };
    }
    return {
      text: `${dayLabel} asupanmu sudah seimbang — pertahankan!`,
      tone: "good" as const,
      icon: "tip" as const,
    };
  })();

  return (
    <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 shadow-xs space-y-5">
      {/* Date Header & Jump to Today */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-divider">
        <h3 className="text-lg sm:text-xl font-extrabold text-text-primary font-heading">
          {isSelectedToday
            ? "Hari Ini"
            : isSelectedYesterday
              ? "Kemarin"
              : formatDateDisplay(selectedDate, "short")}
        </h3>

        {!isSelectedToday && (
          <button
            type="button"
            onClick={() => onSelectDate(getTodayKey())}
            className="text-xs font-bold text-text-primary hover:text-accent-orange-dark transition-colors px-3 py-1.5 rounded-[10px] bg-surface-subtle border border-border-default hover:bg-accent-green-light shrink-0 cursor-pointer"
          >
            Kembali ke Hari Ini
          </button>
        )}
      </div>

      {/* Simple Daily Tip */}
      {!isSelectedFuture && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-medium",
            dailyTip.tone === "good" &&
              "bg-accent-green/10 border-accent-green/30 text-text-primary",
            dailyTip.tone === "warn" &&
              "bg-accent-yellow/35 border-accent-orange/30 text-text-primary",
            dailyTip.tone === "info" && "bg-sky-50 border-sky-200 text-sky-900",
            dailyTip.tone === "muted" &&
              "bg-surface-subtle border-border-divider text-text-muted",
          )}
        >
          {dailyTip.icon === "rest" ? (
            <Moon className="h-4 w-4 text-indigo-600 shrink-0" />
          ) : dailyTip.icon === "freeze" ? (
            <Snowflake className="h-4 w-4 text-sky-600 shrink-0" />
          ) : (
            <Lightbulb
              className={cn(
                "h-4 w-4 shrink-0",
                dailyTip.tone === "good"
                  ? "text-accent-green"
                  : dailyTip.tone === "warn"
                    ? "text-accent-orange-dark"
                    : "text-text-muted",
              )}
            />
          )}
          <span>{dailyTip.text}</span>
        </div>
      )}

      {/* Compliance Status Badge / Alert Banner */}
      {hasLogs ? (
        <div
          className={cn(
            "p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors",
            status === "hit" &&
              "bg-accent-green/15 border-[#5B8E55]/40 text-text-primary",
            status === "under" &&
              "bg-accent-yellow/40 border-accent-orange/30 text-neutral-10",
            status === "over" &&
              "bg-macro-fat/10 border-macro-fat/30 text-neutral-10",
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

      {/* Calories & Macro Progress Card (Unified with Dashboard MacroBar) */}
      {isLoadingSummary ? (
        <div
          aria-live="polite"
          aria-label="Memuat ringkasan nutrisi"
          className="rounded-3xl border border-border-divider bg-surface p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-divider">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-navigation bg-border-divider/40" />
              <div className="h-9 w-40 rounded-navigation bg-border-divider/40" />
            </div>
            <div className="h-20 w-20 rounded-full bg-border-divider/40 shrink-0" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-6 rounded-navigation bg-border-divider/40"
              />
            ))}
          </div>
        </div>
      ) : summaryError ? (
        <div
          role="alert"
          className="rounded-3xl border border-macro-fat/30 bg-macro-fat/10 p-5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
            <AlertCircle className="h-4 w-4 text-macro-fat shrink-0" />
            <span>{summaryError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRetryToken((t) => t + 1)}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-border-default bg-surface px-3 py-1.5 text-xs font-bold text-text-primary hover:bg-accent-green-light transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : (
        <MacroBar
          selectedDate={selectedDate}
          consumed={consumed}
          targets={targets}
          showTodayReset={false}
          compact
          dataTour={null}
        />
      )}

      {/* Meal Slots Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-text-primary">Menu Makanan</h4>
          <span className="text-xs text-text-muted font-medium">
            {logs.length} item dicatat
          </span>
        </div>

        {/* Empty State */}
        {!hasLogs ? (
          <div className="py-8 px-4 rounded-2xl border border-dashed border-border-divider bg-surface-subtle text-center">
            <p className="text-lg sm:text-xl font-bold text-foreground">
              Belum mencatat hari ini
            </p>
          </div>
        ) : (
          /* List of meals */
          <div className="space-y-3">
            {MEAL_TYPES.map((meal) => {
              const mealLogs = logs.filter((l) => l.mealType === meal.id);
              if (mealLogs.length === 0) return null;

              const mealCal = mealLogs.reduce(
                (sum, item) => sum + item.calories,
                0,
              );

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
                          <p className="font-semibold text-foreground">
                            {item.name}
                          </p>
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
            className="w-full sm:flex-1 min-h-11 rounded-navigation bg-accent-green-light hover:bg-accent-green-light/85 text-text-primary font-bold transition-colors flex items-center justify-center gap-2 px-4 py-2.5 text-xs shadow-none"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Makanan</span>
          </Link>
        )}

        <Link
          href="/diary"
          className="w-full sm:w-auto min-h-11 px-4 py-2.5 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-primary text-xs font-bold transition-colors inline-flex items-center justify-center text-center"
        >
          Ke Food Diary Utama &rarr;
        </Link>
      </div>
    </div>
  );
}
