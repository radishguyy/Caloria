"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Utensils, Moon, Sun, AlertCircle } from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { COSMETICS_CATALOG } from "@/lib/cosmetics-catalog";
import { PET_CONFIG, PET_SPECIES } from "@/lib/constants";
import { CharacterSvg } from "@/components/pet/character-svg";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

interface PetRendererProps {
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  dialogMessage?: string | null;
  /** When true, render squircle status indicators below level instead of bars/controls (dashboard mode). */
  statusIndicators?: boolean;
}

export function PetRenderer({
  interactive = true,
  size = "md",
  dialogMessage = null,
  statusIndicators = false,
}: PetRendererProps) {
  const isHydrated = useHydrated();

  const {
    name,
    species,
    stage,
    level,
    exp,
    hunger,
    happiness,
    animationState,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    feedPet,
    petInteract,
    toggleSleep,
    getExpNeededForNextLevel,
    getEffectiveColors,
  } = usePetStore();

  const { equipped } = useCosmeticsStore();

  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

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

  // SSR-safe skeleton: prevents hydration mismatch when Zustand's localStorage state differs from default SSR values
  if (!isHydrated) {
    return (
      <div className="flex flex-col items-center justify-center p-3 relative">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-card p-2 bg-surface-subtle/70 border border-border-divider animate-pulse",
            getContainerSize()
          )}
        >
          <div className="w-24 h-24 rounded-full bg-accent-yellow/40 animate-pulse" />
        </div>
        <div className="mt-3 text-center space-y-1">
          <div className="h-6 w-28 bg-surface-subtle rounded-pill animate-pulse mx-auto" />
          <div className="h-3.5 w-36 bg-surface-subtle rounded-pill animate-pulse mx-auto" />
        </div>
        <div className="w-full max-w-xs space-y-2 mt-4">
          <div className="h-2.5 w-full rounded-pill bg-surface-subtle animate-pulse" />
          <div className="h-2.5 w-full rounded-pill bg-surface-subtle animate-pulse" />
          <div className="h-2.5 w-full rounded-pill bg-surface-subtle animate-pulse" />
        </div>
      </div>
    );
  }

  const expNeeded = getExpNeededForNextLevel();
  const expPercent = Math.min(100, Math.round((exp / expNeeded) * 100));

  const speciesInfo = PET_SPECIES.find((s) => s.id === species) || PET_SPECIES[0];
  const charDef = getCharacterDefinition(species);
  const effectiveColors = getEffectiveColors();

  const roomItem = COSMETICS_CATALOG.find((i) => i.id === equipped.room);

  const handlePetClick = () => {
    if (!interactive || animationState === "sleeping") return;
    petInteract();

    const newHeart = { id: Date.now(), x: (Math.random() - 0.5) * 60 };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
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
            className="mb-2 px-3.5 py-1.5 rounded-button bg-accent-yellow/60 border border-accent-green/25 shadow-xs text-xs font-bold text-text-primary text-center max-w-xs relative"
          >
            <span>{dialogMessage}</span>
            <div className="w-2.5 h-2.5 bg-accent-yellow/60 border-b border-r border-accent-green/25 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
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
              className="absolute top-1/4 pointer-events-none z-30 text-macro-fat"
            >
              <Heart className="h-6 w-6 fill-macro-fat" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hunger Low Warning Badge */}
        {hunger < PET_CONFIG.HUNGER_WARNING_THRESHOLD && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-accent-orange/20 text-accent-orange-dark border border-accent-orange/30 px-2 py-0.5 rounded-pill text-[11px] font-semibold"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Lapar!</span>
          </motion.div>
        )}

        {/* Pet Modular SVG Avatar with Motion */}
        <motion.div
          onClick={handlePetClick}
          className={cn(
            "relative flex items-center justify-center rounded-card cursor-pointer transition-all p-2",
            getContainerSize(),
            interactive ? "hover:scale-105 active:scale-95" : ""
          )}
          animate={
            animationState === "eating"
              ? { scale: [1, 1.12, 0.95, 1.08, 1], y: [0, -8, 2, -4, 0] }
              : animationState === "happy"
              ? { y: [0, -18, 0, -10, 0], rotate: [0, -5, 5, -3, 0] }
              : animationState === "sleeping"
              ? { y: [0, 4, 0], scale: [1, 0.98, 1] }
              : { y: [0, -6, 0] }
          }
          transition={{
            duration: animationState === "idle" ? 3 : 1.2,
            repeat:
              animationState === "idle" || animationState === "sleeping"
                ? Infinity
                : 0,
            ease: "easeInOut",
          }}
        >
          {/* Pet Glow Atmosphere */}
          <div
            className="absolute inset-4 rounded-pill blur-2xl opacity-25 pointer-events-none"
            style={{ backgroundColor: effectiveColors.primary }}
          />

          {/* Modular SVG Character Representation (viewBox="0 0 128 160") */}
          <CharacterSvg
            characterId={species}
            colors={customColors}
            earsVariant={earsVariant}
            tailVariant={tailVariant}
            faceVariant={faceVariant}
            animationState={animationState}
            equipped={equipped}
            className="w-full h-full drop-shadow-lg"
          />
        </motion.div>
      </div>

      {/* Pet Header Information */}
      <div className="mt-3 w-full text-center">
        {statusIndicators ? (
          <h3 className="text-center text-3xl font-black leading-none tracking-tight text-text-primary">
            {name}
            <sup className="ml-1 align-super text-sm font-bold tracking-normal text-accent-orange-dark">
              Lv. {level}
            </sup>
          </h3>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-text-primary">{name}</h3>
            <span className="px-2.5 py-0.5 rounded-pill text-xs font-bold bg-accent-orange text-text-inverse">
              Lv. {level}
            </span>
          </div>
        )}

        {statusIndicators ? null : (
          <p className="text-xs text-text-muted mt-0.5">
            {speciesInfo.name} ({charDef.speciesLabel}) • Tahap {stage}{" "}
            {roomItem && !roomItem.isDefaultFree && `(${roomItem.name})`}
          </p>
        )}
      </div>

      {/* Squircle Status Indicators (Dashboard Mode) */}
      {statusIndicators && (
        <div className="mx-auto mt-4 grid w-full max-w-[11.5rem] grid-cols-3 gap-2.5">
          {/* Makan */}
          <button
            onClick={() => feedPet(300, 25, 0)}
            disabled={animationState === "sleeping"}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle">
              <div
                className="absolute inset-x-0 bottom-0 bg-accent-orange transition-[height] duration-500"
                style={{ height: `${hunger}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Utensils
                  className={cn(
                    "h-4 w-4 transition-colors duration-300",
                    hunger >= 100 ? "text-text-inverse" : "text-accent-orange-dark"
                  )}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Makan</span>
          </button>

          {/* Elus */}
          <button
            onClick={handlePetClick}
            disabled={animationState === "sleeping"}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle">
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-[height,background-color] duration-500",
                  expPercent >= 100 ? "bg-accent-green" : "bg-accent-green-light"
                )}
                style={{ height: `${expPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors duration-300",
                    expPercent >= 100 ? "text-text-inverse" : "text-accent-green"
                  )}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Elus</span>
          </button>

          {/* Tidur */}
          <button
            onClick={toggleSleep}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle">
              <div
                className="absolute inset-x-0 bottom-0 bg-accent-yellow transition-[height] duration-500"
                style={{ height: animationState === "sleeping" ? "100%" : "0%" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Moon
                  className={cn(
                    "h-4 w-4 transition-colors duration-300",
                    animationState === "sleeping" ? "text-text-primary" : "text-text-muted"
                  )}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Tidur</span>
          </button>
        </div>
      )}

      {/* Status Progress Bars (Default Mode) */}
      {!statusIndicators && (
        <div className="w-full max-w-xs space-y-2.5 mt-4">
          {/* EXP Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-text-muted font-medium">
              <span className="flex items-center gap-1 text-text-primary font-semibold">
                <Sparkles className="h-3 w-3 text-accent-green" />
                EXP
              </span>
              <span>
                {exp} / {expNeeded} ({expPercent}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-pill bg-surface-subtle border border-border-divider overflow-hidden">
              <div
                className="h-full bg-accent-green transition-all duration-500"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>

          {/* Hunger Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-text-muted font-medium">
              <span className="flex items-center gap-1 text-text-primary font-semibold">
                <Utensils className="h-3 w-3 text-accent-green" />
                Kenyang
              </span>
              <span>{hunger}%</span>
            </div>
            <div className="h-2 w-full rounded-pill bg-surface-subtle border border-border-divider overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  hunger < 30
                    ? "bg-macro-fat"
                    : hunger < 60
                    ? "bg-accent-orange"
                    : "bg-accent-green"
                )}
                style={{ width: `${hunger}%` }}
              />
            </div>
          </div>

          {/* Happiness Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-text-muted font-medium">
              <span className="flex items-center gap-1 text-text-primary font-semibold">
                <Heart className="h-3 w-3 text-macro-fat" />
                Kebahagiaan
              </span>
              <span>{happiness}%</span>
            </div>
            <div className="h-2 w-full rounded-pill bg-surface-subtle border border-border-divider overflow-hidden">
              <div
                className="h-full bg-accent-green-light transition-all duration-500"
                style={{ width: `${happiness}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls */}
      {!statusIndicators && interactive && (
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => feedPet(250)}
            disabled={animationState === "sleeping"}
            className="button-primary flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-50"
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Beri Makan</span>
          </button>

          <button
            onClick={handlePetClick}
            disabled={animationState === "sleeping"}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border-default hover:bg-accent-green-light text-text-primary disabled:opacity-50 rounded-button text-xs font-bold shadow-xs transition-transform active:scale-95"
          >
            <Heart className="h-3.5 w-3.5 text-macro-fat" />
            <span>Elus (+EXP)</span>
          </button>

          <button
            onClick={toggleSleep}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-yellow hover:bg-accent-green-light text-text-primary rounded-button text-xs font-bold border border-border-default transition-transform active:scale-95"
          >
            {animationState === "sleeping" ? (
              <>
                <Sun className="h-3.5 w-3.5 text-accent-orange" />
                <span>Bangun</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-text-primary" />
                <span>Tidur</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
