"use client";

import { Suspense, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  Apple,
  Candy,
  GlassWater,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingDemoStore } from "@/store/use-onboarding-demo-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingDemoBanner } from "@/components/onboarding/onboarding-demo-banner";
import { generateNutritionPlan } from "@/lib/nutrition-calculator";

function OnboardingNutritionPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "1";

  const { goalPlan, setTargets } = useFoodStore();
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
      router.push("/onboarding/adopt-pet?demo=1");
      return;
    }

    setTargets({
      calories: plan.dailyCalories,
      protein: plan.proteinG,
      carbs: plan.carbsG,
      fat: plan.fatG,
      fiber: plan.fiberG,
      sugar: plan.sugarG,
      waterMl: plan.waterMl,
    });

    setOnboardingStep(5);
    router.push("/onboarding/adopt-pet");
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-6">
      {isDemo && <OnboardingDemoBanner />}
      <OnboardingStepper currentStep={4} />

      <div className="text-center">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Target Gizi Harian
        </h1>
      </div>

      <div className="rounded-2xl border border-border-divider bg-surface p-5 sm:p-6 space-y-4">
        <div className="rounded-2xl border border-border-divider bg-surface p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-accent-green text-text-inverse flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-muted block">
              Target Kalori
            </span>
            <p className="font-heading text-2xl sm:text-3xl font-extrabold text-text-primary tabular-nums">
              {plan.dailyCalories} kkal
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3.5 rounded-xl bg-macro-protein/8 border border-macro-protein/25 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-macro-protein">
              <Beef className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Protein</span>
            </div>
            <p className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tabular-nums">
              {plan.proteinG}g
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-accent-orange/8 border border-accent-orange/25 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-accent-orange-dark">
              <Wheat className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Karbo</span>
            </div>
            <p className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tabular-nums">
              {plan.carbsG}g
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-macro-fat/8 border border-macro-fat/25 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-macro-fat">
              <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Lemak</span>
            </div>
            <p className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tabular-nums">
              {plan.fatG}g
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="flex items-center gap-2">
              <Apple className="w-4 h-4 text-accent-green" aria-hidden="true" />
              <span className="text-xs font-medium text-text-muted">Serat</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {plan.fiberG} g
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="flex items-center gap-2">
              <Candy className="w-4 h-4 text-macro-sugar" aria-hidden="true" />
              <span className="text-xs font-medium text-text-muted">Gula</span>
            </div>
            <span className="text-xs font-bold text-macro-sugar">
              &lt; {plan.sugarG} g
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border-divider">
            <div className="flex items-center gap-2">
              <GlassWater
                className="w-4 h-4 text-blue-500"
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-text-muted">Air</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {plan.waterMl} ml
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href={
            isDemo ? "/onboarding/projection?demo=1" : "/onboarding/projection"
          }
          className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl border border-border-default bg-surface text-xs sm:text-sm font-bold text-neutral-10 hover:bg-surface-subtle transition-colors"
        >
          Kembali
        </Link>

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

export default function OnboardingNutritionPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin mx-auto" />
        </div>
      }
    >
      <OnboardingNutritionPlanContent />
    </Suspense>
  );
}
