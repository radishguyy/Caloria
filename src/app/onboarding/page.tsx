"use client";

import Link from "next/link";
import { Compass, Calculator, Target, Sparkles, ArrowLeft } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";

export default function OnboardingPage() {
  const { goalPlan } = useFoodStore();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Compass className="h-3.5 w-3.5" />
            Assigned Module: Afza
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            Smart Onboarding & Kalkulator Proyeksi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Form input profil fisik, hasil skor BMI, pilihan tujuan (Diet / Bulking / Stabil), dan kartu ringkasan proyeksi N hari.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Ke Dashboard</span>
        </Link>
      </div>

      {/* Preview of Shared Store Data for Afza to Hook Into */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Target className="h-4 w-4 text-orange-500" />
            <span>Tujuan Aktif (Store)</span>
          </div>
          <p className="text-xl font-bold capitalize">{goalPlan.goalType}</p>
          <p className="text-xs text-muted-foreground">
            {goalPlan.currentWeightKg} kg &rarr; Target {goalPlan.targetWeightKg} kg
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Calculator className="h-4 w-4 text-blue-500" />
            <span>Status BMI Saat Ini</span>
          </div>
          <p className="text-xl font-bold">
            {goalPlan.bmiScore} ({goalPlan.bmiCategory})
          </p>
          <p className="text-xs text-muted-foreground">
            Tinggi Badan: {goalPlan.heightCm} cm
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>Proyeksi N Hari</span>
          </div>
          <p className="text-xl font-bold">{goalPlan.totalProjectedDays} Hari</p>
          <p className="text-xs text-muted-foreground">
            Margin Harian: {goalPlan.dailyMarginKcal} kkal/hari
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-3">
        <h2 className="text-base font-semibold">
          Placeholder Workspace untuk Afza (`src/app/onboarding/page.tsx`)
        </h2>
        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
          Gunakan action <code className="px-1.5 py-0.5 rounded bg-muted font-mono">setGoalPlan()</code> dan{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted font-mono">setTargets()</code> dari{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted font-mono">useFoodStore</code> untuk menyimpan hasil kalkulasi BMI & proyeksi N hari secara otomatis ke Dashboard.
        </p>
      </div>
    </div>
  );
}

