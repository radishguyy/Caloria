"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserCircle,
  TrendingDown,
  Calendar,
  Plus,
  Scale,
  Target,
  ArrowLeft,
  X,
  Sparkles,
  Calculator,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useWeightStore } from "@/store/use-weight-store";
import { useSocialStore } from "@/store/use-social-store";
import { calculateBmi } from "@/lib/nutrition-calculator";
import { cn } from "@/lib/utils";

export default function ProfileOverviewPage() {
  const { goalPlan, setGoalPlan } = useFoodStore();
  const { weightLogs, addWeightLog, getLatestWeight } = useWeightStore();
  const { coopStreakDays } = useSocialStore();

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Progres & Riwayat Berat Badan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-8 sm:ml-0">
            Pantau perubahan berat badan secara berkala menuju target program {goalPlan.totalProjectedDays} hari.
          </p>
        </div>

        <button
          onClick={() => {
            setNewWeight(latestWeight);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-transform active:scale-95 self-start sm:self-auto"
        >
          <Scale className="h-4 w-4" />
          <span>+ Update Timbangan Hari Ini</span>
        </button>
      </div>

      {/* Sub-Tabs: Overview vs Achievements vs Settings */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <Link
          href="/profile/overview"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-foreground text-background"
        >
          Overview & Berat Badan
        </Link>
        <Link
          href="/profile/achievements"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Galeri Achievement
        </Link>
        <Link
          href="/profile/settings"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Pengaturan Notifikasi
        </Link>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl border bg-card shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Berat Terkini</span>
          <p className="text-2xl font-extrabold text-foreground">{latestWeight} kg</p>
          <p className="text-[10px] text-muted-foreground">
            Target: <strong className="text-foreground">{goalPlan.targetWeightKg} kg</strong>
          </p>
        </div>

        <div className="p-4 rounded-3xl border bg-card shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Status BMI</span>
          <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">
            {currentBmi.score}
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
            {currentBmi.category}
          </span>
        </div>

        <div className="p-4 rounded-3xl border bg-card shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Selisih ke Target</span>
          <p className="text-2xl font-extrabold text-foreground">{remainingWeightDiff} kg</p>
          <p className="text-[10px] text-muted-foreground">
            {isTargetAchieved ? "Target telah tercapai!" : "Terus jaga defisit/surplus"}
          </p>
        </div>

        <div className="p-4 rounded-3xl border bg-card shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Waktu Program</span>
          <p className="text-2xl font-extrabold text-foreground">
            Hari ke-{goalPlan.currentDayNumber}
          </p>
          <p className="text-[10px] text-muted-foreground">
            dari total {goalPlan.totalProjectedDays} hari misi
          </p>
        </div>
      </div>

      {/* Weight History Visual Chart Abstraction */}
      <div className="rounded-3xl border bg-card p-6 sm:p-7 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-500" />
              <span>Grafik Riwayat Perubahan Berat Badan</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Menampilkan garis tren berat badan aktual menuju target {goalPlan.targetWeightKg} kg.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              Aktual
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-0.5 w-3 bg-emerald-500 border-dashed" />
              Garis Target ({goalPlan.targetWeightKg} kg)
            </span>
          </div>
        </div>

        {/* SVG Line / Bar Chart Abstraction */}
        <div className="w-full h-52 sm:h-64 relative flex items-end justify-between gap-2 pt-6 pb-4 px-2">
          {/* Target Weight Horizontal Guideline */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-emerald-500/60 z-0 pointer-events-none"
            style={{
              bottom: `${((goalPlan.targetWeightKg - minW) / range) * 80 + 10}%`,
            }}
          >
            <span className="absolute -top-4 right-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-background px-1.5 py-0.5 rounded border border-emerald-500/20">
              Target: {goalPlan.targetWeightKg} kg
            </span>
          </div>

          {/* Plotted Points & Bars */}
          {weightLogs.map((entry, idx) => {
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
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-md">
                  {entry.weightKg} kg • {entry.date}
                </div>

                {/* Point Bubble */}
                <div
                  className="w-4 h-4 rounded-full bg-orange-500 border-2 border-background shadow-sm transition-transform group-hover:scale-125 mb-1"
                  style={{ marginBottom: `${heightPercent - 10}%` }}
                />

                {/* Vertical Stem */}
                <div
                  className="w-1.5 rounded-full bg-orange-500/20 group-hover:bg-orange-500/40 transition-colors"
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Date Label */}
                <span className="text-[10px] text-muted-foreground mt-2 truncate max-w-[60px]">
                  {entry.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Logs Table */}
      <div className="rounded-3xl border bg-card p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Log Riwayat Penimbangan:
        </h3>
        <div className="divide-y divide-border/60 max-h-[220px] overflow-y-auto">
          {weightLogs.slice().reverse().map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-foreground">{log.weightKg} kg</span>
                <p className="text-[11px] text-muted-foreground">{log.notes}</p>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">{log.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* [Modal] Update Berat Badan Berkala */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-orange-500" />
                <h3 className="text-base font-bold text-foreground">
                  Update Berat Badan
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWeight} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
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
                  className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-base font-bold outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Setelah olahraga pagi, perut kosong"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-accent text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition-transform active:scale-95"
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

