"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Flame,
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  Lock,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingDemoStore } from "@/store/use-onboarding-demo-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingDemoBanner } from "@/components/onboarding/onboarding-demo-banner";
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
      ? "Turun Berat Badan"
      : activeSource.goalType === "bulking"
        ? "Naik Massa Otot"
        : "Jaga Berat Badan";

  const estimatedWeeks = Math.max(1, Math.round(plan.projectedDays / 7));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-6">
      {isDemo && <OnboardingDemoBanner />}
      <OnboardingStepper currentStep={3} />

      <div className="text-center">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Proyeksi Target
        </h1>
      </div>

      <div className="rounded-2xl border border-border-divider bg-surface p-5 sm:p-6 space-y-4">
        <div className="rounded-2xl border border-border-divider bg-surface p-6 text-center space-y-2">
          <div className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight flex items-baseline justify-center gap-2">
            <span className="tabular-nums">
              <AnimatedCounterInternal targetValue={plan.projectedDays} />
            </span>
            <span className="text-xl sm:text-2xl font-bold text-text-muted">
              Hari
            </span>
          </div>

          <p className="text-xs sm:text-sm text-text-muted">
            Perkiraan tercapai{" "}
            <strong className="text-text-primary font-bold">
              {estimatedDateString}
            </strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="w-9 h-9 rounded-xl bg-accent-green/12 text-accent-green flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-text-muted block">
                Berat
              </span>
              <span className="text-sm font-extrabold text-text-primary">
                {activeSource.currentWeightKg || 75} kg &rarr;{" "}
                {activeSource.targetWeightKg || 68} kg
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="w-9 h-9 rounded-xl bg-accent-orange/12 text-accent-orange-dark flex items-center justify-center shrink-0">
              <GoalIcon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-text-muted block">
                Program
              </span>
              <span className="text-sm font-extrabold text-text-primary">
                {goalLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="w-9 h-9 rounded-xl bg-accent-orange/12 text-accent-orange-dark flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-text-muted block">
                Margin Kalori
              </span>
              <span className="text-sm font-extrabold text-text-primary">
                {plan.dailyMarginKcal > 0
                  ? `+${plan.dailyMarginKcal}`
                  : plan.dailyMarginKcal}{" "}
                kkal/hari
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="w-9 h-9 rounded-xl bg-macro-protein/12 text-macro-protein flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-text-muted block">
                Estimasi
              </span>
              <span className="text-sm font-extrabold text-text-primary">
                {estimatedWeeks} minggu
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        {isDemo ? (
          <Link
            href="/onboarding/profile-calculator?demo=1"
            className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl border border-border-default bg-surface text-xs sm:text-sm font-bold text-neutral-10 hover:bg-surface-subtle transition-colors"
          >
            Kembali
          </Link>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted select-none">
            <Lock
              className="w-3.5 h-3.5 text-accent-orange"
              aria-hidden="true"
            />
            <span>Profil Terkunci</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex min-h-[44px] items-center justify-center px-7 py-2.5 rounded-xl bg-accent-green text-text-inverse text-xs sm:text-sm font-bold hover:bg-accent-green/90 transition-colors cursor-pointer"
        >
          Lanjut
        </button>
      </div>
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
