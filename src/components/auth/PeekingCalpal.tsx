"use client";

import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import type { CharacterId } from "@/lib/character-assets/types";

interface PeekingCalpalProps {
  characterId?: CharacterId;
  position?: "top-right" | "top-left" | "left" | "right";
  title?: string;
  expression?: "happy" | "eating" | "idle";
}

/**
 * Calpal yang bersembunyi di belakang card.
 * Diam tersembunyi, dan saat container kartu di-hover / di-focus,
 * Calpal akan melompat keluar memperlihatkan dirinya.
 */
export function PeekingCalpal({
  characterId = "flameling",
  position = "top-right",
  title = "Calpal mengintip!",
  expression = "happy",
}: PeekingCalpalProps) {
  const isTopRight = position === "top-right";
  const isTopLeft = position === "top-left";
  const isLeft = position === "left";

  // Posisi dan transform hover responsif
  let positionClasses = "";
  let hoverTransform = "";
  let rotationClass = "rotate-6";

  if (isTopRight) {
    positionClasses = "-top-2 sm:-top-5 right-4 sm:right-8";
    hoverTransform = "group-hover:-translate-y-6 group-focus-within:-translate-y-6 group-hover:scale-105";
    rotationClass = "rotate-6 group-hover:rotate-12";
  } else if (isTopLeft) {
    positionClasses = "-top-2 sm:-top-5 left-4 sm:left-8";
    hoverTransform = "group-hover:-translate-y-6 group-focus-within:-translate-y-6 group-hover:scale-105";
    rotationClass = "-rotate-6 group-hover:-rotate-12";
  } else if (isLeft) {
    // Samping kiri kartu
    positionClasses = "top-1/3 -left-10 sm:-left-12 -translate-y-1/2";
    hoverTransform = "group-hover:-translate-x-6 group-focus-within:-translate-x-6 group-hover:scale-105";
    rotationClass = "-rotate-12 group-hover:-rotate-6";
  } else {
    // Samping kanan kartu
    positionClasses = "top-1/3 -right-10 sm:-right-12 -translate-y-1/2";
    hoverTransform = "group-hover:translate-x-6 group-focus-within:translate-x-6 group-hover:scale-105";
    rotationClass = "rotate-12 group-hover:rotate-6";
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 transition-all duration-300 ease-out select-none ${positionClasses} ${hoverTransform}`}
    >
      <div className={`w-20 h-24 sm:w-24 sm:h-28 drop-shadow-md transition-transform duration-300 ease-out ${rotationClass}`}>
        <AvatarRenderer
          characterId={characterId}
          animationState={expression}
          showRoomBackdrop={false}
          showShadow={false}
          title={title}
        />
      </div>
    </div>
  );
}

