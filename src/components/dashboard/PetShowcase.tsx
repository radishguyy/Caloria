"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  Heart,
  Moon,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  Lock,
  RefreshCw,
  Trophy,
  Flame,
} from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useFoodStore } from "@/store/use-food-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useSocialStore } from "@/store/use-social-store";
import { CharacterSvg } from "@/components/pet/character-svg";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import { evaluatePetCondition, PetConditionResult } from "@/lib/pet/decay-evaluator";
import {
  MAIN_MEAL_SLOTS,
  MAX_DAILY_FEEDS,
  MAX_DAILY_PETS,
  evaluateCalpalNeeds,
  extractLoggedMainMealSlots,
  getMealSlotConfig,
} from "@/lib/pet/needs-engine";
import { feedPetAction, petCalpalAction } from "@/server/actions/pet-actions";
import { formatDateKey } from "@/lib/date-utils";
import {
  toastFeedingSuccess,
  toastFeedBlocked,
  toastInsufficientCoins,
  toastPetPetted,
  toastPetBlocked,
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
    animationState,
    moodStatus,
    lastFedAt,
    lastPettedAt,
    fedSlotsToday,
    petCountToday,
    needsResetDate,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    nftTokenId,
    mintStatus,
    feedWithCoins,
    checkAndApplyDecay,
    petInteract,
    toggleSleep,
    getExpNeededForNextLevel,
    getEffectiveColors,
  } = usePetStore();

  const logs = useFoodStore((s) => s.logs);
  const completedMissions = useFoodStore((s) => s.completedMissions);
  const getEvaluatedMissions = useFoodStore((s) => s.getEvaluatedMissions);
  const { equipped } = useCosmeticsStore();
  const { coopStreakDays, lastLoggedDate, lastRestDayDate } = useSocialStore();

  const [isFeeding, setIsFeeding] = useState(false);
  const [isPetting, setIsPetting] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [dialogueSeed, setDialogueSeed] = useState(0);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAiDialogueLoading, setIsAiDialogueLoading] = useState(false);
  const [aiSource, setAiSource] = useState<"ai" | "fallback" | null>(null);
  const lastFetchedSignatureRef = useRef<string>("");

  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number }[]
  >([]);

  // Periodic evaluation of pet condition & clock tick (every minute)
  useEffect(() => {
    if (!isHydrated) return;
    checkAndApplyDecay();
    const interval = setInterval(() => {
      checkAndApplyDecay();
      setClockTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isHydrated, checkAndApplyDecay]);

  const now = useMemo(() => {
    void clockTick;
    return isHydrated ? new Date() : new Date("2026-10-30T08:00:00.000Z");
  }, [isHydrated, clockTick]);

  const todayKey = useMemo(() => formatDateKey(now), [now]);

  // Main meals logged today (breakfast, lunch, dinner)
  const loggedMainMealsToday = useMemo(() => {
    if (!isHydrated) return [];
    return extractLoggedMainMealSlots(logs, todayKey);
  }, [isHydrated, logs, todayKey]);

  // Daily missions completion status
  const missionStats = useMemo(() => {
    if (!isHydrated) {
      return { completedCount: 0, totalCount: 0 };
    }
    const evaluated = getEvaluatedMissions(todayKey);
    const totalCount = evaluated.length;
    const completedCount = evaluated.filter(
      (item) =>
        item.status.isCompleted || completedMissions.includes(item.mission.id),
    ).length;
    return { completedCount, totalCount };
  }, [isHydrated, getEvaluatedMissions, todayKey, logs, completedMissions]);

  // Legacy 20-hour EXP decay evaluation
  const condition: PetConditionResult = useMemo(() => {
    if (!isHydrated) {
      return {
        isComplaining: moodStatus === "complaining",
        currentMood: moodStatus === "complaining" ? "complaining" : "happy",
        adjustedExp: exp,
        hoursSinceFed: 0,
        hoursOverdue: 0,
        expPenalty: 0,
        dialogueMessage: "CalPal kenyang & penuh energi! ✨",
      };
    }
    return evaluatePetCondition({
      lastFedAt,
      exp,
      level,
      moodStatus,
    }, now);
  }, [isHydrated, lastFedAt, exp, level, moodStatus, now]);

  // New CalPal Daily Needs evaluation (Makan 3x, Perhatian 3x, Misi Harian)
  const needs = useMemo(() => {
    return evaluateCalpalNeeds({
      fedSlotsToday,
      petCountToday,
      needsResetDate,
      lastFedAt,
      lastPettedAt,
      loggedMainMealsToday,
      completedDailyMissionsCount: missionStats.completedCount,
      totalDailyMissionsCount: missionStats.totalCount,
      now,
      dialogueSeed: dialogueSeed > 0 ? dialogueSeed : undefined,
    });
  }, [
    fedSlotsToday,
    petCountToday,
    needsResetDate,
    lastFedAt,
    lastPettedAt,
    loggedMainMealsToday,
    missionStats.completedCount,
    missionStats.totalCount,
    now,
    dialogueSeed,
  ]);

  const isEcstatic = needs.isEcstatic;
  const isComplaining =
    !isEcstatic && (needs.isComplaining || condition.isComplaining);
  const hoursSinceFed = condition.hoursSinceFed;
  const showLateStreakNudge =
    isHydrated &&
    now.getHours() >= 20 &&
    coopStreakDays > 0 &&
    lastLoggedDate !== todayKey &&
    lastRestDayDate !== todayKey;

  // Fetch AI-personalized dialogue from /api/pet/dialogue
  const fetchAiDialogue = useCallback(
    async (force = false) => {
      if (!isHydrated || animationState === "sleeping") return;

      const signature = [
        needs.moodCategory,
        needs.currentSlot ?? "none",
        needs.fedSlotsToday.join(","),
        needs.petEligibility.petCountToday,
        needs.petEligibility.loggedMainMeals.join(","),
        missionStats.completedCount,
      ].join("|");

      if (!force && lastFetchedSignatureRef.current === signature) {
        return;
      }
      lastFetchedSignatureRef.current = signature;

      setIsAiDialogueLoading(true);
      try {
        const res = await fetch("/api/pet/dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            petName: name,
            petSpecies: species,
            moodCategory: needs.moodCategory,
            currentSlot: needs.currentSlot,
            fedSlotsToday: needs.fedSlotsToday,
            missedMealSlots: needs.missedMealSlots,
            loggedMainMealsToday: needs.petEligibility.loggedMainMeals,
            petCountToday: needs.petEligibility.petCountToday,
            hoursSinceFed: needs.hoursSinceFed,
            hoursSincePetted: needs.hoursSincePetted,
            completedDailyMissionsCount: missionStats.completedCount,
            totalDailyMissionsCount: missionStats.totalCount,
            previousMessage: aiMessage ?? undefined,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            message?: string;
            source?: "ai" | "fallback";
          };
          if (data.message) {
            setAiMessage(data.message);
            setAiSource(data.source ?? "fallback");
          }
        }
      } catch (err) {
        console.warn("[PetShowcase] AI dialogue fallback:", err);
      } finally {
        setIsAiDialogueLoading(false);
      }
    },
    [
      isHydrated,
      animationState,
      name,
      species,
      needs.moodCategory,
      needs.currentSlot,
      needs.fedSlotsToday,
      needs.missedMealSlots,
      needs.petEligibility.petCountToday,
      needs.petEligibility.loggedMainMeals,
      needs.hoursSinceFed,
      needs.hoursSincePetted,
      missionStats.completedCount,
      missionStats.totalCount,
      aiMessage,
    ],
  );

  useEffect(() => {
    if (!isHydrated) return;
    fetchAiDialogue(false);
  }, [isHydrated, fetchAiDialogue]);

  const handleRefreshDialogue = () => {
    setDialogueSeed((s) => s + 1);
    fetchAiDialogue(true);
  };

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
      return "Zzz... CalPal sedang tidur nyenyak 💤";
    }
    if (animationState === "eating") {
      return "Nyam nyam! Enak sekali! Makasih sudah kasih makan 😋✨";
    }
    if (aiMessage) {
      return aiMessage;
    }
    return needs.fallbackDialogue;
  }, [animationState, aiMessage, needs.fallbackDialogue]);

  const expNeeded = getExpNeededForNextLevel();
  const expPercent = Math.min(100, Math.round((exp / expNeeded) * 100));

  const effectiveColors = getEffectiveColors();
  const charDef = getCharacterDefinition(species);

  // Feeding Action Handler (max 3x/day by meal window + 5-coin cost check)
  const handleFeedPet = async () => {
    if (animationState === "sleeping" || isFeeding) return;

    const FEED_COST = 5;

    // 1. Meal window & daily 3x limit check
    if (!needs.feedEligibility.canFeed) {
      toastFeedBlocked(needs.feedEligibility.message);
      return;
    }

    // 2. Coin cost check
    if (coins < FEED_COST) {
      toastInsufficientCoins();
      return;
    }

    setIsFeeding(true);

    // 3. Client-side optimistic update
    const actionNow = new Date();
    const clientRes = feedWithCoins(FEED_COST, actionNow);
    if (!clientRes.success) {
      if (clientRes.error === "INSUFFICIENT_COINS") {
        toastInsufficientCoins();
      } else {
        toastFeedBlocked(
          clientRes.message || needs.feedEligibility.message,
        );
      }
      setIsFeeding(false);
      return;
    }

    const slotLabel = clientRes.slot
      ? getMealSlotConfig(clientRes.slot).label
      : undefined;

    // 4. Dispatch tactile success toast
    toastFeedingSuccess(slotLabel);

    // 5. Server-side atomic DB persist
    try {
      const result = await feedPetAction({
        clientDateKey: formatDateKey(actionNow),
        clientHour: actionNow.getHours(),
      });
      if (!result.success && result.error === "INSUFFICIENT_COINS") {
        toastInsufficientCoins();
      }
    } catch (err) {
      console.warn("[PetShowcase] feedPetAction warning:", err);
    } finally {
      setIsFeeding(false);
    }
  };

  // Petting / Attention Action Handler (max 3x/day + gated by logged main meals)
  const handlePetClick = async () => {
    if (animationState === "sleeping" || isPetting) return;

    if (!needs.petEligibility.canPet) {
      toastPetBlocked(needs.petEligibility.message);
      // Trigger a fresh nagging reminder when user tries to pet without logging meals
      if (needs.petEligibility.reason === "NEED_MAIN_MEAL_LOG") {
        setDialogueSeed((s) => s + 1);
      }
      return;
    }

    setIsPetting(true);
    const actionNow = new Date();
    const clientRes = petInteract(loggedMainMealsToday, actionNow);

    if (!clientRes.success) {
      toastPetBlocked(clientRes.message || needs.petEligibility.message);
      setIsPetting(false);
      return;
    }

    const id = Date.now();
    const newHeart = { id, x: (Math.random() - 0.5) * 60 };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);

    toastPetPetted(10, clientRes.petCountToday);

    try {
      await petCalpalAction({
        clientDateKey: formatDateKey(actionNow),
        loggedMainMealCount: loggedMainMealsToday.length,
      });
    } catch (err) {
      console.warn("[PetShowcase] petCalpalAction warning:", err);
    } finally {
      setIsPetting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div
        className={cn(
          "rounded-card border border-border-divider bg-surface p-6 shadow-xs animate-pulse",
          className,
        )}
      >
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
  const canFeedNow = needs.feedEligibility.canFeed && canAffordFeed;
  const currentSlotLabel = needs.feedEligibility.currentSlotLabel;

  const complainingBadgeLabel =
    condition.isComplaining && condition.hoursOverdue > 0
      ? "Lapar & Lemas (-2 EXP/jam)"
      : needs.moodCategory === "needs_both"
        ? "Lapar & Kangen Dielus!"
        : needs.moodCategory === "needs_food"
          ? "Waktunya Makan!"
          : "Kangen Dielus 🥺";

  const feedButtonLabel = (() => {
    if (isFeeding) return "Memberi Makan...";
    if (needs.feedEligibility.reason === "MAX_DAILY_FEEDS_REACHED") {
      return "Kenyang 3/3 Hari Ini ✓";
    }
    if (needs.feedEligibility.reason === "OUTSIDE_MEAL_HOURS") {
      return "Tunggu Jam Sarapan (05:00)";
    }
    if (needs.feedEligibility.reason === "SLOT_ALREADY_FED") {
      const nextShort =
        needs.currentSlot === "dinner"
          ? "Sarapan Besok"
          : needs.feedEligibility.nextSlot.label;
      return `Sudah ${currentSlotLabel} ✓ (Tunggu ${nextShort})`;
    }
    if (!canAffordFeed) {
      return `Beri ${currentSlotLabel || "Makan"} (Butuh 5 🪙)`;
    }
    return `Beri ${currentSlotLabel || "Makan"} (5 🪙)`;
  })();

  return (
    <div
      className={cn(
        "rounded-card border border-border-divider bg-surface p-6 shadow-xs flex flex-col justify-between transition-colors",
        isEcstatic && "bg-gradient-to-b from-accent-green-light/40 to-surface border-accent-green/35",
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

        {/* NFT Badge & Last Fed Timestamp */}
        <div className="flex items-center gap-1.5">
          {mintStatus === "minted" && nftTokenId !== null ? (
            <Link
              href="/pet-customization/wardrobe"
              className="inline-flex items-center gap-1 rounded-pill border border-accent-green/35 bg-accent-green/10 px-2.5 py-1 text-[11px] font-bold text-accent-green transition-colors hover:bg-accent-green/20"
              title="CalPal Soulbound NFT terverifikasi on-chain"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>NFT #{nftTokenId}</span>
            </Link>
          ) : (
            <Link
              href="/pet-customization/wardrobe"
              className="inline-flex items-center gap-1 rounded-pill border border-border-divider bg-surface-subtle px-2.5 py-1 text-[11px] font-bold text-text-muted transition-colors hover:bg-accent-green-light hover:text-text-primary"
              title="Mint CalPal kamu sebagai Soulbound NFT"
            >
              <Sparkles className="h-3 w-3 text-accent-orange" />
              <span>Mint NFT</span>
            </Link>
          )}

          <div
            className="flex items-center gap-1 text-[11px] font-sans font-semibold text-text-muted bg-surface-subtle px-2.5 py-1 rounded-pill border border-border-divider"
            title={
              isHydrated && lastFedAt
                ? `Waktu makan terakhir: ${new Date(lastFedAt).toLocaleString()}`
                : undefined
            }
          >
            <Clock className="h-3 w-3 text-text-muted" />
            <span>Makan: {formattedLastFedLabel}</span>
          </div>
        </div>
      </div>

      {/* CalPal AI Speech Bubble */}
      <div className="min-h-[52px] flex items-center justify-center mb-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={speechBubbleText}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "px-3.5 py-2 rounded-2xl text-xs font-bold font-sans text-center max-w-sm relative shadow-2xs border flex items-center gap-2",
              isEcstatic
                ? "bg-accent-green-light/80 border-accent-green/40 text-accent-green-dark"
                : isComplaining
                  ? "bg-[#FCF8E3] border-[#FF9233]/40 text-[#B45309]"
                  : "bg-accent-yellow/50 border-accent-green/25 text-text-primary",
            )}
          >
            <span className="leading-snug">{speechBubbleText}</span>
            {animationState !== "sleeping" && (
              <button
                type="button"
                onClick={handleRefreshDialogue}
                disabled={isAiDialogueLoading}
                aria-label="Ajak CalPal bicara lagi"
                title={
                  aiSource === "ai"
                    ? "Dialog disesuaikan AI • Klik untuk variasi lain"
                    : "Klik untuk variasi omelan / sapaan lain"
                }
                className="shrink-0 rounded-full p-1 hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={cn(
                    "h-3 w-3 opacity-70",
                    isAiDialogueLoading && "animate-spin",
                  )}
                />
              </button>
            )}
            <div
              className={cn(
                "w-2.5 h-2.5 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r",
                isEcstatic
                  ? "bg-accent-green-light/80 border-accent-green/40"
                  : isComplaining
                    ? "bg-[#FCF8E3] border-[#FF9233]/40"
                    : "bg-accent-yellow/50 border-accent-green/25",
              )}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {showLateStreakNudge && (
        <div className="mb-1 flex justify-center">
          <Link
            href="/diary/add"
            className="inline-flex items-center gap-1.5 rounded-pill border border-accent-orange/40 bg-[#FCF8E3] px-3 py-1 text-[11px] font-bold text-accent-orange-dark shadow-2xs transition-colors hover:bg-accent-orange/15"
          >
            <Flame className="h-3.5 w-3.5 text-accent-orange" />
            <span>
              Api streak {coopStreakDays} harimu butuh 1 log lagi sebelum tengah malam! 🔥
            </span>
          </Link>
        </div>
      )}

      {/* Pet Canvas Area with Sluggish vs Energetic / Ecstatic Motion */}
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

        {/* Ecstatic / Daily Mission Fulfilled Badge */}
        {isEcstatic && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-1 right-2 z-20 flex items-center gap-1 bg-accent-green-light text-accent-green-dark border border-accent-green/40 px-2.5 py-0.5 rounded-pill text-[10px] font-bold shadow-2xs"
          >
            <Trophy className="h-3 w-3 text-accent-green" />
            <span>Sangat Senang! ✨</span>
          </motion.div>
        )}

        {/* Complaining / Sluggish Warning Indicator Badge */}
        {!isEcstatic && isComplaining && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-1 right-2 z-20 flex items-center gap-1 bg-[#FCF8E3] text-[#FF9233] border border-[#FF9233]/50 px-2.5 py-0.5 rounded-pill text-[10px] font-bold shadow-2xs"
          >
            <AlertCircle className="h-3 w-3 text-[#FF9233]" />
            <span>{complainingBadgeLabel}</span>
          </motion.div>
        )}

        {/* Modular Avatar Motion */}
        <motion.div
          animate={
            animationState === "eating"
              ? { scale: [1, 1.1, 0.95, 1.05, 1], y: [0, -8, 2, -4, 0] }
              : animationState === "happy" || isEcstatic
                ? { y: [0, -10, 0, -5, 0], rotate: [0, -2.5, 2.5, -1, 0] }
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
                : isEcstatic
                  ? { duration: 2.0, repeat: Infinity, ease: "easeInOut" }
                  : animationState === "sleeping"
                    ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                    : isComplaining
                      ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          }
          onClick={handlePetClick}
          className="relative flex items-center justify-center rounded-card p-2 w-48 h-48 cursor-pointer active:scale-95 transition-transform"
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

          {/* CalPal Modular SVG Avatar */}
          <CharacterSvg
            characterId={species}
            colors={effectiveColors}
            earsVariant={earsVariant}
            tailVariant={tailVariant}
            faceVariant={faceVariant}
            animationState={
              isEcstatic && animationState === "idle" ? "happy" : animationState
            }
            moodStatus={isComplaining ? "complaining" : "happy"}
            equipped={equipped}
            className="w-full h-full drop-shadow-md"
          />
        </motion.div>
      </div>

      {/* Pet Header Information */}
      <div className="text-center mt-0.5">
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

      {/* 2 Kebutuhan Harian Tracker (Makan Pagi/Siang/Malam & Perhatian Elus 3x) */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Kebutuhan 1: Makan (Max 3x sesuai jam makan) */}
        <div className="rounded-2xl border border-border-divider bg-surface-subtle/70 px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold font-sans">
            <span className="flex items-center gap-1 text-text-primary">
              <Utensils className="h-3 w-3 text-accent-orange" />
              Makan Harian
            </span>
            <span className="text-accent-orange-dark">
              {needs.fedSlotsToday.length}/{MAX_DAILY_FEEDS}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MAIN_MEAL_SLOTS.map((slot) => {
              const isFed = needs.fedSlotsToday.includes(slot.id);
              const isActive = needs.currentSlot === slot.id;
              const isMissed = needs.missedMealSlots.includes(slot.id);
              return (
                <div
                  key={slot.id}
                  title={`${slot.label} (${slot.timeRangeLabel})`}
                  className={cn(
                    "flex items-center justify-center gap-0.5 rounded-lg py-1 px-1 text-[10px] font-bold border transition-colors",
                    isFed
                      ? "bg-accent-green-light border-accent-green/40 text-accent-green-dark"
                      : isActive
                        ? "bg-[#FCF8E3] border-[#FF9233]/60 text-[#B45309]"
                        : isMissed
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-surface border-border-divider text-text-muted",
                  )}
                >
                  {isFed && <Check className="h-2.5 w-2.5 shrink-0" />}
                  <span>{slot.shortLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kebutuhan 2: Perhatian / Elus (Max 3x, butuh data makan utama) */}
        <div className="rounded-2xl border border-border-divider bg-surface-subtle/70 px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold font-sans">
            <span className="flex items-center gap-1 text-text-primary">
              <Heart className="h-3 w-3 text-macro-fat fill-macro-fat" />
              Perhatian (Elus)
            </span>
            <span className="text-macro-fat">
              {needs.petEligibility.petCountToday}/{MAX_DAILY_PETS}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((idx) => {
                const isDone = idx < needs.petEligibility.petCountToday;
                const isUnlocked = idx < needs.petEligibility.unlockedPetsToday;
                return (
                  <div
                    key={idx}
                    title={
                      isDone
                        ? "Sudah dielus"
                        : isUnlocked
                          ? "Siap dielus! Klik CalPal"
                          : "Catat makanan utama (Pagi/Siang/Malam) untuk membuka"
                    }
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg border transition-colors",
                      isDone
                        ? "bg-macro-fat/15 border-macro-fat/40 text-macro-fat"
                        : isUnlocked
                          ? "bg-surface border-macro-fat/40 text-macro-fat/70"
                          : "bg-surface border-border-divider text-text-muted/60",
                    )}
                  >
                    {isDone ? (
                      <Heart className="h-3 w-3 fill-macro-fat" />
                    ) : isUnlocked ? (
                      <Heart className="h-3 w-3" />
                    ) : (
                      <Lock className="h-2.5 w-2.5" />
                    )}
                  </div>
                );
              })}
            </div>
            {needs.petEligibility.reason === "NEED_MAIN_MEAL_LOG" ? (
              <Link
                href="/diary"
                className="text-[10px] font-bold text-accent-orange-dark hover:underline truncate"
              >
                Catat makan →
              </Link>
            ) : needs.petEligibility.canPet ? (
              <button
                type="button"
                onClick={handlePetClick}
                className="text-[10px] font-bold text-macro-fat hover:underline cursor-pointer"
              >
                Elus sekarang
              </button>
            ) : (
              <span className="text-[10px] font-bold text-accent-green-dark">
                Terpenuhi ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Squircle Status Indicators (Makan / Elus / Tidur) */}
      <div className="w-full max-w-[14rem] mx-auto mt-3 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          {/* Makan Status Indicator */}
          <button
            type="button"
            onClick={handleFeedPet}
            disabled={animationState === "sleeping"}
            aria-label="Beri makan CalPal (5 Koin)"
            className="flex flex-col items-center gap-1 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle shadow-2xs">
              <div
                className="absolute inset-x-0 bottom-0 bg-accent-orange transition-[height] duration-500"
                style={{ height: `${needs.hungerPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Utensils
                  className={cn(
                    "h-3.5 w-3.5 transition-colors duration-300",
                    needs.hungerPercent >= 66
                      ? "text-text-inverse"
                      : "text-accent-orange-dark",
                  )}
                />
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted font-sans">
              Makan ({needs.fedSlotsToday.length}/3)
            </span>
          </button>

          {/* Elus Status Indicator */}
          <button
            type="button"
            onClick={handlePetClick}
            disabled={animationState === "sleeping"}
            aria-label="Elus CalPal"
            className="flex flex-col items-center gap-1 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-divider bg-surface-subtle shadow-2xs">
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-[height,background-color] duration-500",
                  needs.attentionPercent >= 100
                    ? "bg-macro-fat"
                    : "bg-macro-fat/45",
                )}
                style={{ height: `${needs.attentionPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {!needs.petEligibility.canPet &&
                needs.petEligibility.reason === "NEED_MAIN_MEAL_LOG" ? (
                  <Lock className="h-3.5 w-3.5 text-text-muted" />
                ) : (
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5 transition-colors duration-300",
                      needs.attentionPercent >= 100
                        ? "text-text-inverse fill-text-inverse"
                        : "text-macro-fat fill-macro-fat",
                    )}
                  />
                )}
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted font-sans">
              Elus ({needs.petEligibility.petCountToday}/3)
            </span>
          </button>

          {/* Tidur Status Indicator */}
          <button
            type="button"
            onClick={toggleSleep}
            aria-label={
              animationState === "sleeping"
                ? "Bangunkan CalPal"
                : "Tidurkan CalPal"
            }
            className="flex flex-col items-center gap-1 transition-transform active:scale-95 cursor-pointer"
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

        {/* Daily Missions & EXP Progress */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] text-text-muted font-bold font-sans">
            <span className="flex items-center gap-1 text-text-primary">
              <Sparkles className="h-3 w-3 text-accent-green" />
              EXP
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
          {missionStats.totalCount > 0 && (
            <div className="flex items-center justify-between text-[10px] font-sans font-semibold pt-0.5">
              <Link
                href="/quests"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                Misi Harian: {missionStats.completedCount}/
                {missionStats.totalCount}
              </Link>
              <span
                className={cn(
                  "font-bold",
                  isEcstatic ? "text-accent-green-dark" : "text-text-muted",
                )}
              >
                {isEcstatic
                  ? "CalPal Senang! 💖"
                  : "Selesaikan misi agar senang"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Feed Button aligned with Meal Window */}
      <div className="mt-3 pt-2">
        <button
          type="button"
          onClick={handleFeedPet}
          disabled={animationState === "sleeping" || isFeeding}
          className={cn(
            "w-full py-2.5 px-4 rounded-button font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm",
            canFeedNow
              ? "button-primary active:scale-[0.98] cursor-pointer"
              : "bg-surface-subtle text-text-muted border border-border-divider opacity-80 cursor-pointer hover:opacity-100",
          )}
          title={needs.feedEligibility.message}
        >
          <Utensils className="h-4 w-4 shrink-0" />
          <span>{feedButtonLabel}</span>
        </button>

        {needs.feedEligibility.canFeed && !canAffordFeed && (
          <p className="text-[10px] text-rose-500 text-center font-sans font-semibold mt-1.5 flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>Koin kurang. Catat makanan atau login harian untuk koin.</span>
          </p>
        )}
      </div>
    </div>
  );
}
