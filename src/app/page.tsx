"use client";

import Link from "next/link";
import {
  Flame,
  Sparkles,
  ArrowRight,
  Target,
  ShieldCheck,
  Users,
  Award,
  Zap,
  Heart,
  ChevronRight,
  TrendingDown,
  Calculator,
} from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { useFoodStore } from "@/store/use-food-store";
import { PetRenderer } from "@/components/pet/pet-renderer";

export default function LandingPage() {
  const { isAuthenticated, onboardingCompleted } = useAuthStore();
  const { goalPlan } = useFoodStore();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-semibold">
                <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
                <span>Nourish Your Body, Level Up Your Pet, Achieve Together</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
                Pencatat Nutrisi Gamifikasi dengan{" "}
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Virtual Pet
                </span>{" "}
                & Co-op Streak.
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Ubah kebiasaan makan sehat menjadi misi petualangan harian. Penuhi target gizi harian (Diet, Bulking, atau Maintenance), dapatkan XP untuk berevolusi, dan pertahankan Co-op Streak bersama squad temanmu!
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {isAuthenticated && onboardingCompleted ? (
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-transform active:scale-95"
                  >
                    <span>Buka Dashboard Utama</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/onboarding"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-transform active:scale-95"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Mulai Onboarding Cerdas</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-border bg-card hover:bg-accent text-foreground font-semibold text-sm transition-colors"
                    >
                      <span>Masuk Akun</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/onboarding/profile-calculator"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground py-2 px-3 flex items-center gap-1"
                >
                  <Calculator className="h-3.5 w-3.5 text-orange-500" />
                  <span>Kalkulator BMI & TDEE Gratis</span>
                </Link>
              </div>

              {/* Trust & Guarantee Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Metode Mifflin-St Jeor Teruji
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Gamifikasi Suportif & Tanpa Toxic
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-500" />
                  Co-op Streak Anti-Bolos
                </span>
              </div>
            </div>

            {/* Right Interactive Hero Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl border bg-card p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold">Virtual Pet Sahabat Gizi</span>
                  </div>
                  <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                    Tahap 2 • Hatchling
                  </span>
                </div>

                {/* Pet Preview */}
                <PetRenderer interactive={true} size="md" />

                <div className="mt-3 p-3 rounded-2xl bg-muted/40 border text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Misi Aktif: Program {goalPlan.goalType.toUpperCase()}
                  </p>
                  <p className="text-[11px]">
                    Setiap kamu mencatat makanan bergizi, pet mendapatkan XP untuk berevolusi dan koin kosmetik!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Core Pillars Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tiga Pilar Utama Caloria
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Dirancang untuk menjaga motivasi jangka panjang melalui perpaduan sains gizi dan psikologi game.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-3xl border bg-card p-6 space-y-3.5 shadow-xs">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold">1. Smart Onboarding & Pemetaan N Hari</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hitung skor BMI, TDEE akurat, dan dapatkan proyeksi estimasi pencapaian target dalam N hari dengan defisit/surplus kalori yang aman bagi metabolisme.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline pt-1"
              >
                <span>Lihat Alur Onboarding</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-3xl border bg-card p-6 space-y-3.5 shadow-xs">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold">2. Food Diary & Real-Time Evaluator</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Katalog makanan Indonesia & umum lengkap dengan kalori, protein, karbohidrat, lemak, serat, dan gula. Feedback instan memperingatkan lemak berlebih atau mengapresiasi target protein.
              </p>
              <Link
                href="/diary"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline pt-1"
              >
                <span>Eksplorasi Food Diary</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-3xl border bg-card p-6 space-y-3.5 shadow-xs">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold">3. Shared Co-op Streak & Senggol Teman</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ikat streak bersama squad teman. Angka streak bertambah hanya jika semua anggota memenuhi misi makan sebelum hari berganti. Teman belum makan? Tekan tombol Senggol!
              </p>
              <Link
                href="/social/coop"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1"
              >
                <span>Pelajari Co-op Streak</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CTA Banner */}
      <section className="py-16 container mx-auto max-w-5xl px-4">
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 sm:p-12 text-white shadow-xl text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Siap Menemukan Teman Seperjalanan Sehatmu?
          </h2>
          <p className="text-xs sm:text-sm max-w-xl mx-auto opacity-90 leading-relaxed">
            Adopsi virtual pet pertamamu hari ini, tentukan misi berat badan impian, dan capai targetmu bersama komunitas Caloria.
          </p>
          <div className="pt-2">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-bold text-sm shadow-md transition-transform active:scale-95"
            >
              <span>Mulai Sekarang — Gratis</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
