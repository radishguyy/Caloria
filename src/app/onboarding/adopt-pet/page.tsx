"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useFoodStore } from "@/store/use-food-store";
import { useOnboardingDemoStore } from "@/store/use-onboarding-demo-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingDemoBanner } from "@/components/onboarding/onboarding-demo-banner";
import { CharacterSvg } from "@/components/pet/character-svg";
import { PET_SPECIES, PetSpeciesId } from "@/lib/constants";
import { saveOnboardingAction } from "@/app/actions/onboarding";
import { cn } from "@/lib/utils";

function OnboardingAdoptPetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "1";
  const isHydrated = useHydrated();

  const { setSpecies, setPetName, name, species } = usePetStore();
  const { completeOnboarding, onboardingCompleted } = useAuthStore();
  const { goalPlan, targets } = useFoodStore();
  const demoStore = useOnboardingDemoStore();
  const demoSyncedRef = useRef(false);

  useEffect(() => {
    if (!isDemo && onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [isDemo, onboardingCompleted, router]);

  const [selectedSpecies, setSelectedSpecies] = useState<PetSpeciesId>(
    isDemo ? demoStore.petSpecies : species || "flameling",
  );
  const [petNickname, setPetNickname] = useState(
    isDemo ? demoStore.petNickname : name || "Pyro",
  );
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isDemo || !isHydrated || demoSyncedRef.current) return;
    demoSyncedRef.current = true;
    setSelectedSpecies(demoStore.petSpecies);
    setPetNickname(demoStore.petNickname);
  }, [isDemo, isHydrated, demoStore.petSpecies, demoStore.petNickname]);

  useEffect(() => {
    if (!showConfirmModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        setShowConfirmModal(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirmModal, loading]);

  const currentPetSpec =
    PET_SPECIES.find((s) => s.id === selectedSpecies) || PET_SPECIES[0];

  const handleOpenConfirm = () => {
    if (!petNickname.trim()) return;
    if (isDemo) {
      demoStore.setDemoData({
        petSpecies: selectedSpecies,
        petNickname: petNickname.trim(),
      });
    }
    setShowConfirmModal(true);
  };

  const handleFinish = async () => {
    if (!petNickname.trim()) return;

    if (isDemo) {
      setShowConfirmModal(false);
      demoStore.resetDemo();
      router.push("/profile/settings");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const activityMap: Record<
      string,
      | "sedentary"
      | "lightly_active"
      | "moderately_active"
      | "very_active"
      | "extra_active"
    > = {
      sedentary: "sedentary",
      light: "lightly_active",
      moderate: "moderately_active",
      active: "very_active",
      very_active: "extra_active",
    };

    const targetActivity =
      activityMap[goalPlan.activityLevel] || "moderately_active";

    try {
      await saveOnboardingAction({
        goal: goalPlan.goalType,
        gender: goalPlan.gender,
        heightCm: goalPlan.heightCm,
        initialWeightKg: goalPlan.currentWeightKg,
        currentWeightKg: goalPlan.currentWeightKg,
        targetWeightKg: goalPlan.targetWeightKg,
        activityLevel: targetActivity,
        bmiScore: goalPlan.bmiScore,
        tdeeKcal: targets.calories,
        targetCaloriesKcal: targets.calories,
        targetProteinG: targets.protein,
        targetCarbsG: targets.carbs,
        targetFatG: targets.fat,
        projectedDays: goalPlan.totalProjectedDays,
        petSpecies: selectedSpecies,
        petName: petNickname.trim(),
      });
    } catch (err) {
      console.warn("DB saveOnboarding error:", err);
    }

    setSpecies(selectedSpecies);
    setPetName(petNickname.trim());
    completeOnboarding();
    setShowConfirmModal(false);
    router.push("/dashboard");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-6">
      {isDemo && <OnboardingDemoBanner />}
      <OnboardingStepper currentStep={5} />

      <div className="text-center">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Pilih CalPal
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {PET_SPECIES.map((spec) => {
          const isSelected = selectedSpecies === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedSpecies(spec.id)}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-colors flex flex-col items-center text-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary",
                isSelected
                  ? "border-accent-green bg-accent-green/8 ring-2 ring-accent-green/25"
                  : "border-border-divider bg-surface hover:bg-surface-subtle",
              )}
            >
              <div
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl flex items-center justify-center p-1.5"
                style={{ backgroundColor: `${spec.color}1F` }}
              >
                <CharacterSvg characterId={spec.id} showRoomBackdrop={false} />
              </div>

              <span className="text-sm font-bold text-text-primary">
                {spec.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border-divider bg-surface p-4 sm:p-5 space-y-2">
        <label
          htmlFor="onboarding-pet-name"
          className="block text-xs sm:text-sm font-bold text-text-primary"
        >
          Nama CalPal
        </label>
        <input
          id="onboarding-pet-name"
          type="text"
          value={petNickname}
          onChange={(e) => setPetNickname(e.target.value)}
          placeholder="Nama panggilan"
          maxLength={25}
          className="input-field w-full px-3.5 py-2.5 text-sm sm:text-base font-bold"
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href={
            isDemo
              ? "/onboarding/nutrition-plan?demo=1"
              : "/onboarding/nutrition-plan"
          }
          className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl border border-border-default bg-surface text-xs sm:text-sm font-bold text-neutral-10 hover:bg-surface-subtle transition-colors"
        >
          Kembali
        </Link>

        <button
          type="button"
          onClick={handleOpenConfirm}
          disabled={!petNickname.trim()}
          className="inline-flex min-h-[44px] items-center justify-center px-7 py-2.5 rounded-xl bg-accent-green text-text-inverse text-xs sm:text-sm font-bold hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Selesai
        </button>
      </div>

      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-adopt-pet-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-sm bg-surface border border-border-divider rounded-2xl p-6 space-y-5 text-center">
            <button
              type="button"
              aria-label="Tutup dialog"
              disabled={loading}
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>

            <div className="space-y-3 pt-2">
              <div
                className="w-28 h-28 mx-auto rounded-2xl flex items-center justify-center p-2"
                style={{ backgroundColor: `${currentPetSpec.color}20` }}
              >
                <CharacterSvg
                  characterId={currentPetSpec.id}
                  showRoomBackdrop={false}
                />
              </div>

              <h3
                id="confirm-adopt-pet-title"
                className="font-heading text-xl font-extrabold text-text-primary"
              >
                {petNickname.trim()}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmModal(false)}
                className="min-h-[44px] py-2.5 rounded-xl border border-border-default bg-surface text-xs sm:text-sm font-bold text-neutral-10 hover:bg-surface-subtle transition-colors disabled:opacity-50 cursor-pointer"
              >
                Ubah
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="min-h-[44px] py-2.5 rounded-xl bg-accent-green text-text-inverse text-xs sm:text-sm font-bold hover:bg-accent-green/90 transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Mulai</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingAdoptPetPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin mx-auto" />
        </div>
      }
    >
      <OnboardingAdoptPetContent />
    </Suspense>
  );
}
