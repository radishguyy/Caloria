"use client";

import { useState } from "react";
import {
  Activity,
  Scale,
  Flame,
  Zap,
  SlidersHorizontal,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  calculateClinicalBenchmarks,
  roundTo2,
  type BiologicalGender,
} from "@/lib/nutrition/calculations";
import {
  GOAL_PATH_LABELS,
  goalTypeToGoalPath,
  type GoalPath,
} from "@/lib/gamification/quest-engine";
import { cn } from "@/lib/utils";

interface NutritionStatsCardProps {
  className?: string;
}

export function NutritionStatsCard({ className }: NutritionStatsCardProps) {
  const isHydrated = useHydrated();
  const { goalPlan, setGoalPlan, setQuestProgression } = useFoodStore();

  const [isEditing, setIsEditing] = useState(false);
  const [weightInput, setWeightInput] = useState<number>(goalPlan.currentWeightKg || 76);
  const [heightInput, setHeightInput] = useState<number>(goalPlan.heightCm || 183);
  const [ageInput, setAgeInput] = useState<number>(goalPlan.age || 20);
  const [genderInput, setGenderInput] = useState<BiologicalGender>(
    goalPlan.gender || "male"
  );
  const [pathInput, setPathInput] = useState<GoalPath>(
    goalPlan.goalPath || goalTypeToGoalPath(goalPlan.goalType)
  );
  const [savedBanner, setSavedBanner] = useState(false);

  if (!isHydrated) {
    return (
      <div
        className={cn(
          "rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs",
          className
        )}
      >
        <div className="h-6 w-56 bg-surface-subtle animate-pulse rounded-navigation" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-card bg-surface-subtle animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const benchmarks = calculateClinicalBenchmarks({
    gender: goalPlan.gender,
    age: goalPlan.age,
    weightKg: goalPlan.currentWeightKg,
    heightCm: goalPlan.heightCm,
  });

  const weightVariance = roundTo2(goalPlan.currentWeightKg - benchmarks.bbiKg);
  const activeGoalPath =
    goalPlan.goalPath || goalTypeToGoalPath(goalPlan.goalType);

  const handleOpenEdit = () => {
    setWeightInput(goalPlan.currentWeightKg);
    setHeightInput(goalPlan.heightCm);
    setAgeInput(goalPlan.age);
    setGenderInput(goalPlan.gender);
    setPathInput(activeGoalPath);
    setIsEditing((prev) => !prev);
  };

  const handleSaveBiometrics = (e: React.FormEvent) => {
    e.preventDefault();
    const nextBbi = calculateClinicalBenchmarks({
      gender: genderInput,
      age: ageInput,
      weightKg: weightInput,
      heightCm: heightInput,
    }).bbiKg;

    setGoalPlan({
      currentWeightKg: Number(weightInput) || 70,
      targetWeightKg: nextBbi,
      heightCm: Number(heightInput) || 170,
      age: Number(ageInput) || 20,
      gender: genderInput,
      goalPath: pathInput,
    });
    setQuestProgression({ goalPath: pathInput });
    setIsEditing(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleApplyPakAndiPreset = () => {
    setWeightInput(76);
    setHeightInput(183);
    setAgeInput(20);
    setGenderInput("male");
    setGoalPlan({
      currentWeightKg: 76,
      targetWeightKg: 74.7,
      heightCm: 183,
      age: 20,
      gender: "male",
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <section
      aria-label="Kalkulator Gizi Klinis & Biometrik"
      className={cn(
        "rounded-card border border-border-default bg-[#FAF8F5] p-5 sm:p-6 shadow-xs space-y-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-divider">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#5B8E55]" />
            <h2 className="text-lg font-extrabold text-text-primary font-heading tracking-tight">
              Profil Biometrik & Benchmark Klinis
            </h2>
          </div>
          <p className="text-xs text-text-muted font-sans">
            Standar klinis WHO Asia-Pasifik (2000), Harris-Benedict BMR/TEE, dan Depkes RI
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleApplyPakAndiPreset}
            className="px-3 py-1.5 rounded-navigation border border-border-default bg-surface hover:bg-[#FCF8E3] text-text-primary text-xs font-semibold transition-colors font-sans cursor-pointer"
            title="Uji data Pak Andi (Pria, 20 thn, 76 kg, 183 cm)"
          >
            Preset Pak Andi
          </button>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="button-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold font-sans cursor-pointer"
            style={{ backgroundColor: "#5B8E55", color: "#FFFFFF" }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{isEditing ? "Tutup Editor" : "Ubah Biometrik"}</span>
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3 rounded-navigation bg-[#5B8E55]/15 border border-[#5B8E55]/40 text-xs font-bold text-text-primary flex items-center gap-2 font-sans">
          <Check className="h-4 w-4 text-[#5B8E55]" />
          <span>
            Biometrik & target nutrisi harian berhasil diperbarui secara otomatis!
          </span>
        </div>
      )}

      {/* Collapsible Biometric & Goal Path Editor */}
      {isEditing && (
        <form
          onSubmit={handleSaveBiometrics}
          className="p-4 sm:p-5 rounded-card bg-surface border border-border-default space-y-4 animate-in fade-in duration-200"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-muted font-sans">
                Berat Badan (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-bold rounded-navigation border border-border-default bg-surface font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-muted font-sans">
                Tinggi Badan (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={heightInput}
                onChange={(e) => setHeightInput(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-bold rounded-navigation border border-border-default bg-surface font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-muted font-sans">
                Usia (tahun)
              </label>
              <input
                type="number"
                value={ageInput}
                onChange={(e) => setAgeInput(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm font-bold rounded-navigation border border-border-default bg-surface font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-muted font-sans">
                Jenis Kelamin
              </label>
              <select
                value={genderInput}
                onChange={(e) => setGenderInput(e.target.value as BiologicalGender)}
                className="w-full px-3 py-2 text-sm font-bold rounded-navigation border border-border-default bg-surface font-sans"
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-muted font-sans">
              Jalur Misi Utama (RPG Goal Path)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(Object.keys(GOAL_PATH_LABELS) as GoalPath[]).map((pathKey) => {
                const info = GOAL_PATH_LABELS[pathKey];
                const selected = pathInput === pathKey;
                return (
                  <button
                    key={pathKey}
                    type="button"
                    onClick={() => setPathInput(pathKey)}
                    className={cn(
                      "p-3 rounded-navigation border text-left transition-all cursor-pointer",
                      selected
                        ? "bg-[#FCF8E3] border-[#FF9233] ring-1 ring-[#FF9233]/40"
                        : "bg-surface-subtle border-border-divider hover:bg-surface"
                    )}
                  >
                    <p className="text-xs font-bold text-text-primary font-heading">
                      {info.title}
                    </p>
                    <p className="text-[10px] text-text-muted font-sans mt-0.5">
                      {info.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
            {pathInput !== activeGoalPath && (
              <div className="p-3 rounded-navigation bg-amber-50 border border-amber-300 text-amber-900 text-xs font-sans flex items-start gap-2 mt-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Perhatian:</strong> Mengubah jalur quest akan <strong>mereset seluruh progres</strong> pada jalur sebelumnya (kembali ke Level 1 Minggu 1 dengan tanggal mulai hari ini).
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 rounded-navigation border border-border-default text-xs font-semibold text-text-muted hover:text-text-primary font-sans"
            >
              Batal
            </button>
            <button
              type="submit"
              className="button-primary px-5 py-1.5 text-xs font-bold font-sans cursor-pointer"
              style={{ backgroundColor: "#FF9233", color: "#FFFFFF" }}
            >
              Simpan & Hitung Ulang
            </button>
          </div>
        </form>
      )}

      {/* 3 Main Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. BBI (Berat Badan Ideal) */}
        <div className="rounded-card bg-surface p-5 border border-border-divider shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted font-sans uppercase tracking-wider">
              BBI (Berat Badan Ideal)
            </span>
            <Scale className="h-4 w-4 text-[#5B8E55]" />
          </div>

          <div>
            <p className="text-2xl font-black text-text-primary font-heading">
              {benchmarks.bbiKg} kg{" "}
              <span className="text-xs font-bold text-[#5B8E55] font-sans">
                (Idealmu)
              </span>
            </p>
            <p className="text-xs text-text-muted mt-1 font-sans">
              BB Saat Ini:{" "}
              <strong className="text-text-primary">
                {goalPlan.currentWeightKg} kg
              </strong>{" "}
              (
              {weightVariance === 0
                ? "Tepat Ideal"
                : weightVariance > 0
                ? `+${weightVariance} kg dari BBI`
                : `${weightVariance} kg dari BBI`}
              )
            </p>
          </div>

          <div className="text-[11px] text-text-muted pt-2 border-t border-border-divider font-sans">
            Rumus Broca: ({goalPlan.heightCm} - 100) × 0.9
          </div>
        </div>

        {/* 2. IMT (Indeks Massa Tubuh - WHO Asia-Pasifik) */}
        <div className="rounded-card bg-surface p-5 border border-border-divider shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted font-sans uppercase tracking-wider">
              Indeks Massa Tubuh (IMT)
            </span>
            <Sparkles className="h-4 w-4 text-[#FF9233]" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl font-black text-text-primary font-heading">
                {benchmarks.imt.imt}
              </span>
              <span
                className="px-3 py-0.5 rounded-pill text-xs font-bold text-white shadow-2xs font-sans"
                style={{ backgroundColor: benchmarks.imt.colorHex }}
              >
                {benchmarks.imt.imt} • {benchmarks.imt.category}
              </span>
            </div>
            <p className="text-xs text-text-muted font-sans">
              Status WHO Asia-Pasifik:{" "}
              <strong className="text-text-primary">
                {benchmarks.imt.labelId}
              </strong>
            </p>
          </div>

          <div className="text-[11px] text-text-muted pt-2 border-t border-border-divider font-sans">
            Normal Asia-Pasifik: 18.5 – 22.9 kg/m²
          </div>
        </div>

        {/* 3. BMR & TEE (Harris-Benedict) */}
        <div className="rounded-card bg-surface p-5 border border-border-divider shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted font-sans uppercase tracking-wider">
              Metabolisme BMR & TEE
            </span>
            <Flame className="h-4 w-4 text-[#FF9233]" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-navigation bg-[#FAF8F5] border border-border-divider">
              <span className="text-[10px] font-bold text-text-muted block font-sans">
                BMR (Batas Dasar)
              </span>
              <span className="text-base font-extrabold text-text-primary font-heading">
                {benchmarks.bmrKcal}
              </span>
              <span className="text-[10px] text-text-muted ml-1 font-sans">
                kkal
              </span>
            </div>

            <div className="p-2.5 rounded-navigation bg-[#FCF8E3] border border-[#FF9233]/30">
              <span className="text-[10px] font-bold text-text-primary block font-sans">
                TEE (Aktif ×1.3)
              </span>
              <span className="text-base font-extrabold text-text-primary font-heading">
                {benchmarks.teeKcal}
              </span>
              <span className="text-[10px] text-text-muted ml-1 font-sans">
                kkal
              </span>
            </div>
          </div>

          <div className="text-[11px] text-text-muted pt-2 border-t border-border-divider font-sans flex items-center justify-between">
            <span>Baseline Makro TEE:</span>
            <span className="font-bold text-text-primary">
              P: {benchmarks.baselineMacros.proteinGrams}g • L:{" "}
              {benchmarks.baselineMacros.fatGrams}g • K:{" "}
              {benchmarks.baselineMacros.carbGrams}g
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

