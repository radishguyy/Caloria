"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Utensils, Moon, Sun, AlertCircle } from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { COSMETICS_CATALOG } from "@/lib/cosmetics-catalog";
import { PET_CONFIG, PET_SPECIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PetRendererProps {
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  dialogMessage?: string | null;
}

export function PetRenderer({
  interactive = true,
  size = "md",
  dialogMessage = null,
}: PetRendererProps) {
  const {
    name,
    species,
    stage,
    level,
    exp,
    hunger,
    happiness,
    animationState,
    feedPet,
    petInteract,
    toggleSleep,
    getExpNeededForNextLevel,
  } = usePetStore();

  const { equipped } = useCosmeticsStore();

  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

  const expNeeded = getExpNeededForNextLevel();
  const expPercent = Math.min(100, Math.round((exp / expNeeded) * 100));

  const speciesInfo = PET_SPECIES.find((s) => s.id === species) || PET_SPECIES[0];

  // Equipped cosmetic details
  const headItem = COSMETICS_CATALOG.find((i) => i.id === equipped.head);
  const glassesItem = COSMETICS_CATALOG.find((i) => i.id === equipped.glasses);
  const bodyItem = COSMETICS_CATALOG.find((i) => i.id === equipped.body);
  const roomItem = COSMETICS_CATALOG.find((i) => i.id === equipped.room);

  const handlePetClick = () => {
    if (!interactive || animationState === "sleeping") return;
    petInteract();

    // Spawn heart particle
    const newHeart = { id: Date.now(), x: (Math.random() - 0.5) * 60 };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
  };

  const getContainerSize = () => {
    switch (size) {
      case "sm":
        return "h-44 w-44";
      case "lg":
        return "h-72 w-72";
      case "md":
      default:
        return "h-56 w-56";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 relative">
      {/* Dialog Speech Bubble (if provided) */}
      <AnimatePresence>
        {dialogMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2 px-3.5 py-1.5 rounded-2xl border border-warm-border bg-surface-raised shadow-md text-xs font-medium text-ink text-center max-w-xs relative"
          >
            <span>{dialogMessage}</span>
            <div className="w-2.5 h-2.5 bg-surface-raised border-b border-r border-warm-border rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet Canvas Area */}
      <div className="relative flex items-center justify-center select-none">
        {/* Floating Heart Particles */}
        <AnimatePresence>
          {floatingHearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, y: 0, x: heart.x, scale: 0.6 }}
              animate={{ opacity: 0, y: -60, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-1/4 pointer-events-none z-30 text-brand-orange"
            >
              <Heart className="h-6 w-6 fill-current" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hunger Low Warning Badge */}
        {hunger < PET_CONFIG.HUNGER_WARNING_THRESHOLD && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2 z-20 flex items-center gap-1 border border-warm-border bg-highlight text-brown px-2 py-0.5 rounded-full text-[11px] font-medium"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Lapar!</span>
          </motion.div>
        )}

        {/* Pet SVG Avatar with Motion */}
        <motion.div
          onClick={handlePetClick}
          className={cn(
            "relative flex items-center justify-center rounded-3xl cursor-pointer transition-all",
            getContainerSize(),
            interactive ? "hover:scale-105 active:scale-95" : ""
          )}
          animate={
            animationState === "eating"
              ? { scale: [1, 1.12, 0.95, 1.08, 1], y: [0, -8, 2, -4, 0] }
              : animationState === "happy"
              ? { y: [0, -20, 0, -10, 0], rotate: [0, -6, 6, -3, 0] }
              : animationState === "sleeping"
              ? { y: [0, 4, 0], scale: [1, 0.98, 1] }
              : { y: [0, -8, 0] } // idle breathing
          }
          transition={{
            duration: animationState === "idle" ? 3 : 1.2,
            repeat: animationState === "idle" || animationState === "sleeping" ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          {/* Pet Glow Atmosphere */}
          <div
            className="absolute inset-4 rounded-full blur-2xl opacity-25"
            style={{ backgroundColor: speciesInfo.color }}
          />

          {/* SVG Character Representation */}
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
            <defs>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={speciesInfo.color} />
                <stop
                  offset="100%"
                  stopColor={species === "flameling" ? "#ea580c" : species === "bloomie" ? "#15803d" : "#0284c7"}
                />
              </linearGradient>
              <radialGradient id="bellyGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0.3" />
              </radialGradient>
            </defs>

            {/* Shadow beneath pet */}
            <ellipse cx="100" cy="180" rx="60" ry="12" fill="currentColor" opacity="0.1" />

            {/* Main Body */}
            <motion.path
              d="M 100 40 C 150 40, 165 90, 160 140 C 155 175, 135 175, 100 175 C 65 175, 45 175, 40 140 C 35 90, 50 40, 100 40 Z"
              fill="url(#bodyGrad)"
            />

            {/* Belly highlight */}
            <ellipse cx="100" cy="125" rx="35" ry="32" fill="url(#bellyGrad)" />

            {/* Equipped Body Item Preview */}
            {bodyItem && !bodyItem.isDefaultFree && (
              <text x="100" y="145" textAnchor="middle" fontSize="24">
                {bodyItem.previewEmoji}
              </text>
            )}

            {/* Stage indicator details (horns/leaves/fins) */}
            {stage >= 2 && species === "flameling" && (
              <>
                {/* Fire Crest / Horns */}
                <path d="M 80 45 Q 70 20 85 28 Q 95 35 90 45" fill="#facc15" />
                <path d="M 120 45 Q 130 20 115 28 Q 105 35 110 45" fill="#facc15" />
                <path d="M 100 42 Q 100 15 105 25 Q 102 38 100 42" fill="#ef4444" />
              </>
            )}

            {stage >= 2 && species === "bloomie" && (
              <>
                {/* Sprout Leaves */}
                <path d="M 100 42 Q 75 20 85 15 Q 100 18 100 42" fill="#86efac" />
                <path d="M 100 42 Q 125 20 115 15 Q 100 18 100 42" fill="#4ade80" />
              </>
            )}

            {stage >= 2 && species === "droplet" && (
              <>
                {/* Water Crown */}
                <circle cx="100" cy="30" r="8" fill="#38bdf8" />
                <path d="M 92 35 C 92 35, 100 20, 108 35 Z" fill="#38bdf8" />
              </>
            )}

            {/* Equipped Head Item Preview */}
            {headItem && !headItem.isDefaultFree && (
              <text x="100" y="32" textAnchor="middle" fontSize="28">
                {headItem.previewEmoji}
              </text>
            )}

            {/* Face Expressions */}
            {animationState === "sleeping" ? (
              // Sleeping Eyes
              <>
                <path d="M 72 98 Q 82 108 92 98" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 108 98 Q 118 108 128 98" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" fill="none" />
                <text x="135" y="85" fontSize="16" fontWeight="bold" fill="#6b7280">z</text>
                <text x="145" y="70" fontSize="20" fontWeight="bold" fill="#6b7280">Z</text>
              </>
            ) : animationState === "eating" ? (
              // Eating Expression
              <>
                <circle cx="80" cy="95" r="7" fill="#1f2937" />
                <circle cx="120" cy="95" r="7" fill="#1f2937" />
                <circle cx="82" cy="93" r="2.5" fill="#ffffff" />
                <circle cx="122" cy="93" r="2.5" fill="#ffffff" />
                {/* Chewing Open Mouth */}
                <path d="M 90 115 Q 100 135 110 115 Z" fill="#ef4444" />
              </>
            ) : animationState === "happy" ? (
              // Happy Arc Eyes & Big Smile
              <>
                <path d="M 72 96 Q 82 84 92 96" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 108 96 Q 118 84 128 96" stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 85 110 Q 100 130 115 110 Z" fill="#ef4444" />
                {/* Blush cheeks */}
                <circle cx="68" cy="108" r="8" fill="#fda4af" opacity="0.8" />
                <circle cx="132" cy="108" r="8" fill="#fda4af" opacity="0.8" />
              </>
            ) : (
              // Default Idle Eyes
              <>
                <circle cx="80" cy="95" r="8" fill="#1f2937" />
                <circle cx="120" cy="95" r="8" fill="#1f2937" />
                {/* Eye sparkle */}
                <circle cx="78" cy="92" r="3" fill="#ffffff" />
                <circle cx="118" cy="92" r="3" fill="#ffffff" />
                {/* Cute smile */}
                <path d="M 92 112 Q 100 120 108 112" stroke="#1f2937" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                {/* Blush */}
                <circle cx="68" cy="108" r="6" fill="#fca5a5" opacity="0.6" />
                <circle cx="132" cy="108" r="6" fill="#fca5a5" opacity="0.6" />
              </>
            )}

            {/* Equipped Glasses Preview */}
            {glassesItem && !glassesItem.isDefaultFree && (
              <text x="100" y="102" textAnchor="middle" fontSize="26">
                {glassesItem.previewEmoji}
              </text>
            )}

            {/* Tiny Hands / Wings */}
            <ellipse cx="50" cy="120" rx="10" ry="14" fill="url(#bodyGrad)" />
            <ellipse cx="150" cy="120" rx="10" ry="14" fill="url(#bodyGrad)" />
          </svg>
        </motion.div>
      </div>

      {/* Pet Header Information */}
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-bold tracking-tight text-ink">{name}</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-green-light text-brand-green-ink">
            Lv. {level}
          </span>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          {speciesInfo.name} • Tahap {stage} {roomItem && !roomItem.isDefaultFree && `(${roomItem.name})`}
        </p>
      </div>

      {/* Status Progress Bars */}
      <div className="w-full max-w-xs space-y-2.5 mt-4">
        {/* EXP Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-ink-muted font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-brand-green" />
              EXP
            </span>
            <span>
              {exp} / {expNeeded} ({expPercent}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-warm-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-green-dark to-brand-green transition-all duration-500"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>

        {/* Hunger Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-ink-muted font-medium">
            <span className="flex items-center gap-1">
              <Utensils className="h-3 w-3 text-brown" />
              Kenyang
            </span>
            <span>{hunger}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-warm-border overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                hunger < 30 ? "bg-brand-orange" : hunger < 60 ? "bg-brown" : "bg-brand-green"
              )}
              style={{ width: `${hunger}%` }}
            />
          </div>
        </div>

        {/* Happiness Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-ink-muted font-medium">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-brand-orange" />
              Kebahagiaan
            </span>
            <span>{happiness}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-warm-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-orange to-brown transition-all duration-500"
              style={{ width: `${happiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      {interactive && (
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => feedPet(250)}
            disabled={animationState === "sleeping"}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-green-light hover:bg-brand-green disabled:opacity-50 text-brand-green-ink hover:text-surface-raised rounded-xl text-xs font-bold shadow-[0_4px_0_var(--brand-green-dark)] transition-transform active:scale-95"
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Beri Makan</span>
          </button>

          <button
            onClick={handlePetClick}
            disabled={animationState === "sleeping"}
            className="flex items-center gap-1.5 px-4 py-2 bg-highlight hover:bg-brand-green-light disabled:opacity-50 text-ink hover:text-brand-green-ink rounded-xl text-xs font-bold shadow-[0_4px_0_var(--warm-border-strong)] transition-transform active:scale-95"
          >
            <Heart className="h-3.5 w-3.5" />
            <span>Elus (+EXP)</span>
          </button>

          <button
            onClick={toggleSleep}
            className="flex items-center gap-1.5 px-3 py-2 border border-warm-border bg-surface-raised hover:bg-brand-green-light text-ink hover:text-brand-green-ink rounded-xl text-xs font-semibold transition-transform active:scale-95"
          >
            {animationState === "sleeping" ? (
              <>
                <Sun className="h-3.5 w-3.5 text-brand-green" />
                <span>Bangun</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-brown" />
                <span>Tidur</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
