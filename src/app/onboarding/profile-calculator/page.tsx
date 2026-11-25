"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { OnboardingActionBar } from "@/components/onboarding/onboarding-action-bar";
import { CompactStepper } from "@/components/onboarding/compact-stepper";
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

function OnboardingProfileCalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "1";
  const isHydrated = useHydrated();

  const { goalPlan, setGoalPlan } = useFoodStore();
  const { user, onboardingCompleted, setOnboardingStep } = useAuthStore();
  const demoStore = useOnboardingDemoStore();

  useEffect(() => {
    if (!isDemo && onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [isDemo, onboardingCompleted, router]);

  const [subStep, setSubStep] = useState<1 | 2>(1);

  const [manualUsername, setManualUsername] = useState<string | null>(null);
  const [manualFullName, setManualFullName] = useState<string | null>(null);
  const [manualGender, setManualGender] = useState<Gender | null>(null);
  const [manualAge, setManualAge] = useState<number | null>(null);
  const [manualHeightCm, setManualHeightCm] = useState<number | null>(null);
  const [manualCurrentWeightKg, setManualCurrentWeightKg] = useState<
    number | null
  >(null);
  const [manualActivityLevel, setManualActivityLevel] =
    useState<ActivityLevel | null>(null);

  const activeSource = isDemo ? demoStore : goalPlan;

  const usernameInput =
    manualUsername ??
    (isHydrated
      ? isDemo
        ? demoStore.username
        : user?.username || ""
      : "");
  const fullNameInput =
    manualFullName ??
    (isHydrated
      ? isDemo
        ? demoStore.fullName
        : user?.fullName || ""
      : "");
  const gender: Gender =
    manualGender ?? (isHydrated ? activeSource.gender || "male" : "male");
  const age: number = manualAge ?? (isHydrated ? activeSource.age || 24 : 24);
  const heightCm: number =
    manualHeightCm ?? (isHydrated ? activeSource.heightCm || 172 : 172);
  const currentWeightKg: number =
    manualCurrentWeightKg ??
    (isHydrated ? activeSource.currentWeightKg || 75 : 75);
  const activityLevel: ActivityLevel =
    manualActivityLevel ??
    (isHydrated ? activeSource.activityLevel || "moderate" : "moderate");

  const [usernameError, setUsernameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleStep1Next = async () => {
    const rawUsername = usernameInput.trim();
    const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (!isDemo) {
      if (!rawUsername) {
        setUsernameError("Username wajib diisi (minimal 3 karakter).");
        return;
      }
      if (cleanUsername.length < 3) {
        setUsernameError("Username minimal 3 karakter (huruf, angka, atau _).");
        return;
      }
    } else if (rawUsername && cleanUsername.length < 3) {
      setUsernameError("Username minimal 3 karakter (huruf, angka, atau _).");
      return;
    }

    setUsernameError("");

    if (isDemo) {
      setSubStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const check = await checkUsernameAvailabilityAction(cleanUsername);
      if (!check.available) {
        setUsernameError(check.error || "Username sudah digunakan.");
        setSubmitting(false);
        return;
      }

      const updateRes = await updateUsernameAction(
        cleanUsername,
        fullNameInput.trim(),
      );
      if (!updateRes.success) {
        setUsernameError(
          updateRes.error || "Gagal menyimpan username. Silakan coba lagi.",
        );
        setSubmitting(false);
        return;
      }

      useAuthStore.setState((s) => ({
        user: s.user
          ? {
              ...s.user,
              username: cleanUsername,
              fullName: fullNameInput.trim() || s.user.fullName,
            }
          : null,
      }));

      setSubmitting(false);
      setSubStep(2);
    } catch (err) {
      setUsernameError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan profil.",
      );
      setSubmitting(false);
    }
  };

  const handleFinishProfile = () => {
    const cleanUsername = usernameInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    if (isDemo) {
      demoStore.setDemoData({
        fullName: fullNameInput.trim(),
        username: cleanUsername,
        gender,
        age,
        heightCm,
        currentWeightKg,
        activityLevel,
        bmiScore: bmiAnalysis.score,
        bmiCategory: bmiAnalysis.category,
        hasSelectedGoal:
          bmiAnalysis.category === demoStore.bmiCategory
            ? demoStore.hasSelectedGoal
            : false,
      });
      router.push("/onboarding/goal?demo=1");
      return;
    }

    setGoalPlan({
      gender,
      age,
      heightCm,
      currentWeightKg,
      activityLevel,
      bmiScore: bmiAnalysis.score,
      bmiCategory: bmiAnalysis.category,
    });
    setOnboardingStep(2);
    router.push("/onboarding/goal");
  };

  const bmiLabel =
    BMI_CATEGORY_LABELS[bmiAnalysis.category] || bmiAnalysis.category;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-4 sm:py-8 pb-24 space-y-4">
      {isDemo && <OnboardingDemoBanner />}
      <OnboardingStepper currentStep={1} />

      <div className="text-center space-y-1">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Bagian {subStep} dari 2
        </span>
        <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
          {subStep === 1 ? "Data Diri & Tubuh" : "Aktivitas Harian"}
        </h1>
      </div>

      {subStep === 1 ? (
        <>
          <div className="rounded-2xl border border-border-divider bg-surface p-4 sm:p-5 space-y-4">
            {/* Identitas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3.5 border-b border-border-divider">
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
                  className="input-field mt-1 w-full px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="onboarding-username"
                  className="block text-xs sm:text-sm font-bold text-text-primary"
                >
                  Username{" "}
                  {!isDemo && <span className="text-destructive">*</span>}
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
                  }}
                  placeholder="nama_pengguna"
                  aria-invalid={Boolean(usernameError)}
                  className={cn(
                    "input-field mt-1 w-full px-3 py-2 text-sm",
                    usernameError &&
                      "border-destructive focus-visible:outline-destructive",
                  )}
                />
                {usernameError && (
                  <p
                    role="alert"
                    className="mt-1 text-xs font-semibold text-destructive"
                  >
                    {usernameError}
                  </p>
                )}
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-1.5">
              <span className="block text-xs sm:text-sm font-bold text-text-primary">
                Jenis Kelamin
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={gender === "male"}
                  onClick={() => setManualGender("male")}
                  className={cn(
                    "min-h-[42px] py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer",
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
                  onClick={() => setManualGender("female")}
                  className={cn(
                    "min-h-[42px] py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer",
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
                onChange={setManualAge}
              />

              <CompactStepper
                label="Tinggi"
                unit="cm"
                value={heightCm}
                min={100}
                max={250}
                step={1}
                onChange={setManualHeightCm}
              />

              <div className="sm:col-span-2">
                <CompactStepper
                  label="Berat Saat Ini"
                  unit="kg"
                  value={currentWeightKg}
                  min={30}
                  max={250}
                  step={0.5}
                  subLabel={`Normal: ${bmiAnalysis.healthyWeightRange.min}–${bmiAnalysis.healthyWeightRange.max} kg`}
                  onChange={setManualCurrentWeightKg}
                />
              </div>
            </div>
          </div>

          <OnboardingActionBar
            onNext={handleStep1Next}
            nextLoading={submitting}
            nextLoadingLabel="Memeriksa..."
          />
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-border-divider bg-surface p-4 sm:p-5 space-y-4">
            {/* Aktivitas Harian */}
            <div className="space-y-1.5">
              {ACTIVITY_OPTIONS.map((option) => {
                const isSelected = activityLevel === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setManualActivityLevel(option.key)}
                    className={cn(
                      "w-full min-h-[42px] text-left py-2 px-3.5 rounded-xl border text-xs sm:text-sm transition-colors flex items-center justify-between gap-2 cursor-pointer",
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

            {/* Hasil BMI, BMR, TDEE */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-divider">
                <span className="text-[11px] font-semibold text-text-muted block">
                  BMI
                </span>
                <p className="font-heading text-lg sm:text-xl font-extrabold text-text-primary tabular-nums mt-0.5">
                  {bmiAnalysis.score}
                </p>
                <span className="text-[11px] font-semibold text-neutral-10 block">
                  {bmiLabel}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-divider">
                <span className="text-[11px] font-semibold text-text-muted block">
                  BMR
                </span>
                <p className="font-heading text-lg sm:text-xl font-extrabold text-text-primary tabular-nums mt-0.5">
                  {bmr}
                </p>
                <span className="text-[11px] text-text-muted block">
                  kkal/hari
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-divider">
                <span className="text-[11px] font-semibold text-text-muted block">
                  TDEE
                </span>
                <p className="font-heading text-lg sm:text-xl font-extrabold text-text-primary tabular-nums mt-0.5">
                  {tdee}
                </p>
                <span className="text-[11px] text-text-muted block">
                  kkal/hari
                </span>
              </div>
            </div>
          </div>

          <OnboardingActionBar
            onBack={() => setSubStep(1)}
            onNext={handleFinishProfile}
          />
        </>
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
