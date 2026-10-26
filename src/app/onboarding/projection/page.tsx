"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Calendar,
  Flame,
  Beef,
  Wheat,
  Droplets,
  ShieldAlert,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { generateNutritionPlan } from "@/lib/nutrition-calculator";

export default function OnboardingProjectionPage() {
  const router = useRouter();
  const { goalPlan, setGoalPlan, setTargets } = useFoodStore();
  const { setOnboardingStep } = useAuthStore();

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

    setGoalPlan({
      totalProjectedDays: plan.projectedDays,
      currentDayNumber: 1,
      dailyMarginKcal: plan.dailyMarginKcal,
      bmiScore: plan.bmi.score,
      bmiCategory: plan.bmi.category,
      startDate: new Date().toISOString().split("T")[0],
    });

    setOnboardingStep(4);
    router.push("/onboarding/adopt-pet");
  };

  const weightDiff = Math.abs(goalPlan.currentWeightKg - goalPlan.targetWeightKg);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-6">
      <OnboardingStepper currentStep={3} />

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading">
          Langkah 3: Proyeksi Waktu Pencapaian Misi
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Berdasarkan margin kalori yang aman, berikut adalah estimasi jumlah hari menuju target berat badan dan rincian target makronutrisi harianmu.
        </p>
      </div>

      {/* Projection Hero Card (Pale Yellow Surface) */}
      <div className="hero-card border border-accent-green/25 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary">
          <Sparkles className="h-4 w-4 text-accent-green" />
          <span>Hasil Proyeksi Waktu (N Days)</span>
        </div>

        <div className="space-y-3">
          <p className="text-base sm:text-lg font-bold text-text-primary leading-snug">
            Status BMI Anda:{" "}
            <span className="text-accent-orange-dark">
              {plan.bmi.score} ({plan.bmi.category})
            </span>
            . Untuk mencapai target{" "}
            {goalPlan.goalType === "diet"
              ? "Diet"
              : goalPlan.goalType === "bulking"
              ? "Bulking"
              : "Maintenance"}{" "}
            dari <strong>{goalPlan.currentWeightKg} kg</strong> ke{" "}
            <strong>{goalPlan.targetWeightKg} kg</strong> dengan margin{" "}
            <strong>
              {plan.dailyMarginKcal > 0
                ? `+${plan.dailyMarginKcal}`
                : plan.dailyMarginKcal}{" "}
              kkal/hari
            </strong>
            :
          </p>

          <div className="p-4 rounded-button bg-surface border border-border-default flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-navigation bg-accent-green text-text-inverse flex items-center justify-center font-bold">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Diproyeksikan Tercapai Dalam</p>
                <h3 className="text-2xl font-black text-text-primary font-heading">
                  {plan.projectedDays} Hari
                </h3>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-text-muted">Selisih Target:</span>
              <p className="font-bold text-text-primary">{weightDiff} kg</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-neutral-10 italic flex items-center gap-1.5 pt-1">
          <ShieldAlert className="h-3.5 w-3.5 text-accent-orange shrink-0" />
          <span>
            Proyeksi dihitung berdasarkan standar biologis 1 kg lemak tubuh &asymp; 7.700 kkal dengan margin defisit/surplus aman.
          </span>
        </p>
      </div>

      {/* Recommended Daily Macronutrients Target Card */}
      <div className="rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent-green fill-accent-green" />
            <span>Target Gizi Harian Caloria:</span>
          </h3>
          <span className="px-3 py-1 rounded-pill text-xs font-black bg-accent-green/15 text-text-primary">
            {plan.dailyCalories} kcal / hari
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Protein */}
          <div className="p-3.5 rounded-button bg-macro-protein/10 border border-macro-protein/20 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-macro-protein">
              <Beef className="h-3.5 w-3.5" />
              <span>Protein</span>
            </div>
            <p className="text-xl font-extrabold text-foreground font-heading">
              {plan.proteinG}g
            </p>
            <p className="text-[10px] text-text-muted">Otot & Pemulihan</p>
          </div>

          {/* Carbs */}
          <div className="p-3.5 rounded-button bg-accent-yellow/50 border border-accent-orange/25 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-accent-orange-dark">
              <Wheat className="h-3.5 w-3.5" />
              <span>Karbo</span>
            </div>
            <p className="text-xl font-extrabold text-foreground font-heading">
              {plan.carbsG}g
            </p>
            <p className="text-[10px] text-text-muted">Energi Utama</p>
          </div>

          {/* Fat */}
          <div className="p-3.5 rounded-button bg-macro-fat/10 border border-macro-fat/20 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-macro-fat">
              <Droplets className="h-3.5 w-3.5" />
              <span>Lemak</span>
            </div>
            <p className="text-xl font-extrabold text-foreground font-heading">
              {plan.fatG}g
            </p>
            <p className="text-[10px] text-text-muted">Hormon Sehat</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-input bg-surface-subtle border border-border-divider">
            <span className="text-text-muted">Target Serat:</span>
            <span className="font-bold text-text-primary">{plan.fiberG} gram</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-input bg-surface-subtle border border-border-divider">
            <span className="text-text-muted">Batas Gula:</span>
            <span className="font-bold text-macro-sugar">&lt; {plan.sugarG} gram</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/onboarding/profile-calculator"
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-accent-green-light text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleNext}
          className="button-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm"
        >
          <span>Lanjut: Adopsi Virtual Pet</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
