"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  Plus,
  Check,
  ChevronDown,
  Sparkles,
  Coins,
  TrendingDown,
  Dumbbell,
  ShieldCheck,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAutoTour } from "@/components/tour/useAutoTour";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import {
  GOAL_PATH_LABELS,
  getDynamicQuestTargets,
  goalTypeToGoalPath,
  type DailyQuestPlan,
  type GoalPath,
} from "@/lib/gamification/quest-engine";
import { claimLevelUpPromotionAction } from "@/server/actions/pet-actions";
import {
  GoalCompletedBanner,
  GoalCompletedModal,
} from "@/components/shared/goal-completed-modal";
import { toastReward } from "@/lib/toast";
import { cn } from "@/lib/utils";

const LEVEL_STAGE_META: Record<
  GoalPath,
  Array<{ level: number; shortTitle: string; targetNote: string }>
> = {
  lose_weight: [
    { level: 1, shortTitle: "Catat Asupan", targetNote: "100% TEE" },
    {
      level: 2,
      shortTitle: "Defisit Bertahap",
      targetNote: "-100 s/d -400 kkal",
    },
    { level: 3, shortTitle: "Defisit Optimal", targetNote: "-500 kkal" },
    { level: 4, shortTitle: "Maintenance", targetNote: "Stabil TEE" },
  ],
  gain_muscle: [
    { level: 1, shortTitle: "Catat Asupan", targetNote: "100% TEE" },
    {
      level: 2,
      shortTitle: "Surplus & Protein",
      targetNote: "+100 s/d +500 kkal",
    },
    { level: 3, shortTitle: "Nutrisi Latihan", targetNote: "+500 kkal" },
    { level: 5, shortTitle: "Konsistensi Otot", targetNote: "Maintenance" },
  ],
  maintain_weight: [
    { level: 1, shortTitle: "Keseimbangan TEE", targetNote: "95–105% TEE" },
    { level: 2, shortTitle: "Hidrasi & Gizi", targetNote: "Stabil + Air" },
  ],
};

function getLevelPurposeDescription(plan: DailyQuestPlan): string {
  const { path, level, weekLabel, calorieTarget } = plan;
  const kcalText = `${Math.round(calorieTarget).toLocaleString("id-ID")} kkal/hari`;

  if (path === "lose_weight") {
    if (level === 1) {
      return `Level ini bertujuan membiasakan pencatatan makan dan minum harian serta mengenali kebutuhan energi dasar (${kcalText}) sebelum memasuki fase defisit.`;
    }
    if (level === 2) {
      const weekSuffix = weekLabel ? ` (${weekLabel})` : "";
      return `Level ini${weekSuffix} bertujuan menurunkan berat badan secara aman melalui defisit kalori bertahap (${kcalText}) serta peningkatan asupan serat.`;
    }
    if (level === 3) {
      return `Level ini berfokus pada defisit kalori optimal (${kcalText}) dengan serat tinggi dan pembatasan gula untuk pembakaran lemak maksimal.`;
    }
    return `Level ini bertujuan menstabilkan kembali berat badan ideal setelah fase defisit dengan menjaga asupan harian seimbang (${kcalText}).`;
  }

  if (path === "gain_muscle") {
    if (level === 1) {
      return `Level ini bertujuan membangun konsistensi pencatatan makan dan minum harian (${kcalText}) sebagai fondasi awal sebelum fase surplus kalori.`;
    }
    if (level === 2) {
      const weekSuffix = weekLabel ? ` (${weekLabel})` : "";
      return `Level ini${weekSuffix} mendukung pertumbuhan massa otot melalui surplus kalori bertahap (${kcalText}), protein tinggi, dan latihan beban rutin.`;
    }
    if (level === 3) {
      return `Level ini mengoptimalkan energi dan pemulihan saat latihan beban intensif lewat surplus bersih (${kcalText}) serta strategi karbo loading.`;
    }
    return `Level ini bertujuan menjaga konsistensi massa otot dan komposisi tubuh dalam jangka panjang dengan asupan harian terjaga (${kcalText}).`;
  }

  if (level === 1) {
    return `Level ini menjaga keseimbangan energi harian (${kcalText}) beserta serat dan batas gula agar berat badan tetap stabil.`;
  }
  return `Level ini memperkuat kestabilan berat badan dan gaya hidup sehat dengan keseimbangan gizi harian (${kcalText}) serta hidrasi yang cukup.`;
}

