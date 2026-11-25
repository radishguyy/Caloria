import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CircleDollarSign,
  Flame,
  Check,
  Dumbbell,
  Scale,
  TrendingDown,
  BellRing,
  Camera,
  BarChart3,
  MessageSquare,
  ShieldMinus,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { CalpalShowcase } from "@/components/landing/CalpalShowcase";
import {
  AnimateSection,
  FloatCharacter,
} from "@/components/landing/AnimateSection";
import { CoopStreakIllustration } from "@/components/landing/CoopStreakIllustration";
import { GoalPathIllustration } from "@/components/landing/GoalPathIllustration";
import { AiFeaturesIllustration } from "@/components/landing/AiFeaturesIllustration";
import { DuolingoJourneyMap } from "@/components/landing/DuolingoJourneyMap";
import {
  HERO_CLUSTER,
  type CalpalVariant,
} from "@/lib/landing/calpal-variants";
import {
  calculateClinicalBenchmarks,
  evaluateDepkesIntake,
} from "@/lib/nutrition/calculations";

export const metadata: Metadata = {
  title: "Caloria: Catat Nutrisi Jadi Seru",
  description:
    "Catat makanan harian, scan label gizi, dan jaga streak bersama teman sambil merawat Calpal virtualmu.",
};

const CARD = "rounded-2xl border border-border-divider bg-surface";
const BTN_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent-green px-6 py-3 text-sm font-bold text-text-inverse transition-colors hover:bg-accent-green/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green";
const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border-default bg-surface px-6 py-3 text-sm font-bold text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green";

function Calpal({ v, className }: { v: CalpalVariant; className?: string }) {
  return (
    <div className={className}>
      <AvatarRenderer
        characterId={v.characterId}
        colors={v.colors}
        animationState={v.animationState}
        equipped={v.equipped}
        showRoomBackdrop={false}
        showShadow={false}
        title={`Calpal ${v.label}`}
      />
    </div>
  );
}

const GOAL_PATHS = [
  {
    icon: TrendingDown,
    title: "Turun Berat Badan",
    desc: "Defisit kalori terukur dan aman tanpa membuat tubuh lemas.",
    iconBg: "bg-accent-green text-text-inverse",
  },
  {
    icon: Dumbbell,
    title: "Naik Massa Otot",
    desc: "Surplus kalori terarah dengan asupan protein tinggi harian.",
    iconBg: "bg-accent-orange text-text-inverse",
  },
  {
    icon: Scale,
    title: "Jaga Berat Badan",
    desc: "Asupan harian seimbang untuk energi dan metabolisme stabil.",
    iconBg: "bg-accent-green-light text-text-primary",
  },
];

const SMART_FEATURES = [
  {
    icon: Camera,
    title: "Scan Label Gizi",
    desc: "Foto tabel informasi nilai gizi kemasan, kalori dan makro langsung terisi.",
    iconBg: "bg-accent-green text-text-inverse",
  },
  {
    icon: BarChart3,
    title: "Rekap Mingguan",
    desc: "Ringkasan progres gizi mingguan dan bulanan tersusun otomatis.",
    iconBg: "bg-accent-green-light text-text-primary",
  },
  {
    icon: MessageSquare,
    title: "Konsultasi Gizi",
    desc: "Tanya jawab dengan CalPal AI dan terhubung langsung ke ahli gizi.",
    iconBg: "bg-accent-orange text-text-inverse",
  },
];

const COOP_FEATURES = [
  {
    icon: Flame,
    title: "Streak Co-op",
    desc: "Jaga streak harian bersama teman satu squad setiap hari.",
    iconBg: "bg-accent-orange/15 text-accent-orange",
  },
  {
    icon: BellRing,
    title: "Senggol Teman",
    desc: "Kirim pengingat cepat saat teman belum mencatat makan.",
    iconBg: "bg-accent-green/15 text-text-primary",
  },
  {
    icon: ShieldMinus,
    title: "Power-Up Streak",
    desc: "Lindungi streak dengan Pembeku Streak dan Kupon Jeda.",
    iconBg: "bg-surface-subtle text-neutral-10 border border-border-divider",
  },
];

