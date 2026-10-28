"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingDown,
  Scale,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useWeightStore } from "@/store/use-weight-store";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { NutritionStatsCard } from "@/components/profile/NutritionStatsCard";
import { calculateBmi } from "@/lib/nutrition-calculator";

export default function ProfileOverviewPage() {
  const isHydrated = useHydrated();
  const { goalPlan, setGoalPlan } = useFoodStore();
  const { weightLogs, addWeightLog, getLatestWeight } = useWeightStore();
  const {
    species,
    name,
    level,
    stage,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
  } = usePetStore();
  const { equipped } = useCosmeticsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState<number>(getLatestWeight());
  const [newNotes, setNewNotes] = useState("");

  const latestWeight = getLatestWeight();
  const currentBmi = calculateBmi(goalPlan.heightCm, latestWeight);
  const remainingWeightDiff = Math.round(
    Math.abs(latestWeight - goalPlan.targetWeightKg) * 10
  ) / 10;
  const isTargetAchieved =
    latestWeight <= goalPlan.targetWeightKg && goalPlan.goalType === "diet";

  // Chart data calculations
  const minW =
    Math.min(goalPlan.targetWeightKg, ...weightLogs.map((w) => w.weightKg)) - 1;
  const maxW =
    Math.max(goalPlan.currentWeightKg, ...weightLogs.map((w) => w.weightKg)) + 1;
  const range = Math.max(1, maxW - minW);

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || newWeight <= 0) return;

    addWeightLog(newWeight, newNotes);

    setGoalPlan({
      currentWeightKg: newWeight,
      bmiScore: currentBmi.score,
      bmiCategory: currentBmi.category,
    });

    setModalOpen(false);
    setNewNotes("");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Progres & Riwayat Berat Badan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1 ml-8 sm:ml-0">
            Pantau perubahan berat badan secara berkala menuju target program {goalPlan.totalProjectedDays} hari.
          </p>
        </div>

        <button
          onClick={() => {
            setNewWeight(latestWeight);
            setModalOpen(true);
          }}
          className="button-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs self-start sm:self-auto"
        >
          <Scale className="h-4 w-4" />
          <span>+ Update Timbangan Hari Ini</span>
        </button>
      </div>

      {/* Sub-Tabs: Overview vs Achievements vs Settings */}
      <div className="flex items-center gap-2 border-b border-border-divider pb-2">
        <Link
          href="/profile/overview"
          aria-current="page"
          className="nav-item is-selected px-4 py-2 text-xs font-bold"
        >
          Overview & Berat Badan
        </Link>
        <Link
          href="/profile/achievements"
          className="nav-item px-4 py-2 text-xs font-semibold text-neutral-10"
        >
          Galeri Achievement
        </Link>
        <Link
          href="/profile/settings"
          className="nav-item px-4 py-2 text-xs font-semibold text-neutral-10"
        >
          Pengaturan Notifikasi
        </Link>
      </div>

      {/* Companion Virtual Pet Avatar Card */}
      <div className="p-4 sm:p-5 rounded-card border border-accent-green/25 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-navigation bg-surface-subtle border border-border-divider p-1 shrink-0 overflow-hidden">
            {isHydrated ? (
              <AvatarRenderer
                characterId={species}
                colors={customColors}
                earsVariant={earsVariant}
                tailVariant={tailVariant}
                faceVariant={faceVariant}
                equipped={equipped}
                showRoomBackdrop={false}
                size={64}
                className="w-full h-full drop-shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface-subtle animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-base font-extrabold text-text-primary font-heading"
                suppressHydrationWarning
              >
                {isHydrated ? name : "Pyro"}
              </h2>
              <span
                className="px-2 py-0.5 rounded-pill text-[10px] font-bold bg-accent-orange text-text-inverse"
                suppressHydrationWarning
              >
                Lv. {isHydrated ? level : 4} • Tahap {isHydrated ? stage : 2}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Virtual pet pendamping nutrisi harianmu. Semua kustomisasi pakaian, warna, dan aksesoris tersimpan sinkron.
            </p>
          </div>
        </div>

        <Link
          href="/pet-customization/wardrobe"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-primary text-xs font-bold transition-colors shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent-green" />
          <span>Kustomisasi di Wardrobe</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Clinical Biometrics & Health Benchmark Card */}
      <NutritionStatsCard />

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-5 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted">Berat Terkini</span>
          <p className="text-2xl font-extrabold text-text-primary font-heading">
            {latestWeight} kg
          </p>
          <p className="text-[10px] text-text-muted">
            Target: <strong className="text-text-primary">{goalPlan.targetWeightKg} kg</strong>
          </p>
        </div>

        <div className="p-5 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted">Status BMI</span>
          <p className="text-2xl font-extrabold text-text-primary font-heading">
            {currentBmi.score}
          </p>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-pill bg-accent-green/15 text-text-primary inline-block">
            {currentBmi.category}
          </span>
        </div>

        <div className="p-5 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted">Selisih ke Target</span>
          <p className="text-2xl font-extrabold text-text-primary font-heading">
            {remainingWeightDiff} kg
          </p>
          <p className="text-[10px] text-text-muted">
            {isTargetAchieved ? "Target telah tercapai!" : "Terus jaga defisit/surplus"}
          </p>
        </div>

        <div className="p-5 rounded-card border border-border-divider bg-surface shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-muted">Waktu Program</span>
          <p className="text-2xl font-extrabold text-text-primary font-heading">
            Hari ke-{goalPlan.currentDayNumber}
          </p>
          <p className="text-[10px] text-text-muted">
            dari total {goalPlan.totalProjectedDays} hari misi
          </p>
        </div>
      </div>

      {/* Weight History Visual Chart Abstraction */}
      <div className="rounded-card border border-border-divider bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border-divider">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-accent-green" />
              <span>Grafik Riwayat Perubahan Berat Badan</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Menampilkan garis tren berat badan aktual menuju target {goalPlan.targetWeightKg} kg.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-neutral-10 font-medium">
              <span className="h-2.5 w-2.5 rounded-pill bg-accent-orange" />
              Aktual
            </span>
            <span className="flex items-center gap-1.5 text-neutral-10 font-medium">
              <span className="h-0.5 w-3 bg-accent-green border-dashed" />
              Garis Target ({goalPlan.targetWeightKg} kg)
            </span>
          </div>
        </div>

        {/* SVG Line / Bar Chart Abstraction */}
        <div className="w-full h-52 sm:h-64 relative flex items-end justify-between gap-2 pt-6 pb-4 px-2">
          {/* Target Weight Horizontal Guideline */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-accent-green/70 z-0 pointer-events-none"
            style={{
              bottom: `${((goalPlan.targetWeightKg - minW) / range) * 80 + 10}%`,
            }}
          >
            <span className="absolute -top-4 right-2 text-[10px] font-bold text-text-primary bg-accent-yellow px-2 py-0.5 rounded-pill border border-accent-green/30">
              Target: {goalPlan.targetWeightKg} kg
            </span>
          </div>

          {/* Plotted Points & Bars */}
          {weightLogs.map((entry) => {
            const heightPercent = Math.max(
              15,
              Math.min(95, ((entry.weightKg - minW) / range) * 80 + 10)
            );

            return (
              <div
                key={entry.id}
                className="flex-1 flex flex-col items-center justify-end h-full relative group z-10"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-text-primary text-text-inverse text-[10px] font-bold px-2.5 py-1 rounded-input pointer-events-none whitespace-nowrap shadow-md">
                  {entry.weightKg} kg • {entry.date}
                </div>

                {/* Point Bubble */}
                <div
                  className="w-4 h-4 rounded-pill bg-accent-orange border-2 border-surface shadow-xs transition-transform group-hover:scale-125 mb-1"
                  style={{ marginBottom: `${heightPercent - 10}%` }}
                />

                {/* Vertical Stem */}
                <div
                  className="w-1.5 rounded-pill bg-accent-green/25 group-hover:bg-accent-green/50 transition-colors"
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Date Label */}
                <span className="text-[10px] text-text-muted mt-2 truncate max-w-[60px]">
                  {entry.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Logs Table */}
      <div className="rounded-card border border-border-divider bg-surface p-6 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Log Riwayat Penimbangan:
        </h3>
        <div className="divide-y divide-border-divider/60 max-h-[220px] overflow-y-auto">
          {weightLogs
            .slice()
            .reverse()
            .map((log) => (
              <div
                key={log.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-text-primary">{log.weightKg} kg</span>
                  <p className="text-[11px] text-text-muted">{log.notes}</p>
                </div>
                <span className="text-[11px] text-text-muted font-mono">
                  {log.date}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* [Modal] Update Berat Badan Berkala */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-card border border-border-divider bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border-divider">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-accent-green" />
                <h3 className="text-base font-bold text-text-primary">
                  Update Berat Badan
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWeight} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-text-muted">
                  Berat Badan Terkini (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                  required
                  className="input-field mt-1 w-full px-4 py-2.5 text-base font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Setelah olahraga pagi, perut kosong"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="input-field mt-1 w-full px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-surface-subtle text-neutral-10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="button-primary py-2.5 text-xs"
                >
                  Simpan Timbangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
