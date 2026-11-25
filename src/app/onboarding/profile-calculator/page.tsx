"use client";

import { Suspense, useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Lock, X } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingDemoStore } from "@/store/use-onboarding-demo-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  updateUsernameAction,
  checkUsernameAvailabilityAction,
} from "@/app/actions/profile";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingDemoBanner } from "@/components/onboarding/onboarding-demo-banner";
import {
  calculateBmi,
  calculateBmr,
  calculateTdee,
  ActivityLevel,
  Gender,
} from "@/lib/nutrition-calculator";
import { cn } from "@/lib/utils";

const ACTIVITY_OPTIONS: Array<{
  key: ActivityLevel;
  label: string;
  frequency: string;
}> = [
  {
    key: "sedentary",
    label: "Jarang Olahraga",
    frequency: "Aktivitas minimal",
  },
  { key: "light", label: "Ringan", frequency: "1–3 hari/minggu" },
  { key: "moderate", label: "Sedang", frequency: "3–5 hari/minggu" },
  { key: "active", label: "Aktif", frequency: "6–7 hari/minggu" },
  { key: "very_active", label: "Sangat Aktif", frequency: "Latihan berat" },
];

const BMI_CATEGORY_LABELS: Record<string, string> = {
  Underweight: "Kurus",
  Normal: "Normal",
  Overweight: "Berlebih",
  Obese: "Obesitas",
};

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
            : Math.round((value + delta) * 10) / 10,
        ),
      ),
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
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border-divider gap-2">
      <div className="min-w-0">
        <span className="text-xs sm:text-sm font-bold text-text-primary block">
          {label}
        </span>
        {subLabel && (
          <span className="text-[11px] text-text-muted block">{subLabel}</span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => applyDelta(-step)}
          onMouseDown={() => startStepping(-step)}
          onMouseUp={stopStepping}
          onMouseLeave={stopStepping}
          onTouchStart={() => startStepping(-step)}
          onTouchEnd={stopStepping}
          disabled={value <= min}
          aria-label={`Kurangi ${label}`}
          className="w-8 h-8 rounded-full border border-border-default bg-surface hover:bg-surface-subtle text-text-primary hover:border-accent-green flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
        </button>

        <div className="h-8 px-2 rounded-full border border-border-default bg-surface flex items-center justify-center gap-1 focus-within:border-accent-green focus-within:ring-2 focus-within:ring-accent-green/20">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`${label} dalam ${unit}`}
            value={isFocused ? textValue : String(value)}
            onFocus={() => {
              setIsFocused(true);
              setTextValue(String(value));
            }}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-9 sm:w-10 text-center text-sm font-extrabold text-text-primary bg-transparent outline-none tabular-nums"
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
          className="w-8 h-8 rounded-full border border-border-default bg-surface hover:bg-surface-subtle text-text-primary hover:border-accent-green flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function OnboardingProfileCalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "1";
  const isHydrated = useHydrated();

  const { goalPlan, setGoalPlan } = useFoodStore();
  const { user, activeOnboardingStep, onboardingCompleted, setOnboardingStep } =
    useAuthStore();
  const demoStore = useOnboardingDemoStore();
  const demoSyncedRef = useRef(false);

  useEffect(() => {
    if (isDemo) return;
    if (onboardingCompleted) {
      router.replace("/dashboard");
      return;
    }
    if (activeOnboardingStep >= 3) {
      router.replace("/onboarding/projection");
    }
  }, [isDemo, activeOnboardingStep, onboardingCompleted, router]);

  const [manualUsername, setManualUsername] = useState<string | null>(null);
  const [manualFullName, setManualFullName] = useState<string | null>(null);
  const usernameInput =
    manualUsername ??
    (isDemo
      ? isHydrated
        ? demoStore.username
        : ""
      : isHydrated
        ? user?.username || ""
        : "");
  const fullNameInput =
    manualFullName ??
    (isDemo
      ? isHydrated
        ? demoStore.fullName
        : ""
      : isHydrated
        ? user?.fullName || ""
        : "");

  const [usernameError, setUsernameError] = useState("");
  const [, setUsernameChecked] = useState(false);

  const [gender, setGender] = useState<Gender>(
    isDemo ? demoStore.gender : goalPlan.gender || "male",
  );
  const [age, setAge] = useState<number>(
    isDemo ? demoStore.age : goalPlan.age || 24,
  );
  const [heightCm, setHeightCm] = useState<number>(
    isDemo ? demoStore.heightCm : goalPlan.heightCm || 172,
  );
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(
    isDemo ? demoStore.currentWeightKg : goalPlan.currentWeightKg || 75,
  );
  const [targetWeightKg, setTargetWeightKg] = useState<number>(
    isDemo ? demoStore.targetWeightKg : goalPlan.targetWeightKg || 68,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    isDemo ? demoStore.activityLevel : goalPlan.activityLevel || "moderate",
  );

  useEffect(() => {
    if (!isDemo || !isHydrated || demoSyncedRef.current) return;
    demoSyncedRef.current = true;
    setManualUsername(demoStore.username);
    setManualFullName(demoStore.fullName);
    setGender(demoStore.gender);
    setAge(demoStore.age);
    setHeightCm(demoStore.heightCm);
    setCurrentWeightKg(demoStore.currentWeightKg);
    setTargetWeightKg(demoStore.targetWeightKg);
    setActivityLevel(demoStore.activityLevel);
  }, [isDemo, isHydrated, demoStore]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!showConfirmModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirmModal(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirmModal]);

  const bmiAnalysis = useMemo(
    () => calculateBmi(heightCm, currentWeightKg),
    [heightCm, currentWeightKg],
  );

  const bmr = useMemo(
    () => calculateBmr(gender, age, heightCm, currentWeightKg),
    [gender, age, heightCm, currentWeightKg],
  );

  const tdee = useMemo(
    () => calculateTdee(bmr, activityLevel),
    [bmr, activityLevel],
  );

  const handleOpenConfirm = async () => {
    if (usernameInput.trim()) {
      const clean = usernameInput
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
      if (clean.length < 3) {
        setUsernameError("Username minimal 3 karakter.");
        return;
      }
      if (!isDemo) {
        const check = await checkUsernameAvailabilityAction(clean);
        if (!check.available) {
          setUsernameError(check.error || "Username sudah digunakan.");
          return;
        }
      }
      setUsernameError("");
      setUsernameChecked(true);
    }
    setShowConfirmModal(true);
  };

  const handleConfirmAndProceed = async () => {
    const clean = usernameInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    if (isDemo) {
      demoStore.setDemoData({
        fullName: fullNameInput.trim(),
        username: clean,
        gender,
        age,
        heightCm,
        currentWeightKg,
        targetWeightKg,
        activityLevel,
        bmiScore: bmiAnalysis.score,
        bmiCategory: bmiAnalysis.category,
      });
      setShowConfirmModal(false);
      router.push("/onboarding/projection?demo=1");
      return;
    }

    if (usernameInput.trim()) {
      try {
        await updateUsernameAction(clean, fullNameInput.trim());
        useAuthStore.setState((s) => ({
          user: s.user
            ? {
                ...s.user,
                username: clean,
                fullName: fullNameInput.trim() || s.user.fullName,
              }
            : null,
        }));
      } catch (err) {
        console.warn("Update username warning:", err);
      }
    }

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
    setShowConfirmModal(false);
    router.replace("/onboarding/projection");
  };

  const bmiLabel =
    BMI_CATEGORY_LABELS[bmiAnalysis.category] || bmiAnalysis.category;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-6">
      {isDemo && <OnboardingDemoBanner />}
      <OnboardingStepper currentStep={2} />

      <div className="text-center">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Profil Fisik
        </h1>
      </div>

      <div className="rounded-2xl border border-border-divider bg-surface p-5 sm:p-6 space-y-5">
        {/* Identitas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-4 border-b border-border-divider">
          <div>
            <label
              htmlFor="onboarding-fullname"
              className="block text-xs sm:text-sm font-bold text-text-primary"
            >
              Nama
            </label>
            <input
              id="onboarding-fullname"
              type="text"
              value={fullNameInput}
              onChange={(e) => setManualFullName(e.target.value)}
              placeholder="Nama lengkap"
              className="input-field mt-1.5 w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="onboarding-username"
              className="block text-xs sm:text-sm font-bold text-text-primary"
            >
              Username
            </label>
            <input
              id="onboarding-username"
              type="text"
              value={usernameInput}
              onChange={(e) => {
                setManualUsername(
                  e.target.value.toLowerCase().replace(/\s+/g, "_"),
                );
                setUsernameError("");
                setUsernameChecked(false);
              }}
              placeholder="nama_pengguna"
              required={!isDemo}
              className={cn(
                "input-field mt-1.5 w-full px-3.5 py-2.5 text-sm",
                usernameError &&
                  "border-destructive focus-visible:outline-destructive",
              )}
            />
            {usernameError && (
              <p className="mt-1.5 text-xs font-semibold text-destructive">
                {usernameError}
              </p>
            )}
          </div>
        </div>

        {/* Jenis Kelamin */}
        <div className="space-y-2">
          <span className="block text-xs sm:text-sm font-bold text-text-primary">
            Jenis Kelamin
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              aria-pressed={gender === "male"}
              onClick={() => setGender("male")}
              className={cn(
                "min-h-[44px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer",
                gender === "male"
                  ? "border-accent-green bg-accent-green/10 text-text-primary ring-2 ring-accent-green/20"
                  : "bg-surface border-border-default text-neutral-10 hover:bg-surface-subtle",
              )}
            >
              Laki-Laki
            </button>
            <button
              type="button"
              aria-pressed={gender === "female"}
              onClick={() => setGender("female")}
              className={cn(
                "min-h-[44px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer",
                gender === "female"
                  ? "border-accent-green bg-accent-green/10 text-text-primary ring-2 ring-accent-green/20"
                  : "bg-surface border-border-default text-neutral-10 hover:bg-surface-subtle",
              )}
            >
              Perempuan
            </button>
          </div>
        </div>

        {/* Parameter Fisik */}
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
            label="Tinggi"
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
            subLabel={`Normal: ${bmiAnalysis.healthyWeightRange.min}–${bmiAnalysis.healthyWeightRange.max} kg`}
            onChange={setTargetWeightKg}
          />
        </div>

        {/* Aktivitas Harian */}
        <div className="space-y-2">
          <span className="block text-xs sm:text-sm font-bold text-text-primary">
            Aktivitas Harian
          </span>
          <div className="space-y-1.5">
            {ACTIVITY_OPTIONS.map((option) => {
              const isSelected = activityLevel === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActivityLevel(option.key)}
                  className={cn(
                    "w-full min-h-[44px] text-left py-2.5 px-3.5 rounded-xl border text-xs sm:text-sm transition-colors flex items-center justify-between gap-2 cursor-pointer",
                    isSelected
                      ? "border-accent-green bg-accent-green/10 text-text-primary font-bold ring-2 ring-accent-green/20"
                      : "bg-surface border-border-default text-neutral-10 hover:bg-surface-subtle",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  <span className="text-xs font-medium text-text-muted shrink-0">
                    {option.frequency}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hasil BMI, BMR, TDEE */}
        <div className="rounded-2xl border border-border-divider bg-surface p-4">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-surface-subtle border border-border-divider">
              <span className="text-[11px] font-semibold text-text-muted block">
                BMI
              </span>
              <p className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
                {bmiAnalysis.score}
              </p>
              <span className="text-[11px] font-semibold text-neutral-10 block mt-0.5">
                {bmiLabel}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-border-divider">
              <span className="text-[11px] font-semibold text-text-muted block">
                BMR
              </span>
              <p className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
                {bmr}
              </p>
              <span className="text-[11px] text-text-muted block mt-0.5">
                kkal/hari
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-border-divider">
              <span className="text-[11px] font-semibold text-text-muted block">
                TDEE
              </span>
              <p className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tabular-nums mt-0.5">
                {tdee}
              </p>
              <span className="text-[11px] text-text-muted block mt-0.5">
                kkal/hari
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href={isDemo ? "/onboarding/goal?demo=1" : "/onboarding/goal"}
          className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl border border-border-default bg-surface text-xs sm:text-sm font-bold text-neutral-10 hover:bg-surface-subtle transition-colors"
        >
          Kembali
        </Link>

        <button
          type="button"
          onClick={handleOpenConfirm}
          className="inline-flex min-h-[44px] items-center justify-center px-7 py-2.5 rounded-xl bg-accent-green text-text-inverse text-xs sm:text-sm font-bold hover:bg-accent-green/90 transition-colors cursor-pointer"
        >
          Lanjut
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-profile-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md bg-surface border border-border-divider rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3
                id="confirm-profile-title"
                className="font-heading text-xl font-extrabold text-text-primary"
              >
                Konfirmasi Data
              </h3>

              <button
                type="button"
                aria-label="Tutup dialog"
                onClick={() => setShowConfirmModal(false)}
                className="w-9 h-9 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="rounded-xl bg-surface-subtle border border-border-divider p-3.5 space-y-2 text-xs">
              {(usernameInput || fullNameInput) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 pb-2 border-b border-border-divider">
                  {fullNameInput && (
                    <div className="flex justify-between gap-2 min-w-0">
                      <span className="text-text-muted shrink-0">Nama</span>
                      <span className="font-bold text-text-primary truncate">
                        {fullNameInput}
                      </span>
                    </div>
                  )}
                  {usernameInput && (
                    <div className="flex justify-between gap-2 min-w-0">
                      <span className="text-text-muted shrink-0">Username</span>
                      <span className="font-bold text-accent-green truncate">
                        @{usernameInput}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
                <div className="flex justify-between gap-2 border-b border-border-divider pb-1.5">
                  <span className="text-text-muted">Jenis Kelamin</span>
                  <span className="font-bold text-text-primary">
                    {gender === "male" ? "Laki-Laki" : "Perempuan"}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-border-divider pb-1.5">
                  <span className="text-text-muted">Usia</span>
                  <span className="font-bold text-text-primary">{age} th</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-border-divider pb-1.5">
                  <span className="text-text-muted">Tinggi</span>
                  <span className="font-bold text-text-primary">
                    {heightCm} cm
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-border-divider pb-1.5">
                  <span className="text-text-muted">Berat Saat Ini</span>
                  <span className="font-bold text-text-primary">
                    {currentWeightKg} kg
                  </span>
                </div>
              </div>

              <div className="flex justify-between gap-2 border-b border-border-divider pb-1.5 pt-0.5">
                <span className="text-text-muted">Berat Target</span>
                <span className="font-bold text-text-primary">
                  {targetWeightKg} kg
                </span>
              </div>

              <div className="flex justify-between gap-2 pt-0.5">
                <span className="text-text-muted">BMI &amp; TDEE</span>
                <span className="font-bold text-text-primary">
                  {bmiAnalysis.score} · {tdee} kkal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Lock
                className="w-3.5 h-3.5 shrink-0 text-accent-orange"
                aria-hidden="true"
              />
              <span>Data fisik akan dikunci setelah langkah ini.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="min-h-[44px] py-2.5 rounded-xl border border-border-default bg-surface text-xs sm:text-sm font-bold text-neutral-10 hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                Ubah
              </button>

              <button
                type="button"
                onClick={handleConfirmAndProceed}
                className="min-h-[44px] py-2.5 rounded-xl bg-accent-green text-text-inverse text-xs sm:text-sm font-bold hover:bg-accent-green/90 transition-colors cursor-pointer"
              >
                Lanjut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingProfileCalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin mx-auto" />
        </div>
      }
    >
      <OnboardingProfileCalculatorContent />
    </Suspense>
  );
}
