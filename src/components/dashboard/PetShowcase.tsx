"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  Heart,
  Moon,
  Sun,
  Coins,
  Sparkles,
  AlertCircle,
  Clock,
  Flame,
} from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { CharacterSvg } from "@/components/pet/character-svg";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import { PET_CONFIG, PET_SPECIES } from "@/lib/constants";
import { evaluatePetCondition, PetConditionResult } from "@/lib/pet/decay-evaluator";
import { feedPetAction } from "@/server/actions/pet-actions";
import {
  toastFeedingSuccess,
  toastInsufficientCoins,
  toastPetPetted,
} from "@/lib/toast";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

interface PetShowcaseProps {
  className?: string;
}

export function PetShowcase({ className }: PetShowcaseProps) {
  const isHydrated = useHydrated();

  const {
    name,
    species,
    stage,
    level,
    exp,
    coins,
    hunger,
    happiness,
    animationState,
    moodStatus,
    lastFedAt,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    feedWithCoins,
    checkAndApplyDecay,
    petInteract,
    toggleSleep,
    getExpNeededForNextLevel,
    getEffectiveColors,
  } = usePetStore();

  const { equipped } = useCosmeticsStore();
  const [isFeeding, setIsFeeding] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number }[]
  >([]);

  // Periodic evaluation of pet condition (decay & complaining mood)
  useEffect(() => {
    if (!isHydrated) return;
    checkAndApplyDecay();
    const interval = setInterval(() => {
      checkAndApplyDecay();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isHydrated, checkAndApplyDecay]);

  // Dynamic evaluation calculation (SSR-safe: only evaluate real time after client hydration)
  const condition: PetConditionResult = useMemo(() => {
    if (!isHydrated) {
      return {
        isComplaining: moodStatus === "complaining",
        currentMood: moodStatus === "complaining" ? "complaining" : "happy",
        adjustedExp: exp,
        hoursSinceFed: 0,
        hoursOverdue: 0,
        expPenalty: 0,
        dialogueMessage: "Calpal kenyang & penuh energi! ✨",
      };
    }
    return evaluatePetCondition({
      lastFedAt,
      exp,
      level,
      moodStatus,
    });
  }, [isHydrated, lastFedAt, exp, level, moodStatus]);

  const isComplaining = condition.isComplaining || moodStatus === "complaining";
  const hoursSinceFed = condition.hoursSinceFed;

  // Formatting minimal timestamp label
  const formattedLastFedLabel = useMemo(() => {
    if (!isHydrated) return "...";
    if (hoursSinceFed === 0) return "Baru saja";
    if (hoursSinceFed === 1) return "1 jam lalu";
    return `${hoursSinceFed} jam lalu`;
  }, [isHydrated, hoursSinceFed]);

  // Contextual speech bubble text
  const speechBubbleText = useMemo(() => {
    if (animationState === "sleeping") {
      return "Zzz... Calpal sedang tidur nyenyak 💤";
    }
    if (animationState === "eating") {
      return "Nyam nyam! Enak sekali! 😋✨";
    }
    if (isComplaining) {
      if (hoursSinceFed >= 20) {
        return `My tummy is rumbling... I haven't eaten in ${hoursSinceFed} hours 🥺`;
      }
      return "Feeling so sluggish... please feed me!";
    }
    return "Calpal kenyang & penuh energi! Semangat hidup sehat! ✨";
  }, [animationState, isComplaining, hoursSinceFed]);

  const expNeeded = getExpNeededForNextLevel();
  const expPercent = Math.min(100, Math.round((exp / expNeeded) * 100));

  const effectiveColors = getEffectiveColors();
  const charDef = getCharacterDefinition(species);

  // Feeding Action Handler (5-coin cost check)
  const handleFeedPet = async () => {
    if (animationState === "sleeping" || isFeeding) return;

    const FEED_COST = 5;

    // 1. Coin cost check
    if (coins < FEED_COST) {
      toastInsufficientCoins();
      return;
    }

    setIsFeeding(true);

    // 2. Client-side optimistic update
    const clientSuccess = feedWithCoins(FEED_COST);
    if (!clientSuccess.success) {
      toastInsufficientCoins();
      setIsFeeding(false);
      return;
    }

    // 3. Dispatch tactile success toast
    toastFeedingSuccess();

    // 4. Server-side atomic DB persist
    try {
      const result = await feedPetAction();
      if (!result.success && result.error === "INSUFFICIENT_COINS") {
        toastInsufficientCoins();
      }
    } catch (err) {
      console.warn("[PetShowcase] feedPetAction warning:", err);
    } finally {
      setIsFeeding(false);
    }
  };

  const handlePetClick = () => {
    if (animationState === "sleeping") return;
    petInteract();

    const id = Date.now();
    const newHeart = { id, x: (Math.random() - 0.5) * 60 };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);

    toastPetPetted(10);
  };

  if (!isHydrated) {
    return (
      <div className={cn("rounded-card border border-border-divider bg-surface p-6 shadow-xs animate-pulse", className)}>
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-24 bg-surface-subtle rounded-pill" />
          <div className="h-6 w-20 bg-surface-subtle rounded-pill" />
        </div>
        <div className="h-52 w-52 mx-auto rounded-card bg-surface-subtle" />
        <div className="h-10 w-full bg-surface-subtle rounded-button mt-4" />
      </div>
    );
  }

  const canAffordFeed = coins >= 5;

  return (
    <div
      className={cn(
        "rounded-card border border-border-divider bg-surface p-6 shadow-xs flex flex-col justify-between transition-colors",
        isComplaining && "bg-gradient-to-b from-[#FCF8E3]/40 to-surface",
        className,
      )}
    >
      {/* Top Bar: Coin Balance & Last Fed Timestamp */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Real-time Coin Balance Badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-pill border text-xs font-black shadow-2xs transition-colors",
            canAffordFeed
              ? "bg-[#FCF8E3] border-[#FF9233]/40 text-[#FF9233]"
              : "bg-surface-subtle border-border-divider text-rose-500",
          )}
          title={`Saldo Caloria Coins: ${coins} Koin`}
        >
          <span className="text-sm">🪙</span>
          <span className="font-sans font-bold">{coins} Koin</span>
        </div>

        {/* Minimal Timestamp Label */}
        <div
          className="flex items-center gap-1 text-[11px] font-sans font-semibold text-text-muted bg-surface-subtle px-2.5 py-1 rounded-pill border border-border-divider"
          title={
            isHydrated && lastFedAt
              ? `Waktu makan terakhir: ${new Date(lastFedAt).toLocaleString()}`
              : undefined
          }
        >
          <Clock className="h-3 w-3 text-text-muted" />
          <span>Last fed: {formattedLastFedLabel}</span>
        </div>
      </div>

      {/* Calpal Speech Bubble */}
      <div className="min-h-[46px] flex items-center justify-center mb-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={speechBubbleText}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "px-3.5 py-2 rounded-2xl text-xs font-bold font-sans text-center max-w-sm relative shadow-2xs border",
              isComplaining
                ? "bg-[#FCF8E3] border-[#FF9233]/40 text-[#B45309]"
                : "bg-accent-yellow/50 border-accent-green/25 text-text-primary",
            )}
          >
            <span>{speechBubbleText}</span>
            <div
              className={cn(
                "w-2.5 h-2.5 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r",
                isComplaining
                  ? "bg-[#FCF8E3] border-[#FF9233]/40"
                  : "bg-accent-yellow/50 border-accent-green/25",
              )}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pet Canvas Area with Sluggish vs Energetic Motion */}
      <div className="relative flex items-center justify-center select-none my-1">
        {/* Floating Heart & EXP Particles */}
        <AnimatePresence>
          {floatingHearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, y: 0, x: heart.x, scale: 0.6 }}
              animate={{ opacity: 0, y: -65, scale: 1.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-1/4 pointer-events-none z-30 flex items-center gap-1.5 text-macro-fat"
            >
              <Heart className="h-6 w-6 fill-macro-fat" />
              <span className="rounded-full bg-surface/95 px-2 py-0.5 text-[10px] font-black text-accent-green shadow-xs border border-accent-green/30">
                +10 XP
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Complaining / Sluggish Warning Indicator Badge */}
        {isComplaining && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-1 right-3 z-20 flex items-center gap-1 bg-[#FCF8E3] text-[#FF9233] border border-[#FF9233]/50 px-2.5 py-0.5 rounded-pill text-[10px] font-bold shadow-2xs"
          >
            <AlertCircle className="h-3 w-3 text-[#FF9233]" />
            <span>Lapar & Lemas (-2 EXP/jam)</span>
          </motion.div>
        )}

        {/* Modular Avatar Motion */}
        <motion.div
          animate={
            animationState === "eating"
              ? { scale: [1, 1.1, 0.95, 1.05, 1], y: [0, -8, 2, -4, 0] }
              : animationState === "happy"
                ? { y: [0, -14, 0, -8, 0], rotate: [0, -4, 4, -2, 0] }
                : animationState === "sleeping"
                  ? { scale: [1, 0.97, 1], y: [0, 4, 0] }
                  : isComplaining
                    ? { y: [0, 3, 0], rotate: [0, -1, 0] }
                    : { y: [0, -6, 0] }
          }
          transition={
            animationState === "eating"
              ? { duration: 0.8, repeat: 2 }
              : animationState === "happy"
                ? { duration: 0.9, repeat: 1 }
                : animationState === "sleeping"
                  ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  : isComplaining
                    ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          }
          onClick={handlePetClick}
          className="relative flex items-center justify-center rounded-card p-2 w-52 h-52 cursor-pointer active:scale-95 transition-transform"
        >
          {/* Sleeping 'Zzz' Overlay */}
          {animationState === "sleeping" && (
            <div className="absolute top-2 right-4 flex flex-col items-center pointer-events-none select-none z-20">
              <motion.span
                animate={{ opacity: [0, 1, 0], y: [0, -10], x: [0, 4] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0 }}
                className="text-xs font-bold text-accent-yellow"
              >
                z
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0], y: [0, -14], x: [0, 8] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
                className="text-sm font-bold text-accent-yellow -mt-1"
              >
                Z
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0], y: [0, -18], x: [0, 12] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 1.2 }}
                className="text-base font-extrabold text-accent-yellow -mt-1"
              >
                Z
              </motion.span>
            </div>
          )}

          {/* Calpal Modular SVG Avatar */}
          <CharacterSvg
            characterId={species}
            colors={effectiveColors}
            earsVariant={earsVariant}
            tailVariant={tailVariant}
            faceVariant={faceVariant}
            animationState={animationState}
            moodStatus={isComplaining ? "complaining" : "happy"}
            equipped={equipped}
            className="w-full h-full drop-shadow-md"
          />
        </motion.div>
      </div>

      {/* Pet Header Information */}
      <div className="text-center mt-1">
        <h3 className="text-2xl font-black tracking-tight text-text-primary font-heading">
          {name}
          <sup className="ml-1.5 align-super text-xs font-bold text-accent-orange-dark font-sans">
            Lv. {level}
          </sup>
        </h3>
        <p className="text-[11px] text-text-muted font-sans mt-0.5">
          {charDef.name} ({charDef.speciesLabel}) • Tahap {stage}
        </p>
      </div>

      {/* Squircle Status Indicators (Makan / Elus / Tidur) */}
      <div className="w-full max-w-[13.5rem] mx-auto mt-3.5 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          {/* Makan Status Indicator */}
          <button
            type="button"
            onClick={handleFeedPet}
            disabled={animationState === "sleeping"}
            aria-label="Beri makan Calpal (5 Koin)"
            className="flex flex-col items-center gap-1 transition-transform active:scale-95 disabled:opacity-50"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle shadow-2xs">
              <div
                className="absolute inset-x-0 bottom-0 bg-accent-orange transition-[height] duration-500"
                style={{ height: `${hunger}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Utensils
                  className={cn(
                    "h-3.5 w-3.5 transition-colors duration-300",
                    hunger >= 100
                      ? "text-text-inverse"
                      : "text-accent-orange-dark",
                  )}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted font-sans">
              Kenyang ({hunger}%)
            </span>
          </button>

          {/* Elus Status Indicator */}
          <button
            type="button"
            onClick={handlePetClick}
            disabled={animationState === "sleeping"}
            aria-label="Elus Calpal"
            className="flex flex-col items-center gap-1 transition-transform active:scale-95 disabled:opacity-50"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle shadow-2xs">
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-[height,background-color] duration-500",
                  happiness >= 100 ? "bg-macro-fat" : "bg-macro-fat/40",
                )}
                style={{ height: `${happiness}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart
                  className={cn(
                    "h-3.5 w-3.5 transition-colors duration-300",
                    happiness >= 100
                      ? "text-text-inverse fill-text-inverse"
                      : "text-macro-fat fill-macro-fat",
                  )}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted font-sans">
              Ceria ({happiness}%)
            </span>
          </button>

          {/* Tidur Status Indicator */}
          <button
            type="button"
            onClick={toggleSleep}
            aria-label={
              animationState === "sleeping" ? "Bangunkan Calpal" : "Tidurkan Calpal"
            }
            className="flex flex-col items-center gap-1 transition-transform active:scale-95"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle shadow-2xs">
              <div
                className="absolute inset-x-0 bottom-0 bg-accent-yellow transition-[height] duration-500"
                style={{
                  height: animationState === "sleeping" ? "100%" : "0%",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Moon
                  className={cn(
                    "h-3.5 w-3.5 transition-colors duration-300",
                    animationState === "sleeping"
                      ? "text-text-primary"
                      : "text-text-muted",
                  )}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted font-sans">
              Tidur
            </span>
          </button>
        </div>

        {/* EXP Progress Bar with Level Floor Guard */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] text-text-muted font-bold font-sans">
            <span className="flex items-center gap-1 text-text-primary">
              <Sparkles className="h-3 w-3 text-accent-green" />
              EXP (Floor: 0 Min)
            </span>
            <span>
              {exp} / {expNeeded} ({expPercent}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-pill bg-surface-subtle border border-border-divider overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                isComplaining ? "bg-accent-orange" : "bg-accent-green",
              )}
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* "Feed Calpal (5 🪙)" Button */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={handleFeedPet}
          disabled={animationState === "sleeping" || isFeeding}
          className={cn(
            "w-full py-2.5 px-4 rounded-button font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm",
            canAffordFeed
              ? "button-primary active:scale-[0.98] cursor-pointer"
              : "bg-surface-subtle text-text-muted border border-border-divider opacity-70 cursor-not-allowed",
          )}
          title={
            canAffordFeed
              ? "Beri makan Calpal (Biaya 5 Koin)"
              : "Koin tidak cukup! Butuh minimal 5 koin untuk memberi makan."
          }
        >
          <Utensils className="h-4 w-4 shrink-0" />
          <span>
            {isFeeding
              ? "Memberi Makan..."
              : canAffordFeed
                ? "Feed Calpal (5 🪙)"
                : "Feed Calpal (Butuh 5 🪙)"}
          </span>
        </button>

        {!canAffordFeed && (
          <p className="text-[10px] text-rose-500 text-center font-sans font-semibold mt-1.5 flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>Koin kurang. Catat makanan atau login harian untuk koin.</span>
          </p>
        )}
      </div>
    </div>
  );
}
