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
    // Save generated targets and projection days
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Langkah 3: Proyeksi Waktu Pencapaian Misi
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
          Berdasarkan margin kalori yang aman, berikut adalah estimasi jumlah hari menuju target berat badan dan rincian target makronutrisi harianmu.
        </p>
      </div>

      {/* Projection Hero Card */}
      <div className="rounded-3xl border bg-gradient-to-tr from-orange-500/15 via-amber-500/5 to-card p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
          <Sparkles className="h-4 w-4" />
          <span>Hasil Proyeksi Waktu ($N$ Days)</span>
        </div>

        <div className="space-y-2">
          <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
            Status BMI Anda:{" "}
            <span className="text-orange-600 dark:text-orange-400">
              {plan.bmi.score} ({plan.bmi.category})
            </span>
            . Untuk mencapai target {goalPlan.goalType === "diet" ? "Diet" : goalPlan.goalType === "bulking" ? "Bulking" : "Maintenance"} dari{" "}
            <strong>{goalPlan.currentWeightKg} kg</strong> ke{" "}
            <strong>{goalPlan.targetWeightKg} kg</strong> dengan margin{" "}
            <strong>{plan.dailyMarginKcal > 0 ? `+${plan.dailyMarginKcal}` : plan.dailyMarginKcal} kkal/hari</strong>:
          </p>

          <div className="p-4 rounded-2xl bg-background border flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Diproyeksikan Tercapai Dalam</p>
                <h3 className="text-2xl font-black text-orange-600 dark:text-orange-400">
                  {plan.projectedDays} Hari
                </h3>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-muted-foreground">Selisih Target:</span>
              <p className="font-bold text-foreground">{weightDiff} kg</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground italic flex items-center gap-1.5 pt-1">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>
            Proyeksi dihitung berdasarkan standar biologis 1 kg lemak tubuh &asymp; 7.700 kkal dengan margin defisit/surplus aman.
          </span>
        </p>
      </div>

      {/* Recommended Daily Macronutrients Target Card */}
      <div className="rounded-3xl border bg-card p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span>Target Gizi Harian Caloria:</span>
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/10 text-orange-600 dark:text-orange-400">
            {plan.dailyCalories} kcal / hari
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Protein */}
          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Beef className="h-3.5 w-3.5" />
              <span>Protein</span>
            </div>
            <p className="text-xl font-extrabold text-foreground">{plan.proteinG}g</p>
            <p className="text-[10px] text-muted-foreground">Otot & Pemulihan</p>
          </div>

          {/* Carbs */}
          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Wheat className="h-3.5 w-3.5" />
              <span>Karbo</span>
            </div>
            <p className="text-xl font-extrabold text-foreground">{plan.carbsG}g</p>
            <p className="text-[10px] text-muted-foreground">Energi Utama</p>
          </div>

          {/* Fat */}
          <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              <Droplets className="h-3.5 w-3.5" />
              <span>Lemak</span>
            </div>
            <p className="text-xl font-extrabold text-foreground">{plan.fatG}g</p>
            <p className="text-[10px] text-muted-foreground">Hormon Sehat</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
            <span className="text-muted-foreground">Target Serat:</span>
            <span className="font-bold text-foreground">{plan.fiberG} gram</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
            <span className="text-muted-foreground">Batas Gula:</span>
            <span className="font-bold text-foreground">&lt; {plan.sugarG} gram</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/onboarding/profile-calculator"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-border text-xs font-semibold hover:bg-accent text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-transform active:scale-95"
        >
          <span>Lanjut: Adopsi Virtual Pet</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

