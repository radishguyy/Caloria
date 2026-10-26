"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useAuthStore } from "@/store/use-auth-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { PET_SPECIES, PetSpeciesId } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function OnboardingAdoptPetPage() {
  const router = useRouter();
  const { setSpecies, setPetName, name, species } = usePetStore();
  const { completeOnboarding } = useAuthStore();

  const [selectedSpecies, setSelectedSpecies] = useState<PetSpeciesId>(species || "flameling");
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
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-6">
      <OnboardingStepper currentStep={4} />

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Langkah 4: Adopsi Virtual Pet Pertamamu
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted max-w-lg mx-auto">
          Pilih telur/karakter pet awal sebagai teman seperjalanan selama masa program misi nutrisimu dan berikan nama terbaik!
        </p>
      </div>

      {/* Starting Pet Species Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        {PET_SPECIES.map((spec) => {
          const isSelected = selectedSpecies === spec.id;
          return (
            <div
              key={spec.id}
              onClick={() => setSelectedSpecies(spec.id)}
              className={cn(
                "p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-2.5 shadow-xs relative",
                isSelected
                  ? "border-brand-orange bg-highlight/60 ring-2 ring-brand-orange/20"
                  : "border-warm-border bg-card hover:bg-brand-green-light/20"
              )}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-orange text-ink">
                  Dipilih
                </span>
              )}

              {/* Egg / Pet Avatar Preview */}
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center text-3xl shadow-md transition-transform"
                style={{ backgroundColor: `${spec.color}25` }}
              >
                {spec.id === "flameling" ? "🔥" : spec.id === "bloomie" ? "🌱" : "💧"}
              </div>

              <div>
                <h3 className="text-sm font-bold text-ink">{spec.name}</h3>
                <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-wider">
                  Elemen {spec.element}
                </span>
              </div>

              <p className="text-[11px] text-ink-muted leading-tight">
                {spec.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pet Naming Form */}
      <div className="rounded-3xl border border-warm-border bg-card p-6 shadow-card space-y-3.5">
        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Heart className="h-4 w-4 text-brown" />
          <span>Beri Nama Teman Pet Kamu:</span>
        </label>
        <input
          type="text"
          value={petNickname}
          onChange={(e) => setPetNickname(e.target.value)}
          placeholder="misal: Pyro, Leafy, Splash..."
          maxLength={25}
          className="w-full field rounded-2xl px-4 py-3 text-base font-bold text-ink outline-none"
        />
        <p className="text-[11px] text-ink-muted">
          Pet ini akan menemani setiap waktu makan, menyemangati target protein, dan bertambah kuat seiring konsistensimu!
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/onboarding/projection"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 btn-ghost min-h-0 px-4 py-2.5 text-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>

        <button
          onClick={handleFinish}
          disabled={loading || !petNickname.trim()}
          className="btn-cta text-sm"
        >
          <span>{loading ? "Menyiapkan Dashboard..." : "Selesaikan Onboarding & Masuk"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

