"use client";

import React from "react";
import { Layers, RotateCcw } from "lucide-react";
import { ALL_CHARACTER_IDS } from "@/lib/character-assets/catalog";
import { CharacterId } from "@/lib/character-assets/types";
import { cn } from "@/lib/utils";

export interface AnatomyVariantSelectorProps {
  characterId: CharacterId;
  earsVariant?: CharacterId;
  tailVariant?: CharacterId;
  faceVariant?: CharacterId;
  onChangeEars: (variant?: CharacterId) => void;
  onChangeTail: (variant?: CharacterId) => void;
  onChangeFace: (variant?: CharacterId) => void;
  onResetAnatomy: () => void;
}

export function AnatomyVariantSelector({
  characterId,
  earsVariant,
  tailVariant,
  faceVariant,
  onChangeEars,
  onChangeTail,
  onChangeFace,
  onResetAnatomy,
}: AnatomyVariantSelectorProps) {
  const activeEars = earsVariant || characterId;
  const activeTail = tailVariant || characterId;
  const activeFace = faceVariant || characterId;

  return (
    <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent-green" />
            <h3 className="text-sm font-bold text-text-primary font-heading">
              Kombinasi Layer Anatomi & Ekspresi Wajah
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Padukan telinga, ekor, dan ekspresi mata dari 12 karakter untuk menciptakan siluet unik.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetAnatomy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-navigation border border-border-default text-xs font-bold text-text-primary hover:bg-accent-green-light transition-colors"
          title="Kembalikan telinga, ekor, dan wajah ke bentuk asli karakter ini"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Bentuk Bawaan</span>
        </button>
      </div>

      {/* Face Variant Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Ekspresi Wajah & Mata:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CHARACTER_IDS.map((vid) => {
            const isSelected = activeFace === vid;
            return (
              <button
                key={`face-${vid}`}
                type="button"
                onClick={() => onChangeFace(vid === characterId ? undefined : vid)}
                className={cn(
                  "px-3 py-1.5 rounded-pill text-xs font-semibold capitalize border transition-all",
                  isSelected
                    ? "bg-accent-orange text-text-inverse border-accent-orange font-bold shadow-2xs"
                    : "bg-surface-subtle text-neutral-10 border-border-default hover:bg-surface"
                )}
              >
                {vid}
                {vid === characterId && " (Asli)"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ears Variant Selector */}
      <div className="space-y-2 pt-2 border-t border-border-divider">
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Siluet & Bentuk Telinga:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CHARACTER_IDS.map((vid) => {
            const isSelected = activeEars === vid;
            return (
              <button
                key={`ears-${vid}`}
                type="button"
                onClick={() => onChangeEars(vid === characterId ? undefined : vid)}
                className={cn(
                  "px-3 py-1.5 rounded-pill text-xs font-semibold capitalize border transition-all",
                  isSelected
                    ? "bg-accent-orange text-text-inverse border-accent-orange font-bold shadow-2xs"
                    : "bg-surface-subtle text-neutral-10 border-border-default hover:bg-surface"
                )}
              >
                {vid}
                {vid === characterId && " (Asli)"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tail Variant Selector */}
      <div className="space-y-2 pt-2 border-t border-border-divider">
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Bentuk & Siluet Ekor:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CHARACTER_IDS.map((vid) => {
            const isSelected = activeTail === vid;
            return (
              <button
                key={`tail-${vid}`}
                type="button"
                onClick={() => onChangeTail(vid === characterId ? undefined : vid)}
                className={cn(
                  "px-3 py-1.5 rounded-pill text-xs font-semibold capitalize border transition-all",
                  isSelected
                    ? "bg-accent-orange text-text-inverse border-accent-orange font-bold shadow-2xs"
                    : "bg-surface-subtle text-neutral-10 border-border-default hover:bg-surface"
                )}
              >
                {vid}
                {vid === characterId && " (Asli)"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

