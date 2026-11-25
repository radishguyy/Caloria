"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Utensils,
  X,
  Calendar,
  Pencil,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { QuestWidget } from "@/components/shared/QuestWidget";
import { MacroBar } from "@/components/diary/macro-bar";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export default function FoodDiaryPage() {
  const isHydrated = useHydrated();
  const { logs, removeLog, selectedDate, latestFeedback, clearFeedback } =
    useFoodStore();

  const [activeFilter, setActiveFilter] = useState<MealTypeId | "all">("all");

  useEffect(() => {
    if (!latestFeedback) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearFeedback();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [latestFeedback, clearFeedback]);

  const dayLogs = isHydrated
    ? logs.filter((l) => l.loggedDate === selectedDate)
    : [];

  const visibleMeals = MEAL_TYPES.filter(
    (m) => activeFilter === "all" || activeFilter === m.id,
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            aria-label="Kembali ke Dashboard"
            className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary font-heading">
            Food Diary
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/diary/archive"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-primary text-xs font-bold transition-colors"
          >
            <Calendar className="h-4 w-4 text-accent-green shrink-0" aria-hidden="true" />
            <span>Kalender</span>
          </Link>

          <Link
            href="/diary/add"
            className="button-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs"
          >
            <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Catat</span>
          </Link>
        </div>
      </div>

      {/* Daily Nutrition Notification Banner */}
      {isHydrated && latestFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-center justify-between gap-2.5 rounded-card border px-4 py-2.5 transition-all",
            latestFeedback.type === "success"
              ? "bg-accent-green/15 border-accent-green/35 text-text-primary"
              : latestFeedback.type === "warning"
                ? "review-card border-accent-orange/40 text-neutral-10"
                : "review-card border-accent-green/30 text-text-primary",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {latestFeedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-green" aria-hidden="true" />
            ) : latestFeedback.type === "warning" ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-accent-orange-dark" aria-hidden="true" />
            ) : (
              <Utensils className="h-5 w-5 shrink-0 text-text-primary" aria-hidden="true" />
            )}
            <p
              title={latestFeedback.title}
              className="truncate text-xs sm:text-sm font-bold text-text-primary"
            >
              {latestFeedback.title}
            </p>
          </div>

          <button
            type="button"
            onClick={clearFeedback}
            aria-label="Tutup notifikasi"
            className="p-1.5 rounded-navigation text-text-muted hover:text-text-primary hover:bg-surface/60 transition-colors shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Daily Calories Container (Dashboard Bottom Summary Style) */}
      <QuestWidget />

      {/* Daily Nutrition Container */}
      <MacroBar className="w-full" />

      {/* Filter Tabs by Meal Time */}
      <div
        role="tablist"
        aria-label="Filter waktu makan"
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border-divider"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
          className={cn(
            "nav-item px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none cursor-pointer",
            activeFilter === "all"
              ? "is-selected font-bold"
              : "text-neutral-10",
          )}
        >
          Semua
        </button>

        {MEAL_TYPES.map((m) => {
          const isActive = activeFilter === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(m.id)}
              className={cn(
                "nav-item px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none cursor-pointer",
                isActive
                  ? "is-selected font-bold"
                  : "text-neutral-10",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Meal Timeline Sections */}
      {!isHydrated ? (
        <div
          aria-hidden="true"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
        >
          {MEAL_TYPES.map((meal) => (
            <div
              key={meal.id}
              className="h-44 rounded-card border border-border-divider bg-surface p-5 sm:p-6 animate-pulse shadow-xs"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {visibleMeals.map((meal) => {
            const mealLogs = dayLogs.filter((l) => l.mealType === meal.id);
            const mealCalories = mealLogs.reduce(
              (sum, item) => sum + item.calories,
              0,
            );

            return (
              <section
                key={meal.id}
                aria-label={meal.label}
                className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-border-divider">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-sm font-bold text-text-primary font-sans">
                      {meal.label}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-surface-subtle border border-border-divider text-text-muted">
                      {mealLogs.length} menu
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-extrabold text-text-primary">
                      {mealCalories} kcal
                    </span>

                    <Link
                      href={`/diary/add?meal=${meal.id}`}
                      aria-label={`Tambah makanan untuk ${meal.label}`}
                      title={`Tambah ${meal.label}`}
                      className="inline-flex items-center justify-center p-1.5 rounded-navigation bg-accent-green-light text-text-primary hover:bg-accent-green hover:text-text-inverse transition-colors text-xs font-bold"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {/* Items in this meal */}
                {mealLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-text-muted">
                    Belum ada menu dicatat untuk {meal.label}. Tekan tombol
                    &quot;+&quot; untuk mencatat.
                  </div>
                ) : (
                  <div className="divide-y divide-border-divider/60">
                    {mealLogs.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {item.servingUnit} • {item.calories} kcal
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted pt-0.5">
                            <span className="text-macro-protein font-semibold">
                              P: {item.proteinG}g
                            </span>
                            <span className="text-accent-orange-dark font-semibold">
                              K: {item.carbsG}g
                            </span>
                            <span className="text-macro-fat font-semibold">
                              L: {item.fatG}g
                            </span>
                            {item.fiberG ? (
                              <span>Serat: {item.fiberG}g</span>
                            ) : null}
                            {item.sugarG ? (
                              <span>Gula: {item.sugarG}g</span>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLog(item.id)}
                          aria-label={`Hapus ${item.name}`}
                          title="Hapus Makanan"
                          className="p-2 rounded-navigation shrink-0 text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
