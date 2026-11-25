"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Check,
  CircleDollarSign,
  HandHeart,
  Heart,
  Maximize2,
  Moon,
  Sparkles,
  X,
} from "lucide-react";
import { AvatarRenderer } from "./avatar-renderer";
import {
  CharacterColorPalette,
  CharacterId,
} from "@/lib/character-assets/types";
import { PetAnimationState } from "@/types";
import { usePetStore } from "@/store/use-pet-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { evaluatePetCondition } from "@/lib/pet/decay-evaluator";
import {
  evaluateFeedEligibility,
  getMealSlotConfig,
  normalizeDailyFedSlots,
} from "@/lib/pet/needs-engine";
import { formatDateKey } from "@/lib/date-utils";
import { feedPetAction } from "@/server/actions/pet-actions";
import {
  toastFeedBlocked,
  toastFeedingSuccess,
  toastInsufficientCoins,
} from "@/lib/toast";
import { cn } from "@/lib/utils";

export interface AvatarPreviewProps {
  nickname: string;
  characterId: CharacterId;
  colors?: Partial<CharacterColorPalette>;
  earsVariant?: CharacterId;
  tailVariant?: CharacterId;
  faceVariant?: CharacterId;
  equipped: {
    head?: string | null;
    glasses?: string | null;
    body?: string | null;
    held?: string | null;
    skin?: string | null;
    room?: string | null;
  };
  isDirty?: boolean;
  changedCategoryCount?: number;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function AvatarPreview({
  nickname,
  characterId,
  colors,
  earsVariant,
  tailVariant,
  faceVariant,
  equipped,
  isDirty = false,
  changedCategoryCount = 0,
  onSave,
  onCancel,
  className,
}: AvatarPreviewProps) {
  const isHydrated = useHydrated();
  const {
    level,
    exp,
    coins,
    moodStatus,
    lastFedAt,
    fedSlotsToday,
    needsResetDate,
    feedWithCoins,
    getExpNeededForNextLevel,
  } = usePetStore();

  const [animationState, setAnimationState] =
    useState<PetAnimationState>("idle");
  const [isFeeding, setIsFeeding] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number }[]
  >([]);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const petTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFullscreenView = isNativeFullscreen || isFallbackFullscreen;
  const isSleeping = animationState === "sleeping";

