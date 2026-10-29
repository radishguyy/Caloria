"use client";

import Link from "next/link";
import { ArrowRight, Sword, Calendar, Flame, CheckCircle2 } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  GOAL_PATH_LABELS,
  goalTypeToGoalPath,
} from "@/lib/gamification/quest-engine";
import { cn } from "@/lib/utils";

interface QuestWidgetProps {
  className?: string;
  variant?: "compact" | "full";
}

export function QuestWidget({ className, variant = "full" }: QuestWidgetProps) {
  const isHydrated = useHydrated();
  const {
    goalPlan,
    getQuestPlan,
    getConsumed,
    getWeeklyProgression,
    getEvaluatedMissions,
  } = useFoodStore();

  if (!isHydrated) {
    return (
      <div
        className={cn(
          "rounded-card border border-border-divider bg-[#FAF8F5] p-5 shadow-xs space-y-3",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-surface-subtle animate-pulse rounded-navigation" />
          <div className="h-5 w-28 bg-surface-subtle animate-pulse rounded-pill" />
        </div>
        <div className="h-3 w-full bg-surface-subtle animate-pulse rounded-pill" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 w-32 bg-surface-subtle animate-pulse rounded-navigation" />
          <div className="h-8 w-36 bg-surface-subtle animate-pulse rounded-navigation" />
        </div>
      </div>
    );
  }

  const questPlan = getQuestPlan();
  const consumed = getConsumed();
  const weeklyProgression = getWeeklyProgression();
  const evaluatedMissions = getEvaluatedMissions();

  const activePath =
    goalPlan.goalPath || goalTypeToGoalPath(goalPlan.goalType);
  const activeLevel = goalPlan.currentLevel || 1;
  const pathLabel =
    GOAL_PATH_LABELS[activePath]?.badge ||
    GOAL_PATH_LABELS[activePath]?.title ||
    "Quest Gizi";

  const targetCalories = Math.max(1, Math.round(questPlan.calorieTarget));
  const consumedCalories = consumed.calories;
  const caloriePct = Math.min(
    100,
    Math.round((consumedCalories / targetCalories) * 100)
  );

  const completedCount = evaluatedMissions.filter(
    (m) => m.status.isCompleted
  ).length;
  const totalMissions = evaluatedMissions.length;

  const remainingDays = Math.max(0, 7 - weeklyProgression.dayInCurrentWeek);
  const countdownText =
    remainingDays === 0
      ? `Pekan ${weeklyProgression.currentCalendarWeek} • Hari Evaluasi Terakhir`
      : `Pekan ${weeklyProgression.currentCalendarWeek} • Sisa ${remainingDays} hari evaluasi`;

  return (
    <div
      className={cn(
        "rounded-card border border-border-default bg-[#FAF8F5] p-4 sm:p-5 shadow-xs transition-all hover:border-[#FF9233]/40",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-divider/70">
        {/* Current Level Badge & Path */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-bold bg-[#5B8E55] text-white shadow-2xs font-sans">
            <Sword className="h-3.5 w-3.5" />
            <span>Level {activeLevel} • {pathLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-[#FCF8E3] text-text-primary border border-[#FF9233]/30 font-sans">
            <Calendar className="h-3 w-3 text-[#FF9233]" />
            <span>{countdownText}</span>
          </span>
        </div>

        {/* Quick completed missions status */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted font-sans">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#5B8E55]" />
          <span>
            <strong className="text-text-primary">{completedCount}</strong>/{totalMissions} misi aktif tercapai
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-2 py-3">
        <div className="flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Flame className="h-3.5 w-3.5 text-[#FF9233] fill-[#FF9233]" />
            <span>Asupan Kalori Hari Ini:</span>
            <strong className="text-text-primary font-bold">
              {consumedCalories.toLocaleString("id-ID")} /{" "}
              {targetCalories.toLocaleString("id-ID")} kkal
            </strong>
          </div>
          <span
            className={cn(
              "font-bold font-sans",
              caloriePct >= 85 && caloriePct <= 115
                ? "text-[#5B8E55]"
                : caloriePct > 115
                ? "text-rose-600"
                : "text-text-primary"
            )}
          >
            {caloriePct}%
          </span>
        </div>

        {/* Clean Progress Bar */}
        <div className="h-2 w-full rounded-pill bg-surface-subtle overflow-hidden border border-border-divider/80">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-pill",
              caloriePct > 105
                ? "bg-amber-500"
                : caloriePct >= 75
                ? "bg-[#5B8E55]"
                : "bg-[#FF9233]"
            )}
            style={{ width: `${caloriePct}%` }}
          />
        </div>
      </div>

      {/* Footer with minimal details and Action CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-[11px] text-text-muted font-sans flex items-center gap-3">
          <span>
            Kepatuhan pekan ini:{" "}
            <strong className="text-text-primary">
              {weeklyProgression.currentWeekMetDays}/7 hari ({weeklyProgression.currentWeekComplianceRate}%)
            </strong>
          </span>
          <span className="hidden md:inline">• Target min. 75% untuk naik level</span>
        </div>

        <Link
          href="/quests"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-navigation text-xs font-bold bg-[#FF9233] text-white hover:bg-[#e07d24] transition-all font-sans shadow-2xs self-stretch sm:self-auto"
        >
          <span>Lihat Detail Misi</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

