"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calculator } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import {
  calculateBmi,
  calculateBmr,
  calculateTdee,
  ACTIVITY_MULTIPLIERS,
  ActivityLevel,
  Gender,
} from "@/lib/nutrition-calculator";
import { cn } from "@/lib/utils";

export default function OnboardingProfileCalculatorPage() {
  const router = useRouter();
  const { goalPlan, setGoalPlan } = useFoodStore();
  const { setOnboardingStep } = useAuthStore();

  const [gender, setGender] = useState<Gender>(goalPlan.gender || "male");
  const [age, setAge] = useState<number>(goalPlan.age || 24);
  const [heightCm, setHeightCm] = useState<number>(goalPlan.heightCm || 172);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(goalPlan.currentWeightKg || 75);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(goalPlan.targetWeightKg || 68);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    goalPlan.activityLevel || "moderate"
  );

  // Live real-time calculations
  const bmiAnalysis = useMemo(
    () => calculateBmi(heightCm, currentWeightKg),
    [heightCm, currentWeightKg]
  );

  const bmr = useMemo(
    () => calculateBmr(gender, age, heightCm, currentWeightKg),
    [gender, age, heightCm, currentWeightKg]
  );

  const tdee = useMemo(
    () => calculateTdee(bmr, activityLevel),
    [bmr, activityLevel]
  );

  const handleNext = () => {
    setGoalPlan({
      gender,
      age,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      activityLevel,
      bmiScore: bmiAnalysis.score,
      bmiCategory: bmiAnalysis.category,
    });
    setOnboardingStep(3);
    router.push("/onboarding/projection");
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-6">
      <OnboardingStepper currentStep={2} />

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Langkah 2: Profil Fisik & Kalkulator BMI
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted max-w-lg mx-auto">
          Masukkan parameter fisikmu. Sistem Caloria akan menghitung skor BMI dan estimasi kebutuhan energi harian (TDEE).
        </p>
      </div>

      <div className="rounded-3xl border border-warm-border bg-card p-6 shadow-card space-y-5">
        {/* Gender Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">
            Jenis Kelamin Biologis (untuk rumus BMR Mifflin-St Jeor)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={cn(
                "py-2.5 px-4 rounded-2xl border text-xs font-bold transition-colors",
                gender === "male"
                  ? "bg-brand-orange text-ink border-brand-orange shadow-sm"
                  : "bg-surface-raised border-warm-border text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
              )}
            >
              Laki-Laki
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={cn(
                "py-2.5 px-4 rounded-2xl border text-xs font-bold transition-colors",
                gender === "female"
                  ? "bg-brand-orange text-ink border-brand-orange shadow-sm"
                  : "bg-surface-raised border-warm-border text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
              )}
            >
              Perempuan
            </button>
          </div>
        </div>

        {/* Height, Weight, Age Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Usia (Tahun)
            </label>
            <input
              type="number"
              min="12"
              max="100"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 20)}
              className="mt-1 w-full field rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Tinggi Badan (cm)
            </label>
            <input
              type="number"
              min="100"
              max="250"
              value={heightCm}
              onChange={(e) => setHeightCm(parseInt(e.target.value) || 160)}
              className="mt-1 w-full field rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Berat Saat Ini (kg)
            </label>
            <input
              type="number"
              step="0.5"
              min="30"
              max="250"
              value={currentWeightKg}
              onChange={(e) => setCurrentWeightKg(parseFloat(e.target.value) || 60)}
              className="mt-1 w-full field rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none"
            />
          </div>
        </div>

        {/* Target Weight */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink-muted">
              Berat Badan Target (kg)
            </label>
            <span className="text-[11px] text-ink-muted">
              Rentang BMI Normal: {bmiAnalysis.healthyWeightRange.min} - {bmiAnalysis.healthyWeightRange.max} kg
            </span>
          </div>
          <input
            type="number"
            step="0.5"
            min="30"
            max="250"
            value={targetWeightKg}
            onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 60)}
            className="mt-1 w-full field rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none"
          />
        </div>

        {/* Activity Level Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">
            Tingkat Aktivitas Harian
          </label>
          <div className="space-y-1.5">
            {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((levelKey) => (
              <button
                key={levelKey}
                type="button"
                onClick={() => setActivityLevel(levelKey)}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border text-xs transition-colors flex items-center justify-between",
                  activityLevel === levelKey
                    ? "border-brand-orange bg-highlight/60 text-ink font-bold"
                    : "border-warm-border bg-surface-raised text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
                )}
              >
                <span>{ACTIVITY_MULTIPLIERS[levelKey].label}</span>
                <span className="text-[10px] font-mono opacity-80">
                  x{ACTIVITY_MULTIPLIERS[levelKey].multiplier}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Live BMI & TDEE Result Card */}
        <div className="rounded-2xl border border-warm-border bg-highlight/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-dark uppercase tracking-wider">
            <Calculator className="h-4 w-4" />
            <span>Hasil Analisis Profil Fisik:</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-xl border border-warm-border bg-surface-raised shadow-xs">
              <span className="text-[10px] text-ink-muted">Skor BMI</span>
              <p className="text-base font-extrabold text-ink">{bmiAnalysis.score}</p>
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5",
                  bmiAnalysis.category === "Normal"
                    ? "bg-brand-green/10 text-brand-green-dark"
                    : bmiAnalysis.category === "Underweight"
                    ? "bg-brown/10 text-brown"
                    : "bg-highlight text-ink"
                )}
              >
                {bmiAnalysis.category}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-warm-border bg-surface-raised shadow-xs">
              <span className="text-[10px] text-ink-muted">BMR Alami</span>
              <p className="text-base font-extrabold text-ink">{bmr}</p>
              <span className="text-[10px] text-ink-muted">kkal / hari</span>
            </div>

            <div className="p-2.5 rounded-xl border border-warm-border bg-surface-raised shadow-xs">
              <span className="text-[10px] text-ink-muted">TDEE Total</span>
              <p className="text-base font-extrabold text-brand-green-dark">
                {tdee}
              </p>
              <span className="text-[10px] text-ink-muted">kkal bakar/hari</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/onboarding/goal"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 btn-ghost min-h-0 px-4 py-2.5 text-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleNext}
          className="btn-cta text-sm"
        >
          <span>Lanjut: Proyeksi N Hari</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