const SAMPLE = calculateClinicalBenchmarks({
  gender: "male",
  age: 20,
  weightKg: 76,
  heightCm: 183,
});
const SAMPLE_INTAKE = Math.round(SAMPLE.teeKcal * 0.92);
const SAMPLE_COMPLIANCE = evaluateDepkesIntake(SAMPLE_INTAKE, SAMPLE.teeKcal);
const SAMPLE_PERCENT = Math.round(SAMPLE_COMPLIANCE.ratioPercent);

const RING_RADIUS = 28;
const RING_CIRCUMFERENCE = Math.round(2 * Math.PI * RING_RADIUS);
const RING_OFFSET =
  RING_CIRCUMFERENCE -
  (RING_CIRCUMFERENCE * Math.min(SAMPLE_PERCENT, 100)) / 100;

const CLINICAL_METRICS = [
  { label: "BMI", value: SAMPLE.imt.imt.toFixed(1) },
  { label: "BMR", value: `${Math.round(SAMPLE.bmrKcal)} kcal` },
  { label: "TEE", value: `${Math.round(SAMPLE.teeKcal)} kcal` },
];

const MACROS = [
  { label: "Protein", pct: 88 },
  { label: "Karbo", pct: 95 },
  { label: "Lemak", pct: 81 },
  { label: "Serat", pct: 74 },
  { label: "Gula", pct: 42 },
];

const QUESTS = [
  { label: "Catat sarapan pagi", done: true },
  { label: "Capai 80% target protein", done: true },
  { label: "Asupan kalori seimbang", done: false },
];

