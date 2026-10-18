"use client";

import { useFoodStore } from "@/store/use-food-store";
import { Flame, Beef, Wheat, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

export function MacroBar() {
  const { targets, getConsumed, getCaloriesRemaining } = useFoodStore();
  const consumed = getConsumed();
  const caloriesRemaining = getCaloriesRemaining();

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
    <div className="rounded-2xl border bg-card p-5 shadow-xs text-card-foreground">
      {/* Top Calorie Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span>Target Kalori Harian</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold tracking-tight">
              {consumed.calories}
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              / {targets.calories} kcal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-muted-foreground font-medium">Tersisa</span>
            <p
              className={cn(
                "text-base font-bold",
                caloriesRemaining > 0 ? "text-emerald-500" : "text-amber-500"
              )}
            >
              {caloriesRemaining} kcal
            </p>
          </div>

          <div className="h-12 w-12 rounded-full border-4 border-secondary flex items-center justify-center relative">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-secondary"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-orange-500 transition-all duration-700"
                strokeWidth="4"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * Math.min(caloriePercent, 100)) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-foreground">
              {caloriePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Macronutrient Breakdown */}
      <div className="grid grid-cols-3 gap-3 pt-4">
        {/* Protein */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
              <Beef className="h-3.5 w-3.5" />
              Protein
            </span>
            <span className="text-[11px] text-muted-foreground">{proteinPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-blue-200/50 dark:bg-blue-950/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-foreground">
            {consumed.protein}
            <span className="text-[10px] text-muted-foreground font-normal"> / {targets.protein}g</span>
          </div>
        </div>

        {/* Carbs */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Wheat className="h-3.5 w-3.5" />
              Karbo
            </span>
            <span className="text-[11px] text-muted-foreground">{carbsPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-amber-200/50 dark:bg-amber-950/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-foreground">
            {consumed.carbs}
            <span className="text-[10px] text-muted-foreground font-normal"> / {targets.carbs}g</span>
          </div>
        </div>

        {/* Fat */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
              <Droplets className="h-3.5 w-3.5" />
              Lemak
            </span>
            <span className="text-[11px] text-muted-foreground">{fatPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-rose-200/50 dark:bg-rose-950/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-foreground">
            {consumed.fat}
            <span className="text-[10px] text-muted-foreground font-normal"> / {targets.fat}g</span>
          </div>
        </div>
      </div>

      {/* Fiber & Sugar Micronutrient Details */}
      <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-border/60 text-xs">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
          <span className="text-muted-foreground">Serat (Fiber)</span>
          <span className="font-semibold text-foreground">
            {consumed.fiber} <span className="text-[10px] text-muted-foreground font-normal">/ {targets.fiber ?? 28}g</span>
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
          <span className="text-muted-foreground">Gula (Sugar)</span>
          <span className="font-semibold text-foreground">
            {consumed.sugar} <span className="text-[10px] text-muted-foreground font-normal">/ {targets.sugar ?? 45}g</span>
          </span>
        </div>
      </div>
    </div>
  );
}

