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
            className="mb-2 px-3.5 py-1.5 rounded-2xl bg-card border border-border/80 shadow-md text-xs font-medium text-foreground text-center max-w-xs relative"
          >
            <span>{dialogMessage}</span>
            <div className="w-2.5 h-2.5 bg-card border-b border-r border-border/80 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
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
              className="absolute top-1/4 pointer-events-none z-30 text-rose-500"
            >
              <Heart className="h-6 w-6 fill-rose-500" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hunger Low Warning Badge */}
        {hunger < PET_CONFIG.HUNGER_WARNING_THRESHOLD && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-medium"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Lapar!</span>
          </motion.div>
        )}

        {/* Pet Modular SVG Avatar with Motion */}
        <motion.div
          onClick={handlePetClick}
          className={cn(
            "relative flex items-center justify-center rounded-3xl cursor-pointer transition-all p-2",
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
            className="absolute inset-4 rounded-full blur-2xl opacity-25 pointer-events-none"
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
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-bold tracking-tight text-foreground">{name}</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            Lv. {level}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {speciesInfo.name} ({charDef.speciesLabel}) • Tahap {stage}{" "}
          {roomItem && !roomItem.isDefaultFree && `(${roomItem.name})`}
        </p>
      </div>

      {/* Status Progress Bars */}
      <div className="w-full max-w-xs space-y-2.5 mt-4">
        {/* EXP Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              EXP
            </span>
            <span>
              {exp} / {expNeeded} ({expPercent}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>

        {/* Hunger Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Utensils className="h-3 w-3 text-orange-500" />
              Kenyang
            </span>
            <span>{hunger}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                hunger < 30
                  ? "bg-red-500"
                  : hunger < 60
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              )}
              style={{ width: `${hunger}%` }}
            />
          </div>
        </div>

        {/* Happiness Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-rose-500" />
              Kebahagiaan
            </span>
            <span>{happiness}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-500"
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
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95"
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Beri Makan</span>
          </button>

          <button
            onClick={handlePetClick}
            disabled={animationState === "sleeping"}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95"
          >
            <Heart className="h-3.5 w-3.5" />
            <span>Elus (+EXP)</span>
          </button>

          <button
            onClick={toggleSleep}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-xs font-medium border border-border transition-transform active:scale-95"
          >
            {animationState === "sleeping" ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Bangun</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Tidur</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