export default function LandingPage() {
  const [c0, c1, c2, c3, c4] = HERO_CLUSTER;

  return (
    <div className="bg-white font-sans text-neutral-10 overflow-x-clip">
      {/* 1. Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <header className="flex h-16 items-center justify-between">
            <Link
              href="/"
              aria-label="Caloria Beranda"
              className="flex items-center min-h-[44px]"
            >
              <Image
                src="/logos/caloria-01.svg"
                alt="Caloria"
                width={128}
                height={32}
                priority
                unoptimized
                className="h-8 w-auto"
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-xl px-4 text-sm font-bold text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
            >
              Masuk
            </Link>
          </header>

          <div className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-20">
            <div className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[420px] min-w-0 order-2 md:order-1">
              <div className="absolute inset-[8%] rounded-full border border-border-divider bg-surface-subtle" />
              <div className="absolute inset-[22%] rounded-full bg-accent-green/10" />

              <FloatCharacter
                duration={3.2}
                amplitude={10}
                className="absolute left-1/2 top-1/2 w-[42%] -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <Calpal v={c2} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.2}
                duration={3.8}
                amplitude={8}
                className="absolute left-[4%] top-[10%] w-[25%] -rotate-6"
              >
                <Calpal v={c0} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.5}
                duration={4.2}
                amplitude={9}
                className="absolute right-[4%] top-[6%] w-[25%] rotate-6"
              >
                <Calpal v={c1} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.8}
                duration={3.5}
                amplitude={7}
                className="absolute bottom-[4%] left-[6%] w-[24%] rotate-3"
              >
                <Calpal v={c3} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.4}
                duration={4.0}
                amplitude={8}
                className="absolute bottom-[2%] right-[6%] w-[24%] -rotate-3"
              >
                <Calpal v={c4} />
              </FloatCharacter>
            </div>

            <AnimateSection className="min-w-0 space-y-6 text-center md:text-left order-1 md:order-2">
              <h1 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-5xl">
                Catat Nutrisi Jadi Seru
              </h1>
              <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-10 md:mx-0 sm:text-lg">
                Jaga pola makan harian sambil merawat Calpal virtualmu bersama
                teman.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link href="/register" className={BTN_PRIMARY}>
                  Mulai Gratis
                </Link>
                <Link href="/login" className={BTN_SECONDARY}>
                  Masuk
                </Link>
              </div>
            </AnimateSection>
          </div>
        </div>
      </section>

      {/* 2. Core Loop */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-5 text-center lg:text-left space-y-3">
              <AnimateSection className="space-y-3">
                <h2 className="font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-4xl">
                  Catat. Naik Level. Ulangi.
                </h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-10 lg:mx-0 sm:text-lg">
                  Tiga langkah ringan setiap hari agar target gizi tetap
                  konsisten.
                </p>
              </AnimateSection>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <AnimateSection delay={0.15}>
                <DuolingoJourneyMap />
              </AnimateSection>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 3 Program Tujuan */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 space-y-10">
          <AnimateSection className="mx-auto max-w-2xl text-center space-y-3">
            <h2 className="font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-4xl">
              Pilih Target Tubuhmu
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-neutral-10 sm:text-lg">
              Kebutuhan kalori dan makro disesuaikan otomatis untuk setiap
              tujuanmu.
            </p>
          </AnimateSection>

          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-5 flex justify-center order-2 lg:order-1">
              <AnimateSection delay={0.1} className="w-full">
                <GoalPathIllustration />
              </AnimateSection>
            </div>

            <div className="min-w-0 lg:col-span-7 space-y-3.5 order-1 lg:order-2">
              {GOAL_PATHS.map((item, i) => {
                const PathIcon = item.icon;
                return (
                  <AnimateSection key={item.title} delay={i * 0.08}>
                    <div className={`${CARD} p-5 flex items-center gap-4`}>
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                      >
                        <PathIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-text-primary">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-neutral-10">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </AnimateSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fitur AI & Konsultasi */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-6 space-y-5 text-center lg:text-left">
              <AnimateSection className="space-y-5">
                <h2 className="font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-4xl">
                  Catat Cepat & Konsultasi
                </h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-10 lg:mx-0 sm:text-lg">
                  Pindai label kemasan, lihat rekap otomatis, dan konsultasikan
                  gizimu kapan saja.
                </p>

                <div className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
                  {SMART_FEATURES.map((feat) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div
                        key={feat.title}
                        className="flex items-start gap-3.5 rounded-2xl border border-border-divider bg-surface-subtle p-4"
                      >
                        <div
                          className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${feat.iconBg}`}
                        >
                          <FeatIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h3 className="text-sm sm:text-base font-bold text-text-primary">
                            {feat.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-10 leading-relaxed">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AnimateSection>
            </div>

            <div className="min-w-0 lg:col-span-6 flex justify-center">
              <AnimateSection delay={0.15} className="w-full">
                <AiFeaturesIllustration />
              </AnimateSection>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Co-op Streak & Power-Up */}
      <section className="py-16 sm:py-20 bg-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-6 flex justify-center order-2 lg:order-1">
              <AnimateSection className="w-full">
                <CoopStreakIllustration />
              </AnimateSection>
            </div>

            <div className="min-w-0 lg:col-span-6 space-y-5 text-center lg:text-left order-1 lg:order-2">
              <AnimateSection className="space-y-5">
                <h2 className="font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-4xl">
                  Jaga Streak Bersama Teman
                </h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-10 lg:mx-0 sm:text-lg">
                  Bangun kebiasaan sehat bareng squad agar makin konsisten
                  setiap hari.
                </p>

                <div className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
                  {COOP_FEATURES.map((feat) => {
                    const CoopIcon = feat.icon;
                    return (
                      <div
                        key={feat.title}
                        className={`${CARD} flex items-center gap-3.5 p-4`}
                      >
                        <div
                          className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${feat.iconBg}`}
                        >
                          <CoopIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h3 className="text-sm sm:text-base font-bold text-text-primary">
                            {feat.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-10 leading-relaxed">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AnimateSection>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Wardrobe & Toko CalPal */}
      <section className="py-16 sm:py-20 bg-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-5 text-center lg:text-left space-y-4">
              <AnimateSection className="space-y-4">
                <h2 className="font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-4xl">
                  Kustomisasi Gaya Calpal
                </h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-10 lg:mx-0 sm:text-lg">
                  Buka warna, aksesori, dan ruangan Calpal pakai koin dari misi
                  harianmu.
                </p>
                <div className="pt-1">
                  <Link href="/register" className={BTN_SECONDARY}>
                    Lihat Wardrobe
                  </Link>
                </div>
              </AnimateSection>
            </div>

            <div className="min-w-0 lg:col-span-7 overflow-hidden">
              <AnimateSection delay={0.15}>
                <CalpalShowcase />
              </AnimateSection>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Target Gizi Klinis & Misi Harian */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <AnimateSection delay={0.15} className="min-w-0 order-2 md:order-1">
              <div className={`${CARD} space-y-5 p-5 sm:p-6`}>
                {/* Top Calorie Summary */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-divider">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      TARGET KALORI
                    </p>
                    <p className="mt-1 font-heading text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
                      <span className="text-text-primary">{SAMPLE_INTAKE}</span>{" "}
                      <span className="text-text-muted">
                        / {Math.round(SAMPLE.teeKcal)} kcal
                      </span>
                    </p>
                  </div>

                  {/* Clean Percentage Ring */}
                  <div className="relative flex h-18 w-18 shrink-0 items-center justify-center">
                    <svg className="h-18 w-18 -rotate-90" viewBox="0 0 72 72">
                      <circle
                        cx="36"
                        cy="36"
                        r={RING_RADIUS}
                        className="stroke-border-divider/50"
                        strokeWidth="6"
                        fill="transparent"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r={RING_RADIUS}
                        className="stroke-accent-green"
                        strokeWidth="6"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={RING_OFFSET}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-sm font-extrabold text-text-primary tabular-nums">
                      {SAMPLE_PERCENT}%
                    </span>
                  </div>
                </div>

                {/* 5 Stacked Horizontal Macro Bars */}
                <div className="space-y-2.5">
                  {MACROS.map((m) => (
                    <div
                      key={m.label}
                      className="grid grid-cols-[64px_1fr_40px] items-center gap-3"
                    >
                      <span className="text-xs font-bold text-text-primary">
                        {m.label}
                      </span>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border-divider/40">
                        <div
                          className="h-full rounded-full bg-accent-green"
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                      <span className="text-right text-xs font-semibold tabular-nums text-text-muted">
                        {m.pct}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Compact BMI, BMR, TEE Row */}
                <div className="grid grid-cols-3 gap-2.5">
                  {CLINICAL_METRICS.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-border-divider bg-surface-subtle px-2 py-2.5 text-center"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                        {s.label}
                      </p>
                      <p className="mt-0.5 text-xs sm:text-base font-extrabold tabular-nums text-neutral-10">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Compact Misi Harian List */}
                <div className="space-y-2.5 rounded-xl border border-border-divider bg-surface-subtle p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      Misi Harian
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-orange">
                      <CircleDollarSign
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      <span>+30 Koin</span>
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {QUESTS.map((q) => (
                      <li
                        key={q.label}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        <span
                          className={
                            q.done
                              ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-green text-text-inverse"
                              : "h-5 w-5 shrink-0 rounded-full border border-border-default bg-surface"
                          }
                        >
                          {q.done && (
                            <Check
                              className="h-3 w-3"
                              strokeWidth={3}
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <span
                          className={
                            q.done
                              ? "text-text-muted line-through"
                              : "font-semibold text-neutral-10"
                          }
                        >
                          {q.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateSection>

            <AnimateSection className="min-w-0 space-y-4 text-center md:text-left order-1 md:order-2">
              <h2 className="font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-4xl">
                Target Gizi Terukur
              </h2>
              <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-10 md:mx-0 sm:text-lg">
                Target kalori dan makro dihitung berdasarkan BMI, BMR, TEE,
                serta standar kepatuhan Depkes RI.
              </p>
            </AnimateSection>
          </div>
        </div>
      </section>

      {/* 8. Final CTA & Footer */}
      <section className="bg-white pt-12 sm:pt-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <AnimateSection>
            <div className="relative overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle px-6 py-12 text-center sm:py-16">
              <FloatCharacter
                duration={3.6}
                amplitude={8}
                className="absolute -bottom-4 left-4 hidden w-28 -rotate-6 sm:block md:w-36 pointer-events-none"
              >
                <Calpal v={HERO_CLUSTER[3]} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.5}
                duration={4.0}
                amplitude={8}
                className="absolute -bottom-4 right-4 hidden w-28 rotate-6 sm:block md:w-36 pointer-events-none"
              >
                <Calpal v={HERO_CLUSTER[4]} />
              </FloatCharacter>

              <div className="relative mx-auto max-w-md space-y-5">
                <h2 className="font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-4xl">
                  Adopsi Calpal Pertamamu
                </h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-10 sm:text-lg">
                  Mulai catat nutrisi harianmu secara gratis bersama teman.
                </p>
                <div>
                  <Link href="/register" className={BTN_PRIMARY}>
                    Mulai Gratis
                  </Link>
                </div>
              </div>
            </div>
          </AnimateSection>
        </div>

        <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-text-muted sm:flex-row sm:px-8 mt-6">
          <Image
            src="/logos/caloria-01.svg"
            alt="Caloria"
            width={96}
            height={24}
            unoptimized
            className="h-6 w-auto opacity-80"
          />
          <p>© 2026 Caloria. Teman nutrisi harianmu.</p>
        </footer>
      </section>
    </div>
  );
}
