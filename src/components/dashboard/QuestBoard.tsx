"use client";

import { useState } from "react";
import {
  Sword,
  Trophy,
  Droplets,
  Footprints,
  Dumbbell,
  Moon,
  Ruler,
  CheckCircle2,
  Circle,
  Sparkles,
  Plus,
  Minus,
  Flame,
  Coins,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  GOAL_PATH_LABELS,
  goalTypeToGoalPath,
  type GoalPath,
  type QuestSideMission,
} from "@/lib/gamification/quest-engine";
import { cn } from "@/lib/utils";

interface QuestBoardProps {
  className?: string;
}

export function QuestBoard({ className }: QuestBoardProps) {
  const isHydrated = useHydrated();
  const {
    goalPlan,
    waterLoggedMl,
    completedMissions,
    getQuestPlan,
    getConsumed,
    getDepkesEvaluation,
    setQuestProgression,
    addWater,
    toggleMissionComplete,
  } = useFoodStore();

  const [rewardToast, setRewardToast] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div
        className={cn(
          "rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs",
          className
        )}
      >
        <div className="h-7 w-64 bg-surface-subtle animate-pulse rounded-navigation" />
        <div className="h-32 bg-surface-subtle animate-pulse rounded-card" />
        <div className="h-28 bg-surface-subtle animate-pulse rounded-card" />
      </div>
    );
  }

  const questPlan = getQuestPlan();
  const consumed = getConsumed();
  const depkes = getDepkesEvaluation();
  const activePath =
    goalPlan.goalPath || goalTypeToGoalPath(goalPlan.goalType);
  const activeLevel = goalPlan.currentLevel || 1;
  const activeWeek = goalPlan.currentWeek || 1;

  const availableLevels =
    activePath === "maintain_weight"
      ? [1, 2]
      : activePath === "gain_muscle"
      ? [1, 2, 3, 5]
      : [1, 2, 3, 4];

  const availableWeeks =
    activePath === "lose_weight" && activeLevel === 2
      ? [1, 2, 3, 4]
      : activePath === "gain_muscle" && activeLevel === 2
      ? [1, 2, 3, 4, 5]
      : [];

  const triggerRewardBanner = (title: string, xp: number, coins: number) => {
    setRewardToast(`Misi "${title}" selesai! +${xp} Pet EXP & +${coins} Koin!`);
    setTimeout(() => setRewardToast(null), 3200);
  };

  const handleToggleMission = (
    id: string,
    title: string,
    xp = 35,
    coins = 15
  ) => {
    const completed = toggleMissionComplete(id, xp, coins);
    if (completed) {
      triggerRewardBanner(title, xp, coins);
    }
  };

  const getSideMissionIcon = (type: QuestSideMission["type"]) => {
    switch (type) {
      case "water":
        return <Droplets className="h-4 w-4 text-sky-500" />;
      case "walking":
        return <Footprints className="h-4 w-4 text-[#5B8E55]" />;
      case "workout":
      case "strength_training":
        return <Dumbbell className="h-4 w-4 text-[#FF9233]" />;
      case "sleep":
        return <Moon className="h-4 w-4 text-indigo-500" />;
      case "body_measurement":
        return <Ruler className="h-4 w-4 text-emerald-600" />;
      default:
        return <Sparkles className="h-4 w-4 text-[#5B8E55]" />;
    }
  };

  const calorieProgressPct = Math.min(
    100,
    Math.round((consumed.calories / Math.max(1, questPlan.calorieTarget)) * 100)
  );

  return (
    <section
      aria-label="Papan Misi RPG & Target Gizi"
      className={cn(
        "rounded-card border border-border-default bg-[#FAF8F5] p-5 sm:p-6 shadow-xs space-y-5",
        className
      )}
    >
      {/* 1. RPG Quest Header & Level/Week Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold bg-[#5B8E55] text-white shadow-2xs font-sans">
              <Sword className="h-3.5 w-3.5" />
              <span>
                {questPlan.levelTitle}
                {questPlan.weekLabel ? ` - ${questPlan.weekLabel}` : ""}
              </span>
            </span>
            <span className="px-2.5 py-0.5 rounded-pill text-[11px] font-bold bg-[#FCF8E3] text-text-primary border border-[#FF9233]/30 font-sans">
              {GOAL_PATH_LABELS[activePath].title}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-text-primary font-heading tracking-tight pt-1">
            Papan Quest Nutrisi & Progres Level
          </h2>
          <p className="text-xs text-text-muted font-sans">
            Selesaikan Misi Utama & Side Missions harian untuk mendapatkan Pet EXP dan Caloria Coins.
          </p>
        </div>

        {/* Interactive Path, Level & Week Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Path selector */}
          <div className="flex items-center gap-1 p-1 rounded-navigation bg-surface border border-border-divider">
            {(Object.keys(GOAL_PATH_LABELS) as GoalPath[]).map((pathKey) => (
              <button
                key={pathKey}
                type="button"
                onClick={() =>
                  setQuestProgression({
                    goalPath: pathKey,
                    currentLevel: 1,
                    currentWeek: 1,
                  })
                }
                className={cn(
                  "px-2.5 py-1 rounded-navigation text-[11px] font-bold transition-all font-sans cursor-pointer",
                  activePath === pathKey
                    ? "bg-[#FF9233] text-white shadow-2xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {GOAL_PATH_LABELS[pathKey].title}
              </button>
            ))}
          </div>

          {/* Level selector */}
          <div className="flex items-center gap-1 p-1 rounded-navigation bg-surface border border-border-divider">
            {availableLevels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() =>
                  setQuestProgression({
                    currentLevel: lvl,
                    currentWeek:
                      lvl === 3 && activePath === "lose_weight"
                        ? 5
                        : lvl === 3 && activePath === "gain_muscle"
                        ? 8
                        : 1,
                  })
                }
                className={cn(
                  "px-2.5 py-1 rounded-navigation text-[11px] font-bold transition-all font-sans cursor-pointer",
                  activeLevel === lvl
                    ? "bg-[#5B8E55] text-white shadow-2xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                Lv.{lvl}
              </button>
            ))}
          </div>

          {/* Week selector when in Level 2 */}
          {availableWeeks.length > 0 && (
            <div className="flex items-center gap-1 p-1 rounded-navigation bg-[#FCF8E3] border border-[#FF9233]/30">
              {availableWeeks.map((wk) => (
                <button
                  key={wk}
                  type="button"
                  onClick={() => setQuestProgression({ currentWeek: wk })}
                  className={cn(
                    "px-2 py-1 rounded-navigation text-[11px] font-bold transition-all font-sans cursor-pointer",
                    activeWeek === wk
                      ? "bg-text-primary text-white"
                      : "text-text-primary hover:bg-surface"
                  )}
                >
                  {wk === 5 && activePath === "gain_muscle" ? "Mg 5–8" : `Mg ${wk}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reward Toast Banner */}
      {rewardToast && (
        <div className="p-3.5 rounded-card bg-[#FCF8E3] border border-[#FF9233] text-xs font-bold text-text-primary flex items-center justify-between animate-in fade-in duration-200 font-sans">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#FF9233]" />
            <span>{rewardToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setRewardToast(null)}
            className="text-[11px] underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. Misi Utama Harian (Main Missions Card) */}
      <div className="rounded-card bg-surface p-5 border border-border-divider space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-divider">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#FF9233] fill-[#FF9233]" />
            <h3 className="text-sm font-extrabold text-text-primary font-heading">
              Misi Utama Harian (Main Missions)
            </h3>
          </div>

          {/* Depkes Compliance Pill */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-[11px] font-bold text-white shadow-2xs font-sans self-start sm:self-auto"
            style={{ backgroundColor: depkes.colorHex }}
          >
            <span>{depkes.badgeText}</span>
            <span className="opacity-90">({depkes.ratioPercent}%)</span>
          </span>
        </div>

        {/* Dynamic Calorie & Macro Benchmark Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-navigation bg-[#FCF8E3] border border-[#FF9233]/30">
            <span className="text-[10px] font-bold text-text-muted block font-sans">
              Target Kalori Quest
            </span>
            <p className="text-base font-black text-text-primary font-heading">
              {Math.round(questPlan.calorieTarget)} kkal
            </p>
            <span className="text-[10px] text-text-muted font-sans">
              {questPlan.calorieOffset === 0
                ? "100% TEE"
                : questPlan.calorieOffset > 0
                ? `+${questPlan.calorieOffset} kkal (Surplus)`
                : `${questPlan.calorieOffset} kkal (Defisit)`}
            </span>
          </div>

          <div className="p-3 rounded-navigation bg-surface-subtle border border-border-divider">
            <span className="text-[10px] font-bold text-text-muted block font-sans">
              Target Protein
            </span>
            <p className="text-base font-extrabold text-text-primary font-heading">
              {questPlan.macroTargets.proteinGrams}g
            </p>
            <span className="text-[10px] text-text-muted font-sans">
              Saat ini: {consumed.protein}g
            </span>
          </div>

          <div className="p-3 rounded-navigation bg-surface-subtle border border-border-divider">
            <span className="text-[10px] font-bold text-text-muted block font-sans">
              Target Karbohidrat
            </span>
            <p className="text-base font-extrabold text-text-primary font-heading">
              {questPlan.macroTargets.carbGrams}g
            </p>
            <span className="text-[10px] text-text-muted font-sans">
              Saat ini: {consumed.carbs}g
            </span>
          </div>

          <div className="p-3 rounded-navigation bg-surface-subtle border border-border-divider">
            <span className="text-[10px] font-bold text-text-muted block font-sans">
              Target Lemak
            </span>
            <p className="text-base font-extrabold text-text-primary font-heading">
              {questPlan.macroTargets.fatGrams}g
            </p>
            <span className="text-[10px] text-text-muted font-sans">
              Saat ini: {consumed.fat}g
            </span>
          </div>

          <div className="p-3 rounded-navigation bg-surface-subtle border border-border-divider col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-text-muted block font-sans">
              Serat & Gula
            </span>
            <p className="text-xs font-extrabold text-text-primary font-sans mt-0.5">
              Serat: {questPlan.macroTargets.fiberGrams ?? 28}g
            </p>
            <span className="text-[10px] text-text-muted font-sans">
              Gula maks: {questPlan.macroTargets.sugarGramsMax ?? 50}g
            </span>
          </div>
        </div>

        {/* Main Missions List */}
        <div className="space-y-2.5 pt-1">
          {questPlan.mainMissions.map((mission) => {
            const isDone = completedMissions.includes(mission.id);
            const xp = mission.xpReward ?? 50;
            const coins = mission.coinReward ?? 25;

            return (
              <div
                key={mission.id}
                onClick={() => handleToggleMission(mission.id, mission.title, xp, coins)}
                className={cn(
                  "p-3.5 rounded-navigation border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                  isDone
                    ? "bg-[#5B8E55]/10 border-[#5B8E55]"
                    : "bg-[#FAF8F5] border-border-divider hover:border-[#FF9233]/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-0.5 text-[#5B8E55] shrink-0"
                    aria-label={`Tandai misi ${mission.title}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 fill-[#5B8E55] text-white" />
                    ) : (
                      <Circle className="h-5 w-5 text-text-muted" />
                    )}
                  </button>
                  <div className="space-y-0.5">
                    <h4
                      className={cn(
                        "text-xs sm:text-sm font-bold font-heading",
                        isDone ? "line-through text-text-muted" : "text-text-primary"
                      )}
                    >
                      {mission.title}
                    </h4>
                    <p className="text-xs text-text-muted font-sans">
                      {mission.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="px-2.5 py-1 rounded-pill text-[10px] font-bold bg-[#FCF8E3] text-text-primary border border-[#FF9233]/30 font-sans">
                    +{xp} XP
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[10px] font-bold bg-surface border border-border-default text-text-primary font-sans">
                    <Coins className="h-3 w-3 text-[#FF9233]" />
                    +{coins}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compliance Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="font-semibold text-text-muted">
              Progres Kepatuhan Asupan Harian ({consumed.calories} /{" "}
              {Math.round(questPlan.calorieTarget)} kkal)
            </span>
            <span className="font-bold text-text-primary">{calorieProgressPct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-pill bg-surface-subtle overflow-hidden border border-border-divider">
            <div
              className="h-full transition-all duration-500 rounded-pill"
              style={{
                width: `${calorieProgressPct}%`,
                backgroundColor: depkes.colorHex,
              }}
            />
          </div>
          <p className="text-[11px] text-text-muted font-sans">{depkes.guidanceText}</p>
        </div>
      </div>

      {/* 3. Side Missions Checklist */}
      <div className="rounded-card bg-surface p-5 border border-border-divider space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-border-divider">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#5B8E55]" />
            <h3 className="text-sm font-extrabold text-text-primary font-heading">
              Side Missions Harian (Kebiasaan & Aktivitas)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-text-muted font-sans">
            {questPlan.sideMissions.length === 0
              ? "Fokus Misi Utama di Level 1"
              : `${questPlan.sideMissions.filter((m) => completedMissions.includes(m.id)).length} / ${questPlan.sideMissions.length} Selesai`}
          </span>
        </div>

        {questPlan.sideMissions.length === 0 ? (
          <div className="p-4 rounded-navigation bg-[#FAF8F5] border border-border-divider text-xs text-text-muted font-sans">
            Pada <strong>{questPlan.levelTitle}</strong> jalur Menstabilkan BB, fokus utamamu adalah mencatat asupan harian 95–105% TEE tanpa beban misi tambahan. Naik ke <strong>Level 2</strong> untuk membuka misi hidrasi 8 gelas (1500 ml)!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questPlan.sideMissions.map((side) => {
              const isWater = side.type === "water";
              const isDone = completedMissions.includes(side.id);
              const xp = side.xpReward ?? 25;
              const coins = side.coinReward ?? 10;
              const waterPct = Math.min(
                100,
                Math.round((waterLoggedMl / side.targetValue) * 100)
              );

              return (
                <div
                  key={side.id}
                  className={cn(
                    "p-4 rounded-navigation border transition-all flex flex-col justify-between gap-3",
                    isDone
                      ? "bg-[#5B8E55]/10 border-[#5B8E55]"
                      : "bg-[#FAF8F5] border-border-divider"
                  )}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div
                      onClick={() =>
                        !isWater && handleToggleMission(side.id, side.title, xp, coins)
                      }
                      className={cn(
                        "flex items-start gap-2.5",
                        !isWater && "cursor-pointer"
                      )}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMission(side.id, side.title, xp, coins);
                        }}
                        className="mt-0.5 text-[#5B8E55] shrink-0 cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 fill-[#5B8E55] text-white" />
                        ) : (
                          <Circle className="h-5 w-5 text-text-muted" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-1.5">
                          {getSideMissionIcon(side.type)}
                          <h4
                            className={cn(
                              "text-xs font-bold font-heading",
                              isDone ? "line-through text-text-muted" : "text-text-primary"
                            )}
                          >
                            {side.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-text-muted font-sans mt-0.5">
                          Target: {side.targetValue} {side.unit}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-pill text-[10px] font-bold bg-[#FCF8E3] text-text-primary border border-[#FF9233]/30 font-sans shrink-0">
                      +{xp} XP • +{coins} Koin
                    </span>
                  </div>

                  {/* Interactive Water Tracker for Water Side Mission */}
                  {isWater && (
                    <div className="space-y-2 pt-1 border-t border-border-divider/70">
                      <div className="flex items-center justify-between text-[11px] font-sans">
                        <span className="font-semibold text-text-muted">
                          Hidrasi Hari Ini:{" "}
                          <strong className="text-text-primary">
                            {waterLoggedMl} / {side.targetValue} ml
                          </strong>{" "}
                          ({Math.round(waterLoggedMl / 250)} gelas)
                        </span>
                        <span className="font-bold text-sky-600">{waterPct}%</span>
                      </div>

                      <div className="h-2 w-full rounded-pill bg-surface overflow-hidden border border-border-divider">
                        <div
                          className="h-full bg-sky-500 transition-all duration-300 rounded-pill"
                          style={{ width: `${waterPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => addWater(-250)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-navigation text-[11px] font-bold bg-surface border border-border-default hover:bg-surface-subtle text-text-muted font-sans cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                          <span>250 ml</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const prevDone = completedMissions.includes(side.id);
                            addWater(250);
                            if (
                              !prevDone &&
                              waterLoggedMl + 250 >= side.targetValue
                            ) {
                              triggerRewardBanner(side.title, xp, coins);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-navigation text-[11px] font-bold bg-sky-500 hover:bg-sky-600 text-white font-sans cursor-pointer shadow-2xs"
                        >
                          <Plus className="h-3 w-3" />
                          <span>+1 Gelas (250 ml)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

