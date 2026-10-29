"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { generateNutritionPlan } from "@/lib/nutrition-calculator";

export default function OnboardingNutritionPlanPage() {
  const router = useRouter();
  const { goalPlan, setTargets } = useFoodStore();
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
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-5">
      <OnboardingStepper currentStep={4} />

      <div className="text-center space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary font-heading">
          Langkah 4: Target Gizi Harian Caloria
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Rincian pembagian makronutrisi harian yang dirancang khusus untuk mencapai target tubuh idealmu secara seimbang.
        </p>
      </div>

      <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4 shadow-xs">
        {/* Total Calories Banner */}
        <div className="review-card border border-accent-green/30 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-navigation bg-accent-green text-text-inverse flex items-center justify-center font-bold shadow-2xs">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Total Kalori Harian
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary font-heading">
                {plan.dailyCalories}{" "}
                <span className="text-xs sm:text-sm font-semibold text-text-muted font-sans">
                  kkal / hari
                </span>
              </h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-pill bg-surface text-xs font-bold border border-border-default text-accent-green-dark">
            Rekomendasi Ahli
          </span>
        </div>

        {/* 3 Main Macronutrient Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Protein */}
          <div className="p-3 rounded-navigation bg-macro-protein/10 border border-macro-protein/25 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-macro-protein">
              <Beef className="w-3.5 h-3.5" />
              <span>Protein</span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-foreground font-heading">
              {plan.proteinG}g
            </p>
            <p className="text-[10px] text-text-muted">Otot & Kenyang</p>
          </div>

          {/* Carbs */}
          <div className="p-3 rounded-navigation bg-accent-yellow/60 border border-accent-orange/30 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-accent-orange-dark">
              <Wheat className="w-3.5 h-3.5" />
              <span>Karbo</span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-foreground font-heading">
              {plan.carbsG}g
            </p>
            <p className="text-[10px] text-text-muted">Energi Aktif</p>
          </div>

          {/* Fat */}
          <div className="p-3 rounded-navigation bg-macro-fat/10 border border-macro-fat/25 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-macro-fat">
              <Droplets className="w-3.5 h-3.5" />
              <span>Lemak</span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-foreground font-heading">
              {plan.fatG}g
            </p>
            <p className="text-[10px] text-text-muted">Hormon & Sendi</p>
          </div>
        </div>

        {/* Micro & Vital Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="flex items-center justify-between p-2.5 rounded-navigation bg-surface-subtle border border-border-default">
            <div className="flex items-center gap-2">
              <Apple className="w-4 h-4 text-accent-green" />
              <span className="text-xs text-text-muted">Target Serat</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {plan.fiberG} g
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-navigation bg-surface-subtle border border-border-default">
            <div className="flex items-center gap-2">
              <Candy className="w-4 h-4 text-macro-sugar" />
              <span className="text-xs text-text-muted">Batas Gula</span>
            </div>
            <span className="text-xs font-bold text-macro-sugar">
              &lt; {plan.sugarG} g
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-navigation bg-surface-subtle border border-border-default">
            <div className="flex items-center gap-2">
              <GlassWater className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-text-muted">Target Air</span>
            </div>
            <span className="text-xs font-bold text-text-primary">
              {plan.waterMl} ml
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/onboarding/projection"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-accent-green-light text-text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleNext}
          className="button-primary inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm"
        >
          <span>Lanjut: Adopsi Virtual Pet</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

