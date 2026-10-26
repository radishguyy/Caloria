"use client";

import Link from "next/link";
import {
  Flame,
  Sparkles,
  ArrowRight,
  Target,
  ShieldCheck,
  Users,
  Zap,
  Heart,
  ChevronRight,
  Calculator,
} from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { useFoodStore } from "@/store/use-food-store";
import { PetRenderer } from "@/components/pet/pet-renderer";

export default function LandingPage() {
  const { isAuthenticated, onboardingCompleted } = useAuthStore();
  const { goalPlan } = useFoodStore();

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28 border-b border-border-divider">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="hero-card p-6 sm:p-10 lg:p-12 border border-accent-green/20 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Copy */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface text-text-primary border border-accent-green/30 text-xs font-bold shadow-2xs">
                  <Flame className="h-4 w-4 fill-accent-orange text-accent-orange" />
                  <span>Nourish Your Body, Level Up Your Pet, Achieve Together</span>
                </div>

                <h1 className="typo-h1 text-text-primary tracking-tight">
                  Pencatat Nutrisi Gamifikasi dengan{" "}
                  <span className="text-accent-orange">Virtual Pet</span> & Co-op Streak.
                </h1>

                <p className="text-sm sm:text-base text-neutral-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Ubah kebiasaan makan sehat menjadi misi petualangan harian. Penuhi target gizi harian (Diet, Bulking, atau Maintenance), dapatkan XP untuk berevolusi, dan pertahankan Co-op Streak bersama squad temanmu!
                </p>

                {/* Call to Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  {isAuthenticated && onboardingCompleted ? (
                    <Link
                      href="/dashboard"
                      className="button-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm"
                    >
                      <span>Buka Dashboard Utama</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/onboarding"
                        className="button-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Mulai Onboarding Cerdas</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <Link
                        href="/login"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-button border border-border-default bg-surface hover:bg-accent-green-light text-text-primary font-bold text-sm transition-colors"
                      >
                        <span>Masuk Akun</span>
                      </Link>
                    </>
                  )}

                  <Link
                    href="/onboarding/profile-calculator"
                    className="text-xs font-bold text-text-primary hover:underline py-2 px-3 flex items-center gap-1"
                  >
                    <Calculator className="h-3.5 w-3.5 text-accent-green" />
                    <span>Kalkulator BMI & TDEE Gratis</span>
                  </Link>
                </div>

                {/* Trust & Guarantee Pills */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-xs text-neutral-10 font-medium">
                  <span className="flex items-center gap-1.5 bg-surface/80 px-3 py-1 rounded-pill">
                    <ShieldCheck className="h-4 w-4 text-accent-green" />
                    Metode Mifflin-St Jeor Teruji
                  </span>
                  <span className="flex items-center gap-1.5 bg-surface/80 px-3 py-1 rounded-pill">
                    <Heart className="h-4 w-4 text-macro-fat" />
                    Gamifikasi Suportif & Tanpa Toxic
                  </span>
                  <span className="flex items-center gap-1.5 bg-surface/80 px-3 py-1 rounded-pill">
                    <Users className="h-4 w-4 text-macro-protein" />
                    Co-op Streak Anti-Bolos
                  </span>
                </div>
              </div>

              {/* Right Interactive Hero Preview */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm rounded-card border border-border-divider bg-surface p-6 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-border-divider">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-pill bg-accent-green animate-ping" />
                      <span className="text-xs font-bold text-text-primary">
                        Virtual Pet Sahabat Gizi
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-text-inverse bg-accent-orange px-2.5 py-0.5 rounded-pill">
                      Tahap 2 • Hatchling
                    </span>
                  </div>

                  {/* Pet Preview */}
                  <PetRenderer interactive={true} size="md" />

                  <div className="mt-3 p-3 rounded-button bg-surface-subtle border border-border-divider text-xs text-neutral-10 space-y-1">
                    <p className="font-bold text-text-primary flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-accent-orange" />
                      Misi Aktif: Program {goalPlan.goalType.toUpperCase()}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Setiap kamu mencatat makanan bergizi, pet mendapatkan XP untuk berevolusi dan koin kosmetik!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Core Pillars Section */}
      <section className="py-16 md:py-24 bg-canvas">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="typo-h2 text-text-primary tracking-tight">
              Tiga Pilar Utama Caloria
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Dirancang untuk menjaga motivasi jangka panjang melalui perpaduan sains gizi dan psikologi game.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-card border border-border-divider bg-surface p-7 space-y-3.5 shadow-xs">
              <div className="h-12 w-12 rounded-button bg-accent-green/15 text-text-primary flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                1. Smart Onboarding & Pemetaan N Hari
              </h3>
              <p className="text-xs text-neutral-10 leading-relaxed">
                Hitung skor BMI, TDEE akurat, dan dapatkan proyeksi estimasi pencapaian target dalam N hari dengan defisit/surplus kalori yang aman bagi metabolisme.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1 text-xs font-bold text-text-primary hover:underline pt-1"
              >
                <span>Lihat Alur Onboarding</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-card border border-border-divider bg-surface p-7 space-y-3.5 shadow-xs">
              <div className="h-12 w-12 rounded-button bg-accent-yellow text-text-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                2. Food Diary & Real-Time Evaluator
              </h3>
              <p className="text-xs text-neutral-10 leading-relaxed">
                Katalog makanan Indonesia & umum lengkap dengan kalori, protein, karbohidrat, lemak, serat, dan gula. Feedback instan memperingatkan lemak berlebih atau mengapresiasi target protein.
              </p>
              <Link
                href="/diary"
                className="inline-flex items-center gap-1 text-xs font-bold text-text-primary hover:underline pt-1"
              >
                <span>Eksplorasi Food Diary</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-card border border-border-divider bg-surface p-7 space-y-3.5 shadow-xs">
              <div className="h-12 w-12 rounded-button bg-accent-orange/15 text-accent-orange-dark flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                3. Shared Co-op Streak & Senggol Teman
              </h3>
              <p className="text-xs text-neutral-10 leading-relaxed">
                Ikat streak bersama squad teman. Angka streak bertambah hanya jika semua anggota memenuhi misi makan sebelum hari berganti. Teman belum makan? Tekan tombol Senggol!
              </p>
              <Link
                href="/social/coop"
                className="inline-flex items-center gap-1 text-xs font-bold text-text-primary hover:underline pt-1"
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
        <div className="hero-card p-8 sm:p-12 border border-accent-green/25 shadow-md text-center space-y-5">
          <h2 className="typo-h2 text-text-primary tracking-tight">
            Siap Menemukan Teman Seperjalanan Sehatmu?
          </h2>
          <p className="text-xs sm:text-sm max-w-xl mx-auto text-neutral-10 leading-relaxed">
            Adopsi virtual pet pertamamu hari ini, tentukan misi berat badan impian, dan capai targetmu bersama komunitas Caloria.
          </p>
          <div className="pt-2">
            <Link
              href="/onboarding"
              className="button-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm"
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
