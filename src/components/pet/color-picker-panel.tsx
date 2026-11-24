"use client";

import React from "react";
import { RotateCcw, Palette, Sparkles, Check } from "lucide-react";
import {
  CharacterColorPalette,
  CharacterId,
} from "@/lib/character-assets/types";
import {
  ALL_CHARACTER_IDS,
  CHARACTER_COLOR_PALETTES,
  getCharacterDefinition,
} from "@/lib/character-assets/catalog";
import { cn } from "@/lib/utils";

export interface ColorPickerPanelProps {
  characterId: CharacterId;
  colors: Partial<CharacterColorPalette>;
  onChangeColors: (colors: Partial<CharacterColorPalette>) => void;
  onResetColors: () => void;
}

const POPULAR_SWATCHES = [
  "#FF6B5B", // Coral Blaze
  "#4ADE80", // Fresh Mint
  "#22D3EE", // Aqua Splash
  "#FBBF24", // Honey Gold
  "#F9A8D4", // Sakura Pink
  "#A78BFA", // Lavender Dream
  "#B45309", // Warm Amber
  "#60A5FA", // Sky Blue
  "#A3E635", // Lime Berry
  "#E879F9", // Orchid
  "#F97316", // Tangerine
  "#38BDF8", // Cyan Glow
  "#FFF3E2", // Warm Cream Belly
  "#FFFFFF", // Pure White
  "#231F20", // Charcoal Outline
];

