/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Award,
  Coins,
  Sparkles,
  Palette,
  Layers,
  Smile,
  LayoutGrid,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  Code,
  Undo2,
} from "lucide-react";
import { AvatarPreview } from "@/components/pet/avatar-preview";
import { CharacterSelector } from "@/components/pet/character-selector";
import { ColorPickerPanel } from "@/components/pet/color-picker-panel";
import { AccessorySelector } from "@/components/pet/accessory-selector";
import { AnatomyVariantSelector } from "@/components/pet/anatomy-variant-selector";
import { AvatarConfigModal } from "@/components/pet/avatar-config-modal";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  CHARACTER_CATALOG,
  DEFAULT_CHARACTER_COMPOSITIONS,
  getCharacterDefinition,
} from "@/lib/character-assets/catalog";
import {
  CharacterColorPalette,
  CharacterId,
} from "@/lib/character-assets/types";
import {
  AvatarCustomizationState,
  getDefaultAvatarState,
  sanitizeCharacterId,
  sanitizeEquippedForCharacter,
} from "@/lib/character-assets/config-schema";
import { CosmeticCategory } from "@/lib/cosmetics-catalog";
import { cn } from "@/lib/utils";

type WardrobeSectionTab =
  | "accessories"
  | "characters"
  | "colors"
  | "anatomy"
  | "gallery";

