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
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(
    goalPlan.currentWeightKg || 75
  );
  const [targetWeightKg, setTargetWeightKg] = useState<number>(
    goalPlan.targetWeightKg || 68
  );
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading">
          Langkah 2: Profil Fisik & Kalkulator BMI
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Masukkan parameter fisikmu. Sistem Caloria akan menghitung skor BMI dan estimasi kebutuhan energi harian (TDEE).
        </p>
      </div>

      <div className="rounded-card border border-border-divider bg-surface p-6 sm:p-8 space-y-5 shadow-xs">
        {/* Gender Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted">
            Jenis Kelamin Biologis (untuk rumus BMR Mifflin-St Jeor)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={cn(
                "nav-item py-2.5 px-4 border text-xs font-bold transition-colors",
                gender === "male"
                  ? "is-selected border-accent-orange shadow-2xs"
                  : "bg-surface-subtle border-border-default text-neutral-10"
              )}
            >
              Laki-Laki
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={cn(
                "nav-item py-2.5 px-4 border text-xs font-bold transition-colors",
                gender === "female"
                  ? "is-selected border-accent-orange shadow-2xs"
                  : "bg-surface-subtle border-border-default text-neutral-10"
              )}
            >
              Perempuan
            </button>
          </div>
        </div>

        {/* Height, Weight, Age Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-text-muted">
              Usia (Tahun)
            </label>
            <input
              type="number"
              min="12"
              max="100"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 20)}
              className="input-field mt-1 w-full px-3.5 py-2 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted">
              Tinggi Badan (cm)
            </label>
            <input
              type="number"
              min="100"
              max="250"
              value={heightCm}
              onChange={(e) => setHeightCm(parseInt(e.target.value) || 160)}
              className="input-field mt-1 w-full px-3.5 py-2 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted">
              Berat Saat Ini (kg)
            </label>
            <input
              type="number"
              step="0.5"
              min="30"
              max="250"
              value={currentWeightKg}
              onChange={(e) => setCurrentWeightKg(parseFloat(e.target.value) || 60)}
              className="input-field mt-1 w-full px-3.5 py-2 text-sm font-semibold"
            />
          </div>
        </div>

        {/* Target Weight */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-muted">
              Berat Badan Target (kg)
            </label>
            <span className="text-[11px] text-text-muted">
              Rentang BMI Normal: {bmiAnalysis.healthyWeightRange.min} -{" "}
              {bmiAnalysis.healthyWeightRange.max} kg
            </span>
          </div>
          <input
            type="number"
            step="0.5"
            min="30"
            max="250"
            value={targetWeightKg}
            onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 60)}
            className="input-field mt-1 w-full px-3.5 py-2 text-sm font-semibold"
          />
        </div>

        {/* Activity Level Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted">
            Tingkat Aktivitas Harian
          </label>
          <div className="space-y-1.5">
            {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map(
              (levelKey) => (
                <button
                  key={levelKey}
                  type="button"
                  onClick={() => setActivityLevel(levelKey)}
                  className={cn(
                    "nav-item w-full text-left p-3 border text-xs transition-colors flex items-center justify-between",
                    activityLevel === levelKey
                      ? "is-selected border-accent-orange font-bold"
                      : "bg-surface-subtle border-border-default text-neutral-10"
                  )}
                >
                  <span>{ACTIVITY_MULTIPLIERS[levelKey].label}</span>
                  <span className="text-[10px] font-mono opacity-85">
                    x{ACTIVITY_MULTIPLIERS[levelKey].multiplier}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Live BMI & TDEE Result Card (Review Card Surface) */}
        <div className="review-card border border-accent-green/25 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
            <Calculator className="h-4 w-4 text-accent-green" />
            <span>Hasil Analisis Profil Fisik:</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
            <div className="p-2.5 rounded-button bg-surface border border-border-default shadow-2xs">
              <span className="text-[10px] text-text-muted">Skor BMI</span>
              <p className="text-base font-extrabold text-text-primary font-heading">
                {bmiAnalysis.score}
              </p>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-pill inline-block mt-0.5",
                  bmiAnalysis.category === "Normal"
                    ? "bg-accent-green/15 text-text-primary"
                    : bmiAnalysis.category === "Underweight"
                    ? "bg-macro-protein/15 text-macro-protein"
                    : "bg-accent-orange/15 text-accent-orange-dark"
                )}
              >
                {bmiAnalysis.category}
              </span>
            </div>

            <div className="p-2.5 rounded-button bg-surface border border-border-default shadow-2xs">
              <span className="text-[10px] text-text-muted">BMR Alami</span>
              <p className="text-base font-extrabold text-foreground font-heading">
                {bmr}
              </p>
              <span className="text-[10px] text-text-muted">kkal / hari</span>
            </div>

            <div className="p-2.5 rounded-button bg-surface border border-border-default shadow-2xs">
              <span className="text-[10px] text-text-muted">TDEE Total</span>
              <p className="text-base font-extrabold text-text-primary font-heading">
                {tdee}
              </p>
              <span className="text-[10px] text-text-muted">kkal bakar/hari</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/onboarding/goal"
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-accent-green-light text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleNext}
          className="button-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm"
        >
          <span>Lanjut: Proyeksi N Hari</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
