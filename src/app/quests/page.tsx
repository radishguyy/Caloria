"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import {
  GOAL_PATH_LABELS,
  goalTypeToGoalPath,
  type GoalPath,
} from "@/lib/gamification/quest-engine";
import { claimLevelUpPromotionAction } from "@/server/actions/pet-actions";
import { toastReward } from "@/lib/toast";
import { cn } from "@/lib/utils";

const LEVEL_STAGE_META: Record<
  GoalPath,
  Array<{ level: number; shortTitle: string; targetNote: string }>
> = {
  lose_weight: [
    { level: 1, shortTitle: "Catat Asupan", targetNote: "100% TEE" },
    { level: 2, shortTitle: "Defisit Bertahap", targetNote: "-100 s/d -400 kkal" },
    { level: 3, shortTitle: "Defisit Optimal", targetNote: "-500 kkal" },
    { level: 4, shortTitle: "Maintenance", targetNote: "Stabil TEE" },
  ],
  gain_muscle: [
    { level: 1, shortTitle: "Catat Asupan", targetNote: "100% TEE" },
    { level: 2, shortTitle: "Surplus & Protein", targetNote: "+100 s/d +500 kkal" },
    { level: 3, shortTitle: "Nutrisi Latihan", targetNote: "+500 kkal" },
    { level: 5, shortTitle: "Konsistensi Otot", targetNote: "Maintenance" },
  ],
  maintain_weight: [
    { level: 1, shortTitle: "Keseimbangan TEE", targetNote: "95–105% TEE" },
    { level: 2, shortTitle: "Hidrasi & Gizi", targetNote: "Stabil + Air" },
  ],
};