export default function PetWardrobePage() {
  const isHydrated = useHydrated();

  // Persisted stores
  const {
    coins,
    name,
    species,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    setSpecies,
    setPetName,
    setCustomColors,
    setEarsVariant,
    setTailVariant,
    setFaceVariant,
  } = usePetStore();

  const {
    ownedItemIds,
    equipped,
    setEquippedLoadout,
  } = useCosmeticsStore();

  // Active UI tab
  const [activeTab, setActiveTab] = useState<WardrobeSectionTab>("accessories");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [compatibilityWarning, setCompatibilityWarning] = useState<string | null>(null);

  // Draft Customization State (Isolated from saved store until user explicitly saves)
  const [draftState, setDraftState] = useState<AvatarCustomizationState>(() => ({
    characterId: sanitizeCharacterId(species),
    name: name || "Pyro",
    colors: customColors || {},
    earsVariant,
    tailVariant,
    faceVariant,
    equipped: {
      head: equipped?.head || "head-none",
      glasses: equipped?.glasses || "glasses-none",
      body: equipped?.body || "body-none",
      held: equipped?.held || "held-none",
      skin: equipped?.skin || "skin-default",
      room: equipped?.room || "room-default",
    },
  }));

  // Synchronize draft state when hydrated or initial store mounts
  useEffect(() => {
    if (isHydrated) {
      setDraftState({
        characterId: sanitizeCharacterId(species),
        name: name || "Pyro",
        colors: customColors || {},
        earsVariant,
        tailVariant,
        faceVariant,
        equipped: {
          head: equipped?.head || "head-none",
          glasses: equipped?.glasses || "glasses-none",
          body: equipped?.body || "body-none",
          held: equipped?.held || "held-none",
          skin: equipped?.skin || "skin-default",
          room: equipped?.room || "room-default",
        },
      });
    }
  }, [isHydrated, species, name, customColors, earsVariant, tailVariant, faceVariant, equipped]);

  // Compute dirty state (has user modified draft from saved configuration?)
  const isDirty = useMemo(() => {
    if (draftState.characterId !== species) return true;
    if (draftState.earsVariant !== earsVariant) return true;
    if (draftState.tailVariant !== tailVariant) return true;
    if (draftState.faceVariant !== faceVariant) return true;

    // Compare colors
    const savedColorsStr = JSON.stringify(customColors || {});
    const draftColorsStr = JSON.stringify(draftState.colors || {});
    if (savedColorsStr !== draftColorsStr) return true;

    // Compare equipped
    const slots = ["head", "glasses", "body", "held", "skin", "room"] as const;
    for (const slot of slots) {
      if ((draftState.equipped[slot] || `${slot}-none`) !== (equipped[slot] || `${slot}-none`)) {
        return true;
      }
    }
    return false;
  }, [draftState, species, earsVariant, tailVariant, faceVariant, customColors, equipped]);

  // Handle Character Switch with Compatibility Validation
  const handleSelectCharacter = useCallback(
    (newCharId: CharacterId) => {
      setCompatibilityWarning(null);
      const targetCharDef = getCharacterDefinition(newCharId);

      // Sanitize equipped accessories for the new character
      const { sanitized, removedItems } = sanitizeEquippedForCharacter(
        newCharId,
        draftState.equipped
      );

      if (removedItems.length > 0) {
        const itemNames = removedItems.map((r) => r.name).join(", ");
        setCompatibilityWarning(
          `Aksesoris [${itemNames}] otomatis dilepas karena tidak kompatibel dengan siluet ${targetCharDef.name}.`
        );
        setTimeout(() => setCompatibilityWarning(null), 5000);
      }

      setDraftState((prev) => ({
        ...prev,
        characterId: newCharId,
        // Reset variants if they belonged to the old character's default
        earsVariant: undefined,
        tailVariant: undefined,
        faceVariant: undefined,
        equipped: sanitized,
      }));
    },
    [draftState.equipped]
  );

  // Apply Character's Signature Default Composition
  const handleApplyDefaultComposition = useCallback((charId: CharacterId) => {
    const defaultState = getDefaultAvatarState(charId);
    setDraftState(defaultState);
    setCompatibilityWarning(null);
  }, []);

  // Equip / Unequip Accessory in Draft State
  const handleEquipItem = useCallback((category: CosmeticCategory, itemId: string) => {
    setDraftState((prev) => ({
      ...prev,
      equipped: {
        ...prev.equipped,
        [category]: itemId,
      },
    }));
  }, []);

  const handleUnequipItem = useCallback((category: CosmeticCategory) => {
    setDraftState((prev) => ({
      ...prev,
      equipped: {
        ...prev.equipped,
        [category]: `${category}-none`,
      },
    }));
  }, []);

  // Update Colors in Draft State
  const handleChangeColors = useCallback((newColors: Partial<CharacterColorPalette>) => {
    setDraftState((prev) => ({
      ...prev,
      colors: newColors,
    }));
  }, []);

  const handleResetColors = useCallback(() => {
    setDraftState((prev) => ({
      ...prev,
      colors: {},
    }));
  }, []);

  // Update Anatomy Variants
  const handleChangeEars = useCallback((variant?: CharacterId) => {
    setDraftState((prev) => ({ ...prev, earsVariant: variant }));
  }, []);

  const handleChangeTail = useCallback((variant?: CharacterId) => {
    setDraftState((prev) => ({ ...prev, tailVariant: variant }));
  }, []);

  const handleChangeFace = useCallback((variant?: CharacterId) => {
    setDraftState((prev) => ({ ...prev, faceVariant: variant }));
  }, []);

  const handleResetAnatomy = useCallback(() => {
    setDraftState((prev) => ({
      ...prev,
      earsVariant: undefined,
      tailVariant: undefined,
      faceVariant: undefined,
    }));
  }, []);

  // Revert Draft to Current Saved State
  const handleRevertDraft = useCallback(() => {
    setDraftState({
      characterId: sanitizeCharacterId(species),
      name: name || "Pyro",
      colors: customColors || {},
      earsVariant,
      tailVariant,
      faceVariant,
      equipped: {
        head: equipped?.head || "head-none",
        glasses: equipped?.glasses || "glasses-none",
        body: equipped?.body || "body-none",
        held: equipped?.held || "held-none",
        skin: equipped?.skin || "skin-default",
        room: equipped?.room || "room-default",
      },
    });
    setCompatibilityWarning(null);
  }, [species, name, customColors, earsVariant, tailVariant, faceVariant, equipped]);

  // Save / Commit Draft to Zustand Stores (Persistence)
  const handleSaveAvatar = useCallback(() => {
    // 1. Commit to usePetStore
    if (draftState.characterId !== species) {
      setSpecies(draftState.characterId);
      const def = getCharacterDefinition(draftState.characterId);
      setPetName(def.defaultNickname);
    }
    setCustomColors(draftState.colors);
    setEarsVariant(draftState.earsVariant);
    setTailVariant(draftState.tailVariant);
    setFaceVariant(draftState.faceVariant);

    // 2. Commit to useCosmeticsStore
    setEquippedLoadout(draftState.equipped);

    // Feedback toast
    setSaveToast("Perubahan avatar berhasil disimpan ke profil!");
    setTimeout(() => setSaveToast(null), 3500);
  }, [
    draftState,
    species,
    setSpecies,
    setPetName,
    setCustomColors,
    setEarsVariant,
    setTailVariant,
    setFaceVariant,
    setEquippedLoadout,
  ]);

  const activeCharDef = getCharacterDefinition(draftState.characterId);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-navigation bg-accent-green/15 text-text-primary">
              <Award className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Studio Kustomisasi Karakter & Wardrobe
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Engine kustomisasi SVG modular data-driven: 12 karakter chibi antropomorfik, 24+ aksesoris Everyday & Food-Themed, dan kontrol warna token CSS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-button border border-border-default bg-surface hover:bg-surface-subtle text-text-primary font-bold text-xs transition-colors"
            title="Ekspor atau Impor konfigurasi avatar via JSON"
          >
            <Code className="h-4 w-4 text-accent-green" />
            <span>JSON Config</span>
          </button>

          <Link
            href="/pet-customization/shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-accent-yellow border border-accent-green/30 hover:bg-accent-green-light text-text-primary font-bold text-xs transition-colors"
          >
            <Coins className="h-4 w-4 text-accent-orange" />
            <span suppressHydrationWarning>
              {isHydrated ? coins : 240} Koin • Buka Pet Shop
            </span>
          </Link>
        </div>
      </div>

      {/* Compatibility Notice Banner (if any item was removed on character switch) */}
      {compatibilityWarning && (
        <div className="flex items-center gap-2 p-3 rounded-button bg-amber-50 border border-amber-200 text-amber-900 text-xs animate-in slide-in-from-top-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-medium">{compatibilityWarning}</span>
        </div>
      )}

      {/* Save Success Banner */}
      {saveToast && (
        <div className="flex items-center gap-2 p-3 rounded-button bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in slide-in-from-top-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[3]" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs: Wardrobe vs Shop */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-divider pb-2">
        <div className="flex items-center gap-2">
          <Link
            href="/pet-customization/wardrobe"
            aria-current="page"
            className="nav-item is-selected px-4 py-2 text-xs font-bold"
          >
            Wardrobe (Koleksi & Studio)
          </Link>
          <Link
            href="/pet-customization/shop"
            className="nav-item px-4 py-2 text-xs font-semibold text-neutral-10 hover:text-text-primary"
          >
            Pet Shop (Katalog Koin)
          </Link>
        </div>

        {/* Studio Tool Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("accessories")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "accessories"
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Aksesoris (24+)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("characters")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "characters"
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle"
            )}
          >
            <Smile className="h-3.5 w-3.5" />
            <span>12 Karakter</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("colors")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "colors"
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle"
            )}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Warna & Palet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("anatomy")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "anatomy"
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Layer Anatomi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gallery")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "gallery"
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Contact Sheet Galeri</span>
          </button>
        </div>
      </div>

      {/* Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Live Avatar Preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <AvatarPreview
            characterId={draftState.characterId}
            name={activeCharDef.name}
            colors={draftState.colors}
            earsVariant={draftState.earsVariant}
            tailVariant={draftState.tailVariant}
            faceVariant={draftState.faceVariant}
            equipped={draftState.equipped}
            onUnequipSlot={handleUnequipItem}
            isDirty={isDirty}
          />

          {/* Persistent Action Bar for Saving / Reverting Draft */}
          <div className="rounded-card border border-border-divider bg-surface p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                Status Kustomisasi:
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-pill text-[10px] font-bold",
                  isDirty
                    ? "bg-accent-orange/15 text-accent-orange-dark border border-accent-orange/30"
                    : "bg-accent-green/15 text-text-primary border border-accent-green/30"
                )}
              >
                {isDirty ? "Ada perubahan draft" : "Semua perubahan tersimpan"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!isDirty}
                onClick={handleRevertDraft}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-button border text-xs font-semibold transition-colors",
                  isDirty
                    ? "border-border-default bg-surface hover:bg-surface-subtle text-text-primary cursor-pointer"
                    : "border-border-divider bg-surface-subtle text-text-muted cursor-not-allowed opacity-50"
                )}
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Batal / Pulihkan</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAvatar}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-button text-xs font-bold transition-all shadow-xs",
                  isDirty
                    ? "button-primary"
                    : "bg-surface-subtle border border-border-default text-text-primary hover:bg-accent-green-light"
                )}
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Avatar</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleApplyDefaultComposition(draftState.characterId)}
              className="w-full py-1.5 rounded-button text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-subtle border border-border-default transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset ke Setelan Bawaan {activeCharDef.name}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Customization Tool Workspace */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === "accessories" && (
            <AccessorySelector
              characterId={draftState.characterId}
              ownedItemIds={ownedItemIds}
              equipped={draftState.equipped}
              onEquipItem={handleEquipItem}
              onUnequipItem={handleUnequipItem}
            />
          )}

          {activeTab === "characters" && (
            <CharacterSelector
              selectedCharacterId={draftState.characterId}
              onSelectCharacter={handleSelectCharacter}
              onApplyDefaultComposition={handleApplyDefaultComposition}
            />
          )}

          {activeTab === "colors" && (
            <ColorPickerPanel
              characterId={draftState.characterId}
              colors={draftState.colors}
              onChangeColors={handleChangeColors}
              onResetColors={handleResetColors}
            />
          )}

          {activeTab === "anatomy" && (
            <AnatomyVariantSelector
              characterId={draftState.characterId}
              earsVariant={draftState.earsVariant}
              tailVariant={draftState.tailVariant}
              faceVariant={draftState.faceVariant}
              onChangeEars={handleChangeEars}
              onChangeTail={handleChangeTail}
              onChangeFace={handleChangeFace}
              onResetAnatomy={handleResetAnatomy}
            />
          )}

          {activeTab === "gallery" && (
            <div className="rounded-card border border-border-divider bg-surface p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-heading">
                    Visual Contact Sheet: 12 Karakter & Aksesoris Bawaan
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Klik karakter mana saja untuk memuat seluruh komposisi default ikoniknya ke studio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-button border border-border-default text-xs font-bold text-text-primary hover:bg-surface-subtle"
                >
                  <Code className="h-3.5 w-3.5 text-accent-green" />
                  <span>Lihat JSON</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CHARACTER_CATALOG.map((char) => {
                  const comp = DEFAULT_CHARACTER_COMPOSITIONS[char.id];
                  const isCurrent = draftState.characterId === char.id;

                  return (
                    <div
                      key={`sheet-${char.id}`}
                      onClick={() => handleApplyDefaultComposition(char.id)}
                      className={cn(
                        "p-3 rounded-button border cursor-pointer transition-all flex flex-col items-center text-center space-y-1.5 shadow-2xs group",
                        isCurrent
                          ? "border-accent-orange bg-accent-yellow/40 ring-2 ring-accent-orange/20"
                          : "border-border-default bg-surface hover:border-accent-green/50 hover:bg-surface-subtle"
                      )}
                    >
                      <div className="h-28 w-24 flex items-center justify-center transition-transform group-hover:scale-105">
                        <AvatarRenderer
                          characterId={char.id}
                          equipped={comp.equippedAccessories}
                          showRoomBackdrop={false}
                          className="w-full h-full"
                        />
                      </div>

                      <div className="space-y-0.5 w-full">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {char.name}
                        </p>
                        <p className="text-[10px] text-text-muted truncate">
                          {char.speciesLabel}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "w-full py-1 rounded-input text-[9px] font-bold",
                          isCurrent
                            ? "bg-accent-orange text-text-inverse"
                            : "bg-surface-subtle border border-border-default text-text-primary"
                        )}
                      >
                        {isCurrent ? "Sedang Diedit" : "Terapkan Setelan"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSON Import / Export Modal */}
      <AvatarConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        currentState={draftState}
        onImportState={(newState) => {
          setDraftState(newState);
          setSaveToast("Konfigurasi dari JSON berhasil dimuat ke studio!");
          setTimeout(() => setSaveToast(null), 3000);
        }}
      />
    </div>
  );
}