export default function QuestsPage() {
  const isHydrated = useHydrated();
  useAutoTour("quests", { enabled: isHydrated });
  const {
    goalPlan,
    waterLoggedMl,
    completedMissions,
    rewardedMissions,
    getQuestPlan,
    getConsumed,
    setQuestProgression,
    toggleMissionComplete,
    getWeeklyProgression,
    getEvaluatedMissions,
  } = useFoodStore();

  const {
    name: petName,
    species,
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
  const [goalCompletedModalOpen, setGoalCompletedModalOpen] = useState(false);
  const [expandedMissions, setExpandedMissions] = useState<
    Record<string, boolean>
  >({});
  const [inspectedSelection, setInspectedSelection] = useState<{
    path: GoalPath;
    level: number;
    week?: number;
  } | null>(null);

  const toggleMissionDetails = (id: string) => {
    setExpandedMissions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleMission = (
    missionId: string,
    title: string,
    xp: number,
    coins: number,
  ) => {
    const wasRewarded = (rewardedMissions ?? []).includes(missionId);
    const isNowDone = toggleMissionComplete(missionId, xp, coins);
    if (isNowDone && !wasRewarded) {
      toastReward(
        "Misi Selesai",
        xp,
        coins,
        `${title} (+${xp} XP & +${coins} Koin untuk CalPal).`,
      );
    }
  };

  if (!isHydrated) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-border-divider pb-4">
          <div className="h-11 w-11 bg-border-divider/40 animate-pulse rounded-xl" />
          <div className="h-7 w-56 bg-border-divider/40 animate-pulse rounded-xl" />
        </div>
        <div className="h-24 bg-border-divider/40 animate-pulse rounded-2xl" />
        <div className="h-56 bg-border-divider/40 animate-pulse rounded-2xl border border-border-divider" />
        <div className="h-36 bg-border-divider/40 animate-pulse rounded-2xl border border-border-divider" />
        <div className="h-56 bg-border-divider/40 animate-pulse rounded-2xl border border-border-divider" />
      </div>
    );
  }

  const questPlan = getQuestPlan();
  const consumed = getConsumed();
  const weeklyProgression = getWeeklyProgression();
  const evaluatedMissions = getEvaluatedMissions();

  const activePath = goalPlan.goalPath || goalTypeToGoalPath(goalPlan.goalType);
  const activeLevel = goalPlan.currentLevel || 1;
  const activeWeek = goalPlan.currentWeek || 1;
  const GoalPathIcon =
    activePath === "gain_muscle"
      ? Dumbbell
      : activePath === "maintain_weight"
        ? ShieldCheck
        : TrendingDown;

  const inspectedLevel =
    inspectedSelection && inspectedSelection.path === activePath
      ? inspectedSelection.level
      : activeLevel;
  const inspectedWeek =
    inspectedLevel === 2
      ? inspectedSelection &&
        inspectedSelection.path === activePath &&
        inspectedSelection.level === 2 &&
        inspectedSelection.week !== undefined
        ? inspectedSelection.week
        : activeWeek
      : inspectedLevel === 3 && activePath === "lose_weight"
        ? 5
        : inspectedLevel === 3 && activePath === "gain_muscle"
          ? 8
          : 1;

  const inspectedPlan = getDynamicQuestTargets({
    weightKg: goalPlan.currentWeightKg,
    heightCm: goalPlan.heightCm,
    age: goalPlan.age,
    gender: goalPlan.gender,
    goalPath: activePath,
    currentLevel: inspectedLevel,
    currentWeek: inspectedWeek,
  });

  const isInspectedUnlocked = weeklyProgression.unlockedStages.some(
    (s) => s.level === inspectedLevel,
  );
  const inspectedPurposeParagraph = getLevelPurposeDescription(inspectedPlan);
  const inspectedChecklistItems = [
    ...inspectedPlan.mainMissions.map((m) => ({
      id: m.id,
      title: m.title,
      detail: m.description,
      xp: m.xpReward ?? 50,
      coins: m.coinReward ?? 25,
    })),
    ...inspectedPlan.sideMissions.map((s) => ({
      id: s.id,
      title: s.title,
      detail: `Misi Tambahan • Target ${s.targetValue} ${s.unit}`,
      xp: s.xpReward ?? 25,
      coins: s.coinReward ?? 10,
    })),
  ];

  const charDef = getCharacterDefinition(species);
  const effectiveColors = getEffectiveColors
    ? getEffectiveColors()
    : {
        ...charDef.defaultColors,
        ...Object.fromEntries(
          Object.entries(customColors || {}).filter(([, v]) => Boolean(v)),
        ),
      };

  const expNeeded = getExpNeededForNextLevel ? getExpNeededForNextLevel() : 100;
  const petExpPct = Math.min(
    100,
    Math.round((petExp / Math.max(1, expNeeded)) * 100),
  );

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
          "+100 Koin didapatkan dari evaluasi mingguan.",
        );
      }
    } catch (e) {
      console.warn("Claim level up error:", e);
    } finally {
      setIsClaimingLevelUp(false);
    }
  };

  const levelStages =
    LEVEL_STAGE_META[activePath] || LEVEL_STAGE_META.lose_weight;

  const availableWeeks =
    activePath === "lose_weight" && inspectedLevel === 2
      ? [1, 2, 3, 4]
      : activePath === "gain_muscle" && inspectedLevel === 2
        ? [1, 2, 3, 4, 5]
        : [];

  const calorieProgressPct = Math.min(
    100,
    Math.round(
      (consumed.calories / Math.max(1, questPlan.calorieTarget)) * 100,
    ),
  );
  const proteinProgressPct = Math.min(
    100,
    (consumed.protein / Math.max(1, questPlan.macroTargets.proteinGrams)) * 100,
  );
  const carbsProgressPct = Math.min(
    100,
    (consumed.carbs / Math.max(1, questPlan.macroTargets.carbGrams)) * 100,
  );
  const fatProgressPct = Math.min(
    100,
    (consumed.fat / Math.max(1, questPlan.macroTargets.fatGrams)) * 100,
  );
  const giziProgressPct = Math.round(
    (proteinProgressPct + carbsProgressPct + fatProgressPct) / 3,
  );
  const weeklyTargetPct = Math.min(
    100,
    Math.round((weeklyProgression.currentWeekMetDays / 7) * 100),
  );

  const completedMainCount = evaluatedMissions.filter(
    (m) => m.isMain && m.status.isCompleted,
  ).length;
  const completedSideCount = evaluatedMissions.filter(
    (m) => !m.isMain && m.status.isCompleted,
  ).length;

  const activeStageIndex = Math.max(
    0,
    levelStages.findIndex((s) => s.level === activeLevel),
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
      {/* 1. Header */}
      <header className="border-b border-border-divider pb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <Link
            href="/dashboard"
            aria-label="Kembali ke dashboard"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-default text-neutral-10 transition-colors hover:bg-accent-green-light hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-text-primary font-heading sm:text-2xl">
              Misi & Progres Level
            </h1>
          </div>

          <span className="inline-flex h-11 items-center gap-2 rounded-navigation bg-accent-yellow px-4 text-sm font-bold text-[#486284] dark:text-[#F6E58D] sm:text-base">
            <span>Jalur {GOAL_PATH_LABELS[activePath]?.title}</span>
            <GoalPathIcon
              className="h-4 w-4 shrink-0 sm:h-5 sm:w-5"
              aria-hidden="true"
            />
          </span>
        </div>
      </header>

      {/* Goal Completed Banner */}
      <GoalCompletedBanner
        onOpenModal={() => setGoalCompletedModalOpen(true)}
      />

      {/* 2. CalPal Strip Above Mission Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 px-1 sm:px-2">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/pet"
            aria-label="Lihat CalPal"
            className="group relative shrink-0 rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green"
          >
            <div className="h-20 w-16 sm:h-24 sm:w-20">
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

          <h2 className="min-w-0 truncate font-heading text-2xl font-extrabold leading-tight text-text-primary sm:text-3xl">
            {petName || "CalPal"}
          </h2>
        </div>

        <div className="w-full sm:w-72 md:w-80 shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
            <span className="text-neutral-10">EXP CalPal</span>
            <span className="font-bold text-[#3B6B1B] dark:text-text-primary tabular-nums">
              {petExp} / {expNeeded} XP
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Progres EXP CalPal"
            aria-valuemin={0}
            aria-valuemax={expNeeded}
            aria-valuenow={petExp}
            className="h-2.5 w-full overflow-hidden rounded-full bg-border-divider"
          >
            <div
              className="h-full rounded-full bg-accent-green transition-all duration-300"
              style={{ width: `${petExpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Main & Side Missions */}
      <section className="rounded-2xl border border-border-divider bg-surface p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-0">
          {/* Left: Main Missions */}
          <div data-tour="quests-main" className="lg:pr-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-xl font-extrabold text-text-primary sm:text-2xl">
                Misi Utama
              </h2>
              <span className="text-base font-bold text-neutral-10 tabular-nums sm:text-lg">
                {completedMainCount}/{questPlan.mainMissions.length}
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {questPlan.mainMissions.map((mission) => {
                const evaluated = evaluatedMissions.find(
                  (e) => e.mission.id === mission.id,
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
                const isExpanded = Boolean(expandedMissions[mission.id]);
                const xp = mission.xpReward ?? 50;
                const coins = mission.coinReward ?? 25;

                return (
                  <li
                    key={mission.id}
                    className="flex items-start justify-between gap-3 py-1.5"
                  >
                    <div className="flex items-start gap-1 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleMission(
                            mission.id,
                            mission.title,
                            xp,
                            coins,
                          )
                        }
                        aria-pressed={isDone}
                        aria-label={
                          isDone
                            ? `Batalkan selesai ${mission.title}`
                            : `Tandai ${mission.title} selesai`
                        }
                        className="inline-flex h-11 w-11 shrink-0 -my-2 -ml-3 items-center justify-center rounded-xl text-neutral-10 transition-colors hover:bg-accent-green-light/30 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle2
                            className="h-5 w-5 shrink-0 text-text-primary dark:text-accent-green"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="h-5 w-5 shrink-0 text-neutral-10"
                            aria-hidden="true"
                          />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-1">
                          <p
                            className={cn(
                              "text-base font-bold leading-snug sm:text-lg",
                              isDone
                                ? "text-neutral-10 line-through opacity-75"
                                : "text-neutral-10",
                            )}
                          >
                            {mission.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleMissionDetails(mission.id)}
                            aria-expanded={isExpanded}
                            aria-controls={`mission-detail-${mission.id}`}
                            aria-label={
                              isExpanded
                                ? `Sembunyikan detail ${mission.title}`
                                : `Lihat detail ${mission.title}`
                            }
                            className="inline-flex h-11 w-11 shrink-0 -my-2 items-center justify-center rounded-xl text-neutral-10 transition-colors hover:bg-accent-green-light/30 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green cursor-pointer"
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isExpanded && "rotate-180",
                              )}
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        {isExpanded && (
                          <p
                            id={`mission-detail-${mission.id}`}
                            className="mt-1 text-xs font-medium leading-relaxed text-neutral-10 sm:text-sm"
                          >
                            {status.progressLabel}
                            {status.statusText ? ` • ${status.statusText}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-0.5 flex items-center gap-3 shrink-0 text-xs font-bold tabular-nums sm:text-sm">
                      <span
                        className="inline-flex items-center gap-1 text-[#3B6B1B] dark:text-text-primary"
                        title={`+${xp} XP`}
                      >
                        <Sparkles
                          className="h-4 w-4 shrink-0 text-text-primary dark:text-accent-green"
                          aria-hidden="true"
                        />
                        <span>+{xp}</span>
                        <span className="sr-only">XP</span>
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[#9A4B16] dark:text-accent-orange-dark"
                        title={`+${coins} Koin`}
                      >
                        <Coins
                          className="h-4 w-4 shrink-0 text-accent-orange-dark dark:text-accent-orange"
                          aria-hidden="true"
                        />
                        <span>+{coins}</span>
                        <span className="sr-only">Koin</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: Side Missions */}
          <div
            data-tour="quests-side"
            className="border-t border-border-divider pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-xl font-extrabold text-text-primary sm:text-2xl">
                Misi Tambahan
              </h2>
              <span
                className={cn(
                  "font-bold text-neutral-10 tabular-nums",
                  questPlan.sideMissions.length === 0
                    ? "text-sm sm:text-base"
                    : "text-base sm:text-lg",
                )}
              >
                {questPlan.sideMissions.length === 0
                  ? "Terbuka di Level 2"
                  : `${completedSideCount}/${questPlan.sideMissions.length}`}
              </span>
            </div>

            {questPlan.sideMissions.length === 0 ? (
              <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-10">
                Fokus pada target nutrisi utama di Level 1. Misi tambahan
                terbuka mulai Level 2.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {questPlan.sideMissions.map((side) => {
                  const evaluatedSide = evaluatedMissions.find(
                    (e) => e.mission.id === side.id,
                  );
                  const isWater = side.type === "water";
                  const isDone =
                    evaluatedSide?.status.isCompleted ??
                    completedMissions.includes(side.id);
                  const isExpanded = Boolean(expandedMissions[side.id]);
                  const xp = side.xpReward ?? 25;
                  const coins = side.coinReward ?? 10;

                  return (
                    <li
                      key={side.id}
                      className="flex items-start justify-between gap-3 py-1.5"
                    >
                      <div className="flex items-start gap-1 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleMission(side.id, side.title, xp, coins)
                          }
                          aria-pressed={isDone}
                          aria-label={
                            isDone
                              ? `Batalkan selesai ${side.title}`
                              : `Tandai ${side.title} selesai`
                          }
                          className="inline-flex h-11 w-11 shrink-0 -my-2 -ml-3 items-center justify-center rounded-xl text-neutral-10 transition-colors hover:bg-accent-green-light/30 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2
                              className="h-5 w-5 shrink-0 text-text-primary dark:text-accent-green"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              className="h-5 w-5 shrink-0 text-neutral-10"
                              aria-hidden="true"
                            />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-1">
                            <p
                              className={cn(
                                "text-base font-bold leading-snug sm:text-lg",
                                isDone
                                  ? "text-neutral-10 line-through opacity-75"
                                  : "text-neutral-10",
                              )}
                            >
                              {side.title}
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleMissionDetails(side.id)}
                              aria-expanded={isExpanded}
                              aria-controls={`mission-detail-${side.id}`}
                              aria-label={
                                isExpanded
                                  ? `Sembunyikan detail ${side.title}`
                                  : `Lihat detail ${side.title}`
                              }
                              className="inline-flex h-11 w-11 shrink-0 -my-2 items-center justify-center rounded-xl text-neutral-10 transition-colors hover:bg-accent-green-light/30 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green cursor-pointer"
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  isExpanded && "rotate-180",
                                )}
                                aria-hidden="true"
                              />
                            </button>
                          </div>

                          {isExpanded && (
                            <p
                              id={`mission-detail-${side.id}`}
                              className="mt-1 text-xs font-medium leading-relaxed text-neutral-10 sm:text-sm"
                            >
                              {isWater
                                ? `${waterLoggedMl} / ${side.targetValue} ml (${Math.round(waterLoggedMl / 250)} gelas)`
                                : `Target ${side.targetValue} ${side.unit}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-0.5 flex items-center gap-3 shrink-0 text-xs font-bold tabular-nums sm:text-sm">
                        <span
                          className="inline-flex items-center gap-1 text-[#3B6B1B] dark:text-text-primary"
                          title={`+${xp} XP`}
                        >
                          <Sparkles
                            className="h-4 w-4 shrink-0 text-text-primary dark:text-accent-green"
                            aria-hidden="true"
                          />
                          <span>+{xp}</span>
                          <span className="sr-only">XP</span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[#9A4B16] dark:text-accent-orange-dark"
                          title={`+${coins} Koin`}
                        >
                          <Coins
                            className="h-4 w-4 shrink-0 text-accent-orange-dark dark:text-accent-orange"
                            aria-hidden="true"
                          />
                          <span>+{coins}</span>
                          <span className="sr-only">Koin</span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 4. Container 1: Level Progress Bar (Interactive Squircles) */}
      <section
        data-tour="quests-roadmap"
        className="rounded-2xl border border-border-divider bg-surface p-5 sm:p-6 space-y-4"
      >
        <div className="relative">
          {/* Connecting Track Line */}
          <div
            aria-hidden="true"
            className="absolute left-8 right-8 top-7 h-1.5 rounded-full bg-border-divider/60 sm:left-10 sm:right-10 sm:top-8"
          >
            <div
              className="h-full rounded-full bg-accent-green transition-all duration-300"
              style={{ width: `${roadmapFillPct}%` }}
            />
          </div>

          {/* Clickable Level Squircle Nodes (stroke-free) */}
          <div
            className="relative grid gap-2 sm:gap-4"
            style={{
              gridTemplateColumns: `repeat(${levelStages.length}, minmax(0, 1fr))`,
            }}
          >
            {levelStages.map((stage, idx) => {
              const isUnlocked = weeklyProgression.unlockedStages.some(
                (s) => s.level === stage.level,
              );
              const isInspected = inspectedLevel === stage.level;
              const isPassed = idx < activeStageIndex && isUnlocked;
              const defaultWeekForStage =
                stage.level === 3 && activePath === "lose_weight"
                  ? 5
                  : stage.level === 3 && activePath === "gain_muscle"
                    ? 8
                    : 1;

              return (
                <button
                  key={stage.level}
                  type="button"
                  aria-pressed={isInspected}
                  onClick={() => {
                    setInspectedSelection({
                      path: activePath,
                      level: stage.level,
                      week: defaultWeekForStage,
                    });
                    if (isUnlocked) {
                      setQuestProgression({
                        currentLevel: stage.level,
                        currentWeek: defaultWeekForStage,
                      });
                    }
                  }}
                  className="group flex flex-col items-center text-center transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green rounded-2xl cursor-pointer py-1"
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl text-base sm:text-lg font-extrabold transition-all font-heading",
                      isInspected && isUnlocked
                        ? "bg-accent-green-light text-[#244710] dark:bg-accent-green dark:text-[#0F172A] scale-105"
                        : isInspected && !isUnlocked
                          ? "bg-accent-yellow text-[#486284] dark:bg-accent-yellow dark:text-[#F1F5F9] scale-105"
                          : isPassed
                            ? "bg-accent-green/20 text-[#3B6B1B] dark:bg-accent-green/25 dark:text-text-primary group-hover:scale-105"
                            : isUnlocked
                              ? "bg-accent-green-light/40 text-[#244710] dark:bg-border-default dark:text-neutral-10 group-hover:scale-105"
                              : "bg-border-divider/55 text-neutral-10 dark:bg-border-default dark:text-neutral-10 group-hover:scale-105",
                    )}
                  >
                    {isPassed && !isInspected ? (
                      <Check
                        className="h-5 w-5 sm:h-6 sm:w-6 text-[#3B6B1B] dark:text-text-primary"
                        aria-hidden="true"
                      />
                    ) : !isUnlocked ? (
                      <Lock
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <span>{stage.level}</span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "mt-2.5 text-xs font-bold leading-tight sm:text-sm",
                      isInspected
                        ? "text-[#3B6B1B] dark:text-text-primary"
                        : "text-neutral-10",
                    )}
                  >
                    Level {stage.level}
                  </span>
                  <span className="mt-0.5 text-[11px] font-medium leading-tight text-neutral-10">
                    {!isUnlocked
                      ? "Selesaikan level sebelumnya"
                      : stage.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-week selector when Level 2 is selected */}
        {availableWeeks.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-10">
              Fase Minggu Level 2
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-border-divider/35 p-1">
              {availableWeeks.map((wk) => {
                const isWkUnlocked = weeklyProgression.unlockedStages.some(
                  (s) => s.level === 2 && s.week === wk,
                );
                const isWkActive = inspectedWeek === wk;
                const label =
                  wk === 5 && activePath === "gain_muscle"
                    ? "Mg 5–8"
                    : `Mg ${wk}`;

                return (
                  <button
                    key={wk}
                    type="button"
                    onClick={() => {
                      setInspectedSelection({
                        path: activePath,
                        level: 2,
                        week: wk,
                      });
                      if (isWkUnlocked) {
                        setQuestProgression({
                          currentLevel: 2,
                          currentWeek: wk,
                        });
                      }
                    }}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green cursor-pointer",
                      isWkActive
                        ? "bg-accent-green-light text-[#244710] dark:bg-accent-green dark:text-[#0F172A] font-bold"
                        : "text-neutral-10 hover:text-text-primary",
                    )}
                  >
                    {!isWkUnlocked && (
                      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                    )}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 5. Container 2: 3 Bagian (1. Judul Level, 2. Deskripsi & Tasks, 3. Gizi & Tombol) dengan Divider */}
      <section className="rounded-2xl border border-border-divider bg-surface p-5 sm:p-6 divide-y divide-border-divider dark:divide-border-default">
        {/* Bagian 1: Judul Level */}
        <div className="flex flex-wrap items-center gap-2.5 pb-4 sm:pb-5">
          <h3 className="font-heading text-base font-extrabold text-[#3B6B1B] dark:text-text-primary sm:text-lg">
            {inspectedPlan.levelTitle}
          </h3>
          {!isInspectedUnlocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-yellow px-3 py-1 text-xs font-bold text-[#486284] dark:text-[#F1F5F9]">
              <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>Selesaikan level sebelumnya</span>
            </span>
          )}
        </div>

        {/* Bagian 2: Deskripsi dan Tasks */}
        <div className="py-4 sm:py-5 space-y-4">
          <p className="text-sm font-medium leading-relaxed text-neutral-10 sm:text-base">
            {inspectedPurposeParagraph}
          </p>

          <ul
            className="space-y-2.5"
            aria-label={`Checklist misi Level ${inspectedPlan.level}`}
          >
            {inspectedChecklistItems.map((item) => {
              const evaluatedItem = evaluatedMissions.find(
                (e) => e.mission.id === item.id,
              );
              const isItemDone = isInspectedUnlocked
                ? (evaluatedItem?.status.isCompleted ??
                  completedMissions.includes(item.id))
                : false;

              return (
                <li key={item.id} className="flex items-start gap-2">
                  {isInspectedUnlocked ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleMission(
                          item.id,
                          item.title,
                          item.xp,
                          item.coins,
                        )
                      }
                      aria-pressed={isItemDone}
                      aria-label={
                        isItemDone
                          ? `Batalkan selesai ${item.title}`
                          : `Tandai ${item.title} selesai`
                      }
                      className="inline-flex h-11 w-11 shrink-0 -my-2 -ml-3 items-center justify-center rounded-xl text-neutral-10 transition-colors hover:bg-accent-green-light/30 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green cursor-pointer"
                    >
                      {isItemDone ? (
                        <CheckCircle2
                          className="h-5 w-5 shrink-0 text-text-primary dark:text-accent-green"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="h-5 w-5 shrink-0 text-neutral-10"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-neutral-10/70">
                      <Circle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-bold leading-snug sm:text-base",
                        isItemDone
                          ? "text-neutral-10 line-through opacity-75"
                          : "text-neutral-10",
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs font-medium leading-relaxed text-neutral-10">
                      {item.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bagian 3: Gizi dan Tombol */}
        <div className="flex flex-col gap-5 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
          <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-10">
                KALORI
              </p>
              <p className="mt-1 font-heading text-2xl font-extrabold leading-none text-text-primary tabular-nums sm:text-3xl">
                {calorieProgressPct}%
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-10">
                GIZI
              </p>
              <p className="mt-1 font-heading text-2xl font-extrabold leading-none text-text-primary tabular-nums sm:text-3xl">
                {giziProgressPct}%
              </p>
            </div>

            <div
              title={`${weeklyProgression.currentWeekMetDays} dari 7 hari pekan ini`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-10">
                TARGET PEKAN INI
              </p>
              <p className="mt-1 font-heading text-2xl font-extrabold leading-none text-text-primary tabular-nums sm:text-3xl">
                {weeklyTargetPct}%
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {weeklyProgression.canAdvance && !levelUpClaimed ? (
              <button
                type="button"
                onClick={handleClaimLevelUpPromotion}
                disabled={isClaimingLevelUp}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-green-light px-5 py-3 text-xs font-bold text-[#244710] transition-colors hover:bg-accent-green-light/85 dark:bg-accent-green dark:text-[#0F172A] dark:hover:bg-accent-green/90 disabled:opacity-50 sm:w-auto sm:text-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
              >
                <span>
                  {isClaimingLevelUp
                    ? "Mengklaim..."
                    : "Klaim Naik Level (+100 Koin)"}
                </span>
              </button>
            ) : (
              <Link
                href="/diary/add"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-green-light px-5 py-3 text-xs font-bold text-[#244710] transition-colors hover:bg-accent-green-light/85 dark:bg-accent-green dark:text-[#0F172A] dark:hover:bg-accent-green/90 sm:w-auto sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Catat Asupan</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <GoalCompletedModal
        open={goalCompletedModalOpen}
        onClose={() => setGoalCompletedModalOpen(false)}
      />
    </div>
  );
}
