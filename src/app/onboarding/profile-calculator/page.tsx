"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Minus,
  Plus,
  AlertCircle,
  CheckCircle2,
  Lock,
  X,
} from "lucide-react";
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

interface CompactStepperProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  subLabel?: string;
  onChange: (val: number) => void;
}

function CompactStepper({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  subLabel,
  onChange,
}: CompactStepperProps) {
  const [textValue, setTextValue] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setTextValue(String(value));
    }
  }, [value, isFocused]);

  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const applyDelta = (delta: number) => {
    onChange(
      Math.min(
        max,
        Math.max(
          min,
          step === 1
            ? Math.round(value + delta)
            : Math.round((value + delta) * 10) / 10
        )
      )
    );
  };

  const startStepping = (delta: number) => {
    applyDelta(delta);
    stepTimerRef.current = setTimeout(() => {
      stepIntervalRef.current = setInterval(() => {
        applyDelta(delta);
      }, 90);
    }, 350);
  };

  const stopStepping = () => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      setTextValue(raw);
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChange(Math.min(max, Math.max(min, parsed)));
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(textValue);
    if (isNaN(parsed) || parsed < min) {
      onChange(min);
      setTextValue(String(min));
    } else if (parsed > max) {
      onChange(max);
      setTextValue(String(max));
    } else {
      const rounded =
        step === 1 ? Math.round(parsed) : Math.round(parsed * 10) / 10;
      onChange(rounded);
      setTextValue(String(rounded));
    }
  };

  return (
    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-navigation bg-surface-subtle border border-border-default">
      <div className="min-w-0 pr-2">
        <span className="text-xs font-bold text-text-primary block truncate">
          {label}
        </span>
        {subLabel && (
          <span className="text-[10px] text-text-muted block truncate">
            {subLabel}
          </span>
        )}
      </div>

      {/* Compact Stepper matching user reference image */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => applyDelta(-step)}
          onMouseDown={() => startStepping(-step)}
          onMouseUp={stopStepping}
          onMouseLeave={stopStepping}
          onTouchStart={() => startStepping(-step)}
          onTouchEnd={stopStepping}
          disabled={value <= min}
          aria-label={`Kurang ${label}`}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border-default bg-surface hover:bg-surface-subtle active:scale-95 text-accent-green hover:border-accent-green/50 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div className="h-7 sm:h-8 px-2 sm:px-3 rounded-full border border-border-default bg-surface flex items-center justify-center gap-1 shadow-2xs focus-within:border-accent-green focus-within:ring-2 focus-within:ring-accent-green/20">
          <input
            type="text"
            inputMode="decimal"
            value={isFocused ? textValue : String(value)}
            onFocus={() => {
              setIsFocused(true);
              setTextValue(String(value));
            }}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-10 sm:w-11 text-center text-sm sm:text-base font-black text-accent-green-dark dark:text-accent-green bg-transparent outline-none tracking-tight"
          />
          <span className="text-[11px] font-semibold text-text-muted select-none">
            {unit}
          </span>
        </div>

        <button
          type="button"
          onClick={() => applyDelta(step)}
          onMouseDown={() => startStepping(step)}
          onMouseUp={stopStepping}
          onMouseLeave={stopStepping}
          onTouchStart={() => startStepping(step)}
          onTouchEnd={stopStepping}
          disabled={value >= max}
          aria-label={`Tambah ${label}`}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border-default bg-surface hover:bg-surface-subtle active:scale-95 text-accent-green hover:border-accent-green/50 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

export default function OnboardingProfileCalculatorPage() {
  const router = useRouter();
  const { goalPlan, setGoalPlan } = useFoodStore();
  const { activeOnboardingStep, setOnboardingStep } = useAuthStore();

  // Guard: if user has already progressed to projection or further, lock and redirect forward
  useEffect(() => {
    if (activeOnboardingStep >= 3) {
      router.replace("/onboarding/projection");
    }
  }, [activeOnboardingStep, router]);

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

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const handleOpenConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmAndProceed = () => {
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
    // Set step to 3 (Projection) so this step is permanently locked
    setOnboardingStep(3);
    setShowConfirmModal(false);
    router.replace("/onboarding/projection");
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-5">
      <OnboardingStepper currentStep={2} />

      <div className="text-center space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary font-heading">
          Langkah 2: Profil Fisik & Kalkulator BMI
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Atur parameter fisikmu dengan tombol kontrol praktis untuk menghitung BMI dan kebutuhan kalori harian.
        </p>
      </div>

      <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4 shadow-xs">
        {/* Gender Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted">
            Jenis Kelamin Biologis (untuk rumus BMR Mifflin-St Jeor)
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={cn(
                "nav-item py-2 px-3 border text-xs font-bold transition-colors",
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
                "nav-item py-2 px-3 border text-xs font-bold transition-colors",
                gender === "female"
                  ? "is-selected border-accent-orange shadow-2xs"
                  : "bg-surface-subtle border-border-default text-neutral-10"
              )}
            >
              Perempuan
            </button>
          </div>
        </div>

        {/* Physical Steppers in 2x2 Grid for compact layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <CompactStepper
            label="Usia"
            unit="th"
            value={age}
            min={12}
            max={100}
            step={1}
            onChange={setAge}
          />

          <CompactStepper
            label="Tinggi Badan"
            unit="cm"
            value={heightCm}
            min={100}
            max={250}
            step={1}
            onChange={setHeightCm}
          />

          <CompactStepper
            label="Berat Saat Ini"
            unit="kg"
            value={currentWeightKg}
            min={30}
            max={250}
            step={0.5}
            onChange={setCurrentWeightKg}
          />

          <CompactStepper
            label="Berat Target"
            unit="kg"
            value={targetWeightKg}
            min={30}
            max={250}
            step={0.5}
            subLabel={`Normal: ${bmiAnalysis.healthyWeightRange.min}-${bmiAnalysis.healthyWeightRange.max}kg`}
            onChange={setTargetWeightKg}
          />
        </div>

        {/* Activity Level Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted">
            Tingkat Aktivitas Harian
          </label>
          <div className="space-y-1">
            {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map(
              (levelKey) => (
                <button
                  key={levelKey}
                  type="button"
                  onClick={() => setActivityLevel(levelKey)}
                  className={cn(
                    "nav-item w-full text-left py-2 px-3 border text-xs transition-colors flex items-center justify-between rounded-navigation",
                    activityLevel === levelKey
                      ? "is-selected border-accent-orange font-bold"
                      : "bg-surface-subtle border-border-default text-neutral-10"
                  )}
                >
                  <span className="truncate pr-2">{ACTIVITY_MULTIPLIERS[levelKey].label}</span>
                  <span className="text-[10px] font-mono opacity-85 shrink-0">
                    x{ACTIVITY_MULTIPLIERS[levelKey].multiplier}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Live BMI & TDEE Result Card */}
        <div className="review-card border border-accent-green/25 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
            <Calculator className="h-3.5 w-3.5 text-accent-green" />
            <span>Hasil Analisis Profil Fisik:</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
            <div className="p-2 rounded-button bg-surface border border-border-default shadow-2xs">
              <span className="text-[10px] text-text-muted">Skor BMI</span>
              <p className="text-sm sm:text-base font-extrabold text-text-primary font-heading">
                {bmiAnalysis.score}
              </p>
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-pill inline-block mt-0.5",
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

            <div className="p-2 rounded-button bg-surface border border-border-default shadow-2xs">
              <span className="text-[10px] text-text-muted">BMR Alami</span>
              <p className="text-sm sm:text-base font-extrabold text-foreground font-heading">
                {bmr}
              </p>
              <span className="text-[9px] text-text-muted">kkal / hari</span>
            </div>

            <div className="p-2 rounded-button bg-surface border border-border-default shadow-2xs">
              <span className="text-[10px] text-text-muted">TDEE Total</span>
              <p className="text-sm sm:text-base font-extrabold text-text-primary font-heading">
                {tdee}
              </p>
              <span className="text-[9px] text-text-muted">kkal bakar/hari</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Link
          href="/onboarding/goal"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-accent-green-light text-text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleOpenConfirm}
          className="button-primary inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm"
        >
          <span>Lanjut: Proyeksi N Hari</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-surface border border-border-default rounded-card p-5 sm:p-6 shadow-xl space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-accent-green/15 text-accent-green flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-text-primary font-heading">
                    Konfirmasi Data Fisik
                  </h3>
                  <p className="text-xs text-text-muted">
                    Pastikan parameter fisikmu sudah tepat
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-7 h-7 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Data Box */}
            <div className="rounded-navigation bg-surface-subtle border border-border-default p-3.5 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between border-b border-border-divider pb-1">
                  <span className="text-text-muted">Jenis Kelamin:</span>
                  <span className="font-bold text-text-primary">
                    {gender === "male" ? "Laki-Laki" : "Perempuan"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border-divider pb-1">
                  <span className="text-text-muted">Usia:</span>
                  <span className="font-bold text-text-primary">{age} tahun</span>
                </div>
                <div className="flex justify-between border-b border-border-divider pb-1">
                  <span className="text-text-muted">Tinggi Badan:</span>
                  <span className="font-bold text-text-primary">{heightCm} cm</span>
                </div>
                <div className="flex justify-between border-b border-border-divider pb-1">
                  <span className="text-text-muted">Berat Saat Ini:</span>
                  <span className="font-bold text-text-primary">{currentWeightKg} kg</span>
                </div>
              </div>

              <div className="flex justify-between border-b border-border-divider pb-1 pt-1">
                <span className="text-text-muted">Berat Target:</span>
                <span className="font-extrabold text-accent-orange-dark">
                  {targetWeightKg} kg
                </span>
              </div>

              <div className="flex justify-between pt-0.5">
                <span className="text-text-muted">Analisis Awal:</span>
                <span className="font-bold text-text-primary">
                  BMI {bmiAnalysis.score} ({bmiAnalysis.category}) &bull; TDEE {tdee} kkal
                </span>
              </div>
            </div>

            {/* Lock Notice */}
            <div className="flex items-start gap-2 p-2.5 rounded-navigation bg-accent-orange/10 border border-accent-orange/20 text-[11px] text-accent-orange-dark">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Catatan:</strong> Setelah melanjutkan ke langkah proyeksi, data profil fisik ini akan dikunci untuk menghitung target gizi dan proyeksi programmu.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-button border border-border-default text-xs font-bold text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
              >
                Periksa Lagi
              </button>

              <button
                type="button"
                onClick={handleConfirmAndProceed}
                className="button-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <span>Ya, Sudah Benar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