export default function QuestsPage() {
  const isHydrated = useHydrated();
  const {
    goalPlan,
    waterLoggedMl,
    completedMissions,
    getQuestPlan,
    getConsumed,
    setQuestProgression,
    addWater,
    getWeeklyProgression,
    getEvaluatedMissions,
  } = useFoodStore();

  const {
    name: petName,
    species,
    level: petLevel,
    exp: petExp,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    getEffectiveColors,
    getExpNeededForNextLevel,
    addCoins,
  } = usePetStore();

  const { equipped } = useCosmeticsStore();

  const [isClaimingLevelUp, setIsClaimingLevelUp] = useState(false);
  const [levelUpClaimed, setLevelUpClaimed] = useState(false);

  if (!isHydrated) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-border-divider pb-4">
          <div className="h-8 w-8 bg-surface-subtle animate-pulse rounded-xl" />
          <div className="h-7 w-56 bg-surface-subtle animate-pulse rounded-xl" />
        </div>
        <div className="h-48 bg-surface-subtle animate-pulse rounded-2xl border border-border-divider" />
        <div className="h-64 bg-surface-subtle animate-pulse rounded-2xl border border-border-divider" />
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
  const activeWeek = goalPlan.currentWeek || 1;

  const charDef = getCharacterDefinition(species);
  const effectiveColors = getEffectiveColors
    ? getEffectiveColors()
    : {
        ...charDef.defaultColors,
        ...Object.fromEntries(
          Object.entries(customColors || {}).filter(([, v]) => Boolean(v))
        ),
      };

  const expNeeded = getExpNeededForNextLevel ? getExpNeededForNextLevel() : 100;
  const petExpPct = Math.min(100, Math.round((petExp / Math.max(1, expNeeded)) * 100));

  const handleClaimLevelUpPromotion = async () => {
    if (isClaimingLevelUp || levelUpClaimed) return;
    setIsClaimingLevelUp(true);
    try {
      const nextLevel = (activeLevel || 1) + 1;
      const res = await claimLevelUpPromotionAction(nextLevel);
      if (res.success && res.coinsEarned) {
        addCoins(res.coinsEarned);
        setLevelUpClaimed(true);
        toastReward(
          "Naik Level Berhasil",
          0,
          100,
          "+100 Koin didapatkan dari evaluasi mingguan."
        );
      }
    } catch (e) {
      console.warn("Claim level up error:", e);
    } finally {
      setIsClaimingLevelUp(false);
    }
  };

  const levelStages = LEVEL_STAGE_META[activePath] || LEVEL_STAGE_META.lose_weight;

  const availableWeeks =
    activePath === "lose_weight" && activeLevel === 2
      ? [1, 2, 3, 4]
      : activePath === "gain_muscle" && activeLevel === 2
      ? [1, 2, 3, 4, 5]
      : [];

  const calorieProgressPct = Math.min(
    100,
    Math.round((consumed.calories / Math.max(1, questPlan.calorieTarget)) * 100)
  );

  const completedMainCount = evaluatedMissions.filter(
    (m) => m.status.isCompleted
  ).length;
  const completedSideCount = questPlan.sideMissions.filter((m) =>
    completedMissions.includes(m.id)
  ).length;

  const cleanLevelTitle = questPlan.levelTitle.replace(/^Level\s+\d+:\s*/i, "");
  const activeStageIndex = Math.max(
    0,
    levelStages.findIndex((s) => s.level === activeLevel)
  );
  const roadmapFillPct =
    levelStages.length > 1
      ? Math.round((activeStageIndex / (levelStages.length - 1)) * 100)
      : 100;

  const allMainDone =
    questPlan.mainMissions.length > 0 &&
    completedMainCount === questPlan.mainMissions.length;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Header — Matching ProfileHeader */}
      <header className="border-b border-border-divider pb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <Link
            href="/dashboard"
            aria-label="Kembali ke dashboard"
            className="shrink-0 rounded-xl border border-border-default p-1.5 text-text-muted transition-colors hover:bg-accent-green-light hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-text-primary font-heading sm:text-2xl">
              Misi & Progres Level
            </h1>
          </div>

          <span className="text-xs font-semibold text-text-muted">
            Jalur {GOAL_PATH_LABELS[activePath]?.title}
          </span>
        </div>
      </header>

      {/* 2. Highlighted Level Hero + Interactive Level Stepper Card */}
      <section className="rounded-2xl border border-border-divider bg-surface p-5 shadow-xs sm:p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:items-center">
          {/* Left: Big Highlighted Active Level */}
          <div className="flex items-baseline gap-4 lg:border-r lg:border-border-divider lg:pr-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Level Saat Ini
              </p>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span
                  className="font-heading font-extrabold leading-none text-text-primary"
                  style={{ fontSize: "clamp(3rem, 9vw, 4.5rem)" }}
                >
                  Lv.{activeLevel}
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-lg font-extrabold text-text-primary leading-tight sm:text-xl">
                    {cleanLevelTitle}
                  </p>
                  <p className="text-xs font-semibold text-text-muted mt-0.5">
                    Pekan ke-{weeklyProgression.currentCalendarWeek} • Hari {weeklyProgression.dayInCurrentWeek}/7
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Connected Visual Level Roadmap */}
          <div className="space-y-4">
            <div className="relative">
              {/* Connecting Track Line */}
              <div
                aria-hidden="true"
                className="absolute left-6 right-6 top-5 h-1 rounded-full bg-border-divider"
              >
                <div
                  className="h-full rounded-full bg-accent-green transition-all duration-300"
                  style={{ width: `${roadmapFillPct}%` }}
                />
              </div>

              {/* Level Nodes */}
              <div
                className="relative grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${levelStages.length}, minmax(0, 1fr))`,
                }}
              >
                {levelStages.map((stage, idx) => {
                  const isUnlocked = weeklyProgression.unlockedStages.some(
                    (s) => s.level === stage.level
                  );
                  const isActive = activeLevel === stage.level;
                  const isPassed = idx < activeStageIndex && isUnlocked;

                  return (
                    <button
                      key={stage.level}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() =>
                        isUnlocked &&
                        setQuestProgression({
                          currentLevel: stage.level,
                          currentWeek:
                            stage.level === 3 && activePath === "lose_weight"
                              ? 5
                              : stage.level === 3 && activePath === "gain_muscle"
                              ? 8
                              : 1,
                        })
                      }
                      className={cn(
                        "group flex flex-col items-center text-center transition-all focus-visible:outline-none",
                        isUnlocked ? "cursor-pointer" : "cursor-not-allowed"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-extrabold transition-all font-heading",
                          isActive
                            ? "border-accent-green bg-accent-green text-text-inverse ring-4 ring-accent-green/20 scale-110"
                            : isPassed
                            ? "border-accent-green bg-surface text-text-primary"
                            : isUnlocked
                            ? "border-border-default bg-surface text-neutral-10 group-hover:border-accent-green"
                            : "border-border-divider bg-surface-subtle text-text-muted/60"
                        )}
                      >
                        {isPassed ? (
                          <Check className="h-4 w-4 text-accent-green" aria-hidden="true" />
                        ) : !isUnlocked ? (
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <span>{stage.level}</span>
                        )}
                      </div>

                      <span
                        className={cn(
                          "mt-2 text-xs font-bold leading-tight",
                          isActive
                            ? "text-text-primary"
                            : isUnlocked
                            ? "text-neutral-10"
                            : "text-text-muted/60"
                        )}
                      >
                        Level {stage.level}
                      </span>
                      <span className="mt-0.5 text-[11px] font-medium text-text-muted line-clamp-1">
                        {stage.shortTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-week selector when Level 2 is active */}
            {availableWeeks.length > 0 && (
              <div className="flex items-center justify-between gap-2 border-t border-border-divider pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Fase Minggu Level 2
                </span>
                <div className="inline-flex items-center gap-1 rounded-xl border border-border-default bg-surface-subtle p-1">
                  {availableWeeks.map((wk) => {
                    const isWkUnlocked = weeklyProgression.unlockedStages.some(
                      (s) => s.level === activeLevel && s.week === wk
                    );
                    const isWkActive = activeWeek === wk;
                    const label =
                      wk === 5 && activePath === "gain_muscle" ? "Mg 5–8" : `Mg ${wk}`;

                    return (
                      <button
                        key={wk}
                        type="button"
                        disabled={!isWkUnlocked}
                        onClick={() =>
                          isWkUnlocked && setQuestProgression({ currentWeek: wk })
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                          isWkActive
                            ? "bg-accent-green text-text-inverse"
                            : isWkUnlocked
                            ? "text-neutral-10 hover:text-text-primary cursor-pointer"
                            : "text-text-muted/50 cursor-not-allowed"
                        )}
                      >
                        {!isWkUnlocked && <Lock className="h-2.5 w-2.5" aria-hidden="true" />}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Compliance Bar */}
        <div className="space-y-2 border-t border-border-divider pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {weeklyProgression.currentWeekMetDays} / 7 hari target pekan ini tercapai
            </p>
            <span className="text-xs font-semibold text-text-muted">
              Syarat naik level: min. {weeklyProgression.requiredDaysMet} hari (75%)
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Progres kepatuhan mingguan"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={weeklyProgression.currentWeekComplianceRate}
            className="h-3 w-full overflow-hidden rounded-md bg-border-divider"
          >
            <div
              className="h-full rounded-md bg-accent-green transition-all duration-300"
              style={{
                width: `${Math.min(100, weeklyProgression.currentWeekComplianceRate)}%`,
              }}
            />
          </div>
        </div>

        {/* Daily Calorie & Macro Targets Row */}
        <div className="grid grid-cols-2 items-center gap-4 border-t border-border-divider pt-4 lg:grid-cols-[1fr_1.35fr_auto]">
          {/* Col 1: Daily Calories */}
          <div className="min-w-0 lg:pr-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Kalori Hari Ini
            </p>
            <p
              className="font-heading font-extrabold leading-none text-text-primary mt-1"
              style={{ fontSize: "clamp(2.25rem, 7vw, 3.5rem)" }}
            >
              {Math.round(consumed.calories).toLocaleString("id-ID")}
              <span className="ml-1 align-baseline text-sm font-bold text-text-muted sm:text-base">
                / {Math.round(questPlan.calorieTarget).toLocaleString("id-ID")} kkal
              </span>
            </p>
            <p className="mt-2 text-xs font-semibold text-text-muted">
              {calorieProgressPct}% dari target harian
            </p>
          </div>

          {/* Col 2: Macro Targets */}
          <div className="col-span-2 min-w-0 border-t border-border-divider pt-4 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Protein
                </p>
                <p className="mt-1 font-heading text-xl font-extrabold text-text-primary sm:text-2xl">
                  {Math.round(consumed.protein)}
                  <span className="text-xs font-bold text-text-muted">
                    /{Math.round(questPlan.macroTargets.proteinGrams)}g
                  </span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Karbo
                </p>
                <p className="mt-1 font-heading text-xl font-extrabold text-text-primary sm:text-2xl">
                  {Math.round(consumed.carbs)}
                  <span className="text-xs font-bold text-text-muted">
                    /{Math.round(questPlan.macroTargets.carbGrams)}g
                  </span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Lemak
                </p>
                <p className="mt-1 font-heading text-xl font-extrabold text-text-primary sm:text-2xl">
                  {Math.round(consumed.fat)}
                  <span className="text-xs font-bold text-text-muted">
                    /{Math.round(questPlan.macroTargets.fatGrams)}g
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs font-semibold text-text-muted">
              Serat min. {questPlan.macroTargets.fiberGrams ?? 28}g • Gula maks. {questPlan.macroTargets.sugarGramsMax ?? 50}g
            </p>
          </div>

          {/* Col 3: Action CTA */}
          <div className="col-span-2 flex justify-center border-t border-border-divider pt-3 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {weeklyProgression.canAdvance && !levelUpClaimed ? (
              <button
                type="button"
                onClick={handleClaimLevelUpPromotion}
                disabled={isClaimingLevelUp}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-green px-4 py-2.5 text-xs font-bold text-text-inverse transition-colors hover:bg-accent-green/90 disabled:opacity-50 lg:h-[4.25rem] lg:w-auto lg:px-6 lg:text-sm"
              >
                <span>
                  {isClaimingLevelUp ? "Mengklaim..." : "Klaim Naik Level (+100 Koin)"}
                </span>
              </button>
            ) : (
              <Link
                href="/diary/add"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-green px-4 py-2.5 text-xs font-bold text-text-inverse transition-colors hover:bg-accent-green/90 lg:h-[4.25rem] lg:w-auto lg:px-6 lg:text-sm"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Catat Asupan</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 3. CalPal Tucked Between the Cards */}
      <div className="relative z-10 -my-2 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/pet"
            aria-label="Lihat CalPal"
            className="group relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border-divider bg-surface shadow-xs transition-transform hover:-translate-y-0.5"
          >
            <div className="h-20 w-16">
              <AvatarRenderer
                characterId={species}
                colors={effectiveColors}
                earsVariant={earsVariant}
                tailVariant={tailVariant}
                faceVariant={faceVariant}
                equipped={equipped}
                animationState={allMainDone ? "happy" : "idle"}
                size="full"
                showShadow={false}
              />
            </div>
          </Link>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Partner Misi • Level {petLevel}
            </p>
            <p className="font-heading text-lg font-extrabold text-text-primary leading-tight">
              {petName || "CalPal"}
            </p>
            <p className="mt-0.5 text-xs font-medium text-neutral-10">
              {allMainDone
                ? "Semua misi utama hari ini beres. Pertahankan ritmemu!"
                : `Selesaikan misi di bawah untuk menambah EXP ${petName || "CalPal"}.`}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-52 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted">
            <span>EXP Partner</span>
            <span className="text-text-primary">
              {petExp} / {expNeeded} XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-md bg-border-divider">
            <div
              className="h-full rounded-md bg-accent-green transition-all duration-300"
              style={{ width: `${petExpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Main & Side Missions — Matching ProfileOverview 2-Column Card */}
      <section className="rounded-2xl border border-border-divider bg-surface p-5 shadow-xs sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-0">
          {/* Left: Main Missions */}
          <div className="lg:pr-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">Misi Utama</h2>
              <span className="text-xs font-semibold text-text-muted">
                {completedMainCount} / {questPlan.mainMissions.length} selesai
              </span>
            </div>

            <ul className="mt-3 divide-y divide-border-divider/60">
              {questPlan.mainMissions.map((mission) => {
                const evaluated = evaluatedMissions.find(
                  (e) => e.mission.id === mission.id
                );
                const status = evaluated?.status || {
                  isCompleted: completedMissions.includes(mission.id),
                  currentValue: consumed.calories,
                  targetValue: mission.targetValue,
                  unit: mission.unit,
                  progressPercent: 0,
                  progressLabel: "0 kkal",
                  statusText: "",
                };

                const isDone = status.isCompleted;
                const xp = mission.xpReward ?? 50;
                const coins = mission.coinReward ?? 25;

                return (
                  <li
                    key={mission.id}
                    className="flex items-start justify-between gap-4 py-3.5 first:pt-1 last:pb-0"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isDone ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-accent-green"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
                          aria-hidden="true"
                        />
                      )}

                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-xs font-bold",
                            isDone ? "text-text-muted line-through" : "text-text-primary"
                          )}
                        >
                          {mission.title}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-neutral-10">
                          {status.progressLabel}
                          {status.statusText ? ` • ${status.statusText}` : ""}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-[11px] font-semibold text-text-muted">
                      +{xp} XP • +{coins} Koin
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: Side Missions */}
          <div className="border-t border-border-divider pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">Misi Tambahan</h2>
              <span className="text-xs font-semibold text-text-muted">
                {questPlan.sideMissions.length === 0
                  ? "Terbuka di Level 2"
                  : `${completedSideCount} / ${questPlan.sideMissions.length} selesai`}
              </span>
            </div>

            {questPlan.sideMissions.length === 0 ? (
              <p className="mt-3 text-xs text-text-muted">
                Fokus pada target nutrisi utama di Level 1. Misi tambahan terbuka mulai Level 2.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border-divider/60">
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
                    <li
                      key={side.id}
                      className="py-3.5 first:pt-1 last:pb-0 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {isDone ? (
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 shrink-0 text-accent-green"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
                              aria-hidden="true"
                            />
                          )}

                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-xs font-bold",
                                isDone
                                  ? "text-text-muted line-through"
                                  : "text-text-primary"
                              )}
                            >
                              {side.title}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-neutral-10">
                              {isWater
                                ? `${waterLoggedMl} / ${side.targetValue} ml (${Math.round(waterLoggedMl / 250)} gelas)`
                                : `Target ${side.targetValue} ${side.unit}`}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-[11px] font-semibold text-text-muted">
                          +{xp} XP • +{coins} Koin
                        </span>
                      </div>

                      {isWater && (
                        <div className="flex items-center gap-3 pl-6">
                          <div className="h-2 flex-1 overflow-hidden rounded-md bg-border-divider">
                            <div
                              className="h-full rounded-md bg-accent-green transition-all duration-300"
                              style={{ width: `${waterPct}%` }}
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => addWater(-250)}
                              aria-label="Kurangi 250 ml"
                              className="inline-flex items-center gap-1 rounded-lg border border-border-default bg-surface px-2 py-1 text-[11px] font-semibold text-neutral-10 hover:bg-surface-subtle cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                              <span>250 ml</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => addWater(250)}
                              aria-label="Tambah 250 ml"
                              className="inline-flex items-center gap-1 rounded-lg bg-accent-green px-2.5 py-1 text-[11px] font-bold text-text-inverse hover:bg-accent-green/90 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>250 ml</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
