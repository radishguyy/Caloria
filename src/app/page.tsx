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
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-canvas">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full   bg-highlight text-ink text-xs font-semibold">
                <Flame className="h-4 w-4 fill-current text-brown" />
                <span>Nourish Your Body, Level Up Your Pet, Achieve Together</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-ink leading-[1.15]">
                Pencatat Nutrisi Gamifikasi dengan{" "}
                <span className="text-brand-green-dark">
                  Virtual Pet
                </span>{" "}
                & Co-op Streak.
              </h1>

              <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
                Ubah kebiasaan makan sehat menjadi misi petualangan harian. Penuhi target gizi harian (Diet, Bulking, atau Maintenance), dapatkan XP untuk berevolusi, dan pertahankan Co-op Streak bersama squad temanmu!
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {isAuthenticated && onboardingCompleted ? (
                  <Link
                    href="/dashboard"
                    className="btn-cta w-full text-sm sm:w-auto"
                  >
                    <span>Buka Dashboard Utama</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/onboarding"
                      className="btn-cta w-full text-sm sm:w-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Mulai Onboarding Cerdas</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/login"
                      className="btn-ghost w-full text-sm sm:w-auto"
                    >
                      <span>Masuk Akun</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/onboarding/profile-calculator"
                  className="text-xs font-semibold text-brand-green-dark hover:text-brand-green-ink py-2 px-3 flex items-center gap-1"
                >
                  <Calculator className="h-3.5 w-3.5 text-brand-green" />
                  <span>Kalkulator BMI & TDEE Gratis</span>
                </Link>
              </div>

              {/* Trust & Guarantee Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-brand-green" />
                  Metode Mifflin-St Jeor Teruji
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-brown" />
                  Gamifikasi Suportif & Tanpa Toxic
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-brand-green" />
                  Co-op Streak Anti-Bolos
                </span>
              </div>
            </div>

            {/* Right Interactive Hero Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm surface-card rounded-3xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-3  ">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-ping" />
                    <span className="text-xs font-bold">Virtual Pet Sahabat Gizi</span>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-green-ink bg-brand-green-light px-2 py-0.5 rounded-full">
                    Tahap 2 • Hatchling
                  </span>
                </div>

                {/* Pet Preview */}
                <PetRenderer interactive={true} size="md" />

                <div className="mt-3 p-3 rounded-2xl   bg-surface text-xs text-ink-muted space-y-1">
                  <p className="font-semibold text-ink flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-brand-green" />
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tiga Pilar Utama Caloria
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Dirancang untuk menjaga motivasi jangka panjang melalui perpaduan sains gizi dan psikologi game.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="surface-card rounded-3xl p-6 space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-brand-green-light text-brand-green-ink flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold">1. Smart Onboarding & Pemetaan N Hari</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Hitung skor BMI, TDEE akurat, dan dapatkan proyeksi estimasi pencapaian target dalam N hari dengan defisit/surplus kalori yang aman bagi metabolisme.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green-dark hover:underline pt-1"
              >
                <span>Lihat Alur Onboarding</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="surface-card rounded-3xl p-6 space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-highlight text-ink flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold">2. Food Diary & Real-Time Evaluator</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Katalog makanan Indonesia & umum lengkap dengan kalori, protein, karbohidrat, lemak, serat, dan gula. Feedback instan memperingatkan lemak berlebih atau mengapresiasi target protein.
              </p>
              <Link
                href="/diary"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brown hover:underline pt-1"
              >
                <span>Eksplorasi Food Diary</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="surface-card rounded-3xl p-6 space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-surface text-brand-green-dark flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold">3. Shared Co-op Streak & Senggol Teman</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Ikat streak bersama squad teman. Angka streak bertambah hanya jika semua anggota memenuhi misi makan sebelum hari berganti. Teman belum makan? Tekan tombol Senggol!
              </p>
              <Link
                href="/social/coop"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green-dark hover:underline pt-1"
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
        <div className="rounded-3xl bg-brand-green p-8 sm:p-12 text-surface-raised text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Siap Menemukan Teman Seperjalanan Sehatmu?
          </h2>
          <p className="text-xs sm:text-sm max-w-xl mx-auto opacity-90 leading-relaxed">
            Adopsi virtual pet pertamamu hari ini, tentukan misi berat badan impian, dan capai targetmu bersama komunitas Caloria.
          </p>
          <div className="pt-2">
            <Link
              href="/onboarding"
              className="btn-secondary text-sm"
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
