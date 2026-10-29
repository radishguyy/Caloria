"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Calendar,
  Flame,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Minus,
  Lock,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { generateNutritionPlan } from "@/lib/nutrition-calculator";

function AnimatedCounter({ targetValue }: { targetValue: number }) {
  const [count, setCount] = useMemo(() => {
    // initial state placeholder handled via react state below
    return [0, () => {}];
  }, []);

  return <AnimatedCounterInternal targetValue={targetValue} />;
}

import { useState, useEffect } from "react";

function AnimatedCounterInternal({ targetValue }: { targetValue: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // 1.2s smooth animation

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * targetValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetValue]);

  return <span>{count}</span>;
}

export default function OnboardingProjectionPage() {
  const router = useRouter();
  const { goalPlan, setGoalPlan } = useFoodStore();
  const { setOnboardingStep, onboardingCompleted } = useAuthStore();

  useEffect(() => {
    if (onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [onboardingCompleted, router]);

  const plan = useMemo(() => {
    return generateNutritionPlan({
      gender: goalPlan.gender || "male",
      age: goalPlan.age || 24,
      heightCm: goalPlan.heightCm || 172,
      currentWeightKg: goalPlan.currentWeightKg || 75,
      targetWeightKg: goalPlan.targetWeightKg || 68,
      activityLevel: goalPlan.activityLevel || "moderate",
      goalType: goalPlan.goalType || "diet",
    });
  }, [goalPlan]);

  const handleNext = () => {
    setGoalPlan({
      totalProjectedDays: plan.projectedDays,
      currentDayNumber: 1,
      dailyMarginKcal: plan.dailyMarginKcal,
      bmiScore: plan.bmi.score,
      bmiCategory: plan.bmi.category,
      startDate: new Date().toISOString().split("T")[0],
    });

    setOnboardingStep(4);
    router.push("/onboarding/nutrition-plan");
  };

  const weightDiff = Math.abs(
    (goalPlan.currentWeightKg || 75) - (goalPlan.targetWeightKg || 68)
  );

  const isHydrated = useHydrated();
  const [estimatedDateString, setEstimatedDateString] = useState("...");

  useEffect(() => {
    if (!isHydrated) return;
    const d = new Date();
    d.setDate(d.getDate() + plan.projectedDays);
    setEstimatedDateString(
      d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  }, [isHydrated, plan.projectedDays]);

  const GoalIcon =
    goalPlan.goalType === "bulking"
      ? TrendingUp
      : goalPlan.goalType === "maintenance"
      ? Minus
      : TrendingDown;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-5">
      <OnboardingStepper currentStep={3} />

      <div className="text-center space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary font-heading">
          Langkah 3: Proyeksi Target Tercapai
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Estimasi durasi program misi kesehatanmu berdasarkan ritme metabolisme dan margin energi harian yang aman.
        </p>
      </div>

      {/* Main Clean & Compact Projection Card */}
      <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4 shadow-xs">
        {/* Animated Days Counter Banner */}
        <div className="hero-card border border-accent-green/30 p-5 sm:p-6 text-center space-y-3 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/80 border border-accent-green/30 text-xs font-bold text-accent-green-dark">
            <Sparkles className="w-3.5 h-3.5 text-accent-green animate-pulse" />
            <span>Estimasi Waktu Perjalanan Misi</span>
          </div>

          <div className="space-y-1">
            <div className="text-4xl sm:text-5xl font-black text-text-primary font-heading tracking-tight flex items-baseline justify-center gap-2">
              <span className="text-accent-green-dark dark:text-accent-green tabular-nums">
                <AnimatedCounterInternal targetValue={plan.projectedDays} />
              </span>
              <span className="text-xl sm:text-2xl font-bold text-text-muted">
                Hari
              </span>
            </div>
            <p className="text-xs text-text-muted flex items-center justify-center gap-1.5 pt-0.5">
              <Calendar className="w-3.5 h-3.5 text-accent-orange" />
              <span>
                Target diperkirakan tercapai sekitar:{" "}
                <strong className="text-text-primary">
                  {estimatedDateString}
                </strong>
              </span>
            </p>
          </div>
        </div>

        {/* 2x2 Clean Compact Grid of Projection Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Target Berat & Selisih */}
          <div className="flex items-center justify-between p-3 rounded-navigation bg-surface-subtle border border-border-default">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent-green/15 text-accent-green flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">
                  Perubahan Berat
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-text-primary">
                  {goalPlan.currentWeightKg || 75} kg &rarr;{" "}
                  {goalPlan.targetWeightKg || 68} kg
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-pill bg-surface border border-border-default text-[11px] font-bold text-accent-green-dark shrink-0">
              {weightDiff} kg
            </span>
          </div>

          {/* Program Goal Type */}
          <div className="flex items-center justify-between p-3 rounded-navigation bg-surface-subtle border border-border-default">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent-orange/15 text-accent-orange-dark flex items-center justify-center shrink-0">
                <GoalIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">
                  Fokus Program
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-text-primary capitalize">
                  {goalPlan.goalType === "diet"
                    ? "Weight Loss (Defisit)"
                    : goalPlan.goalType === "bulking"
                    ? "Muscle Gain (Surplus)"
                    : "Maintenance Seimbang"}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Calorie Margin */}
          <div className="flex items-center justify-between p-3 rounded-navigation bg-surface-subtle border border-border-default">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent-yellow text-text-primary flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-accent-orange-dark" />
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">
                  Margin Kalori Harian
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-text-primary">
                  {plan.dailyMarginKcal > 0
                    ? `+${plan.dailyMarginKcal}`
                    : plan.dailyMarginKcal}{" "}
                  kkal / hari
                </span>
              </div>
            </div>
          </div>

          {/* Biological Standard Indicator */}
          <div className="flex items-center justify-between p-3 rounded-navigation bg-surface-subtle border border-border-default">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-macro-protein/15 text-macro-protein flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">
                  Standar Keamanan
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-text-primary">
                  1 kg lemak &asymp; 7.700 kkal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons: Profile step is locked, user cannot go back */}
      <div className="flex items-center justify-between pt-1">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-button bg-surface-subtle border border-border-default text-xs font-semibold text-text-muted select-none">
          <Lock className="w-3.5 h-3.5 text-accent-orange" />
          <span>Profil Fisik Terkunci</span>
        </div>

        <button
          onClick={handleNext}
          className="button-primary inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm"
        >
          <span>Lanjut: Target Gizi Harian</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
