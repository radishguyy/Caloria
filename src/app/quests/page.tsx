"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sword,
  Calendar,
  Flame,
  CheckCircle2,
  Circle,
  Sparkles,
  Droplets,
  Footprints,
  Dumbbell,
  Moon,
  Ruler,
  Coins,
  Lock,
  AlertCircle,
  Plus,
  Minus,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  GOAL_PATH_LABELS,
  goalTypeToGoalPath,
  type QuestSideMission,
} from "@/lib/gamification/quest-engine";
import { claimLevelUpPromotionAction } from "@/server/actions/pet-actions";
import { toastReward } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function QuestsPage() {
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
    getWeeklyProgression,
    getEvaluatedMissions,
  } = useFoodStore();

  const [rewardToast, setRewardToast] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-border-divider pb-4">
          <div className="h-9 w-9 bg-surface-subtle animate-pulse rounded-xl" />
          <div className="h-7 w-64 bg-surface-subtle animate-pulse rounded-navigation" />
        </div>
        <div className="h-32 bg-surface-subtle animate-pulse rounded-card" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-subtle animate-pulse rounded-card" />
          ))}
        </div>
        <div className="h-48 bg-surface-subtle animate-pulse rounded-card" />
      </div>
    );
  }

  const questPlan = getQuestPlan();
  const consumed = getConsumed();
  const depkes = getDepkesEvaluation();
  const weeklyProgression = getWeeklyProgression();
  const evaluatedMissions = getEvaluatedMissions();

  const activePath =
    goalPlan.goalPath || goalTypeToGoalPath(goalPlan.goalType);
  const activeLevel = goalPlan.currentLevel || 1;
  const activeWeek = goalPlan.currentWeek || 1;
  const { addCoins } = usePetStore();
  const [isClaimingLevelUp, setIsClaimingLevelUp] = useState(false);
  const [levelUpClaimed, setLevelUpClaimed] = useState(false);

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
          "Promosi Naik Level Berhasil! 🏆✨",
          0,
          100,
          "+100 Koin Caloria didapatkan atas konsistensi evaluasi mingguan!",
        );
      }
    } catch (e) {
      console.warn("Claim level up error:", e);
    } finally {
      setIsClaimingLevelUp(false);
    }
  };

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

  const calorieProgressPct = Math.min(
    100,
    Math.round((consumed.calories / Math.max(1, questPlan.calorieTarget)) * 100)
  );

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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Header (Aligned with Profile Layout: Back button, Title, Level & Path badges) */}
      <header className="border-b border-border-divider pb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Kembali ke Dashboard"
              className="shrink-0 rounded-xl border border-border-default p-2 text-text-muted transition-colors hover:bg-accent-green-light hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-bold bg-[#5B8E55] text-white shadow-2xs font-sans">
                  <Sword className="h-3 w-3" />
                  <span>
                    Level {activeLevel} • {questPlan.levelTitle}
                    {questPlan.weekLabel ? ` - ${questPlan.weekLabel}` : ""}
                  </span>
                </span>
                <span className="px-2.5 py-0.5 rounded-pill text-xs font-bold bg-[#FCF8E3] text-text-primary border border-[#FF9233]/40 font-sans">
                  Jalur: {GOAL_PATH_LABELS[activePath]?.title} ({GOAL_PATH_LABELS[activePath]?.badge})
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary font-heading mt-1">
                Misi Nutrisi & Quest Level
              </h1>
            </div>
          </div>

          {/* Level & Week Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Level Selector */}
            <div className="flex items-center gap-1 p-1 rounded-navigation bg-surface border border-border-divider">
              {availableLevels.map((lvl) => {
                const isUnlocked = weeklyProgression.unlockedStages.some(
                  (s) => s.level === lvl
                );
                const isActive = activeLevel === lvl;

                if (isUnlocked) {
                  return (
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
                        "px-2.5 py-1 rounded-navigation text-xs font-bold transition-all font-sans cursor-pointer",
                        isActive
                          ? "bg-[#5B8E55] text-white shadow-2xs"
                          : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Lv.{lvl}
                    </button>
                  );
                }

                return (
                  <button
                    key={lvl}
                    type="button"
                    disabled
                    title={`Level ${lvl} Terkunci: Waktu minimal 1 minggu dan kepatuhan ≥75% harian di level sebelumnya diperlukan.`}
                    className="px-2.5 py-1 rounded-navigation text-xs font-bold font-sans cursor-not-allowed opacity-50 text-text-muted bg-surface-subtle flex items-center gap-1 border border-border-divider"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Lv.{lvl}</span>
                  </button>
                );
              })}
            </div>

            {/* Week Selector (for Level 2) */}
            {availableWeeks.length > 0 && (
              <div className="flex items-center gap-1 p-1 rounded-navigation bg-[#FCF8E3] border border-[#FF9233]/30">
                {availableWeeks.map((wk) => {
                  const isWkUnlocked = weeklyProgression.unlockedStages.some(
                    (s) => s.level === activeLevel && s.week === wk
                  );
                  const isWkActive = activeWeek === wk;
                  const label =
                    wk === 5 && activePath === "gain_muscle" ? "Mg 5–8" : `Mg ${wk}`;

                  if (isWkUnlocked) {
                    return (
                      <button
                        key={wk}
                        type="button"
                        onClick={() => setQuestProgression({ currentWeek: wk })}
                        className={cn(
                          "px-2 py-1 rounded-navigation text-xs font-bold transition-all font-sans cursor-pointer",
                          isWkActive
                            ? "bg-text-primary text-white"
                            : "text-text-primary hover:bg-surface"
                        )}
                      >
                        {label}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={wk}
                      type="button"
                      disabled
                      title={`Minggu ${wk} Terkunci: Selesaikan minggu sebelumnya dengan kepatuhan ≥75%.`}
                      className="px-2 py-1 rounded-navigation text-xs font-bold font-sans cursor-not-allowed opacity-45 text-text-muted flex items-center gap-1"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {rewardToast && (
        <div className="p-3.5 rounded-card bg-[#FCF8E3] border border-[#FF9233] text-xs font-bold text-text-primary flex items-center justify-between animate-in fade-in duration-200 font-sans shadow-2xs">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#FF9233]" />
            <span>{rewardToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setRewardToast(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. Weekly Evaluation Scorecard (7-Day Promotion Checklist) */}
      <section
        aria-label="Evaluasi Mingguan"
        className="rounded-card bg-surface p-5 border border-border-divider space-y-4 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-divider">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#FF9233]" />
            <h2 className="text-base font-extrabold text-text-primary font-heading">
              Evaluasi Mingguan (Target Kepatuhan 75%)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-muted font-sans">
              Pekan ke-{weeklyProgression.currentCalendarWeek} • Hari {weeklyProgression.dayInCurrentWeek} dari 7
            </span>
            {weeklyProgression.isRepeating && (
              <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Mengulang Level
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-text-muted">
              Kepatuhan Misi Harian:{" "}
              <strong className="text-text-primary">
                {weeklyProgression.currentWeekMetDays} / 7 hari tercapai
              </strong>{" "}
              (Target kelulusan: min. 75% / {weeklyProgression.requiredDaysMet} hari)
            </span>
            <span
              className={cn(
                "font-bold",
                weeklyProgression.currentWeekComplianceRate >= 75
                  ? "text-[#5B8E55]"
                  : "text-amber-600"
              )}
            >
              {weeklyProgression.currentWeekComplianceRate}%
            </span>
          </div>

          {/* Segmented 7-day progress checklist */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const dayNum = i + 1;
              const isPastDay = dayNum < weeklyProgression.dayInCurrentWeek;
              const isToday = dayNum === weeklyProgression.dayInCurrentWeek;
              const isMet = dayNum <= weeklyProgression.currentWeekMetDays;

              return (
                <div
                  key={dayNum}
                  className={cn(
                    "p-2.5 rounded-navigation text-center border text-xs font-bold font-sans transition-all",
                    isMet
                      ? "bg-[#5B8E55]/15 border-[#5B8E55] text-[#5B8E55]"
                      : isPastDay
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : isToday
                      ? "bg-[#FCF8E3] border-[#FF9233] text-text-primary ring-2 ring-[#FF9233]/20"
                      : "bg-surface-subtle border-border-divider text-text-muted"
                  )}
                >
                  <div>H-{dayNum}</div>
                  <div className="text-[10px] font-normal mt-0.5">
                    {isMet
                      ? "✓ Tercapai"
                      : isPastDay
                      ? "✕ Belum"
                      : isToday
                      ? "Hari Ini"
                      : "Nanti"}
                  </div>
                </div>
              );
            })}
          </div>

          {weeklyProgression.isRepeating ? (
            <div className="p-3 rounded-navigation bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 font-sans">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Perhatian Pengulangan:</span> Capaian pekan lalu belum memenuhi syarat minimal 75%. Ulangi konsistensi nutrisi di Level {activeLevel} pekan ini untuk membuka level berikutnya.
              </div>
            </div>
          ) : weeklyProgression.dayInCurrentWeek < 7 ? (
            <p className="text-[11px] text-text-muted font-sans">
              💡 Level progression terikat pada konsistensi harian. Level berikutnya akan otomatis terbuka di akhir hari ke-7 jika kepatuhan harianmu mencapai minimal 75%.
            </p>
          ) : weeklyProgression.canAdvance ? (
            <div className="p-3.5 rounded-navigation bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-800 font-bold font-sans">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Selamat! Syarat 75% pekan ini terpenuhi. Level berikutnya telah terbuka!</span>
              </div>
              <button
                type="button"
                onClick={handleClaimLevelUpPromotion}
                disabled={isClaimingLevelUp || levelUpClaimed}
                className="button-primary px-3 py-1.5 text-xs text-text-inverse font-bold shrink-0 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <span>
                  {levelUpClaimed
                    ? "Bonus Koin Diklaim ✓"
                    : isClaimingLevelUp
                      ? "Mengklaim..."
                      : "Klaim Promosi Naik Level (+100 🪙)"}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* 3. Daily Target Stat Cards (4 Clean Stats + Fiber/Sugar Sub-row) */}
      <section aria-label="Target Nutrisi Harian" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#FF9233] fill-[#FF9233]" />
            <h2 className="text-base font-extrabold text-text-primary font-heading">
              Target Nutrisi & Tolok Ukur Harian
            </h2>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-[11px] font-bold text-white shadow-2xs font-sans"
            style={{ backgroundColor: depkes.colorHex }}
          >
            <span>{depkes.badgeText}</span>
            <span className="opacity-90">({depkes.ratioPercent}%)</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Target Kalori */}
          <div className="p-4 rounded-card border border-[#FF9233]/40 bg-[#FCF8E3] shadow-xs space-y-1">
            <span className="text-xs font-bold text-text-muted block font-sans">
              Target Kalori Quest
            </span>
            <p className="text-xl font-extrabold text-text-primary font-heading">
              {Math.round(questPlan.calorieTarget)} kkal
            </p>
            <div className="text-[11px] text-text-muted font-sans">
              Konsumsi: <strong className="text-text-primary">{consumed.calories} kkal</strong>
              <span className="block text-[10px] mt-0.5">
                {questPlan.calorieOffset === 0
                  ? "100% TEE"
                  : questPlan.calorieOffset > 0
                  ? `+${questPlan.calorieOffset} kkal (Surplus)`
                  : `${questPlan.calorieOffset} kkal (Defisit)`}
              </span>
            </div>
          </div>

          {/* Target Protein */}
          <div className="p-4 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
            <span className="text-xs font-bold text-text-muted block font-sans">
              Target Protein
            </span>
            <p className="text-xl font-extrabold text-macro-protein font-heading">
              {questPlan.macroTargets.proteinGrams}g
            </p>
            <p className="text-[11px] text-text-muted font-sans">
              Konsumsi: <strong className="text-text-primary">{consumed.protein}g</strong>
            </p>
          </div>

          {/* Target Karbohidrat */}
          <div className="p-4 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
            <span className="text-xs font-bold text-text-muted block font-sans">
              Target Karbohidrat
            </span>
            <p className="text-xl font-extrabold text-accent-orange-dark font-heading">
              {questPlan.macroTargets.carbGrams}g
            </p>
            <p className="text-[11px] text-text-muted font-sans">
              Konsumsi: <strong className="text-text-primary">{consumed.carbs}g</strong>
            </p>
          </div>

          {/* Target Lemak */}
          <div className="p-4 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
            <span className="text-xs font-bold text-text-muted block font-sans">
              Target Lemak
            </span>
            <p className="text-xl font-extrabold text-macro-fat font-heading">
              {questPlan.macroTargets.fatGrams}g
            </p>
            <p className="text-[11px] text-text-muted font-sans">
              Konsumsi: <strong className="text-text-primary">{consumed.fat}g</strong>
            </p>
          </div>
        </div>

        {/* Depkes & Fiber Strip */}
        <div className="p-3.5 rounded-card bg-[#FAF8F5] border border-border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">
                Kepatuhan Standar Gizi Depkes:
              </span>
              <span className="text-text-muted">{depkes.guidanceText}</span>
            </div>
            <div className="text-[11px] text-text-muted">
              Serat target: <strong>{questPlan.macroTargets.fiberGrams ?? 28}g</strong> • Gula maksimal: <strong>{questPlan.macroTargets.sugarGramsMax ?? 50}g</strong>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="w-32 sm:w-44 h-2 rounded-pill bg-surface border border-border-divider overflow-hidden">
              <div
                className="h-full rounded-pill transition-all duration-300"
                style={{
                  width: `${calorieProgressPct}%`,
                  backgroundColor: depkes.colorHex,
                }}
              />
            </div>
            <span className="font-bold text-text-primary font-sans">{calorieProgressPct}%</span>
          </div>
        </div>
      </section>

      {/* 4. Automated Mission List (No Manual Checkboxes, Driven from meal_logs) */}
      <section
        aria-label="Daftar Misi Utama Harian"
        className="rounded-card bg-surface p-5 border border-border-divider space-y-4 shadow-2xs"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-divider">
          <div className="flex items-center gap-2">
            <Sword className="h-4 w-4 text-[#5B8E55]" />
            <h2 className="text-base font-extrabold text-text-primary font-heading">
              Misi Utama Harian (Otomatis Terverifikasi dari Diary)
            </h2>
          </div>
          <span className="text-xs text-text-muted font-sans font-semibold">
            {evaluatedMissions.filter((m) => m.status.isCompleted).length} / {questPlan.mainMissions.length} Selesai
          </span>
        </div>

        <div className="space-y-3">
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
              <div
                key={mission.id}
                className={cn(
                  "p-4 rounded-navigation border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5",
                  isDone
                    ? "bg-[#5B8E55]/10 border-[#5B8E55]"
                    : "bg-[#FAF8F5] border-border-divider"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 shrink-0 rounded-pill p-0.5",
                      isDone ? "text-[#5B8E55]" : "text-text-muted"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 fill-[#5B8E55] text-white" />
                    ) : (
                      <Circle className="h-5 w-5 text-text-muted" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={cn(
                          "text-sm font-bold font-heading",
                          isDone ? "text-[#5B8E55]" : "text-text-primary"
                        )}
                      >
                        {mission.title}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-pill text-[10px] font-bold font-sans",
                          isDone
                            ? "bg-[#5B8E55] text-white"
                            : "bg-surface border border-border-default text-text-muted"
                        )}
                      >
                        {isDone ? "✓ Selesai" : "Berjalan"}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted font-sans">
                      {mission.description}
                    </p>

                    {/* Automatic Progress from Intake */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap text-xs font-sans">
                      <span className="font-semibold text-text-primary">
                        Progres Asupan:{" "}
                        <strong
                          className={isDone ? "text-[#5B8E55]" : "text-[#FF9233]"}
                        >
                          {status.progressLabel}
                        </strong>
                      </span>
                      <span className="text-text-muted">• {status.statusText}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!isDone && (
                    <Link
                      href="/diary/add"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-navigation text-xs font-bold bg-[#FF9233] text-white hover:bg-[#e07d24] transition-all font-sans shadow-2xs"
                    >
                      <span>+ Catat Diary</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
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
      </section>

      {/* 5. Side Missions (Hydration & Healthy Habits) */}
      <section
        aria-label="Side Missions Harian"
        className="rounded-card bg-surface p-5 border border-border-divider space-y-4 shadow-2xs"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border-divider">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#5B8E55]" />
            <h2 className="text-base font-extrabold text-text-primary font-heading">
              Side Missions Harian (Hidrasi & Kebiasaan Sehat)
            </h2>
          </div>
          <span className="text-xs font-semibold text-text-muted font-sans">
            {questPlan.sideMissions.length === 0
              ? "Fokus Misi Utama di Level 1"
              : `${
                  questPlan.sideMissions.filter((m) =>
                    completedMissions.includes(m.id)
                  ).length
                } / ${questPlan.sideMissions.length} Selesai`}
          </span>
        </div>

        {questPlan.sideMissions.length === 0 ? (
          <div className="p-4 rounded-navigation bg-[#FAF8F5] border border-border-divider text-xs text-text-muted font-sans">
            Pada <strong>{questPlan.levelTitle}</strong> jalur {GOAL_PATH_LABELS[activePath]?.title}, fokus utamamu adalah mencapai target asupan gizi utama tanpa beban misi sampingan. Naik ke <strong>Level 2</strong> untuk membuka misi hidrasi 8 gelas (1500 ml)!
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
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-[#5B8E55] shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 fill-[#5B8E55] text-white" />
                        ) : (
                          <Circle className="h-5 w-5 text-text-muted" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          {getSideMissionIcon(side.type)}
                          <h3
                            className={cn(
                              "text-xs font-bold font-heading",
                              isDone
                                ? "line-through text-text-muted"
                                : "text-text-primary"
                            )}
                          >
                            {side.title}
                          </h3>
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
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="font-semibold text-text-muted">
                          Hidrasi Hari Ini:{" "}
                          <strong className="text-text-primary">
                            {waterLoggedMl} / {side.targetValue} ml
                          </strong>{" "}
                          ({Math.round(waterLoggedMl / 250)} gelas)
                        </span>
                        <span className="font-bold text-sky-600">
                          {waterPct}%
                        </span>
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-navigation text-xs font-bold bg-surface border border-border-default hover:bg-surface-subtle text-text-muted font-sans cursor-pointer"
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
                              setRewardToast(
                                `Misi Hidrasi Selesai! +${xp} XP & +${coins} Koin!`
                              );
                              setTimeout(() => setRewardToast(null), 3000);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-navigation text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white font-sans cursor-pointer shadow-2xs"
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
      </section>
    </div>
  );
}

