"use client";

import React, { useState, useMemo } from "react";
import { Check, Search, Wand2 } from "lucide-react";
import { AvatarRenderer } from "./avatar-renderer";
import {
  CHARACTER_CATALOG,
} from "@/lib/character-assets/catalog";
import { CharacterId } from "@/lib/character-assets/types";
import { cn } from "@/lib/utils";

export interface CharacterSelectorProps {
  selectedCharacterId: CharacterId;
  onSelectCharacter: (characterId: CharacterId) => void;
  onApplyDefaultComposition: (characterId: CharacterId) => void;
}

export function CharacterSelector({
  selectedCharacterId,
  onSelectCharacter,
  onApplyDefaultComposition,
}: CharacterSelectorProps) {
  const [macroFilter, setMacroFilter] = useState<"all" | "protein" | "carbs" | "fat">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCharacters = useMemo(() => {
    return CHARACTER_CATALOG.filter((char) => {
      if (macroFilter !== "all" && char.primaryMacro !== macroFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = char.name.toLowerCase().includes(q);
        const matchSpecies = char.speciesLabel.toLowerCase().includes(q);
        const matchTrait = char.animalTrait.toLowerCase().includes(q);
        return matchName || matchSpecies || matchTrait;
      }
      return true;
    });
  }, [macroFilter, searchQuery]);

  return (
    <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-divider">
        <div>
          <h3 className="text-sm font-bold text-text-primary font-heading">
            Pilih Karakter Utama (12 Chibi Anthropomorphic)
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Setiap karakter memiliki proporsi kepala, telinga, ekor, dan kepribadian nutrisi unik.
          </p>
        </div>

        {/* Macro Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "all", label: "Semua (12)" },
              { id: "protein", label: "Protein" },
              { id: "carbs", label: "Karbohidrat" },
              { id: "fat", label: "Lemak Sehat" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setMacroFilter(filter.id)}
              className={cn(
                "px-2.5 py-1 rounded-pill text-[11px] font-semibold border transition-colors whitespace-nowrap",
                macroFilter === filter.id
                  ? "bg-accent-green text-text-inverse border-accent-green font-bold shadow-2xs"
                  : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="h-4 w-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, spesies, atau ciri hewan (misal: fox, kelinci, panda)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-input border border-border-default bg-surface-subtle focus:bg-surface text-xs text-text-primary placeholder:text-text-muted transition-colors outline-hidden focus:border-accent-green"
        />
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
        {filteredCharacters.map((char) => {
          const isSelected = selectedCharacterId === char.id;

          return (
            <div
              key={char.id}
              onClick={() => onSelectCharacter(char.id)}
              className={cn(
                "p-3 rounded-button border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-2 relative shadow-2xs group",
                isSelected
                  ? "border-accent-orange bg-accent-yellow/40 ring-2 ring-accent-orange/20"
                  : "border-border-divider bg-surface hover:bg-surface-subtle hover:border-accent-green/40"
              )}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-pill bg-accent-orange text-text-inverse shadow-2xs">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}

              {/* Macro Pill Badge */}
              <span
                className={cn(
                  "absolute top-2 left-2 px-1.5 py-0.5 rounded-input text-[9px] font-bold uppercase",
                  char.primaryMacro === "protein"
                    ? "bg-macro-protein/15 text-macro-protein"
                    : char.primaryMacro === "carbs"
                    ? "bg-macro-carbs/15 text-macro-carbs"
                    : "bg-macro-fat/15 text-macro-fat"
                )}
              >
                {char.primaryMacro}
              </span>

              {/* Character Mini SVG Representation */}
              <div className="h-28 w-22 flex items-center justify-center pt-3 transition-transform group-hover:scale-105">
                <AvatarRenderer
                  characterId={char.id}
                  showRoomBackdrop={false}
                  showShadow={true}
                  className="w-full h-full"
                />
              </div>

              {/* Character Details */}
              <div className="space-y-0.5 w-full">
                <p className="text-xs font-bold text-text-primary truncate">
                  {char.name}
                </p>
                <p className="text-[10px] text-text-muted truncate">
                  {char.speciesLabel}
                </p>
                <p className="text-[9px] text-neutral-10 line-clamp-2 px-1 text-center pt-0.5">
                  {char.personality}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-1 mt-auto pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCharacter(char.id);
                  }}
                  className={cn(
                    "w-full py-1 rounded-input text-[10px] font-bold transition-colors",
                    isSelected
                      ? "bg-accent-orange text-text-inverse"
                      : "bg-surface-subtle border border-border-default hover:bg-accent-green-light text-text-primary"
                  )}
                >
                  {isSelected ? "Terpilih" : "Pilih Karakter"}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApplyDefaultComposition(char.id);
                  }}
                  className="w-full py-0.5 rounded-input text-[9px] font-semibold text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors flex items-center justify-center gap-1"
                  title="Gunakan karakter ini bersama setelan aksesoris bawaan ikonik"
                >
                  <Wand2 className="h-2.5 w-2.5 text-accent-orange" />
                  <span>Setelan Bawaan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="py-12 text-center text-xs text-text-muted space-y-1">
          <p>Tidak ada karakter yang cocok dengan kata kunci &quot;{searchQuery}&quot;.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setMacroFilter("all");
            }}
            className="text-xs font-bold text-text-primary hover:underline"
          >
            Reset Pencarian
          </button>
        </div>
      )}
    </div>
  );
}
