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
    fetchUserArchiveSummariesAction(selectedDate, selectedDate).then((res) => {
      if (!isCancelled && res.success && res.data && res.data[selectedDate]) {
        setServerSummary(res.data[selectedDate]);
      } else if (!isCancelled) {
        setServerSummary(null);
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

  const consumed = {
    calories: activeCalories,
    protein: activeProtein,
    carbs: activeCarbs,
    fat: activeFat,
  };

  const hasLogs = summary.hasLogs || activeCalories > 0;
  const percentage = targets.calories > 0
    ? Math.round((activeCalories / targets.calories) * 100)
    : 0;

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

  return (
    <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 shadow-xs space-y-5">
      {/* Date Header & Jump to Today */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-accent-orange uppercase tracking-wider font-heading">
              Inspektur Diary Harian
            </span>
            {isSelectedToday && (
              <span className="px-2 py-0.5 rounded-pill text-[10px] font-black bg-accent-green text-text-inverse tracking-wide">
                HARI INI
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-text-primary font-heading mt-0.5">
            {formatDateDisplay(selectedDate, "full")}
          </h3>
        </div>

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
            <div>
              <p className="text-xs font-bold text-foreground">
                {status === "hit"
                  ? "Target Kalori Tercapai (Goal Met)!"
                  : status === "under"
                  ? "Asupan Kalori Belum Mencapai Target"
                  : "Asupan Melebihi Batas Kalori Target"}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {consumed.calories} dari target {targets.calories} kcal ({percentage}%)
              </p>
            </div>
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

      {/* Calories & Macro Breakdown Card */}
      <div className="p-4 rounded-2xl bg-surface-subtle border border-border-divider space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
            <Flame className="h-4 w-4 text-accent-green fill-accent-green" />
            <span>Total Kalori Terhitung</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-text-primary font-heading">
              {consumed.calories}{" "}
              <span className="text-xs font-normal text-text-muted font-sans">
                / {targets.calories} kcal
              </span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-pill bg-surface border border-border-divider overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-pill",
              status === "hit"
                ? "bg-[#5B8E55]"
                : status === "over"
                ? "bg-macro-fat"
                : "bg-accent-orange"
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>

        {/* 3 Macro Breakdown Bars */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
          {/* Protein */}
          <div className="p-2.5 rounded-navigation bg-surface border border-macro-protein/25 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-macro-protein flex items-center gap-1">
                <Beef className="h-3 w-3" /> Protein
              </span>
              <span className="text-[10px] text-text-muted">{proteinPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-pill bg-macro-protein/20 overflow-hidden">
              <div
                className="h-full bg-macro-protein rounded-pill transition-all"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
            <p className="text-[11px] font-extrabold text-foreground pt-0.5">
              {consumed.protein}{" "}
              <span className="text-[9px] font-normal text-text-muted">
                / {targets.protein}g
              </span>
            </p>
          </div>

          {/* Carbs */}
          <div className="p-2.5 rounded-navigation bg-surface border border-accent-orange/25 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-accent-orange-dark flex items-center gap-1">
                <Wheat className="h-3 w-3" /> Karbo
              </span>
              <span className="text-[10px] text-text-muted">{carbsPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-pill bg-accent-orange/20 overflow-hidden">
              <div
                className="h-full bg-accent-orange rounded-pill transition-all"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
            <p className="text-[11px] font-extrabold text-foreground pt-0.5">
              {consumed.carbs}{" "}
              <span className="text-[9px] font-normal text-text-muted">
                / {targets.carbs}g
              </span>
            </p>
          </div>

          {/* Fat */}
          <div className="p-2.5 rounded-navigation bg-surface border border-macro-fat/25 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-macro-fat flex items-center gap-1">
                <Droplets className="h-3 w-3" /> Lemak
              </span>
              <span className="text-[10px] text-text-muted">{fatPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-pill bg-macro-fat/20 overflow-hidden">
              <div
                className="h-full bg-macro-fat rounded-pill transition-all"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
            <p className="text-[11px] font-extrabold text-foreground pt-0.5">
              {consumed.fat}{" "}
              <span className="text-[9px] font-normal text-text-muted">
                / {targets.fat}g
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Meal Slots Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-text-primary">
            Menu Makanan per Waktu Makan
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-navigation bg-accent-green hover:bg-accent-green/90 text-text-inverse text-xs font-bold transition-all active:scale-95 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Catat Makanan Tanggal Ini</span>
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
                            {item.servingSize} {item.servingUnit} •{" "}
                            <span className="text-macro-protein font-medium">
                              P: {item.proteinG}g
                            </span>{" "}
                            •{" "}
                            <span className="text-accent-orange-dark font-medium">
                              K: {item.carbsG}g
                            </span>{" "}
                            •{" "}
                            <span className="text-macro-fat font-medium">
                              L: {item.fatG}g
                            </span>
                          </p>
                        </div>
                        <span className="text-xs font-bold text-text-primary shrink-0">
                          {item.calories} kcal
                        </span>
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
            className="w-full sm:flex-1 button-primary flex items-center justify-center gap-2 py-2.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>+ Catat Makanan untuk Tanggal Ini</span>
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
