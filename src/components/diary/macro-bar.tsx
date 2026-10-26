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
    <div className="surface-card p-5 text-ink">
      {/* Top Calorie Summary */}
      <div className="flex flex-col justify-between gap-4 border-b border-warm-border pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <Flame className="h-4 w-4 fill-current text-brown" />
            <span>Target Kalori Harian</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {consumed.calories}
            </span>
            <span className="text-sm font-medium text-ink-muted">
              / {targets.calories} kcal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-medium text-ink-muted">Tersisa</span>
            <p
              className={cn(
                "text-base font-bold",
                caloriesRemaining > 0 ? "text-brand-green-dark" : "text-brand-orange"
              )}
            >
              {caloriesRemaining} kcal
            </p>
          </div>

          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-highlight">
            <svg className="h-12 w-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-highlight"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-brand-green transition-all duration-700"
                strokeWidth="4"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * Math.min(caloriePercent, 100)) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-ink">
              {caloriePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Macronutrient Breakdown */}
      <div className="grid grid-cols-3 gap-3 pt-4">
        {/* Protein */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-brand-green/20 bg-brand-green/10 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold text-brand-green-dark">
              <Beef className="h-3.5 w-3.5" />
              Protein
            </span>
            <span className="text-[11px] text-ink-muted">{proteinPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-green/20">
            <div
              className="h-full bg-brand-green transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-ink">
            {consumed.protein}
            <span className="text-[10px] font-normal text-ink-muted">
              {" "}
              / {targets.protein}g
            </span>
          </div>
        </div>

        {/* Carbs */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-warm-border bg-highlight/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <Wheat className="h-3.5 w-3.5" />
              Karbo
            </span>
            <span className="text-[11px] text-ink-muted">{carbsPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-warm-border">
            <div
              className="h-full bg-brown transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-ink">
            {consumed.carbs}
            <span className="text-[10px] font-normal text-ink-muted">
              {" "}
              / {targets.carbs}g
            </span>
          </div>
        </div>

        {/* Fat */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-brown/20 bg-brown/10 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold text-brown">
              <Droplets className="h-3.5 w-3.5" />
              Lemak
            </span>
            <span className="text-[11px] text-ink-muted">{fatPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-brown/20">
            <div
              className="h-full bg-brown transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-ink">
            {consumed.fat}
            <span className="text-[10px] font-normal text-ink-muted">
              {" "}
              / {targets.fat}g
            </span>
          </div>
        </div>
      </div>

      {/* Fiber & Sugar Micronutrient Details */}
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-warm-border/70 pt-3 text-xs">
        <div className="flex items-center justify-between rounded-xl bg-surface-sunken/70 px-3 py-2">
          <span className="text-ink-muted">Serat (Fiber)</span>
          <span className="font-semibold text-ink">
            {consumed.fiber}{" "}
            <span className="text-[10px] font-normal text-ink-muted">
              / {targets.fiber ?? 28}g
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface-sunken/70 px-3 py-2">
          <span className="text-ink-muted">Gula (Sugar)</span>
          <span className="font-semibold text-ink">
            {consumed.sugar}{" "}
            <span className="text-[10px] font-normal text-ink-muted">
              / {targets.sugar ?? 45}g
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
