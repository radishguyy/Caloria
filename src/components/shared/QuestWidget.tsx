"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

interface QuestWidgetProps {
  className?: string;
  variant?: "compact" | "full";
}

export function QuestWidget({ className }: QuestWidgetProps) {
  const isHydrated = useHydrated();
  const {
    completedMissions,
    getQuestPlan,
    getWeeklyProgression,
    getEvaluatedMissions,
  } = useFoodStore();

  if (!isHydrated) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-28 animate-pulse rounded-2xl border border-border-divider bg-surface-subtle",
          className,
        )}
      />
    );
  }

  const questPlan = getQuestPlan();
  const weeklyProgression = getWeeklyProgression();
  const evaluatedMissions = getEvaluatedMissions();

  // Misi hari ini
  const dailyMissions = evaluatedMissions.filter((m) => m.isMain);
  const totalDaily =
    dailyMissions.length > 0 ? dailyMissions.length : evaluatedMissions.length;
  const completedDaily =
    dailyMissions.length > 0
      ? dailyMissions.filter((m) => m.status.isCompleted).length
      : evaluatedMissions.filter((m) => m.status.isCompleted).length;

  // Misi mingguan
  const totalWeekly =
    questPlan.sideMissions.length > 0 ? questPlan.sideMissions.length : 7;
  const completedWeekly =
    questPlan.sideMissions.length > 0
      ? questPlan.sideMissions.filter((m) => completedMissions.includes(m.id))
          .length
      : weeklyProgression.currentWeekMetDays;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border-divider bg-surface p-5 shadow-xs sm:p-6",
        className,
      )}
      aria-label="Progres Misi Nutrisi"
    >
      <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <div className="min-w-0 lg:pr-6">
          <p className="text-xs font-semibold text-text-muted">Misi hari ini</p>
          <p className="mt-1 font-heading text-2xl font-extrabold leading-none text-text-primary sm:text-3xl">
            {completedDaily} / {totalDaily}
          </p>
        </div>

        <div className="min-w-0 border-border-divider pl-0 lg:border-l lg:pl-6">
          <p className="text-xs font-semibold text-text-muted">Misi mingguan</p>
          <p className="mt-1 font-heading text-2xl font-extrabold leading-none text-text-primary sm:text-3xl">
            {completedWeekly} / {totalWeekly}
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
