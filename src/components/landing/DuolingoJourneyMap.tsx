"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import {
  ScanLine,
  Heart,
  Shirt,
  Flame,
  CircleDollarSign,
  CheckCircle2,
} from "lucide-react";
import type { CharacterId } from "@/lib/character-assets/types";

interface StepDetail {
  id: number;
  icon: typeof ScanLine;
  title: string;
  shortDesc: string;
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
    accent: "green" | "orange";
  };
}

const JOURNEY_STEPS: StepDetail[] = [
  {
    id: 1,
    icon: ScanLine,
    title: "1. Catat & Scan Makanan",
    shortDesc:
      "Ketik menu harian atau foto tabel nilai gizi kemasan secara instan.",
    characterId: "nyx",
    characterAccessories: {
      head: "acc-beanie",
      glasses: "acc-rectangular-glasses",
    },
    animationState: "idle",
    widget: {
      title: "Sarapan Pagi",
      sub: "Telur & Roti Gandum",
      highlight: "+28g Protein Tercapai",
      accent: "green",
    },
  },
  {
    id: 2,
    icon: Heart,
    title: "2. Rawat & Naikkan Level",
    shortDesc: "Target terpenuhi, Calpal kenyang dan langsung naik level.",
    characterId: "flameling",
    characterAccessories: {
      held: "acc-apple",
    },
    animationState: "eating",
    widget: {
      title: "Calpal Kenyang",
      sub: "Level 14",
      highlight: "+50 EXP & 15 Koin",
      accent: "orange",
    },
  },
  {
    id: 3,
    icon: Shirt,
    title: "3. Koleksi & Jaga Streak",
    shortDesc: "Tukar koin di toko dan jaga streak harian bersama teman.",
    characterId: "sunny",
    characterAccessories: {
      head: "head-golden-crown",
      body: "body-hero-cape",
      held: "acc-water-bottle",
    },
    animationState: "happy",
    widget: {
      title: "Streak 7 Hari",
      sub: "Squad Kompak",
      highlight: "Mahkota Terbuka",
      accent: "green",
    },
  },
];

export function DuolingoJourneyMap() {
  const [activeStep, setActiveStep] = useState<number>(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % JOURNEY_STEPS.length) + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeStep]);

  const current =
    JOURNEY_STEPS.find((s) => s.id === activeStep) || JOURNEY_STEPS[0];

  const progressPercent =
    activeStep === 1 ? "15%" : activeStep === 2 ? "55%" : "100%";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none">
      {/* Path Stepper */}
      <div className="relative flex items-center justify-between px-4 sm:px-10 pt-10 pb-3">
        {/* Base Track */}
        <div className="absolute left-8 right-8 top-[calc(50%+14px)] -translate-y-1/2 h-3 bg-surface-subtle border border-border-divider rounded-full z-0 overflow-hidden">
          <motion.div
            className="h-full bg-accent-green rounded-full"
            initial={false}
            animate={{ width: progressPercent }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 18,
            }}
          />
        </div>

        {/* 3 Step Nodes */}
        {JOURNEY_STEPS.map((step) => {
          const isActive = activeStep === step.id;
          const isPassed = activeStep > step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center"
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key={`calpal-${step.id}`}
                    initial={{ y: -12, opacity: 0, scale: 0.85 }}
                    animate={{ y: [0, -5, 0], opacity: 1, scale: 1 }}
                    exit={{ y: -12, opacity: 0, scale: 0.85 }}
                    transition={{
                      y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                      opacity: { duration: 0.2 },
                    }}
                    className="absolute -top-14 sm:-top-16 w-14 h-16 sm:w-16 sm:h-20 pointer-events-none"
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

              <button
                type="button"
                onClick={() => setActiveStep(step.id)}
                aria-label={step.title}
                aria-pressed={isActive}
                className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green ${
                  isActive
                    ? "border-accent-green bg-accent-green text-text-inverse"
                    : isPassed
                      ? "border-accent-green bg-accent-green-light text-text-primary"
                      : "border-border-divider bg-surface text-text-muted hover:bg-surface-subtle hover:text-neutral-10"
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                <span className="sr-only">Langkah {step.id}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step Detail Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-2xl border border-border-divider bg-surface p-5 sm:p-6"
        >
          <div className="grid items-center gap-5 sm:grid-cols-12">
            <div className="sm:col-span-7 space-y-1.5 text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Langkah 0{current.id}
              </p>
              <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                {current.title}
              </h3>
              <p className="text-sm text-neutral-10 leading-relaxed">
                {current.shortDesc}
              </p>
            </div>

            <div className="sm:col-span-5 flex justify-center">
              <div className="w-full max-w-[240px] rounded-xl border border-border-divider bg-surface-subtle p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-border-divider pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        current.widget.accent === "orange"
                          ? "bg-accent-orange"
                          : "bg-accent-green"
                      }`}
                    />
                    <span className="text-[11px] font-bold text-neutral-10">
                      {current.widget.title}
                    </span>
                  </div>
                  {current.widget.accent === "orange" ? (
                    <CircleDollarSign
                      className="w-3.5 h-3.5 text-accent-orange"
                      aria-hidden="true"
                    />
                  ) : current.id === 3 ? (
                    <Flame
                      className="w-3.5 h-3.5 text-accent-orange"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-text-primary"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-neutral-10">
                    {current.widget.sub}
                  </p>
                  <p
                    className={`text-[11px] font-extrabold ${
                      current.widget.accent === "orange"
                        ? "text-accent-orange"
                        : "text-text-primary"
                    }`}
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
