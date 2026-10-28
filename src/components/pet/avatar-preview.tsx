"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, HandHeart, Heart, Lamp, Maximize2, X } from "lucide-react";
import { AvatarRenderer } from "./avatar-renderer";
import {
  CharacterColorPalette,
  CharacterId,
} from "@/lib/character-assets/types";
import { PetAnimationState } from "@/types";
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
  const [animationState, setAnimationState] =
    useState<PetAnimationState>("idle");
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

  // Lock page scroll and wire Esc while the fullscreen view is open.
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

  return (
    <div
      ref={stageRef}
      className={cn(
        "flex flex-col border border-border-divider bg-surface shadow-xs",
        isFullscreenView
          ? "fixed inset-0 z-50 h-[100dvh] w-screen rounded-none border-0 p-4 sm:p-8"
          : "relative rounded-card p-5 sm:p-6",
        className,
      )}
    >
      {/* Header: nickname + fullscreen toggle */}
      <div className="flex w-full items-center justify-between gap-3 border-b border-border-divider pb-3">
        <h2 className="min-w-0 truncate text-2xl font-bold text-text-primary font-heading">
          {nickname}
        </h2>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreenView ? "Keluar layar penuh" : "Layar penuh"}
          title={isFullscreenView ? "Keluar layar penuh" : "Layar penuh"}
          className="shrink-0 rounded-navigation border border-border-default bg-surface p-2 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary shadow-2xs"
        >
          {isFullscreenView ? (
            <X className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Character stage */}
      <div
        className={cn(
          "relative flex w-full select-none items-center justify-center",
          isFullscreenView ? "min-h-0 flex-1 py-2" : "my-3 h-64 sm:h-72",
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
          className="relative flex h-full max-h-full max-w-full cursor-pointer items-center justify-center aspect-[128/160]"
          animate={
            animationState === "happy"
              ? { y: [0, -16, 0, -8, 0], rotate: [0, -4, 4, -2, 0] }
              : animationState === "sleeping"
                ? { y: [0, 4, 0], scale: [1, 0.98, 1] }
                : { y: [0, -5, 0] }
          }
          transition={{
            duration: animationState === "idle" ? 3.2 : 1.2,
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
            equipped={equipped}
            className="h-full w-full drop-shadow-md"
          />
        </motion.div>
      </div>

      {/* Bottom row: pet controls (left), draft actions (right) */}
      <div className="mt-3 flex w-full items-center justify-between gap-3 border-t border-border-divider pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePet}
            aria-label="Elus Calpal"
            title="Elus"
            className="flex h-10 w-10 items-center justify-center rounded-navigation border border-border-default bg-surface text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary shadow-2xs"
          >
            <HandHeart className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={toggleSleep}
            aria-label="Tidurkan Calpal"
            aria-pressed={isSleeping}
            title="Tidurkan"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-navigation border transition-colors shadow-2xs",
              isSleeping
                ? "border-accent-orange bg-accent-yellow text-text-primary"
                : "border-border-default bg-surface text-text-muted hover:bg-surface-subtle hover:text-text-primary",
            )}
          >
            <Lamp className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={!isDirty}
            aria-label="Batalkan perubahan"
            title="Batalkan perubahan"
            className="flex h-10 w-10 items-center justify-center rounded-navigation border border-border-default bg-surface text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty}
            aria-label="Simpan perubahan"
            title="Simpan perubahan"
            className="relative flex h-10 w-10 items-center justify-center rounded-navigation bg-accent-green text-text-inverse transition-colors hover:bg-accent-green/90 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
          >
            <Check className="h-5 w-5 stroke-[2.5]" />
            {isDirty && changedCategoryCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-[6px] bg-accent-orange px-1 text-[10px] font-bold leading-none text-text-inverse ring-2 ring-surface"
              >
                {changedCategoryCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
