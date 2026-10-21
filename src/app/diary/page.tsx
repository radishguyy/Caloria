"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Beef,
  Wheat,
  Droplets,
  ArrowLeft,
  Calendar,
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

  const filteredLogs =
    activeFilter === "all" ? logs : logs.filter((l) => l.mealType === activeFilter);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Food Diary & Meal Timeline
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-8 sm:ml-0">
            Catatan asupan gizi harianmu untuk sarapan, makan siang, makan malam, dan camilan sehat.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/diary/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-transform active:scale-95"
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
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
              : latestFeedback.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
              : "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-100"
          )}
        >
          <button
            onClick={clearFeedback}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="mt-0.5">
              {latestFeedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : latestFeedback.type === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold">{latestFeedback.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/80 border">
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
        <div className="p-3.5 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Kalori Masuk</span>
            <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
          </div>
          <p className="text-xl font-extrabold text-foreground">
            {consumed.calories}{" "}
            <span className="text-xs text-muted-foreground font-normal">
              / {targets.calories} kcal
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            Sisa: <strong className="text-foreground">{caloriesRemaining} kcal</strong>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Protein</span>
            <Beef className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
            {consumed.protein}g{" "}
            <span className="text-xs text-muted-foreground font-normal">
              / {targets.protein}g
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">Target {goalPlan.goalType}</p>
        </div>

        <div className="p-3.5 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Karbohidrat</span>
            <Wheat className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            {consumed.carbs}g{" "}
            <span className="text-xs text-muted-foreground font-normal">
              / {targets.carbs}g
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">Bahan bakar harian</p>
        </div>

        <div className="p-3.5 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Lemak</span>
            <Droplets className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
            {consumed.fat}g{" "}
            <span className="text-xs text-muted-foreground font-normal">
              / {targets.fat}g
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">Lemak sehat</p>
        </div>
      </div>

      {/* Filter Tabs by Meal Time */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors",
            activeFilter === "all"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                  ? "bg-orange-500 text-white font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
              className="rounded-3xl border bg-card p-5 space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {meal.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                    {mealLogs.length} menu
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {mealCalories} kcal
                  </span>

                  <Link
                    href={`/diary/add?meal=${meal.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white transition-colors text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </Link>
                </div>
              </div>

              {/* Items in this meal */}
              {mealLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Belum ada menu dicatat untuk {meal.label}. Tekan tombol &quot;+ Tambah&quot; untuk mencatat.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {mealLogs.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.servingUnit} • {item.calories} kcal
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            P: {item.proteinG}g
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            K: {item.carbsG}g
                          </span>
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            L: {item.fatG}g
                          </span>
                          {item.fiberG ? <span>Serat: {item.fiberG}g</span> : null}
                          {item.sugarG ? <span>Gula: {item.sugarG}g</span> : null}
                        </div>
                      </div>

                      <button
                        onClick={() => removeLog(item.id)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
