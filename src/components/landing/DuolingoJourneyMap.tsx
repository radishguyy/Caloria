"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import {
  ScanLine,
  Heart,
  Shirt,
  Sparkles,
  Flame,
} from "lucide-react";
import type { CharacterId } from "@/lib/character-assets/types";

interface StepDetail {
  id: number;
  icon: typeof ScanLine;
  title: string;
  shortDesc: string;
  badge: string;
  characterId: CharacterId;
  characterAccessories?: {
    head?: string | null;
    glasses?: string | null;
    body?: string | null;
    held?: string | null;
  };
  animationState?: "happy" | "eating" | "idle";
  widget: {
    title: string;
    sub: string;
    highlight: string;
    color: string;
  };
}

const JOURNEY_STEPS: StepDetail[] = [
  {
    id: 1,
    icon: ScanLine,
    title: "1. Catat & Scan Makanan",
    shortDesc: "Ketik menu harian atau foto tabel nilai gizi. Kalori terhitung instan.",
    badge: "Misi Harian",
    characterId: "nyx",
    characterAccessories: {
      head: "acc-beanie",
      glasses: "acc-rectangular-glasses",
    },
    animationState: "idle",
    widget: {
      title: "Sarapan Pagi",
      sub: "Telur Rebus & Roti",
      highlight: "+28g Protein Tercapai! 🍳",
      color: "#5B8E55",
    },
  },
  {
    id: 2,
    icon: Heart,
    title: "2. Rawat & Level Up Pet",
    shortDesc: "Nutrisi terpenuhi, Calpal makan kenyang, dapat exp, dan naik level.",
    badge: "Level Up",
    characterId: "flameling",
    characterAccessories: {
      held: "acc-apple",
    },
    animationState: "eating",
    widget: {
      title: "Calpal Kenyang!",
      sub: "Level 14",
      highlight: "+50 EXP & 15 Koin ✨",
      color: "#FF9233",
    },
  },
  {
    id: 3,
    icon: Shirt,
    title: "3. Koleksi & Jaga Streak",
    shortDesc: "Beli kostum langka dan pertahankan streak sehat bareng temanmu.",
    badge: "Co-op Streak",
    characterId: "sunny",
    characterAccessories: {
      head: "head-golden-crown",
      body: "body-hero-cape",
      held: "acc-water-bottle",
    },
    animationState: "happy",
    widget: {
      title: "Streak 7 Hari 🔥",
      sub: "Squad Kompak",
      highlight: "Mahkota Terbuka! 👑",
      color: "#0284C7",
    },
  },
];

export function DuolingoJourneyMap() {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Interval otomatis: berganti tiap 5 detik, berputar kembali jika sudah sampai akhir (1 -> 2 -> 3 -> 1)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % JOURNEY_STEPS.length) + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeStep]);

  const current = JOURNEY_STEPS.find((s) => s.id === activeStep) || JOURNEY_STEPS[0];

  // Target persentase untuk tiap node (tengah node 1: 0%, tengah node 2: 50%, tengah node 3: 100%)
  const progressPercent = activeStep === 1 ? "15%" : activeStep === 2 ? "55%" : "100%";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none">
      {/* ── Path Stepper / Node Jalan Setapak Interaktif dengan Animasi Loading Bar ── */}
      <div className="relative flex items-center justify-between px-4 sm:px-10 py-3">
        {/* Garis Jalan Setapak (Base Track) */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-4 bg-[#FAF8F5] border-2 border-[#1E293B]/10 rounded-full z-0 overflow-hidden shadow-inner">
          {/* Progress Loading Bar Terisi */}
          <motion.div
            className="relative h-full bg-gradient-to-r from-[#8e7955] to-[#FF9233] rounded-full overflow-hidden"
            initial={false}
            animate={{ width: progressPercent }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 18,
            }}
          >
            {/* Animasi Shimmer / Striped Pulsa Bergerak Seperti Loading Bar Game */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "linear",
              }}
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
            />
          </motion.div>
        </div>

        {/* 3 Step Nodes */}
        {JOURNEY_STEPS.map((step) => {
          const isActive = activeStep === step.id;
          const isPassed = activeStep > step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Pet Melompat di Atas Node yang Aktif */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key={`calpal-${step.id}`}
                    initial={{ y: -15, opacity: 0, scale: 0.8 }}
                    animate={{ y: [0, -6, 0], opacity: 1, scale: 1 }}
                    exit={{ y: -15, opacity: 0, scale: 0.8 }}
                    transition={{
                      y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                      opacity: { duration: 0.2 },
                    }}
                    className="absolute -top-14 sm:-top-18 w-14 h-18 sm:w-18 sm:h-22 pointer-events-none drop-shadow-md"
                  >
                    <AvatarRenderer
                      characterId={step.characterId}
                      equipped={step.characterAccessories}
                      animationState={step.animationState}
                      showRoomBackdrop={false}
                      showShadow={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tombol Node Bulat 3D Ala Duolingo dengan Ring Efek Active Pulse */}
              <button
                type="button"
                onClick={() => setActiveStep(step.id)}
                aria-label={step.title}
                className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "border-[#5B8E55] bg-[#5B8E55] text-white shadow-[0_5px_0_#3f6b3a] translate-y-[-3px] ring-4 ring-[#5B8E55]/25"
                    : isPassed
                    ? "border-gray-600 bg-gray-600 text-white shadow-[0_3px_0_rgba(30,41,59,0.08)] hover:bg-[#5B8E55]/25"
                    : "border-[#1E293B]/15 bg-white text-[#1E293B]/40 shadow-[0_3px_0_rgba(30,41,59,0.06)] hover:bg-[#FCF8E3]"
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />

                {/* Badge Angka Step */}
                <span className="absolute -bottom-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-white border border-[#1E293B]/10 text-[#1E293B]/70 shadow-2xs">
                  0{step.id}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Detail Card Ringkas & Bersih ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-2xl border-2 border-[#1E293B]/10 bg-white p-5 sm:p-6 shadow-sm"
        >
          <div className="grid items-center gap-5 sm:grid-cols-12">
            {/* Teks Step Ringkas (7 Kolom) */}
            <div className="sm:col-span-7 space-y-2 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCF8E3] px-3 py-0.5 text-xs font-bold text-[#FF9233] border border-[#FF9233]/20">
                <Flame className="h-3 w-3 fill-[#FF9233]" />
                Langkah {current.id}: {current.badge}
              </span>

              <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#5B8E55] tracking-tight">
                {current.title}
              </h3>

              <p className="text-sm text-[#1E293B]/70 leading-relaxed">
                {current.shortDesc}
              </p>
            </div>

            {/* Widget Mini Preview (5 Kolom) */}
            <div className="sm:col-span-5 flex justify-center">
              <div className="w-full max-w-[240px] rounded-xl border border-[#1E293B]/10 bg-[#FAF8F5] p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1E293B]/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: current.widget.color }}
                    />
                    <span className="text-[11px] font-bold text-[#1E293B]/70">
                      {current.widget.title}
                    </span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-[#FF9233]" />
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#1E293B]">
                    {current.widget.sub}
                  </p>
                  <p
                    className="text-[11px] font-extrabold"
                    style={{ color: current.widget.color }}
                  >
                    {current.widget.highlight}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
