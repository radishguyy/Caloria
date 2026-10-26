"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useAuthStore } from "@/store/use-auth-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { CharacterSvg } from "@/components/pet/character-svg";
import { PET_SPECIES, PetSpeciesId } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function OnboardingAdoptPetPage() {
  const router = useRouter();
  const { setSpecies, setPetName, name, species } = usePetStore();
  const { completeOnboarding } = useAuthStore();

  const [selectedSpecies, setSelectedSpecies] = useState<PetSpeciesId>(
    species || "flameling"
  );
  const [petNickname, setPetNickname] = useState(name || "Pyro");
  const [loading, setLoading] = useState(false);

  const handleFinish = () => {
    if (!petNickname.trim()) return;

    setLoading(true);
    setSpecies(selectedSpecies);
    setPetName(petNickname.trim());
    completeOnboarding();

    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-6">
      <OnboardingStepper currentStep={4} />

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading">
          Langkah 4: Adopsi Virtual Pet Pertamamu
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Pilih salah satu dari 12 karakter pet chibi awal sebagai teman seperjalanan selama masa program misi nutrisimu dan berikan nama terbaik!
        </p>
      </div>

      {/* Starting Pet Species Selection (All 12 Chibi Characters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
        {PET_SPECIES.map((spec) => {
          const isSelected = selectedSpecies === spec.id;
          return (
            <div
              key={spec.id}
              onClick={() => setSelectedSpecies(spec.id)}
              className={cn(
                "p-4 rounded-card border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-2 shadow-xs relative",
                isSelected
                  ? "border-accent-orange bg-accent-yellow/50 ring-2 ring-accent-orange/20"
                  : "border-border-divider bg-surface hover:bg-surface-subtle"
              )}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-pill text-[9px] font-bold bg-accent-orange text-text-inverse">
                  Dipilih
                </span>
              )}

              {/* Modular SVG Pet Avatar Preview */}
              <div
                className="h-24 w-24 rounded-button flex items-center justify-center p-1.5 transition-transform"
                style={{ backgroundColor: `${spec.color}20` }}
              >
                <CharacterSvg
                  characterId={spec.id}
                  showRoomBackdrop={false}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-primary">{spec.name}</h3>
                <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                  Elemen {spec.element}
                </span>
              </div>

              <p className="text-[11px] text-neutral-10 leading-tight line-clamp-2">
                {spec.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pet Naming Form */}
      <div className="rounded-card border border-border-divider bg-surface p-6 space-y-3.5 shadow-xs">
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
          className="input-field w-full px-4 py-3 text-base font-bold"
        />
        <p className="text-[11px] text-text-muted">
          Pet ini akan menemani setiap waktu makan, menyemangati target protein, dan bertambah kuat seiring konsistensimu!
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/onboarding/projection"
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-accent-green-light text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleFinish}
          disabled={loading || !petNickname.trim()}
          className="button-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm"
        >
          <span>
            {loading ? "Menyiapkan Dashboard..." : "Selesaikan Onboarding & Masuk"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
