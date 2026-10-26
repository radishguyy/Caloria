"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingDown,
  Scale,
  ArrowLeft,
  X,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useWeightStore } from "@/store/use-weight-store";
import { calculateBmi } from "@/lib/nutrition-calculator";

export default function ProfileOverviewPage() {
  const { goalPlan, setGoalPlan } = useFoodStore();
  const { weightLogs, addWeightLog, getLatestWeight } = useWeightStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState<number>(getLatestWeight());
  const [newNotes, setNewNotes] = useState("");

  const latestWeight = getLatestWeight();
  const currentBmi = calculateBmi(goalPlan.heightCm, latestWeight);
  const remainingWeightDiff = Math.round(Math.abs(latestWeight - goalPlan.targetWeightKg) * 10) / 10;
  const isTargetAchieved = latestWeight <= goalPlan.targetWeightKg && goalPlan.goalType === "diet";

  // Chart data calculations
  const minW = Math.min(goalPlan.targetWeightKg, ...weightLogs.map((w) => w.weightKg)) - 1;
  const maxW = Math.max(goalPlan.currentWeightKg, ...weightLogs.map((w) => w.weightKg)) + 1;
  const range = Math.max(1, maxW - minW);

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || newWeight <= 0) return;

    addWeightLog(newWeight, newNotes);

    // Update goalPlan current weight & re-evaluate BMI
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="btn-icon h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Progres & Riwayat Berat Badan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 ml-8 sm:ml-0">
            Pantau perubahan berat badan secara berkala menuju target program {goalPlan.totalProjectedDays} hari.
          </p>
        </div>

        <button
          onClick={() => {
            setNewWeight(latestWeight);
            setModalOpen(true);
          }}
          className="btn-cta inline-flex items-center gap-2 self-start px-5 py-2.5 text-xs sm:self-auto"
        >
          <Scale className="h-4 w-4" />
          <span>+ Update Timbangan Hari Ini</span>
        </button>
      </div>

      {/* Sub-Tabs: Overview vs Achievements vs Settings */}
      <div className="flex items-center gap-2 border-b border-warm-border pb-1">
        <Link
          href="/profile/overview"
          className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-ink"
        >
          Overview & Berat Badan
        </Link>
        <Link
          href="/profile/achievements"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
        >
          Galeri Achievement
        </Link>
        <Link
          href="/profile/settings"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
        >
          Pengaturan Notifikasi
        </Link>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-3xl border border-warm-border bg-card p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted">Berat Terkini</span>
          <p className="text-2xl font-extrabold text-ink">{latestWeight} kg</p>
          <p className="text-[10px] text-ink-muted">
            Target: <strong className="text-ink">{goalPlan.targetWeightKg} kg</strong>
          </p>
        </div>

        <div className="rounded-3xl border border-warm-border bg-card p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted">Status BMI</span>
          <p className="text-2xl font-extrabold text-brand-green-dark">
            {currentBmi.score}
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-highlight text-ink">
            {currentBmi.category}
          </span>
        </div>

        <div className="rounded-3xl border border-warm-border bg-card p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted">Selisih ke Target</span>
          <p className="text-2xl font-extrabold text-ink">{remainingWeightDiff} kg</p>
          <p className="text-[10px] text-ink-muted">
            {isTargetAchieved ? "Target telah tercapai!" : "Terus jaga defisit/surplus"}
          </p>
        </div>

        <div className="rounded-3xl border border-warm-border bg-card p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted">Waktu Program</span>
          <p className="text-2xl font-extrabold text-ink">
            Hari ke-{goalPlan.currentDayNumber}
          </p>
          <p className="text-[10px] text-ink-muted">
            dari total {goalPlan.totalProjectedDays} hari misi
          </p>
        </div>
      </div>

      {/* Weight History Visual Chart Abstraction */}
      <div className="rounded-3xl border border-warm-border bg-card p-6 shadow-card sm:p-7 space-y-6">
        <div className="flex flex-col gap-3 pb-2 border-b border-warm-border sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-brand-green" />
              <span>Grafik Riwayat Perubahan Berat Badan</span>
            </h3>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Menampilkan garis tren berat badan aktual menuju target {goalPlan.targetWeightKg} kg.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] sm:shrink-0 sm:text-xs">
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
              Aktual
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span className="w-4 border-t-2 border-dashed border-brand-green" />
              Garis Target ({goalPlan.targetWeightKg} kg)
            </span>
          </div>
        </div>

        {/* Weight History Chart */}
        <div className="w-full h-56 sm:h-64 relative flex items-end justify-between gap-2 pt-8 pb-6 px-2">
          {/* Target Weight Horizontal Guideline */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-brand-green/60 z-0 pointer-events-none"
            style={{
              bottom: `${((goalPlan.targetWeightKg - minW) / range) * 70 + 12}%`,
            }}
          >
            <span className="absolute -top-4 right-2 text-[10px] font-bold text-brand-green-dark bg-surface-raised px-1.5 py-0.5 rounded border border-warm-border">
              Target: {goalPlan.targetWeightKg} kg
            </span>
          </div>

          {/* Plotted Points & Bars */}
          {weightLogs.map((entry) => {
            const heightPercent = Math.max(
              12,
              Math.min(85, ((entry.weightKg - minW) / range) * 70 + 12)
            );

            return (
              <div
                key={entry.id}
                className="flex-1 h-full relative flex flex-col items-center justify-end group z-10"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-orange text-ink text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-md">
                  {entry.weightKg} kg • {entry.date}
                </div>

                {/* Stem + Point */}
                <div
                  className="relative w-4 shrink-0"
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-brand-green/20 group-hover:bg-brand-green/40 transition-colors" />
                  <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-surface-raised bg-brand-green shadow-sm transition-transform group-hover:scale-125" />
                </div>

                {/* Date Label */}
                <span className="text-[10px] text-ink-muted mt-2 truncate max-w-[60px]">
                  {entry.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Logs Table */}
      <div className="rounded-3xl border border-warm-border bg-card p-5 shadow-card space-y-3">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
          Log Riwayat Penimbangan:
        </h3>
        <div className="divide-y divide-warm-border/70 max-h-[220px] overflow-y-auto">
          {weightLogs.slice().reverse().map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-ink">{log.weightKg} kg</span>
                <p className="text-[11px] text-ink-muted">{log.notes}</p>
              </div>
              <span className="text-[11px] text-ink-muted font-mono">{log.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* [Modal] Update Berat Badan Berkala */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-warm-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-warm-border">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-brand-green" />
                <h3 className="text-base font-bold text-ink">
                  Update Berat Badan
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWeight} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-ink-muted">
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
                  className="field mt-1 w-full rounded-2xl px-4 py-2.5 text-base font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Setelah olahraga pagi, perut kosong"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="field mt-1 w-full px-3.5 py-2 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost min-h-0 py-2.5 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-cta min-h-0 py-2.5 text-xs"
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

