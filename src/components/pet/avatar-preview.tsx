"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Heart,
  Smile,
  Moon,
  Utensils,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { AvatarRenderer } from "./avatar-renderer";
import {
  CharacterColorPalette,
  CharacterId,
} from "@/lib/character-assets/types";
import {
  getAccessoryDefinition,
  getCharacterDefinition,
} from "@/lib/character-assets/catalog";
import { PetAnimationState } from "@/types";
import { cn } from "@/lib/utils";

export interface AvatarPreviewProps {
  characterId: CharacterId;
  name: string;
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
  onUnequipSlot?: (slot: "head" | "glasses" | "body" | "held" | "skin" | "room") => void;
  isDirty?: boolean;
  className?: string;
}

export function AvatarPreview({
  characterId,
  name,
  colors,
  earsVariant,
  tailVariant,
  faceVariant,
  equipped,
  onUnequipSlot,
  isDirty = false,
  className,
}: AvatarPreviewProps) {
  const [previewSize, setPreviewSize] = useState<"standard" | "large">("standard");
  const [animationState, setAnimationState] = useState<PetAnimationState>("idle");
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

  const charDef = getCharacterDefinition(characterId);

  const handlePetClick = () => {
    if (animationState === "sleeping") return;
    setAnimationState("happy");
    const newHeart = { id: Date.now(), x: (Math.random() - 0.5) * 60 };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
    setTimeout(() => {
      setAnimationState("idle");
    }, 1400);
  };

  const equippedSlots: {
    slot: "head" | "glasses" | "body" | "held" | "skin" | "room";
    label: string;
    itemId?: string | null;
  }[] = [
    { slot: "head", label: "Topi", itemId: equipped.head },
    { slot: "glasses", label: "Kacamata", itemId: equipped.glasses },
    { slot: "body", label: "Pakaian", itemId: equipped.body },
    { slot: "held", label: "Bawaan", itemId: equipped.held },
  ];

  return (
    <div
      className={cn(
        "rounded-card border border-border-divider bg-surface p-5 sm:p-6 shadow-xs flex flex-col items-center relative overflow-hidden",
        className
      )}
    >
      {/* Top Meta Bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-border-divider text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-text-primary text-sm font-heading">
            {name || charDef.defaultNickname}
          </span>
          <span className="px-2 py-0.5 rounded-pill text-[10px] font-bold bg-accent-green/15 text-text-primary">
            {charDef.speciesLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="px-2 py-0.5 rounded-pill text-[10px] font-bold bg-accent-orange text-text-inverse animate-pulse">
              Draft Belum Disimpan
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              setPreviewSize((prev) => (prev === "standard" ? "large" : "standard"))
            }
            className="p-1.5 rounded-navigation border border-border-default bg-surface hover:bg-surface-subtle text-text-muted hover:text-text-primary transition-colors"
            title={previewSize === "standard" ? "Perbesar Tampilan" : "Perkecil Tampilan"}
          >
            {previewSize === "standard" ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Avatar Stage */}
      <div
        className={cn(
          "relative flex items-center justify-center my-3 select-none transition-all duration-300 w-full",
          previewSize === "standard" ? "h-64 sm:h-72" : "h-80 sm:h-96"
        )}
      >
        {/* Floating Heart Particles */}
        <AnimatePresence>
          {floatingHearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, y: 0, x: heart.x, scale: 0.6 }}
              animate={{ opacity: 0, y: -70, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute top-1/4 pointer-events-none z-30 text-macro-fat"
            >
              <Heart className="h-7 w-7 fill-macro-fat" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Ambient Halo Glow */}
        <div
          className="absolute inset-8 rounded-pill blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{
            backgroundColor:
              colors?.primary || charDef.defaultColors.primary || "#FF6B5B",
          }}
        />

        {/* Interactive Character Motion */}
        <motion.div
          onClick={handlePetClick}
          className="relative flex items-center justify-center cursor-pointer transition-transform h-full max-h-full aspect-[128/160]"
          animate={
            animationState === "eating"
              ? { scale: [1, 1.1, 0.96, 1.06, 1], y: [0, -6, 2, -3, 0] }
              : animationState === "happy"
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
            className="w-full h-full drop-shadow-md"
          />
        </motion.div>
      </div>

      {/* Animation Pose Test Controls */}
      <div className="w-full flex items-center justify-center gap-1.5 py-1 text-xs">
        <span className="text-[11px] font-semibold text-text-muted mr-1">
          Uji Animasi:
        </span>
        <button
          type="button"
          onClick={() => setAnimationState("idle")}
          className={cn(
            "px-2.5 py-1 rounded-pill text-[11px] font-semibold border transition-colors flex items-center gap-1",
            animationState === "idle"
              ? "bg-accent-green text-text-inverse border-accent-green"
              : "bg-surface-subtle text-neutral-10 border-border-default hover:bg-surface"
          )}
        >
          <Sparkles className="h-3 w-3" />
          <span>Idle</span>
        </button>
        <button
          type="button"
          onClick={() => setAnimationState("happy")}
          className={cn(
            "px-2.5 py-1 rounded-pill text-[11px] font-semibold border transition-colors flex items-center gap-1",
            animationState === "happy"
              ? "bg-accent-orange text-text-inverse border-accent-orange"
              : "bg-surface-subtle text-neutral-10 border-border-default hover:bg-surface"
          )}
        >
          <Smile className="h-3 w-3" />
          <span>Happy</span>
        </button>
        <button
          type="button"
          onClick={() => setAnimationState("eating")}
          className={cn(
            "px-2.5 py-1 rounded-pill text-[11px] font-semibold border transition-colors flex items-center gap-1",
            animationState === "eating"
              ? "bg-macro-protein text-text-inverse border-macro-protein"
              : "bg-surface-subtle text-neutral-10 border-border-default hover:bg-surface"
          )}
        >
          <Utensils className="h-3 w-3" />
          <span>Makan</span>
        </button>
        <button
          type="button"
          onClick={() => setAnimationState("sleeping")}
          className={cn(
            "px-2.5 py-1 rounded-pill text-[11px] font-semibold border transition-colors flex items-center gap-1",
            animationState === "sleeping"
              ? "bg-accent-yellow text-text-primary border-accent-yellow font-bold"
              : "bg-surface-subtle text-neutral-10 border-border-default hover:bg-surface"
          )}
        >
          <Moon className="h-3 w-3" />
          <span>Tidur</span>
        </button>
      </div>

      {/* Equipped Accessories Summary Bar with 1-click Unequip */}
      <div className="w-full grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-border-divider text-[11px]">
        {equippedSlots.map(({ slot, label, itemId }) => {
          const acc = getAccessoryDefinition(itemId);
          const hasItem = Boolean(acc);

          return (
            <div
              key={slot}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-input border transition-colors",
                hasItem
                  ? "bg-accent-yellow/40 border-accent-orange/30 text-text-primary"
                  : "bg-surface-subtle border-border-divider text-text-muted"
              )}
            >
              <div className="truncate max-w-[110px]">
                <span className="text-[10px] text-text-muted mr-1">{label}:</span>
                <span className="font-bold">
                  {acc ? acc.name : "Kosong"}
                </span>
              </div>

              {hasItem && onUnequipSlot && (
                <button
                  type="button"
                  onClick={() => onUnequipSlot(slot)}
                  className="p-1 rounded-pill text-text-muted hover:text-accent-orange hover:bg-surface transition-colors"
                  title={`Lepas ${label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
