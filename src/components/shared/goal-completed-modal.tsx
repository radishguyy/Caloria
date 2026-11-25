"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  ShieldCheck,
  Target,
  TrendingDown,
  Dumbbell,
  X,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useFoodStore } from "@/store/use-food-store";
import { CompactStepper } from "@/components/onboarding/compact-stepper";
import {
  calculateBmi,
  evaluateGoalCompletion,
  generateNutritionPlan,
  GOAL_PACE_OPTIONS,
} from "@/lib/nutrition-calculator";
import { updateGoalProgramAction } from "@/app/actions/profile";
import { cn } from "@/lib/utils";

interface GoalCompletedBannerProps {
  onOpenModal: () => void;
  className?: string;
}

export function GoalCompletedBanner({
  onOpenModal,
  className,
}: GoalCompletedBannerProps) {
  const { goalPlan } = useFoodStore();

  const status = useMemo(
    () =>
      evaluateGoalCompletion({
        goalType: goalPlan.goalType,
        currentWeightKg: goalPlan.currentWeightKg,
        targetWeightKg: goalPlan.targetWeightKg,
        currentDayNumber: goalPlan.currentDayNumber,
        totalProjectedDays: goalPlan.totalProjectedDays,
      }),
    [goalPlan],
  );

  if (!status.isReached) return null;

  return (
    <section
      className={cn(
        "rounded-2xl border border-accent-green/35 bg-accent-green/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-green text-text-inverse">
          <Trophy className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-sm sm:text-base font-extrabold text-text-primary">
            Target Tercapai!
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {status.summaryText} Pilih fase Jaga Berat Badan atau susun target
            baru supaya target kalorimu tetap akurat.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenModal}
        className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent-green px-4 py-2 text-xs font-bold text-text-inverse hover:bg-accent-green/90 transition-colors cursor-pointer"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Atur Langkah Selanjutnya</span>
      </button>
    </section>
  );
}

interface GoalCompletedModalProps {
  open: boolean;
  onClose: () => void;
}

function roundHalf(val: number): number {
  return Math.round(val * 2) / 2;
}

export function GoalCompletedModal({ open, onClose }: GoalCompletedModalProps) {
  const { goalPlan, setGoalPlan, setTargets, setQuestProgression } =
    useFoodStore();

  const [mode, setMode] = useState<"choose" | "new_target">("choose");
  const [newGoalType, setNewGoalType] = useState<"diet" | "bulking">("diet");
  const [newTargetWeightKg, setNewTargetWeightKg] = useState<number>(
    Math.max(30, roundHalf((goalPlan.currentWeightKg || 70) - 3)),
  );
  const [newMarginKcal, setNewMarginKcal] = useState<number>(-500);
  const [savingOption, setSavingOption] = useState<
    "maintenance" | "new_target" | null
  >(null);
  const [errorMsg, setErrorMsg] = useState("");

  const currentWeight = goalPlan.currentWeightKg || 70;
  const heightCm = goalPlan.heightCm || 172;
  const gender = goalPlan.gender || "male";
  const age = goalPlan.age || 24;
  const activityLevel = goalPlan.activityLevel || "moderate";

  const bmiAnalysis = useMemo(
    () => calculateBmi(heightCm, currentWeight),
    [heightCm, currentWeight],
  );

  const maintenancePreview = useMemo(
    () =>
      generateNutritionPlan({
        gender,
        age,
        heightCm,
        currentWeightKg: currentWeight,
        targetWeightKg: currentWeight,
        activityLevel,
        goalType: "maintenance",
        customMarginKcal: 0,
      }),
    [gender, age, heightCm, currentWeight, activityLevel],
  );

  const newTargetPreview = useMemo(
    () =>
      generateNutritionPlan({
        gender,
        age,
        heightCm,
        currentWeightKg: currentWeight,
        targetWeightKg: newTargetWeightKg,
        activityLevel,
        goalType: newGoalType,
        customMarginKcal: newMarginKcal,
      }),
    [
      gender,
      age,
      heightCm,
      currentWeight,
      newTargetWeightKg,
      activityLevel,
      newGoalType,
      newMarginKcal,
    ],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !savingOption) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, savingOption, onClose]);

  if (!open) return null;

  const openNewTargetForm = () => {
    const defaultGoal: "diet" | "bulking" =
      bmiAnalysis.category === "Underweight" ? "bulking" : "diet";
    const defaultTarget =
      defaultGoal === "diet"
        ? Math.max(30, roundHalf(currentWeight - 3))
        : Math.min(250, roundHalf(currentWeight + 3));
    setNewGoalType(defaultGoal);
    setNewTargetWeightKg(defaultTarget);
    setNewMarginKcal(defaultGoal === "diet" ? -500 : 400);
    setErrorMsg("");
    setMode("new_target");
  };

  const handleSelectNewGoalType = (goal: "diet" | "bulking") => {
    setNewGoalType(goal);
    setNewMarginKcal(goal === "diet" ? -500 : 400);
    setErrorMsg("");
    if (goal === "diet" && newTargetWeightKg >= currentWeight) {
      setNewTargetWeightKg(Math.max(30, roundHalf(currentWeight - 3)));
    } else if (goal === "bulking" && newTargetWeightKg <= currentWeight) {
      setNewTargetWeightKg(Math.min(250, roundHalf(currentWeight + 3)));
    }
  };

  const applyPlanToStore = (
    goalType: "diet" | "bulking" | "maintenance",
    goalPath: "lose_weight" | "gain_muscle" | "maintain_weight",
    targetWeight: number,
    plan: ReturnType<typeof generateNutritionPlan>,
  ) => {
    setGoalPlan({
      goalType,
      goalPath,
      currentLevel: 1,
      currentWeek: 1,
      currentWeightKg: currentWeight,
      targetWeightKg: targetWeight,
      bmiScore: plan.bmi.score,
      bmiCategory: plan.bmi.category,
      dailyMarginKcal: plan.dailyMarginKcal,
      totalProjectedDays: plan.projectedDays,
      currentDayNumber: 1,
      startDate: new Date().toISOString().split("T")[0],
    });
    setQuestProgression({
      goalPath,
      currentLevel: 1,
      currentWeek: 1,
    });
    setTargets({
      calories: plan.dailyCalories,
      protein: plan.proteinG,
      carbs: plan.carbsG,
      fat: plan.fatG,
      fiber: plan.fiberG,
      sugar: plan.sugarG,
      waterMl: plan.waterMl,
    });
  };

  const handleChooseMaintenance = async () => {
    setSavingOption("maintenance");
    setErrorMsg("");
    try {
      const res = await updateGoalProgramAction({
        goalType: "maintenance",
        currentWeightKg: currentWeight,
        targetWeightKg: currentWeight,
        customMarginKcal: 0,
        gender,
        age,
        heightCm,
        activityLevel,
      });

      if (!res.success && !res.unauthenticated) {
        setErrorMsg(res.error || "Gagal menyimpan fase Jaga Berat Badan.");
        setSavingOption(null);
        return;
      }

      applyPlanToStore(
        "maintenance",
        "maintain_weight",
        currentWeight,
        res.plan || maintenancePreview,
      );
      toast.success(
        `Masuk fase Jaga Berat Badan! Target kalorimu sekarang ${
          (res.plan || maintenancePreview).dailyCalories
        } kkal/hari.`,
      );
      setSavingOption(null);
      setMode("choose");
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan program.",
      );
      setSavingOption(null);
    }
  };

  const handleSaveNewTarget = async () => {
    if (newGoalType === "diet" && newTargetWeightKg >= currentWeight) {
      setErrorMsg(
        `Berat target harus lebih rendah dari berat saat ini (${currentWeight} kg).`,
      );
      return;
    }
    if (newGoalType === "bulking" && newTargetWeightKg <= currentWeight) {
      setErrorMsg(
        `Berat target harus lebih tinggi dari berat saat ini (${currentWeight} kg).`,
      );
      return;
    }

    setSavingOption("new_target");
    setErrorMsg("");
    try {
      const res = await updateGoalProgramAction({
        goalType: newGoalType,
        currentWeightKg: currentWeight,
        targetWeightKg: newTargetWeightKg,
        customMarginKcal: newMarginKcal,
        gender,
        age,
        heightCm,
        activityLevel,
      });

      if (!res.success && !res.unauthenticated) {
        setErrorMsg(res.error || "Gagal menyimpan target baru.");
        setSavingOption(null);
        return;
      }

      const nextPlan = res.plan || newTargetPreview;
      const nextGoalPath =
        res.goalPath ||
        (newGoalType === "bulking" ? "gain_muscle" : "lose_weight");

      applyPlanToStore(
        newGoalType,
        nextGoalPath,
        newTargetWeightKg,
        nextPlan,
      );
      toast.success(
        `Target baru disimpan! Estimasi ${nextPlan.projectedDays} hari (${nextPlan.dailyCalories} kkal/hari).`,
      );
      setSavingOption(null);
      setMode("choose");
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan target baru.",
      );
      setSavingOption(null);
    }
  };

  const paceOptions = GOAL_PACE_OPTIONS[newGoalType];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-completed-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border-divider bg-surface p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {mode === "new_target" ? (
              <button
                type="button"
                disabled={savingOption !== null}
                onClick={() => {
                  setErrorMsg("");
                  setMode("choose");
                }}
                aria-label="Kembali ke pilihan"
                className="w-8 h-8 rounded-xl border border-border-default bg-surface hover:bg-surface-subtle flex items-center justify-center text-text-primary cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-accent-green/15 text-accent-green flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" aria-hidden="true" />
              </div>
            )}
            <div>
              <h3
                id="goal-completed-modal-title"
                className="font-heading text-lg font-extrabold text-text-primary"
              >
                {mode === "choose" ? "Target Tercapai!" : "Buat Target Baru"}
              </h3>
              <p className="text-xs text-text-muted">
                {mode === "choose"
                  ? `Berat saat ini ${currentWeight} kg · BMI ${bmiAnalysis.score}`
                  : "Sesuaikan tujuan, berat target, dan kecepatan baru."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={savingOption !== null}
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-8 h-8 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {mode === "choose" ? (
          <div className="space-y-3">
            <p className="text-xs text-text-muted leading-relaxed">
              Kebutuhan kalori tubuhmu ikut berubah sesuai berat badan terbaru.
              Pilih langkah selanjutnya:
            </p>

            {/* Opsi 1: Maintenance */}
            <div className="rounded-xl border border-accent-green/40 bg-accent-green/8 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-green text-text-inverse flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-text-primary">
                      Masuk Fase Jaga Berat Badan
                    </h4>
                    <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-[10px] font-bold text-accent-green">
                      Direkomendasikan
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Kalori dikalibrasi ulang ke{" "}
                    <strong className="text-text-primary">
                      {maintenancePreview.dailyCalories} kkal/hari
                    </strong>{" "}
                    (seimbang) untuk siklus 30 hari agar berat tetap stabil.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={savingOption !== null}
                onClick={handleChooseMaintenance}
                className="w-full min-h-[42px] rounded-xl bg-accent-green text-text-inverse text-xs sm:text-sm font-bold hover:bg-accent-green/90 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {savingOption === "maintenance" ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Mulai Jaga Berat Badan</span>
                )}
              </button>
            </div>

            {/* Opsi 2: Target Baru */}
            <div className="rounded-xl border border-border-divider bg-surface-subtle p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface border border-border-default text-text-primary flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-extrabold text-text-primary">
                    Buat Target Baru
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    Lanjut turun berat badan atau beralih ke program naik massa
                    otot dengan target dan proyeksi baru.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={savingOption !== null}
                onClick={openNewTargetForm}
                className="w-full min-h-[42px] rounded-xl border border-border-default bg-surface text-text-primary text-xs sm:text-sm font-bold hover:bg-accent-green-light/30 transition-colors cursor-pointer"
              >
                Atur Target Baru
              </button>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 border border-destructive/25 px-3 py-2 text-xs font-semibold text-destructive"
              >
                {errorMsg}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pilih Tujuan Baru */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                aria-pressed={newGoalType === "diet"}
                onClick={() => handleSelectNewGoalType("diet")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-colors cursor-pointer space-y-1",
                  newGoalType === "diet"
                    ? "border-accent-green bg-accent-green/10 ring-2 ring-accent-green/20"
                    : "border-border-default bg-surface hover:bg-surface-subtle",
                )}
              >
                <TrendingDown
                  className="w-4 h-4 text-accent-green"
                  aria-hidden="true"
                />
                <span className="block text-xs font-extrabold text-text-primary">
                  Turun Berat
                </span>
              </button>

              <button
                type="button"
                aria-pressed={newGoalType === "bulking"}
                onClick={() => handleSelectNewGoalType("bulking")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-colors cursor-pointer space-y-1",
                  newGoalType === "bulking"
                    ? "border-accent-green bg-accent-green/10 ring-2 ring-accent-green/20"
                    : "border-border-default bg-surface hover:bg-surface-subtle",
                )}
              >
                <Dumbbell
                  className="w-4 h-4 text-accent-green"
                  aria-hidden="true"
                />
                <span className="block text-xs font-extrabold text-text-primary">
                  Naik Otot
                </span>
              </button>
            </div>

            {/* Berat Target Baru */}
            <CompactStepper
              label="Berat Target Baru"
              unit="kg"
              value={newTargetWeightKg}
              min={30}
              max={250}
              step={0.5}
              subLabel={`Saat ini ${currentWeight} kg · Ideal ${bmiAnalysis.healthyWeightRange.min}–${bmiAnalysis.healthyWeightRange.max} kg`}
              onChange={(val) => {
                setNewTargetWeightKg(val);
                setErrorMsg("");
              }}
            />

            {/* Kecepatan Program */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-text-primary">
                Kecepatan Program
              </span>
              <div className="grid grid-cols-2 gap-2">
                {paceOptions.map((pace) => {
                  const isSelected = newMarginKcal === pace.marginKcal;
                  return (
                    <button
                      key={pace.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setNewMarginKcal(pace.marginKcal)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-colors cursor-pointer",
                        isSelected
                          ? "border-accent-green bg-accent-green/10 ring-2 ring-accent-green/20"
                          : "border-border-default bg-surface hover:bg-surface-subtle",
                      )}
                    >
                      <span className="block text-xs font-extrabold text-text-primary">
                        {pace.label}
                      </span>
                      <span className="block text-[11px] font-semibold text-text-muted tabular-nums">
                        {pace.marginKcal > 0
                          ? `+${pace.marginKcal}`
                          : pace.marginKcal}{" "}
                        kkal/hari
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ringkasan Preview */}
            <div className="rounded-xl bg-surface-subtle border border-border-divider p-3 flex items-center justify-between text-xs">
              <span className="text-text-muted">Target kalori &amp; estimasi</span>
              <span className="font-extrabold text-text-primary tabular-nums">
                {newTargetPreview.dailyCalories} kkal ·{" "}
                {newTargetPreview.projectedDays} hari
              </span>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 border border-destructive/25 px-3 py-2 text-xs font-semibold text-destructive"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="button"
              disabled={savingOption !== null}
              onClick={handleSaveNewTarget}
              className="w-full min-h-[44px] rounded-xl bg-accent-green text-text-inverse text-xs sm:text-sm font-bold hover:bg-accent-green/90 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {savingOption === "new_target" ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Target Baru</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
