import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Flame,
  Check,
  Dumbbell,
  Scale,
  Sparkles,
  BellRing,
  Camera,
  LineChart,
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
import { GreenHeroStatement } from "@/components/landing/GreenHeroStatement";
import { HERO_CLUSTER, type CalpalVariant } from "@/lib/landing/calpal-variants";
import {
  calculateClinicalBenchmarks,
  evaluateDepkesIntake,
} from "@/lib/nutrition/calculations";

export const metadata: Metadata = {
  title: "Caloria — Catat Nutrisi Jadi Seru Bareng Pet RPG",
  description:
    "Cara paling seru dan klinis untuk jaga pola makan, scan label makanan pakai AI, dan jaga streak bareng sahabat.",
};

const CARD = "border-2 border-[#1E293B]/10 bg-white";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-[20px] border-2 border-[#1E293B]/10 bg-white px-7 py-3.5 text-sm font-bold text-[#5B8E55] shadow-[0_4px_0_rgba(30,41,59,0.1)] transition-all hover:bg-[#FAF8F5] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(30,41,59,0.1)]";
const BTN_PRIMARY =
  "button-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm";

function Calpal({ v, className }: { v: CalpalVariant; className?: string }) {
  return (
    <div className={className}>
      <AvatarRenderer
        characterId={v.characterId}
        colors={v.colors}
        animationState={v.animationState}
        equipped={v.equipped}
        showRoomBackdrop={false}
        title={`Calpal ${v.label}`}
      />
    </div>
  );
}

const GOAL_PATHS = [
  {
    icon: Dumbbell,
    title: "Bulking & Otot",
    desc: "Surplus kalori aman dan rasio protein tinggi untuk bangun massa otot.",
    iconBg: "bg-[#FF9233] text-white",
  },
  {
    icon: Sparkles,
    title: "Diet & Cutting",
    desc: "Defisit kalori bertahap tanpa lemas. Berat badan turun secara alami.",
    iconBg: "bg-[#5B8E55] text-white",
  },
  {
    icon: Scale,
    title: "Jaga Berat Badan",
    desc: "Metabolisme prima dan energi seimbang untuk gaya hidup mindful.",
    iconBg: "bg-[#0284C7] text-white",
  },
];

// Sample biometrics preview
const SAMPLE = calculateClinicalBenchmarks({
  gender: "male",
  age: 20,
  weightKg: 76,
  heightCm: 183,
});
const SAMPLE_INTAKE = Math.round(SAMPLE.teeKcal * 0.92);
const SAMPLE_COMPLIANCE = evaluateDepkesIntake(SAMPLE_INTAKE, SAMPLE.teeKcal);

const ENGINE_STATS = [
  { label: "BBI", desc: "Berat Ideal", value: `${SAMPLE.bbiKg.toFixed(1)}`, unit: "kg" },
  { label: "BMI", desc: "Indeks Massa", value: `${SAMPLE.imt.imt.toFixed(1)}`, unit: "" },
  { label: "BMR", desc: "Kalori Diam", value: `${Math.round(SAMPLE.bmrKcal)}`, unit: "kkal" },
  { label: "TEE", desc: "Target Kalori", value: `${Math.round(SAMPLE.teeKcal)}`, unit: "kkal" },
];

const MACROS = [
  { label: "Protein", grams: SAMPLE.baselineMacros.proteinGrams, pct: 88, color: "#5B8E55" },
  { label: "Karbohidrat", grams: SAMPLE.baselineMacros.carbGrams, pct: 95, color: "#FF9233" },
  { label: "Lemak", grams: SAMPLE.baselineMacros.fatGrams, pct: 81, color: "#E9C46A" },
];

const QUESTS = [
  { label: "Catat sarapan pagi", done: true },
  { label: "Capai 80% target protein", done: true },
  { label: "Asupan kalori seimbang (80–120%)", done: false },
];

export default function LandingPage() {
  const [c0, c1, c2, c3, c4] = HERO_CLUSTER;

  return (
    <div className="bg-white font-sans text-[#1E293B] overflow-x-hidden space-y-10">
      {/* ── 1. Hero ───────────────────────────────────────────────────────
          POLA ZIGZAG: [Kiri: Ilustrasi Calpal] | [Kanan: Konten Teks]
      ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <header className="flex h-16 items-center justify-between">
            <Link href="/" aria-label="Caloria Beranda" className="flex items-center">
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
              className="text-sm font-bold text-[#1E293B]/60 transition-colors hover:text-[#5B8E55]"
            >
              Masuk
            </Link>
          </header>

          <div className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
            {/* Visual Chibi Pet Cluster (Kiri di Desktop) */}
            <div className="relative mx-auto aspect-square w-full max-w-[420px] order-2 md:order-1">
              <div className="absolute inset-[8%] rounded-full bg-[#FCF8E3]" />
              <div className="absolute inset-[22%] rounded-full bg-[#5B8E55]/10" />

              <FloatCharacter
                duration={3.2}
                amplitude={10}
                className="absolute left-1/2 top-1/2 w-[44%] -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <Calpal v={c2} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.2}
                duration={3.8}
                amplitude={8}
                className="absolute left-[2%] top-[10%] w-[27%] -rotate-6"
              >
                <Calpal v={c0} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.5}
                duration={4.2}
                amplitude={9}
                className="absolute right-[2%] top-[6%] w-[27%] rotate-6"
              >
                <Calpal v={c1} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.8}
                duration={3.5}
                amplitude={7}
                className="absolute bottom-[4%] left-[6%] w-[26%] rotate-3"
              >
                <Calpal v={c3} />
              </FloatCharacter>

              <FloatCharacter
                delay={0.4}
                duration={4.0}
                amplitude={8}
                className="absolute bottom-[2%] right-[6%] w-[26%] -rotate-3"
              >
                <Calpal v={c4} />
              </FloatCharacter>
            </div>

            {/* Hero Copy (Kanan di Desktop) */}
            <AnimateSection className="space-y-6 text-center md:text-left order-1 md:order-2">
              <h1 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-[#5B8E55] sm:text-5xl">
                Ubah pola makan harian jadi petualangan seru!
              </h1>
              <p className="mx-auto max-w-md text-base leading-relaxed text-[#1E293B]/70 md:mx-0 sm:text-lg">
                Cocok untuk <b>bulking</b>, <b>diet sehat</b>, atau <b>jaga berat badan</b>. Rawat pet virtualmu sambil capai target nutrisi harian.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
                <Link href="/register" className={BTN_PRIMARY}>
                  Mulai Sekarang — Gratis
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/login" className={BTN_SECONDARY}>
                  Masuk Akun
                </Link>
              </div>
            </AnimateSection>
          </div>
        </div>
      </section>

      {/* ── 2. Core loop (Makan, Level Up, Ulangi) ─────────────────────────
          POLA ZIGZAG: [Kiri: Konten Teks & Fitur] | [Kanan: Stepper Path Duolingo]
      ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Teks Pengantar di Kiri (5 Kolom) */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-4">
              <AnimateSection className="space-y-4">
                <h2 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-[#5B8E55] sm:text-5xl">
                  Makan Enak. Level Up. Ulangi.
                </h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-[#1E293B]/70 lg:mx-0 sm:text-lg">
                  3 langkah mudah menjaga tubuh ideal tanpa rasa jenuh. Klik tiap tahap pada peta untuk melihat simulasi aksinya!
                </p>
              </AnimateSection>
            </div>

            {/* Duolingo Stepper Path di Kanan (7 Kolom) */}
            <div className="lg:col-span-7">
              <AnimateSection delay={0.15}>
                <DuolingoJourneyMap />
              </AnimateSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Bulking, Diet & Maintenance ────────────────────────────────
          POLA ZIGZAG: [Kiri: Ilustrasi Calpal] | [Kanan: 3 Kartu Target Nutrisi]
      ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 space-y-12">
          <AnimateSection className="mx-auto max-w-2xl text-center space-y-3">
            <h2 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-[#5B8E55] sm:text-5xl">
              Apapun Targetmu, Caloria Siap Nemenin
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-[#1E293B]/70 sm:text-lg">
              Kebutuhan kalori dan makronutrisi disesuaikan presisi untuk setiap misi tubuh.
            </p>
          </AnimateSection>

          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Ilustrasi Trio Calpal (Kiri di Desktop - 5 Kolom) */}
            <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
              <AnimateSection delay={0.1} className="w-full">
                <GoalPathIllustration />
              </AnimateSection>
            </div>

            {/* Kartu Target Ringkas (Kanan di Desktop - 7 Kolom) */}
            <div className="lg:col-span-7 space-y-3.5 order-1 lg:order-2">
              {GOAL_PATHS.map((item, i) => {
                const PathIcon = item.icon;
                return (
                  <AnimateSection key={item.title} delay={i * 0.1}>
                    <div className={`${CARD} rounded-card p-5 sm:p-6 hover:shadow-md transition-all flex items-center gap-4`}>
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${item.iconBg}`}>
                        <PathIcon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-[#1E293B]">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-[#1E293B]/65">
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

      {/* ── 4. AI Vision Scan & AI Recap (Fitur AI Cerdas) ─────────────────
          POLA ZIGZAG: [Kiri: Konten Teks AI] | [Kanan: Ilustrasi Scanner AI]
      ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Copy AI Features di Kiri (7 Kolom) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <AnimateSection className="space-y-6">

                <h2 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-[#5B8E55] sm:text-5xl">
                  Gak Perlu Ribet, Ada AI yang Bantu!
                </h2>

                <p className="mx-auto max-w-md text-base leading-relaxed text-[#1E293B]/70 lg:mx-0 sm:text-lg">
                  Catat makanan tinggal foto kemasan dan nikmati ringkasan kemajuan gizi otomatis seperti story Spotify Wrapped.
                </p>

                <div className="space-y-3.5 text-left max-w-md mx-auto lg:mx-0">
                  <div className="flex items-start gap-3.5 rounded-2xl bg-[#FAF8F5] p-4 border-2 border-[#1E293B]/10">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-[#5B8E55] text-white flex items-center justify-center font-bold">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#1E293B]">AI Vision Label Scanner</h4>
                      <p className="text-sm text-[#1E293B]/65 leading-relaxed">
                        Cukup foto tabel Informasi Nilai Gizi makanan kemasan. Kalori, protein, dan lemak terekam otomatis.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 rounded-2xl bg-[#FAF8F5] p-4 border-2 border-[#1E293B]/10">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-[#38BDF8] text-white flex items-center justify-center font-bold">
                      <LineChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#1E293B]">AI Story Recap (Caloria Wrapped)</h4>
                      <p className="text-sm text-[#1E293B]/65 leading-relaxed">
                        Dapatkan evaluasi mingguan & bulanan dalam format kartu interaktif yang seru untuk dibagikan ke teman.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateSection>
            </div>

            {/* Ilustrasi AI di Kanan (5 Kolom) */}
            <div className="lg:col-span-5 flex justify-center">
              <AnimateSection delay={0.2} className="w-full">
                <AiFeaturesIllustration />
              </AnimateSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Co-op Streak Bersama Teman ─────────────────────────────────
          POLA ZIGZAG: [Kiri: Ilustrasi 2 Calpal HP] | [Kanan: Konten Teks Squad]
      ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Visual 2 Calpal Memegang Handphone (Kiri di Desktop - 6 Kolom) */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <AnimateSection className="w-full">
                <CoopStreakIllustration />
              </AnimateSection>
            </div>

            {/* Copy Feature Ringkas (Kanan di Desktop - 6 Kolom) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left order-1 lg:order-2">
              <AnimateSection className="space-y-6">

                <h2 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-[#5B8E55] sm:text-5xl">
                  Sehat Berdua Lebih Asik. Jaga Streak Bareng Sahabat!
                </h2>

                <p className="mx-auto max-w-md text-base leading-relaxed text-[#1E293B]/70 lg:mx-0 sm:text-lg">
                  Bikin <b>Co-op Squad</b> bareng teman atau pasangan. Jaga streak api tetap menyala setiap hari!
                </p>

                <div className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 border-2 border-[#1E293B]/10 shadow-2xs">
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-[#FF9233]/15 text-[#FF9233] flex items-center justify-center font-bold">
                      <Flame className="h-5 w-5 fill-[#FF9233]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1E293B]">Shared Co-op Streak</h4>
                      <p className="text-xs text-[#1E293B]/60">Streak bertambah saat kalian berdua sama-sama mencatat makanan.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 border-2 border-[#1E293B]/10 shadow-2xs">
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-[#5B8E55]/15 text-[#5B8E55] flex items-center justify-center font-bold">
                      <BellRing className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1E293B]">Fitur Senggol Teman</h4>
                      <p className="text-xs text-[#1E293B]/60">Kirim notifikasi lucu ke HP sahabat yang belum log makanan.</p>
                    </div>
                  </div>
                </div>
              </AnimateSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Calpal & wardrobe showcase ─────────────────────────────────
          POLA ZIGZAG: [Kiri: Konten Teks Wardrobe] | [Kanan: 2-Tier Marquee Slider]
      ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Teks Showcase (Kiri di Desktop - 5 Kolom) */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-4">
              <AnimateSection className="space-y-4">

                <h2 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-[#5B8E55] sm:text-5xl">
                  Bikin Calpal Sesuai Gayamu
                </h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-[#1E293B]/70 lg:mx-0 sm:text-lg">
                  Koleksi topi lucu, pakaian keren, dan camilan favorit di Wardrobe. Ribuan kombinasi seru menantimu!
                </p>
                <div className="pt-2 hidden lg:block">
                  <Link href="/register" className={BTN_SECONDARY}>
                    Lihat Koleksi Wardrobe
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </AnimateSection>
            </div>

            {/* Slider Marquee 2 Tingkat (Kanan di Desktop - 7 Kolom) */}
            <div className="lg:col-span-7 overflow-hidden">
              <AnimateSection delay={0.15}>
                <CalpalShowcase />
              </AnimateSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Science-backed engine (Standar Medis & Depkes) ───────────────
          POLA ZIGZAG: [Kiri: Target Preview Card] | [Kanan: Konten Teks Sains]
      ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2">
            {/* Preview card (Kiri di Desktop) */}
            <AnimateSection delay={0.2} className="order-2 md:order-1">
              <div className={`${CARD} rounded-card space-y-5 p-6 sm:p-7 shadow-xs`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#1E293B]">Contoh Target Harian</p>
                    <p className="text-xs text-[#1E293B]/50">Simulasi pria 20 th, 183 cm, 76 kg</p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-2xs"
                    style={{ backgroundColor: SAMPLE_COMPLIANCE.colorHex }}
                  >
                    {SAMPLE_COMPLIANCE.label} ({Math.round(SAMPLE_COMPLIANCE.ratioPercent)}%)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {ENGINE_STATS.map((s) => (
                    <div key={s.label} className="rounded-2xl bg-[#FAF8F5] px-2 py-3 text-center border border-[#1E293B]/5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#1E293B]/50">
                        {s.label}
                      </p>
                      <p className="text-lg font-extrabold tabular-nums text-[#1E293B]">
                        {s.value}
                      </p>
                      <p className="text-[10px] font-semibold text-[#1E293B]/40">
                        {s.unit ? `${s.unit} · ` : ""}{s.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {MACROS.map((m) => (
                    <div key={m.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#1E293B]/70">{m.label}</span>
                        <span className="tabular-nums text-[#1E293B]/50">
                          {Math.round((m.grams * m.pct) / 100)} / {Math.round(m.grams)} gram
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#1E293B]/5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 rounded-2xl bg-[#FCF8E3] p-4 border border-[#FF9233]/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#1E293B]/60">
                      Misi Harian Calpal
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF9233]">
                      <Coins className="h-3.5 w-3.5" aria-hidden="true" /> +30 Koin
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {QUESTS.map((q) => (
                      <li key={q.label} className="flex items-center gap-2 text-sm">
                        <span
                          className={
                            q.done
                              ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#5B8E55] text-white"
                              : "h-5 w-5 rounded-full border-2 border-[#1E293B]/20 bg-white"
                          }
                        >
                          {q.done && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                        </span>
                        <span className={q.done ? "text-[#1E293B]/40 line-through" : "font-semibold text-[#1E293B]/80"}>
                          {q.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateSection>

            {/* Teks Sains & Klinis (Kanan di Desktop) */}
            <AnimateSection className="space-y-5 text-center md:text-left order-1 md:order-2">
              <h2 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-[#5B8E55] sm:text-5xl">
                Bukan Asal Tebak Kalori.
              </h2>
              <p className="mx-auto max-w-md text-base leading-relaxed text-[#1E293B]/70 md:mx-0 sm:text-lg">
                Target gizi dihitung berbasis rumus <b>BBI, BMI, BMR, TEE</b>, dan standar kepatuhan <b>Depkes RI (80–120%)</b>.
              </p>
              <ul className="flex flex-wrap justify-center gap-2 md:justify-start">
                {[
                  "Berat Badan Ideal (BBI)",
                  "Indeks Massa Tubuh (BMI)",
                  "Standar Gizi Depkes RI",
                  "Hitungan Makronutrisi",
                ].map((t) => (
                  <li
                    key={t}
                    className="rounded-full border-2 border-[#1E293B]/10 bg-white px-3.5 py-1 text-xs font-bold text-[#1E293B]/70"
                  >
                    ✓ {t}
                  </li>
                ))}
              </ul>
            </AnimateSection>
          </div>
        </div>
      </section>

      {/* ── 9. Final CTA & Footer ───────────────────────────────────────── */}
      <section className="bg-white pt-16 sm:pt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <AnimateSection>
            <div className="relative overflow-hidden rounded-card bg-[#FCF8E3] px-6 py-12 text-center sm:py-16 border-2 border-[#FF9233]/20 shadow-xs">
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

              <div className="relative mx-auto max-w-md space-y-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#FF9233] shadow-2xs">
                  <Flame className="h-3.5 w-3.5 fill-[#FF9233]" aria-hidden="true" />
                  Mulai Langkah Pertamamu
                </span>
                <h2 className="font-heading text-4xl font-extrabold leading-[1.15] tracking-tight text-[#5B8E55] sm:text-5xl">
                  Yuk, adopsi teman sehatmu hari ini!
                </h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-[#1E293B]/70 sm:text-lg">
                  Gratis digunakan. Gak perlu ribet, langsung atur pola makan sehat sambil bersenang-senang bareng teman.
                </p>
                <Link href="/register" className={BTN_PRIMARY}>
                  Mulai Sekarang — Gratis
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </AnimateSection>
        </div>

        <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-[#1E293B]/50 sm:flex-row sm:px-8 mt-6">
          <Image
            src="/logos/caloria-01.svg"
            alt="Caloria"
            width={96}
            height={24}
            unoptimized
            className="h-6 w-auto opacity-80"
          />
          <p>© 2026 Caloria · Teman nutrisi harianmu</p>
        </footer>
      </section>
    </div>
  );
}
