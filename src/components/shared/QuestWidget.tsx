"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

export function QuestWidget({ className }: QuestWidgetProps) {
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
        aria-hidden="true"
        className={cn(
          "h-36 animate-pulse rounded-2xl border border-border-divider bg-surface-subtle",
          className
        )}
      />
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

  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border border-border-divider bg-surface p-5 shadow-xs sm:p-6",
        className
      )}
    >
      {/* Top Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold text-text-primary">
          <span>
            {consumedCalories.toLocaleString("id-ID")} /{" "}
            {targetCalories.toLocaleString("id-ID")} kkal asupan hari ini
          </span>
          <span>{caloriePct}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Progres kalori harian"
          aria-valuemin={0}
          aria-valuemax={targetCalories}
          aria-valuenow={consumedCalories}
          className="h-3 w-full overflow-hidden rounded-md bg-border-divider"
        >
          <div
            className="h-full rounded-md bg-accent-green transition-all duration-300"
            style={{ width: `${caloriePct}%` }}
          />
        </div>
      </div>

      {/* Bottom Metrics & CTA */}
      <div className="grid grid-cols-2 items-center gap-4 border-t border-border-divider pt-4 lg:grid-cols-[1fr_1fr_auto]">
        <div className="min-w-0 lg:pr-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Level {activeLevel} • {pathLabel}
          </p>
          <p className="mt-1 font-heading text-2xl font-extrabold leading-none text-text-primary sm:text-3xl">
            {completedCount} / {totalMissions}
            <span className="ml-1.5 align-baseline text-xs font-bold text-text-muted">
              misi hari ini
            </span>
          </p>
        </div>

        <div className="min-w-0 border-border-divider pl-0 lg:border-l lg:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Pekan {weeklyProgression.currentCalendarWeek} •{" "}
            {remainingDays === 0 ? "Hari evaluasi" : `Sisa ${remainingDays} hari`}
          </p>
          <p className="mt-1 font-heading text-2xl font-extrabold leading-none text-text-primary sm:text-3xl">
            {weeklyProgression.currentWeekMetDays} / 7
            <span className="ml-1.5 align-baseline text-xs font-bold text-text-muted">
              hari patuh ({weeklyProgression.currentWeekComplianceRate}%)
            </span>
          </p>
        </div>

        <div className="col-span-2 flex justify-center border-t border-border-divider pt-3 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <Link
            href="/quests"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-green px-5 py-2.5 text-xs font-bold text-text-inverse transition-colors hover:bg-accent-green/90 lg:w-auto"
          >
            <span>Detail Misi</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