export function ColorPickerPanel({
  characterId,
  colors,
  onChangeColors,
  onResetColors,
}: ColorPickerPanelProps) {
  const charDef = getCharacterDefinition(characterId);

  const effectiveColors: CharacterColorPalette = {
    ...charDef.defaultColors,
    ...Object.fromEntries(
      Object.entries(colors || {}).filter(([, v]) => Boolean(v))
    ),
  };

  const handleApplyPalette = (paletteKey: CharacterId) => {
    const pal = CHARACTER_COLOR_PALETTES[paletteKey];
    if (!pal) return;
    onChangeColors({
      primary: pal.primary,
      secondary: pal.secondary,
      belly: pal.belly,
      innerEar: pal.innerEar,
      blush: pal.blush,
    });
  };

  const updateSingleColor = (key: keyof CharacterColorPalette, hex: string) => {
    onChangeColors({
      ...colors,
      [key]: hex,
    });
  };

  return (
    <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent-green" />
            <h3 className="text-sm font-bold text-text-primary font-heading">
              Kustomisasi Warna & Token CSS Karakter
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Pilih dari 12 palet koleksi harmonis atau ubah warna per bagian tubuh secara presisi.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetColors}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-navigation border border-border-default text-xs font-bold text-text-primary hover:bg-accent-green-light transition-colors"
          title="Kembalikan semua warna ke standar karakter ini"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Warna Bawaan</span>
        </button>
      </div>

      {/* 12 Collectible Palette Presets */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent-orange" />
          <span>12 Palet Warna Koleksi (1-Click Harmony):</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {ALL_CHARACTER_IDS.map((pid) => {
            const pal = CHARACTER_COLOR_PALETTES[pid];
            const isSelected =
              effectiveColors.primary.toLowerCase() === pal.primary.toLowerCase() &&
              effectiveColors.secondary.toLowerCase() === pal.secondary.toLowerCase();

            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => handleApplyPalette(pid)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-button border text-left transition-all relative",
                  isSelected
                    ? "border-accent-orange bg-accent-yellow/40 font-bold ring-2 ring-accent-orange/20"
                    : "border-border-default bg-surface hover:bg-surface-subtle"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="flex items-center -space-x-1 shrink-0">
                    <span
                      className="h-4 w-4 rounded-pill border border-black/20"
                      style={{ backgroundColor: pal.primary }}
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-pill border border-black/20"
                      style={{ backgroundColor: pal.secondary }}
                    />
                    <span
                      className="h-3 w-3 rounded-pill border border-black/20"
                      style={{ backgroundColor: pal.belly }}
                    />
                  </span>
                  <span className="text-[11px] text-text-primary truncate">
                    {pal.name}
                  </span>
                </div>

                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-accent-orange shrink-0 ml-1 stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-Grained Part Pickers */}
      <div className="space-y-3 pt-2 border-t border-border-divider">
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Pewarnaan Presisi per Bagian Tubuh:
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Body & Limbs */}
          <div className="p-3.5 rounded-button border border-border-default bg-surface-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-text-primary">Tubuh & Kepala Utama</p>
                <p className="text-[10px] text-text-muted">Token: --char-primary</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={effectiveColors.primary}
                  onChange={(e) => updateSingleColor("primary", e.target.value)}
                  className="w-20 px-2 py-1 rounded-input border border-border-default bg-surface text-xs font-mono uppercase text-center"
                />
                <input
                  type="color"
                  value={effectiveColors.primary}
                  onChange={(e) => updateSingleColor("primary", e.target.value)}
                  className="h-8 w-10 rounded-input cursor-pointer border border-border-default bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* 2. Secondary Accents */}
          <div className="p-3.5 rounded-button border border-border-default bg-surface-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-text-primary">Aksen, Ujung Telinga & Ekor</p>
                <p className="text-[10px] text-text-muted">Token: --char-secondary</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={effectiveColors.secondary}
                  onChange={(e) => updateSingleColor("secondary", e.target.value)}
                  className="w-20 px-2 py-1 rounded-input border border-border-default bg-surface text-xs font-mono uppercase text-center"
                />
                <input
                  type="color"
                  value={effectiveColors.secondary}
                  onChange={(e) => updateSingleColor("secondary", e.target.value)}
                  className="h-8 w-10 rounded-input cursor-pointer border border-border-default bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* 3. Belly & Inner Muzzle */}
          <div className="p-3.5 rounded-button border border-border-default bg-surface-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-text-primary">Perut & Moncong Depan</p>
                <p className="text-[10px] text-text-muted">Token: --char-belly</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={effectiveColors.belly}
                  onChange={(e) => updateSingleColor("belly", e.target.value)}
                  className="w-20 px-2 py-1 rounded-input border border-border-default bg-surface text-xs font-mono uppercase text-center"
                />
                <input
                  type="color"
                  value={effectiveColors.belly}
                  onChange={(e) => updateSingleColor("belly", e.target.value)}
                  className="h-8 w-10 rounded-input cursor-pointer border border-border-default bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* 4. Inner Ear & Cheek Blush */}
          <div className="p-3.5 rounded-button border border-border-default bg-surface-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-text-primary">Telinga Dalam & Rona Pipi</p>
                <p className="text-[10px] text-text-muted">Token: --char-inner-ear / --char-blush</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={effectiveColors.innerEar}
                  onChange={(e) => {
                    onChangeColors({
                      ...colors,
                      innerEar: e.target.value,
                      blush: e.target.value,
                    });
                  }}
                  className="w-20 px-2 py-1 rounded-input border border-border-default bg-surface text-xs font-mono uppercase text-center"
                />
                <input
                  type="color"
                  value={effectiveColors.innerEar}
                  onChange={(e) => {
                    onChangeColors({
                      ...colors,
                      innerEar: e.target.value,
                      blush: e.target.value,
                    });
                  }}
                  className="h-8 w-10 rounded-input cursor-pointer border border-border-default bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Swatch Palette */}
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-text-muted mb-1.5">
            Palet Cepat (Klik untuk mewarnai Tubuh Utama):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => updateSingleColor("primary", swatch)}
                className="h-6 w-6 rounded-pill border border-black/20 hover:scale-115 transition-transform"
                style={{ backgroundColor: swatch }}
                title={`Gunakan warna ${swatch}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

