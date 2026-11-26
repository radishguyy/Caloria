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
  type FeedEligibilityResult,
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

function getTimePeriodId(hour: number): "pagi" | "siang" | "sore" | "malam" {
  if (hour >= 5 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

function formatFeedCooldownBubble(
  eligibility: FeedEligibilityResult,
  now: Date,
): string {
  const period = getTimePeriodId(now.getHours());

  if (eligibility.reason === "MAX_DAILY_FEEDS_REACHED") {
    return "Aku sudah makan 3x hari ini! Beri makan lagi besok pagi ya!";
  }

  if (eligibility.reason === "OUTSIDE_MEAL_HOURS") {
    return "Sekarang masih malam, beri makan aku lagi nanti pagi ya!";
  }

  if (eligibility.reason === "SLOT_ALREADY_FED") {
    if (eligibility.currentSlot === "breakfast") {
      return "Aku sudah makan pagi! Beri makan lagi nanti siang ya!";
    }
    if (eligibility.currentSlot === "lunch") {
      return period === "siang"
        ? "Aku sudah makan siang! Beri makan lagi nanti sore ya!"
        : "Aku sudah makan sore! Beri makan lagi nanti malam ya!";
    }
    return period === "sore"
      ? "Aku sudah makan sore! Beri makan lagi besok pagi ya!"
      : "Aku sudah makan malam! Beri makan lagi besok pagi ya!";
  }

  return eligibility.message;
}

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
  onPet?: () => void | Promise<void>;
  dataTour?: string;
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
  onPet,
  dataTour,
  className,
}: AvatarPreviewProps) {
  const isHydrated = useHydrated();
  const {
    level,
    exp,
    coins,
    animationState: storeAnimationState,
    moodStatus,
    lastFedAt,
    fedSlotsToday,
    needsResetDate,
    feedWithCoins,
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
  const activeAnimationState =
    animationState !== "idle"
      ? animationState
      : isHydrated
        ? storeAnimationState
        : "idle";
  const isSleeping = activeAnimationState === "sleeping";

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

  const displayLevel = isHydrated ? level : 1;
  const canAffordFeed = isHydrated ? coins >= 5 : true;

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

  const speechBubbleText = useMemo(() => {
    void clockTick;
    if (activeAnimationState === "sleeping") {
      return "Zzz... Calpal sedang tidur nyenyak";
    }
    if (activeAnimationState === "eating") {
      return "Nyam nyam! Enak sekali!";
    }
    if (isComplaining) {
      if (condition.hoursSinceFed > 10) {
        return "Perutku lapar nih... sudah lama sekali belum makan!";
      }
      return "Perutku lapar nih... sudah lama belum makan!";
    }
    if (isHydrated && !feedEligibility.canFeed && feedEligibility.message) {
      return formatFeedCooldownBubble(
        feedEligibility as FeedEligibilityResult,
        new Date(),
      );
    }
    return "Calpal kenyang & penuh energi! Semangat hidup sehat!";
  }, [
    clockTick,
    activeAnimationState,
    isComplaining,
    condition.hoursSinceFed,
    isHydrated,
    feedEligibility,
  ]);

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

    if (onPet) {
      void onPet();
    }
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

  const showDraftActions = Boolean(onSave || onCancel);

  return (
    <div
      ref={stageRef}
      data-tour={dataTour}
      className={cn(
        "flex flex-col justify-between border border-border-divider bg-surface shadow-xs",
        isFullscreenView
          ? "fixed inset-0 z-50 h-[100dvh] w-screen rounded-none border-0 p-4 sm:p-8"
          : "relative flex-1 rounded-card p-5 sm:p-6",
        className,
      )}
    >
      {/* Header: nickname + distinct level badge + fullscreen toggle */}
      <div className="flex w-full items-center justify-between gap-3 border-b border-border-divider pb-4">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h2
            suppressHydrationWarning
            className="min-w-0 truncate text-2xl font-extrabold text-text-primary font-heading"
          >
            {nickname}
          </h2>
          <span
            suppressHydrationWarning
            className="shrink-0 rounded-pill bg-accent-yellow px-2.5 py-0.5 text-sm font-black tracking-wide text-[#7C3A0D] font-mono tabular-nums"
          >
            Lv. {displayLevel}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreenView ? "Keluar layar penuh" : "Layar penuh"}
          title={isFullscreenView ? "Keluar layar penuh" : "Layar penuh"}
          className="min-h-11 min-w-11 shrink-0 rounded-navigation border border-border-default bg-surface flex items-center justify-center text-neutral-10 transition-colors hover:bg-surface-subtle hover:text-text-primary cursor-pointer"
        >
          {isFullscreenView ? (
            <X className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Calpal Speech Bubble */}
      <div className="min-h-[54px] flex items-center justify-center pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={speechBubbleText}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-sm rounded-2xl bg-accent-yellow px-4 py-2.5 text-center text-sm font-bold font-sans leading-snug text-[#1e293b]"
          >
            <span>{speechBubbleText}</span>
            <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-accent-yellow" />
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

        <div
          className={
            isFullscreenView
              ? "absolute inset-0 flex items-center justify-center"
              : "relative flex h-full w-full items-center justify-center"
          }
          style={isFullscreenView ? { containerType: "size" } : undefined}
        >
          <motion.div
            onClick={handlePet}
            className={cn(
              "relative flex cursor-pointer items-center justify-center aspect-[128/160]",
              !isFullscreenView && "h-64 sm:h-72 max-h-full max-w-full",
            )}
            style={
              isFullscreenView
                ? {
                    height: "min(92cqh, calc(96cqw * 1.25))",
                    width: "min(96cqw, calc(92cqh * 0.8))",
                  }
                : undefined
            }
            animate={
              activeAnimationState === "eating"
                ? { scale: [1, 1.08, 0.96, 1.04, 1], y: [0, -8, 2, -4, 0] }
                : activeAnimationState === "happy"
                  ? { y: [0, -16, 0, -8, 0], rotate: [0, -4, 4, -2, 0] }
                  : activeAnimationState === "sleeping"
                    ? { y: [0, 4, 0], scale: [1, 0.98, 1] }
                    : { y: [0, -5, 0] }
            }
            transition={{
              duration: activeAnimationState === "idle" ? 3.2 : 1.1,
              repeat:
                activeAnimationState === "idle" ||
                activeAnimationState === "sleeping"
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
              animationState={activeAnimationState}
              moodStatus={isComplaining ? "complaining" : "happy"}
              equipped={equipped}
              className="h-full w-full drop-shadow-md"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom controls: Elus & Tidurkan (equal combined width with Beri Makan Calpal) */}
      <div className="mt-3 space-y-2.5 pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handlePet}
            disabled={isSleeping}
            aria-label="Elus Calpal"
            className="min-h-12 w-full py-3 px-4 rounded-button border border-border-default bg-surface text-neutral-10 font-sans font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors hover:bg-surface-subtle hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <HandHeart className="h-5 w-5 shrink-0" />
            <span>Elus</span>
          </button>

          <button
            type="button"
            onClick={toggleSleep}
            aria-label={isSleeping ? "Bangunkan Calpal" : "Tidurkan Calpal"}
            aria-pressed={isSleeping}
            className={cn(
              "min-h-12 w-full py-3 px-4 rounded-button border font-sans font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer",
              isSleeping
                ? "border-accent-orange bg-accent-yellow text-text-primary"
                : "border-border-default bg-surface text-neutral-10 hover:bg-surface-subtle hover:text-text-primary",
            )}
          >
            <Moon className="h-5 w-5 shrink-0" />
            <span>{isSleeping ? "Bangunkan" : "Tidurkan"}</span>
          </button>
        </div>

        {/* Beri Makan Calpal Button */}
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
              <CircleDollarSign
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>)</span>
            </span>
          </button>

          {isHydrated && !canAffordFeed && (
            <p className="text-sm text-rose-600 text-center font-sans font-semibold flex items-center justify-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Koin kurang. Catat makanan untuk mendapat koin.</span>
            </p>
          )}
        </div>

        {showDraftActions && (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={!isDirty}
              aria-label="Batalkan perubahan"
              title="Batalkan perubahan"
              className="min-h-11 w-full py-2.5 px-4 rounded-button border border-border-default bg-surface text-destructive font-sans font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <X className="h-4 w-4 shrink-0" />
              <span>Batalkan</span>
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={!isDirty}
              aria-label="Simpan perubahan"
              title="Simpan perubahan"
              className="relative min-h-11 w-full py-2.5 px-4 rounded-button bg-accent-green-light text-[#244710] font-sans font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:bg-[#a9ce46] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <Check className="h-4 w-4 shrink-0 stroke-[2.5]" />
              <span>Simpan</span>
              {isDirty && changedCategoryCount > 0 && (
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-accent-orange px-1.5 text-xs font-bold leading-none text-[#1e293b]"
                >
                  {changedCategoryCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
