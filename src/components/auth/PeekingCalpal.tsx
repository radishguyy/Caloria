"use client";

import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import type {
  CharacterColorPalette,
  CharacterId,
} from "@/lib/character-assets/types";
import { cn } from "@/lib/utils";

interface PeekingCalpalProps {
  characterId?: CharacterId | string;
  position?: "top-right" | "top-left" | "left" | "right";
  title?: string;
  expression?: "happy" | "eating" | "idle";
  alwaysVisible?: boolean;
  colors?: Partial<CharacterColorPalette>;
  earsVariant?: CharacterId;
  tailVariant?: CharacterId;
  faceVariant?: CharacterId;
  moodStatus?: "happy" | "neutral" | "complaining";
  bubbleText?: string;
  bubbleTone?: "good" | "moderate" | "poor";
  className?: string;
}

const BUBBLE_TONE_CLASSES: Record<NonNullable<PeekingCalpalProps["bubbleTone"]>, string> = {
  good: "bg-[#E9F7DF] text-[#2F5B14]",
  moderate: "bg-[#FEF3C7] text-[#7C3A0D]",
  poor: "bg-[#FEE2E2] text-[#991B1B]",
};

/**
 * Calpal yang mengintip di tepi card atau modal.
 * Secara default tersembunyi dan muncul saat hover/focus (halaman auth),
 * atau langsung terlihat (`alwaysVisible`) untuk modal AR di mobile & desktop.
 */
export function PeekingCalpal({
  characterId = "flameling",
  position = "top-right",
  title = "Calpal mengintip!",
  expression = "happy",
  alwaysVisible = false,
  colors,
  earsVariant,
  tailVariant,
  faceVariant,
  moodStatus,
  bubbleText,
  bubbleTone = "good",
  className,
}: PeekingCalpalProps) {
  const isTopRight = position === "top-right";
  const isTopLeft = position === "top-left";
  const isLeft = position === "left";

  let positionClasses = "";
  let revealTransform = "";
  let rotationClass = "rotate-6";

  if (isTopRight) {
    positionClasses = alwaysVisible
      ? "-top-12 sm:-top-14 right-4 sm:right-7"
      : "-top-2 sm:-top-5 right-4 sm:right-8";
    revealTransform = alwaysVisible
      ? "translate-y-0 scale-105"
      : "group-hover:-translate-y-6 group-focus-within:-translate-y-6 group-hover:scale-105";
    rotationClass = alwaysVisible ? "rotate-8" : "rotate-6 group-hover:rotate-12";
  } else if (isTopLeft) {
    positionClasses = alwaysVisible
      ? "-top-12 sm:-top-14 left-4 sm:left-7"
      : "-top-2 sm:-top-5 left-4 sm:left-8";
    revealTransform = alwaysVisible
      ? "translate-y-0 scale-105"
      : "group-hover:-translate-y-6 group-focus-within:-translate-y-6 group-hover:scale-105";
    rotationClass = alwaysVisible ? "-rotate-8" : "-rotate-6 group-hover:-rotate-12";
  } else if (isLeft) {
    positionClasses = alwaysVisible
      ? "top-1/3 -left-12 sm:-left-16 -translate-y-1/2"
      : "top-1/3 -left-10 sm:-left-12 -translate-y-1/2";
    revealTransform = alwaysVisible
      ? "-translate-x-2 scale-105"
      : "group-hover:-translate-x-6 group-focus-within:-translate-x-6 group-hover:scale-105";
    rotationClass = alwaysVisible ? "-rotate-8" : "-rotate-12 group-hover:-rotate-6";
  } else {
    positionClasses = alwaysVisible
      ? "top-1/3 -right-12 sm:-right-16 -translate-y-1/2"
      : "top-1/3 -right-10 sm:-right-12 -translate-y-1/2";
    revealTransform = alwaysVisible
      ? "translate-x-2 scale-105"
      : "group-hover:translate-x-6 group-focus-within:translate-x-6 group-hover:scale-105";
    rotationClass = alwaysVisible ? "rotate-8" : "rotate-12 group-hover:rotate-6";
  }

  return (
    <div
      aria-hidden={!bubbleText}
      className={cn(
        "pointer-events-none absolute z-0 transition-all duration-300 ease-out select-none motion-reduce:transition-none",
        positionClasses,
        revealTransform,
        className
      )}
    >
      <div className="relative flex items-end gap-2">
        <div
          className={cn(
            "w-20 h-24 sm:w-24 sm:h-28 drop-shadow-md transition-transform duration-300 ease-out motion-reduce:transition-none",
            rotationClass
          )}
        >
          <AvatarRenderer
            characterId={characterId}
            colors={colors}
            earsVariant={earsVariant}
            tailVariant={tailVariant}
            faceVariant={faceVariant}
            animationState={expression}
            moodStatus={moodStatus}
            showRoomBackdrop={false}
            showShadow={false}
            title={title}
          />
        </div>
        {bubbleText && (
          <div
            className={cn(
              "mb-10 max-w-[210px] rounded-2xl px-3.5 py-2 text-xs font-bold leading-snug shadow-sm",
              BUBBLE_TONE_CLASSES[bubbleTone]
            )}
          >
            {bubbleText}
          </div>
        )}
      </div>
    </div>
  );
}
