"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useFoodStore } from "@/store/use-food-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { CharacterSvg } from "@/components/pet/character-svg";
import { PET_SPECIES, PetSpeciesId } from "@/lib/constants";
import { saveOnboardingAction } from "@/app/actions/onboarding";
import { cn } from "@/lib/utils";

export default function OnboardingAdoptPetPage() {
  const router = useRouter();
  const { setSpecies, setPetName, name, species } = usePetStore();
  const { completeOnboarding } = useAuthStore();
  const { goalPlan, targets } = useFoodStore();

  const [selectedSpecies, setSelectedSpecies] = useState<PetSpeciesId>(
    species || "flameling"
  );
  const [petNickname, setPetNickname] = useState(name || "Pyro");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentPetSpec =
    PET_SPECIES.find((s) => s.id === selectedSpecies) || PET_SPECIES[0];

  const handleOpenConfirm = () => {
    if (!petNickname.trim()) return;
    setShowConfirmModal(true);
  };

  const handleFinish = async () => {
    if (!petNickname.trim()) return;

    setLoading(true);
    setErrorMsg("");

    // Map store activity level string to schema enum
    const activityMap: Record<
      string,
      "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active"
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
      // Persist onboarding & pet directly into Supabase database
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
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-5">
      <OnboardingStepper currentStep={5} />

      <div className="text-center space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary font-heading">
          Langkah 5: Adopsi Virtual Pet Pertamamu
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Pilih salah satu dari 12 karakter pet chibi awal sebagai teman seperjalanan selama masa program nutrisimu dan berikan nama terbaik!
        </p>
      </div>

      {/* Starting Pet Species Selection (All 12 Chibi Characters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
        {PET_SPECIES.map((spec) => {
          const isSelected = selectedSpecies === spec.id;
          return (
            <div
              key={spec.id}
              onClick={() => setSelectedSpecies(spec.id)}
              className={cn(
                "p-3 rounded-card border cursor-pointer transition-all flex flex-col items-center text-center space-y-1.5 shadow-2xs relative",
                isSelected
                  ? "border-accent-orange bg-accent-yellow/50 ring-2 ring-accent-orange/25"
                  : "border-border-divider bg-surface hover:bg-surface-subtle"
              )}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-pill text-[9px] font-bold bg-accent-orange text-text-inverse">
                  Dipilih
                </span>
              )}

              {/* Modular SVG Pet Avatar Preview */}
              <div
                className="h-20 w-20 rounded-button flex items-center justify-center p-1 transition-transform"
                style={{ backgroundColor: `${spec.color}20` }}
              >
                <CharacterSvg
                  characterId={spec.id}
                  showRoomBackdrop={false}
                />
              </div>

              <div>
                <h3 className="text-xs font-bold text-text-primary">{spec.name}</h3>
                <span className="text-[9px] uppercase font-semibold text-text-muted tracking-wider">
                  Elemen {spec.element}
                </span>
              </div>

              <p className="text-[10px] text-text-muted leading-tight line-clamp-2">
                {spec.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pet Naming Form */}
      <div className="rounded-card border border-border-divider bg-surface p-4 sm:p-5 space-y-2.5 shadow-xs">
        <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <Heart className="h-4 w-4 text-macro-fat" />
          <span>Beri Nama Teman Pet Kamu:</span>
        </label>
        <input
          type="text"
          value={petNickname}
          onChange={(e) => setPetNickname(e.target.value)}
          placeholder="misal: Pyro, Sprout, Splash..."
          maxLength={25}
          className="input-field w-full px-3.5 py-2.5 text-sm sm:text-base font-bold"
        />
        <p className="text-[11px] text-text-muted">
          Pet ini akan menemani setiap waktu makan, menyemangati target nutrisi harianmu, dan bertambah kuat seiring konsistensimu!
        </p>
      </div>

      {/* Bottom Nav Buttons */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/onboarding/nutrition-plan"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-accent-green-light text-text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleOpenConfirm}
          disabled={!petNickname.trim()}
          className="button-primary inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm"
        >
          <span>Selesaikan Onboarding</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-surface border border-border-default rounded-card p-5 sm:p-6 shadow-xl space-y-4 text-center">
            {/* Close Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Pet Chibi Preview In Modal */}
            <div className="space-y-2">
              <div
                className="w-24 h-24 mx-auto rounded-button flex items-center justify-center p-2 shadow-inner"
                style={{ backgroundColor: `${currentPetSpec.color}25` }}
              >
                <CharacterSvg
                  characterId={currentPetSpec.id}
                  showRoomBackdrop={false}
                />
              </div>

              <div>
                <h3 className="text-lg font-black text-text-primary font-heading flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent-orange" />
                  <span>{petNickname.trim()}</span>
                </h3>
                <p className="text-xs text-text-muted">
                  Spesies: <strong className="text-text-primary">{currentPetSpec.name}</strong> (Elemen {currentPetSpec.element})
                </p>
              </div>
            </div>

            {/* Explanation box */}
            <div className="p-3 rounded-navigation bg-surface-subtle border border-border-default text-xs text-text-muted text-left space-y-1">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <CheckCircle2 className="w-4 h-4 text-accent-green shrink-0" />
                <span>Siap Memulai Perjalanan!</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Apakah kamu sudah yakin dengan karakter pet dan nama panggilan ini? Kamu akan langsung diarahkan ke Dashboard utama Caloria.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-button border border-border-default text-xs font-bold text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors disabled:opacity-50"
              >
                Ubah Pet
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="flex-1 button-primary py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span>Adopsi & Mulai</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