  const condition = useMemo(() => {
    if (!isHydrated) {
      return {
        isComplaining: moodStatus === "complaining",
        hoursSinceFed: 0,
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

  const speechBubbleText = useMemo(() => {
    if (animationState === "sleeping") {
      return "Zzz... Calpal sedang tidur nyenyak";
    }
    if (animationState === "eating") {
      return "Nyam nyam! Enak sekali!";
    }
    if (isComplaining) {
      if (condition.hoursSinceFed >= 20) {
        return `Perutku lapar nih... sudah ${condition.hoursSinceFed} jam belum makan!`;
      }
      return "Aku agak lemas, beri makan dulu ya!";
    }
    return "Calpal kenyang & penuh energi! Semangat hidup sehat!";
  }, [animationState, isComplaining, condition.hoursSinceFed]);

  const expNeeded = getExpNeededForNextLevel();
  const expPercent = Math.min(
    100,
    Math.round((exp / Math.max(1, expNeeded)) * 100),
  );
  const canAffordFeed = coins >= 5;

  useEffect(() => {
    if (!isHydrated) return;
    const interval = setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isHydrated]);

  const feedEligibility = useMemo(() => {
    void clockTick;
    if (!isHydrated) {
      return {
        canFeed: true,
        reason: undefined,
        message: "",
        currentSlot: null,
        currentSlotLabel: null,
        nextWindowLabel: null,
      };
    }
    const now = new Date();
    const todayKey = formatDateKey(now);
    const normalizedFed = normalizeDailyFedSlots(
      fedSlotsToday,
      needsResetDate,
      todayKey,
    );
    return evaluateFeedEligibility(normalizedFed, now);
  }, [isHydrated, fedSlotsToday, needsResetDate, clockTick]);

  const canFeedNow = canAffordFeed && feedEligibility.canFeed;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (petTimerRef.current) clearTimeout(petTimerRef.current);
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    };
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFallbackFullscreen(false);
    if (
      document.fullscreenElement &&
      typeof document.exitFullscreen === "function"
    ) {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isFullscreenView) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") exitFullscreen();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreenView, exitFullscreen]);

  const toggleFullscreen = async () => {
    if (isFullscreenView) {
      exitFullscreen();
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    if (typeof stage.requestFullscreen === "function") {
      try {
        await stage.requestFullscreen();
        return;
      } catch {
        // Fall through to the CSS overlay (e.g. iOS Safari).
      }
    }

    setIsFallbackFullscreen(true);
  };

  const handlePet = () => {
    if (isSleeping) return;
    setAnimationState("happy");

    const newHeart = { id: Date.now(), x: (Math.random() - 0.5) * 60 };
    setFloatingHearts((prev) => [...prev, newHeart]);

    if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    if (petTimerRef.current) clearTimeout(petTimerRef.current);

    heartTimerRef.current = setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((heart) => heart.id !== newHeart.id),
      );
    }, 1200);

    petTimerRef.current = setTimeout(() => {
      setAnimationState("idle");
    }, 1400);
  };

  const toggleSleep = () => {
    if (petTimerRef.current) clearTimeout(petTimerRef.current);
    setAnimationState((prev) => (prev === "sleeping" ? "idle" : "sleeping"));
  };

  const handleFeedPet = async () => {
    if (isSleeping || isFeeding) return;

    const FEED_COST = 5;
    const actionNow = new Date();
    const todayKey = formatDateKey(actionNow);
    const liveEligibility = evaluateFeedEligibility(
      normalizeDailyFedSlots(fedSlotsToday, needsResetDate, todayKey),
      actionNow,
    );

    if (!liveEligibility.canFeed) {
      toastFeedBlocked(liveEligibility.message);
      return;
    }

    if (coins < FEED_COST) {
      toastInsufficientCoins();
      return;
    }

    setIsFeeding(true);
    const clientRes = feedWithCoins(FEED_COST, actionNow);
    if (!clientRes.success) {
      if (clientRes.error === "INSUFFICIENT_COINS") {
        toastInsufficientCoins();
      } else {
        toastFeedBlocked(clientRes.message || liveEligibility.message);
      }
      setIsFeeding(false);
      return;
    }

    const slotLabel = clientRes.slot
      ? getMealSlotConfig(clientRes.slot).label
      : undefined;

    setAnimationState("eating");
    toastFeedingSuccess(slotLabel);

    if (petTimerRef.current) clearTimeout(petTimerRef.current);
    petTimerRef.current = setTimeout(() => {
      setAnimationState("idle");
    }, 1600);

    try {
      const result = await feedPetAction({
        clientDateKey: todayKey,
        clientHour: actionNow.getHours(),
      });
      if (!result.success) {
        if (result.error === "INSUFFICIENT_COINS") {
          toastInsufficientCoins();
        } else if (result.message) {
          toastFeedBlocked(result.message);
        }
      }
    } catch (err) {
      console.warn("[AvatarPreview] feedPetAction warning:", err);
    } finally {
      setIsFeeding(false);
    }
  };

  return (
    <div
      ref={stageRef}
      className={cn(
        "flex flex-col justify-between border border-border-divider bg-surface shadow-xs",
        isFullscreenView
          ? "fixed inset-0 z-50 h-[100dvh] w-screen rounded-none border-0 p-4 sm:p-8"
          : "relative flex-1 rounded-card p-5 sm:p-6",
        className,
      )}
    >
      {/* Header: nickname + distinct level badge + XP bar + fullscreen toggle */}
      <div className="space-y-3 border-b border-border-divider pb-4">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2.5">
            <h2 className="min-w-0 truncate text-2xl font-extrabold text-text-primary font-heading">
              {nickname}
            </h2>
            <span
              suppressHydrationWarning
              className="shrink-0 rounded-pill bg-accent-yellow px-2.5 py-0.5 text-sm font-black tracking-wide text-[#7C3A0D] font-mono tabular-nums"
            >
              Lv. {level}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreenView ? "Keluar layar penuh" : "Layar penuh"}
            title={isFullscreenView ? "Keluar layar penuh" : "Layar penuh"}
            className="min-h-11 min-w-11 shrink-0 rounded-navigation border border-border-default bg-surface flex items-center justify-center text-neutral-10 transition-colors hover:bg-surface-subtle hover:text-text-primary"
          >
            {isFullscreenView ? (
              <X className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm font-bold font-sans">
            <span className="inline-flex items-center gap-1.5 text-[#244710]">
              <Sparkles className="h-4 w-4 text-accent-green" />
              <span>XP</span>
            </span>
            <span
              suppressHydrationWarning
              className="text-neutral-10 tabular-nums"
            >
              {exp} / {expNeeded} ({expPercent}%)
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-pill border border-border-divider bg-surface-subtle">
            <div
              className={cn(
                "h-full rounded-pill transition-all duration-500",
                isComplaining ? "bg-accent-orange" : "bg-accent-green",
              )}
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Calpal Speech Bubble (matching Dashboard) */}
      <div className="min-h-[54px] flex items-center justify-center pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={speechBubbleText}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative max-w-sm rounded-2xl border px-4 py-2.5 text-center text-sm font-bold font-sans leading-snug",
              isComplaining
                ? "border-accent-orange/40 bg-[#FCF8E3] text-[#B45309]"
                : "border-accent-green/25 bg-accent-yellow/55 text-[#244710]",
            )}
          >
            <span>{speechBubbleText}</span>
            <div
              className={cn(
                "absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r",
                isComplaining
                  ? "border-accent-orange/40 bg-[#FCF8E3]"
                  : "border-accent-green/25 bg-accent-yellow/55",
              )}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Character stage (flex-1 keeps bottom controls aligned with right panel) */}
      <div
        className={cn(
          "relative flex w-full flex-1 select-none items-center justify-center",
          isFullscreenView ? "min-h-0 py-2" : "min-h-64 py-4",
        )}
      >
        <AnimatePresence>
          {floatingHearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, y: 0, x: heart.x, scale: 0.6 }}
              animate={{ opacity: 0, y: -70, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="pointer-events-none absolute top-1/4 z-30 text-macro-fat"
            >
              <Heart className="h-7 w-7 fill-macro-fat" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Ambient halo glow */}
        <div
          className="pointer-events-none absolute inset-8 rounded-card opacity-20 blur-3xl transition-colors duration-500"
          style={{
            backgroundColor: colors?.primary || "var(--color-accent-orange)",
          }}
        />

        <motion.div
          onClick={handlePet}
          className="relative flex h-64 sm:h-72 max-h-full max-w-full cursor-pointer items-center justify-center aspect-[128/160]"
          animate={
            animationState === "eating"
              ? { scale: [1, 1.08, 0.96, 1.04, 1], y: [0, -8, 2, -4, 0] }
              : animationState === "happy"
                ? { y: [0, -16, 0, -8, 0], rotate: [0, -4, 4, -2, 0] }
                : animationState === "sleeping"
                  ? { y: [0, 4, 0], scale: [1, 0.98, 1] }
                  : { y: [0, -5, 0] }
          }
          transition={{
            duration: animationState === "idle" ? 3.2 : 1.1,
            repeat:
              animationState === "idle" || animationState === "sleeping"
                ? Infinity
                : 0,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          <AvatarRenderer
            characterId={characterId}
            colors={colors}
            earsVariant={earsVariant}
            tailVariant={tailVariant}
            faceVariant={faceVariant}
            animationState={animationState}
            moodStatus={isComplaining ? "complaining" : "happy"}
            equipped={equipped}
            className="h-full w-full drop-shadow-md"
          />
        </motion.div>
      </div>

      {/* Bottom controls: pet interactions + draft save + Beri Makan Calpal button */}
      <div className="mt-3 space-y-3 border-t border-border-divider pt-4">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePet}
              disabled={isSleeping}
              aria-label="Elus Calpal"
              title="Elus"
              className="flex h-11 w-11 items-center justify-center rounded-navigation border border-border-default bg-surface text-neutral-10 transition-colors hover:bg-surface-subtle hover:text-text-primary disabled:opacity-50"
            >
              <HandHeart className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={toggleSleep}
              aria-label={isSleeping ? "Bangunkan Calpal" : "Tidurkan Calpal"}
              aria-pressed={isSleeping}
              title={isSleeping ? "Bangunkan" : "Tidurkan"}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-navigation border transition-colors",
                isSleeping
                  ? "border-accent-orange bg-accent-yellow text-text-primary"
                  : "border-border-default bg-surface text-neutral-10 hover:bg-surface-subtle hover:text-text-primary",
              )}
            >
              <Moon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={!isDirty}
              aria-label="Batalkan perubahan"
              title="Batalkan perubahan"
              className="flex h-11 w-11 items-center justify-center rounded-navigation border border-border-default bg-surface text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={!isDirty}
              aria-label="Simpan perubahan"
              title="Simpan perubahan"
              className="relative flex h-11 w-11 items-center justify-center rounded-navigation bg-accent-green-light text-[#244710] transition-colors hover:bg-[#a9ce46] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-5 w-5 stroke-[2.5]" />
              {isDirty && changedCategoryCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-[6px] bg-accent-orange px-1 text-xs font-bold leading-none text-text-inverse ring-2 ring-surface"
                >
                  {changedCategoryCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Beri Makan Calpal Button (matching Dashboard flat green button style, no fork/knife, CircleDollarSign) */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => void handleFeedPet()}
            disabled={isSleeping || isFeeding || !canAffordFeed}
            className={cn(
              "w-full min-h-12 py-3 px-4 rounded-button font-sans font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors",
              canFeedNow && !isSleeping
                ? "bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] cursor-pointer"
                : "bg-surface-subtle text-text-muted border border-border-divider opacity-80",
              isSleeping || isFeeding || !canAffordFeed
                ? "cursor-not-allowed"
                : "cursor-pointer",
            )}
          >
            <span>{isFeeding ? "Memberi Makan..." : "Beri Makan Calpal"}</span>
            <span className="inline-flex items-center gap-1 font-bold">
              <span>(5</span>
              <CircleDollarSign className="h-4 w-4 text-accent-orange-dark shrink-0" />
              <span>)</span>
            </span>
          </button>

          {!canAffordFeed ? (
            <p className="text-sm text-rose-600 text-center font-sans font-semibold flex items-center justify-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Koin kurang. Catat makanan untuk mendapat koin.</span>
            </p>
          ) : (
            isHydrated &&
            !feedEligibility.canFeed &&
            feedEligibility.message && (
              <p className="text-sm text-text-muted text-center font-sans font-semibold">
                {feedEligibility.message}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
