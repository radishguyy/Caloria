"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingDown, Dumbbell, ShieldCheck, Sparkles } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingDemoStore } from "@/store/use-onboarding-demo-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingDemoBanner } from "@/components/onboarding/onboarding-demo-banner";
import { OnboardingActionBar } from "@/components/onboarding/onboarding-action-bar";
import { CompactStepper } from "@/components/onboarding/compact-stepper";
import {
  calculateBmi,
  GOAL_PACE_OPTIONS,
  recommendGoalFromBmi,
} from "@/lib/nutrition-calculator";
import { GoalProgramType } from "@/types";
import { cn } from "@/lib/utils";

const BMI_CATEGORY_LABELS: Record<string, string> = {
  Underweight: "Kurus",
  Normal: "Normal",
  Overweight: "Berlebih",
  Obese: "Obesitas",
};

function roundHalf(val: number): number {
  return Math.round(val * 2) / 2;
}

function getSuggestedTargetWeight(
  goalType: GoalProgramType,
  currentWeightKg: number,
  healthyMin: number,
  healthyMax: number,
): number {
  if (goalType === "maintenance") {
    return currentWeightKg;
  }
  if (goalType === "diet") {
    const idealCap = roundHalf(healthyMax);
    const candidate =
      currentWeightKg > idealCap + 1
        ? idealCap
        : roundHalf(currentWeightKg - 5);
    const bounded = Math.min(currentWeightKg - 0.5, candidate);
    return Math.max(30, roundHalf(bounded));
  }
  const idealFloor = roundHalf(healthyMin);
  const candidate =
    currentWeightKg < idealFloor - 1
      ? idealFloor
      : roundHalf(currentWeightKg + 5);
  const bounded = Math.max(currentWeightKg + 0.5, candidate);
  return Math.min(250, roundHalf(bounded));
}

function getDefaultMarginForGoal(goalType: GoalProgramType): number {
  if (goalType === "diet") return -500;
  if (goalType === "bulking") return 400;
  return 0;
}

function isTargetValidForGoal(
  goalType: GoalProgramType,
  currentWeightKg: number,
  targetWeightKg: number,
): boolean {
  if (goalType === "diet") return targetWeightKg < currentWeightKg;
  if (goalType === "bulking") return targetWeightKg > currentWeightKg;
  return true;
}

function OnboardingGoalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "1";
  const isHydrated = useHydrated();

  const { goalPlan, setGoalPlan } = useFoodStore();
  const { activeOnboardingStep, setOnboardingStep, onboardingCompleted } =
    useAuthStore();
  const demoStore = useOnboardingDemoStore();

  useEffect(() => {
    if (!isDemo && onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [isDemo, onboardingCompleted, router]);

  const [subStep, setSubStep] = useState<1 | 2>(1);

  const activeSource = isDemo ? demoStore : goalPlan;
  const heightCm = isHydrated ? activeSource.heightCm || 172 : 172;
  const currentWeightKg = isHydrated ? activeSource.currentWeightKg || 75 : 75;

  const bmiAnalysis = useMemo(
    () => calculateBmi(heightCm, currentWeightKg),
    [heightCm, currentWeightKg],
  );

  const recommendation = useMemo(
    () => recommendGoalFromBmi(bmiAnalysis.category),
    [bmiAnalysis.category],
  );

  const shouldPreserveGoal =
    isHydrated &&
    (isDemo ? demoStore.hasSelectedGoal : activeOnboardingStep >= 3);

  const [manualGoal, setManualGoal] = useState<GoalProgramType | null>(null);
  const [manualMarginKcal, setManualMarginKcal] = useState<number | null>(null);
  const [manualTargetWeightKg, setManualTargetWeightKg] = useState<
    number | null
  >(null);
  const [targetError, setTargetError] = useState("");

  const selectedGoal: GoalProgramType =
    manualGoal ??
    (shouldPreserveGoal
      ? activeSource.goalType || recommendation.recommendedGoal
      : recommendation.recommendedGoal);

  const selectedMarginKcal: number = (() => {
    if (selectedGoal === "maintenance") return 0;
    if (manualMarginKcal !== null) return manualMarginKcal;
    const existingMargin = activeSource.dailyMarginKcal;
    if (
      selectedGoal === "diet" &&
      (existingMargin === -250 || existingMargin === -500)
    ) {
      return existingMargin;
    }
    if (
      selectedGoal === "bulking" &&
      (existingMargin === 250 || existingMargin === 400)
    ) {
      return existingMargin;
    }
    return getDefaultMarginForGoal(selectedGoal);
  })();

  const targetWeightKg: number = (() => {
    if (selectedGoal === "maintenance") return currentWeightKg;
    if (manualTargetWeightKg !== null) return manualTargetWeightKg;
    const existingTarget = activeSource.targetWeightKg;
    if (
      shouldPreserveGoal &&
      existingTarget &&
      isTargetValidForGoal(selectedGoal, currentWeightKg, existingTarget)
    ) {
      return existingTarget;
    }
    return getSuggestedTargetWeight(
      selectedGoal,
      currentWeightKg,
      bmiAnalysis.healthyWeightRange.min,
      bmiAnalysis.healthyWeightRange.max,
    );
  })();

  const handleSelectGoal = (goalId: GoalProgramType) => {
    setManualGoal(goalId);
    setManualMarginKcal(getDefaultMarginForGoal(goalId));
    setTargetError("");

    if (goalId === "maintenance") {
      setManualTargetWeightKg(currentWeightKg);
    } else if (!isTargetValidForGoal(goalId, currentWeightKg, targetWeightKg)) {
      setManualTargetWeightKg(
        getSuggestedTargetWeight(
          goalId,
          currentWeightKg,
          bmiAnalysis.healthyWeightRange.min,
          bmiAnalysis.healthyWeightRange.max,
        ),
      );
    }
  };

  const goals = [
    {
      id: "diet" as GoalProgramType,
      title: "Turun Berat Badan",
      subtitle: "Defisit kalori bertahap untuk mengurangi lemak tubuh",
      icon: TrendingDown,
    },
    {
      id: "bulking" as GoalProgramType,
      title: "Naik Massa Otot",
      subtitle: "Surplus kalori terukur untuk membangun otot & bobot sehat",
      icon: Dumbbell,
    },
    {
      id: "maintenance" as GoalProgramType,
      title: "Jaga Berat Badan",
      subtitle: "Kalori seimbang untuk mempertahankan berat ideal",
      icon: ShieldCheck,
    },
  ];

  const commitGoalAndProceed = (
    goalToSave: GoalProgramType,
    effectiveTarget: number,
    dailyMargin: number,
  ) => {
    if (isDemo) {
      demoStore.setDemoData({
        goalType: goalToSave,
        dailyMarginKcal: dailyMargin,
        targetWeightKg: effectiveTarget,
        hasSelectedGoal: true,
      });
      router.push("/onboarding/projection?demo=1");
      return;
    }

    const goalPath =
      goalToSave === "bulking"
        ? "gain_muscle"
        : goalToSave === "maintenance"
          ? "maintain_weight"
          : "lose_weight";

    setGoalPlan({
      goalType: goalToSave,
      goalPath,
      currentLevel: 1,
      currentWeek: 1,
      startDate: new Date().toISOString().split("T")[0],
      streakConsecutiveLogs: 0,
      dailyMarginKcal: dailyMargin,
      targetWeightKg: effectiveTarget,
    });
    setOnboardingStep(3);
    router.push("/onboarding/projection");
  };

  const handleGoalStepNext = () => {
    // Auto-skip target & pace sub-step for maintenance
    if (selectedGoal === "maintenance") {
      commitGoalAndProceed("maintenance", currentWeightKg, 0);
      return;
    }
    setTargetError("");
    setSubStep(2);
  };

  const handleTargetStepNext = () => {
    if (selectedGoal === "diet" && targetWeightKg >= currentWeightKg) {
      setTargetError(
        `Untuk turun berat badan, berat target harus lebih rendah dari berat saat ini (${currentWeightKg} kg).`,
      );
      return;
    }

    if (selectedGoal === "bulking" && targetWeightKg <= currentWeightKg) {
      setTargetError(
        `Untuk naik massa otot, berat target harus lebih tinggi dari berat saat ini (${currentWeightKg} kg).`,
      );
      return;
    }

    setTargetError("");
    commitGoalAndProceed(selectedGoal, targetWeightKg, selectedMarginKcal);
  };

  const bmiLabel =
    BMI_CATEGORY_LABELS[bmiAnalysis.category] || bmiAnalysis.category;
  const paceOptions =
    selectedGoal === "diet" || selectedGoal === "bulking"
      ? GOAL_PACE_OPTIONS[selectedGoal]
      : null;
  const selectedGoalMeta =
    goals.find((g) => g.id === selectedGoal) || goals[0];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-4 sm:py-8 pb-24 space-y-4">
      {isDemo && <OnboardingDemoBanner />}
      <OnboardingStepper currentStep={2} />

      <div className="text-center space-y-1">
        {selectedGoal !== "maintenance" && (
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Bagian {subStep} dari 2
          </span>
        )}
        <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
          {subStep === 1 ? "Pilih Tujuan" : "Atur Target & Kecepatan"}
        </h1>
      </div>

      {subStep === 1 ? (
        <>
          {/* Rekomendasi Berbasis BMI */}
          <div className="rounded-2xl border border-border-divider bg-surface p-3.5 sm:p-4 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-green/12 px-2.5 py-0.5 text-[11px] font-bold text-accent-green">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>Rekomendasi BMI</span>
              </span>
              <span className="text-[11px] font-bold text-text-muted tabular-nums">
                BMI {bmiAnalysis.score} ({bmiLabel}) · Ideal{" "}
                {bmiAnalysis.healthyWeightRange.min}–
                {bmiAnalysis.healthyWeightRange.max} kg
              </span>
            </div>

            <p className="text-xs text-text-primary leading-relaxed">
              Saran:{" "}
              <strong className="font-extrabold">{recommendation.label}</strong>{" "}
              — {recommendation.reason}
            </p>
          </div>

          {/* Pilihan Tujuan */}
          <div className="space-y-2.5">
            {goals.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.id;
              const isRecommended = recommendation.recommendedGoal === goal.id;

              return (
                <button
                  key={goal.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectGoal(goal.id)}
                  className={cn(
                    "w-full text-left p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-colors flex items-center gap-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary",
                    isSelected
                      ? "border-accent-green bg-accent-green/8 ring-2 ring-accent-green/25"
                      : "border-border-divider bg-surface hover:bg-surface-subtle",
                  )}
                >
                  <div
                    className={cn(
                      "h-11 w-11 rounded-xl shrink-0 flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-accent-green text-text-inverse"
                        : "bg-surface-subtle border border-border-default text-text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-sm sm:text-base font-extrabold text-text-primary">
                        {goal.title}
                      </h2>
                      {isRecommended && (
                        <span className="rounded-full bg-accent-green/12 px-2 py-0.5 text-[10px] font-bold text-accent-green">
                          Direkomendasikan
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-text-muted mt-0.5">
                      {goal.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <OnboardingActionBar
            backHref={
              isDemo
                ? "/onboarding/profile-calculator?demo=1"
                : "/onboarding/profile-calculator"
            }
            onNext={handleGoalStepNext}
          />
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-border-divider bg-surface p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-divider">
              <span className="text-xs font-semibold text-text-muted">
                Program dipilih
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-text-primary">
                {selectedGoalMeta.title}
              </span>
            </div>

            <div className="space-y-1.5">
              <CompactStepper
                label="Berat Target"
                unit="kg"
                value={targetWeightKg}
                min={30}
                max={250}
                step={0.5}
                subLabel={`Saat ini ${currentWeightKg} kg · Ideal ${bmiAnalysis.healthyWeightRange.min}–${bmiAnalysis.healthyWeightRange.max} kg`}
                onChange={(val) => {
                  setManualTargetWeightKg(val);
                  setTargetError("");
                }}
              />
              {targetError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-destructive px-1"
                >
                  {targetError}
                </p>
              )}
            </div>

            {paceOptions && (
              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-bold text-text-primary">
                  Kecepatan Program
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {paceOptions.map((pace) => {
                    const isPaceSelected =
                      selectedMarginKcal === pace.marginKcal;
                    return (
                      <button
                        key={pace.id}
                        type="button"
                        aria-pressed={isPaceSelected}
                        onClick={() => setManualMarginKcal(pace.marginKcal)}
                        className={cn(
                          "text-left p-3.5 rounded-xl border transition-colors cursor-pointer space-y-0.5",
                          isPaceSelected
                            ? "border-accent-green bg-accent-green/10 text-text-primary ring-2 ring-accent-green/20"
                            : "bg-surface border-border-default text-neutral-10 hover:bg-surface-subtle",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-text-primary">
                            {pace.label}
                          </span>
                          <span className="text-xs font-bold text-text-primary tabular-nums">
                            {pace.marginKcal > 0
                              ? `+${pace.marginKcal}`
                              : pace.marginKcal}{" "}
                            kkal/hari
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-text-muted">
                          {pace.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <OnboardingActionBar
            onBack={() => setSubStep(1)}
            onNext={handleTargetStepNext}
          />
        </>
      )}
    </div>
  );
}

export default function OnboardingGoalPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin mx-auto" />
        </div>
      }
    >
      <OnboardingGoalContent />
    </Suspense>
  );
}
