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
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function FoodDiaryPage() {
  const {
    logs,
    removeLog,
    getConsumed,
    targets,
    goalPlan,
    latestFeedback,
    clearFeedback,
  } = useFoodStore();

  const [activeFilter, setActiveFilter] = useState<MealTypeId | "all">("all");
  const consumed = getConsumed();
  const caloriesRemaining = Math.max(0, targets.calories - consumed.calories);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="btn-icon h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Food Diary & Meal Timeline
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 ml-8 sm:ml-0">
            Catatan asupan gizi harianmu untuk sarapan, makan siang, makan malam, dan camilan sehat.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/diary/add"
            className="btn-cta min-h-11 px-5 py-2.5 text-xs shadow-[0_7px_0_var(--brand-green-dark)] active:translate-y-[7px]"
          >
            <Plus className="h-4 w-4" />
            <span>+ Cari & Tambah Makanan</span>
          </Link>
        </div>
      </div>

      {/* Latest Feedback Banner (if any) */}
      {latestFeedback && (
        <div
          className={cn(
            "p-4 rounded-2xl border transition-all animate-in fade-in duration-300 relative",
            latestFeedback.type === "success"
              ? "bg-brand-green/10 border-brand-green/30 text-ink"
              : latestFeedback.type === "warning"
              ? "bg-highlight/70 border-warm-border text-ink"
              : "bg-surface-sunken border-warm-border text-ink"
          )}
        >
          <button
            onClick={clearFeedback}
            className="absolute right-3 top-3 rounded-full p-1 text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="mt-0.5">
              {latestFeedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-brand-green-dark" />
              ) : latestFeedback.type === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-brown" />
              ) : (
                <Sparkles className="h-5 w-5 text-brand-green" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold">{latestFeedback.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised/80 border">
                  +{latestFeedback.xpEarned} XP • +{latestFeedback.coinsEarned} Koin
                </span>
              </div>
              <p className="text-xs opacity-90">{latestFeedback.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Target Progress Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-warm-border bg-card p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Kalori Masuk</span>
            <Flame className="h-3.5 w-3.5 fill-current text-brown" />
          </div>
          <p className="text-xl font-extrabold text-ink">
            {consumed.calories}{" "}
            <span className="text-xs text-ink-muted font-normal">
              / {targets.calories} kcal
            </span>
          </p>
          <p className="text-[10px] text-ink-muted">
            Sisa: <strong className="text-ink">{caloriesRemaining} kcal</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-warm-border bg-card p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Protein</span>
            <Beef className="h-3.5 w-3.5 text-brand-green" />
          </div>
          <p className="text-xl font-extrabold text-brand-green-dark">
            {consumed.protein}g{" "}
            <span className="text-xs text-ink-muted font-normal">
              / {targets.protein}g
            </span>
          </p>
          <p className="text-[10px] text-ink-muted">Target {goalPlan.goalType}</p>
        </div>

        <div className="rounded-2xl border border-warm-border bg-card p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Karbohidrat</span>
            <Wheat className="h-3.5 w-3.5 text-brown" />
          </div>
          <p className="text-xl font-extrabold text-brown">
            {consumed.carbs}g{" "}
            <span className="text-xs text-ink-muted font-normal">
              / {targets.carbs}g
            </span>
          </p>
          <p className="text-[10px] text-ink-muted">Bahan bakar harian</p>
        </div>

        <div className="rounded-2xl border border-warm-border bg-card p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Lemak</span>
            <Droplets className="h-3.5 w-3.5 text-brown" />
          </div>
          <p className="text-xl font-extrabold text-brown">
            {consumed.fat}g{" "}
            <span className="text-xs text-ink-muted font-normal">
              / {targets.fat}g
            </span>
          </p>
          <p className="text-[10px] text-ink-muted">Lemak sehat</p>
        </div>
      </div>

      {/* Filter Tabs by Meal Time */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-warm-border">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors",
            activeFilter === "all"
              ? "bg-brand-orange text-ink font-bold"
              : "text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
          )}
        >
          Semua ({logs.length})
        </button>

        {MEAL_TYPES.map((m) => {
          const count = logs.filter((l) => l.mealType === m.id).length;
          return (
            <button
              key={m.id}
              onClick={() => setActiveFilter(m.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
                activeFilter === m.id
                  ? "bg-brand-orange text-ink font-bold"
                  : "text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
              )}
            >
              <span>{m.label}</span>
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Meal Timeline Sections */}
      <div className="space-y-6">
        {MEAL_TYPES.filter(
          (m) => activeFilter === "all" || activeFilter === m.id
        ).map((meal) => {
          const mealLogs = logs.filter((l) => l.mealType === meal.id);
          const mealCalories = mealLogs.reduce((sum, item) => sum + item.calories, 0);

          return (
            <div
              key={meal.id}
              className="rounded-3xl border border-warm-border bg-card p-5 space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-warm-border/70">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">
                    {meal.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-sunken text-ink-muted">
                    {mealLogs.length} menu
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-green-dark">
                    {mealCalories} kcal
                  </span>

                  <Link
                    href={`/diary/add?meal=${meal.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-warm-border bg-highlight px-3 py-1 text-xs font-bold text-ink transition-colors hover:bg-brand-green-light hover:text-brand-green-ink"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </Link>
                </div>
              </div>

              {/* Items in this meal */}
              {mealLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-muted">
                  Belum ada menu dicatat untuk {meal.label}. Tekan tombol &quot;+ Tambah&quot; untuk mencatat.
                </div>
              ) : (
                <div className="divide-y divide-warm-border/50">
                  {mealLogs.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-ink">{item.name}</p>
                        <p className="text-[11px] text-ink-muted">
                          {item.servingUnit} • {item.calories} kcal
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-ink-muted pt-0.5">
                          <span className="font-medium text-brand-green-dark">
                            P: {item.proteinG}g
                          </span>
                          <span className="font-medium text-brown">
                            K: {item.carbsG}g
                          </span>
                          <span className="font-medium text-brand-green-dark">
                            L: {item.fatG}g
                          </span>
                          {item.fiberG ? <span>Serat: {item.fiberG}g</span> : null}
                          {item.sugarG ? <span>Gula: {item.sugarG}g</span> : null}
                        </div>
                      </div>

                      <button
                        onClick={() => removeLog(item.id)}
                        className="p-2 rounded-xl text-ink-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
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
