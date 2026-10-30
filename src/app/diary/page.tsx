"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Beef,
  Wheat,
  Droplets,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  X,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { QuestWidget } from "@/components/shared/QuestWidget";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { isToday, formatDateDisplay, getTodayKey } from "@/lib/date-utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export default function FoodDiaryPage() {
  const isHydrated = useHydrated();
  const {
    logs,
    removeLog,
    getConsumed,
    targets,
    goalPlan,
    selectedDate,
    setSelectedDate,
    latestFeedback,
    clearFeedback,
  } = useFoodStore();

  const [activeFilter, setActiveFilter] = useState<MealTypeId | "all">("all");
  const consumed = getConsumed();
  const caloriesRemaining = Math.max(0, targets.calories - consumed.calories);

  // Filter logs by active selected date
  const dayLogs = logs.filter((l) => l.loggedDate === selectedDate);
  const isSelectedToday = isHydrated ? isToday(selectedDate) : true;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Food Diary & Meal Timeline
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-8 sm:ml-0">
            <span className="text-xs sm:text-sm text-text-muted">
              {isSelectedToday ? "Catatan asupan gizi hari ini." : `Catatan: ${formatDateDisplay(selectedDate, "full")}`}
            </span>
            {!isSelectedToday && (
              <button
                onClick={() => setSelectedDate(getTodayKey())}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-orange-dark bg-accent-yellow/50 hover:bg-accent-yellow px-2 py-0.5 rounded-pill transition-colors"
                title="Kembali ke Hari Ini"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Hari Ini</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/diary/archive"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-primary text-xs font-bold transition-colors"
          >
            <Calendar className="h-4 w-4 text-accent-green" />
            <span>Arsip Kalender</span>
          </Link>

          <Link
            href="/diary/add"
            className="button-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>+ Cari & Tambah Makanan</span>
          </Link>
        </div>
      </div>

      {/* Latest Feedback Banner (Review Card Surface) */}
      {latestFeedback && (
        <div
          className={cn(
            "p-4 rounded-card border transition-all animate-in fade-in duration-300 relative",
            latestFeedback.type === "success"
              ? "bg-accent-green/15 border-accent-green/35 text-text-primary"
              : latestFeedback.type === "warning"
              ? "review-card border-accent-orange/40 text-neutral-10"
              : "review-card border-accent-green/30 text-text-primary"
          )}
        >
          <button
            onClick={clearFeedback}
            className="absolute top-3 right-3 text-text-muted hover:text-text-primary p-1"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="mt-0.5">
              {latestFeedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-accent-green" />
              ) : latestFeedback.type === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-accent-orange-dark" />
              ) : (
                <Sparkles className="h-5 w-5 text-text-primary" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-text-primary">
                  {latestFeedback.title}
                </h4>
                <span className="px-2 py-0.5 rounded-pill text-[10px] font-bold bg-surface border border-border-default text-text-primary">
                  +{latestFeedback.xpEarned} XP
                </span>
              </div>
              <p className="text-xs text-neutral-10">{latestFeedback.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Target Progress Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Kalori Masuk</span>
            <Flame className="h-3.5 w-3.5 text-accent-green fill-accent-green" />
          </div>
          <p className="text-xl font-extrabold text-text-primary font-heading">
            {consumed.calories}{" "}
            <span className="text-xs text-text-muted font-sans font-normal">
              / {targets.calories} kcal
            </span>
          </p>
          <p className="text-[10px] text-text-muted">
            Sisa: <strong className="text-text-primary">{caloriesRemaining} kcal</strong>
          </p>
        </div>

        <div className="p-4 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Protein</span>
            <Beef className="h-3.5 w-3.5 text-macro-protein" />
          </div>
          <p className="text-xl font-extrabold text-macro-protein font-heading">
            {consumed.protein}g{" "}
            <span className="text-xs text-text-muted font-sans font-normal">
              / {targets.protein}g
            </span>
          </p>
          <p className="text-[10px] text-text-muted">Target {goalPlan.goalType}</p>
        </div>

        <div className="p-4 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Karbohidrat</span>
            <Wheat className="h-3.5 w-3.5 text-accent-orange" />
          </div>
          <p className="text-xl font-extrabold text-accent-orange-dark font-heading">
            {consumed.carbs}g{" "}
            <span className="text-xs text-text-muted font-sans font-normal">
              / {targets.carbs}g
            </span>
          </p>
          <p className="text-[10px] text-text-muted">Bahan bakar harian</p>
        </div>

        <div className="p-4 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Lemak</span>
            <Droplets className="h-3.5 w-3.5 text-macro-fat" />
          </div>
          <p className="text-xl font-extrabold text-macro-fat font-heading">
            {consumed.fat}g{" "}
            <span className="text-xs text-text-muted font-sans font-normal">
              / {targets.fat}g
            </span>
          </p>
          <p className="text-[10px] text-text-muted">Lemak sehat</p>
        </div>
      </div>

      {/* Quest & Level Progress Summary Widget */}
      <QuestWidget />

      {/* Filter Tabs by Meal Time */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border-divider">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "nav-item px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
            activeFilter === "all"
              ? "is-selected font-bold"
              : "text-neutral-10"
          )}
        >
          Semua ({dayLogs.length})
        </button>

        {MEAL_TYPES.map((m) => {
          const count = dayLogs.filter((l) => l.mealType === m.id).length;
          return (
            <button
              key={m.id}
              onClick={() => setActiveFilter(m.id)}
              className={cn(
                "nav-item px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
                activeFilter === m.id
                  ? "is-selected font-bold"
                  : "text-neutral-10"
              )}
            >
              <span>{m.label}</span>
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Meal Timeline Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {MEAL_TYPES.filter(
          (m) => activeFilter === "all" || activeFilter === m.id
        ).map((meal) => {
          const mealLogs = dayLogs.filter((l) => l.mealType === meal.id);
          const mealCalories = mealLogs.reduce((sum, item) => sum + item.calories, 0);

          return (
            <div
              key={meal.id}
              className="rounded-card border border-border-divider bg-surface p-6 space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-divider">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">
                    {meal.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-surface-subtle border border-border-divider text-text-muted">
                    {mealLogs.length} menu
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-text-primary">
                    {mealCalories} kcal
                  </span>

                  <Link
                    href={`/diary/add?meal=${meal.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-navigation bg-accent-green-light text-text-primary hover:bg-accent-green hover:text-text-inverse transition-colors text-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </Link>
                </div>
              </div>

              {/* Items in this meal */}
              {mealLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">
                  Belum ada menu dicatat untuk {meal.label}. Tekan tombol &quot;+ Tambah&quot; untuk mencatat.
                </div>
              ) : (
                <div className="divide-y divide-border-divider/60">
                  {mealLogs.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">{item.name}</p>
                        <p className="text-[11px] text-text-muted">
                          {item.servingUnit} • {item.calories} kcal
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-text-muted pt-0.5">
                          <span className="text-macro-protein font-semibold">
                            P: {item.proteinG}g
                          </span>
                          <span className="text-accent-orange-dark font-semibold">
                            K: {item.carbsG}g
                          </span>
                          <span className="text-macro-fat font-semibold">
                            L: {item.fatG}g
                          </span>
                          {item.fiberG ? <span>Serat: {item.fiberG}g</span> : null}
                          {item.sugarG ? <span>Gula: {item.sugarG}g</span> : null}
                        </div>
                      </div>

                      <button
                        onClick={() => removeLog(item.id)}
                        className="p-2 rounded-navigation text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Hapus Makanan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
