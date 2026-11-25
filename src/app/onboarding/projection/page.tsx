"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Flame,
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingDemoStore } from "@/store/use-onboarding-demo-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingDemoBanner } from "@/components/onboarding/onboarding-demo-banner";
import { OnboardingActionBar } from "@/components/onboarding/onboarding-action-bar";
import { generateNutritionPlan } from "@/lib/nutrition-calculator";

function AnimatedCounterInternal({ targetValue }: { targetValue: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200;

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

function OnboardingProjectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "1";

  const { goalPlan, setGoalPlan } = useFoodStore();
  const { setOnboardingStep, onboardingCompleted } = useAuthStore();
  const demoStore = useOnboardingDemoStore();

  useEffect(() => {
    if (!isDemo && onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [isDemo, onboardingCompleted, router]);

  const activeSource = isDemo ? demoStore : goalPlan;

  const plan = useMemo(() => {
    return generateNutritionPlan({
      gender: activeSource.gender || "male",
      age: activeSource.age || 24,
      heightCm: activeSource.heightCm || 172,
      currentWeightKg: activeSource.currentWeightKg || 75,
      targetWeightKg: activeSource.targetWeightKg || 68,
      activityLevel: activeSource.activityLevel || "moderate",
      goalType: activeSource.goalType || "diet",
      customMarginKcal: activeSource.dailyMarginKcal,
    });
  }, [activeSource]);

  const handleNext = () => {
    if (isDemo) {
      demoStore.setDemoData({
        totalProjectedDays: plan.projectedDays,
        dailyMarginKcal: plan.dailyMarginKcal,
        bmiScore: plan.bmi.score,
        bmiCategory: plan.bmi.category,
      });
      router.push("/onboarding/nutrition-plan?demo=1");
      return;
    }

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

  const isHydrated = useHydrated();
  const estimatedDateString = useMemo(() => {
    if (!isHydrated) return "...";
    const d = new Date();
    d.setDate(d.getDate() + plan.projectedDays);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [isHydrated, plan.projectedDays]);

  const GoalIcon =
    activeSource.goalType === "bulking"
      ? TrendingUp
      : activeSource.goalType === "maintenance"
        ? Minus
        : TrendingDown;

  const goalLabel =
    activeSource.goalType === "diet"
      ? "Turun Berat"
      : activeSource.goalType === "bulking"
        ? "Naik Otot"
        : "Jaga Berat";

  const estimatedWeeks = Math.max(1, Math.round(plan.projectedDays / 7));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-4 sm:py-8 pb-24 space-y-4">
      {isDemo && <OnboardingDemoBanner />}
      <OnboardingStepper currentStep={3} />

      <div className="text-center">
        <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
          Proyeksi Target
        </h1>
      </div>

      <div className="rounded-2xl border border-border-divider bg-surface p-4 sm:p-5 space-y-3.5">
        <div className="rounded-2xl border border-border-divider bg-surface p-4 sm:p-5 text-center space-y-1">
          <div className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight flex items-baseline justify-center gap-2">
            <span className="tabular-nums">
              <AnimatedCounterInternal targetValue={plan.projectedDays} />
            </span>
            <span className="text-lg sm:text-xl font-bold text-text-muted">
              Hari
            </span>
          </div>

          <p className="text-xs sm:text-sm text-text-muted">
            Perkiraan tercapai{" "}
            <strong className="text-text-primary font-bold">
              {estimatedDateString}
            </strong>
          </p>
          <p className="text-[11px] text-text-muted pt-0.5">
            Setelah target tercapai, kamu bisa lanjut ke fase Jaga Berat Badan
            atau atur target baru.
          </p>
        </div>

        {plan.isCalorieFloorApplied && (
          <div className="flex items-start gap-2 rounded-xl bg-accent-orange/10 border border-accent-orange/25 p-3 text-xs text-text-primary">
            <Info
              className="h-4 w-4 text-accent-orange-dark shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p>
              Kalori dijaga di batas aman minimal (
              <strong>{plan.dailyCalories} kkal</strong>), sehingga proyeksi
              memakai defisit aktual{" "}
              <strong>{plan.dailyMarginKcal} kkal/hari</strong>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="w-8 h-8 rounded-lg bg-accent-green/12 text-accent-green flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-text-muted block">
                Berat
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-text-primary truncate block">
                {activeSource.currentWeightKg || 75} &rarr;{" "}
                {activeSource.targetWeightKg || 68} kg
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="w-8 h-8 rounded-lg bg-accent-orange/12 text-accent-orange-dark flex items-center justify-center shrink-0">
              <GoalIcon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-text-muted block">
                Program
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-text-primary truncate block">
                {goalLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="w-8 h-8 rounded-lg bg-accent-orange/12 text-accent-orange-dark flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-text-muted block">
                Margin
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-text-primary tabular-nums truncate block">
                {plan.dailyMarginKcal > 0
                  ? `+${plan.dailyMarginKcal}`
                  : plan.dailyMarginKcal}{" "}
                kkal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="w-8 h-8 rounded-lg bg-macro-protein/12 text-macro-protein flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-text-muted block">
                Estimasi
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-text-primary truncate block">
                {estimatedWeeks} minggu
              </span>
            </div>
          </div>
        </div>
      </div>

      <OnboardingActionBar
        backHref={isDemo ? "/onboarding/goal?demo=1" : "/onboarding/goal"}
        onNext={handleNext}
      />
    </div>
  );
}

export default function OnboardingProjectionPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin mx-auto" />
        </div>
      }
    >
      <OnboardingProjectionContent />
    </Suspense>
  );
}
