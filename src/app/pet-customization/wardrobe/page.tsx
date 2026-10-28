/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Check, AlertCircle } from "lucide-react";
import { AvatarPreview } from "@/components/pet/avatar-preview";
import { AccessorySelector } from "@/components/pet/accessory-selector";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import {
  AvatarCustomizationState,
  sanitizeCharacterId,
} from "@/lib/character-assets/config-schema";
import { CosmeticCategory } from "@/lib/cosmetics-catalog";
import { WARDROBE_CATEGORIES } from "@/lib/wardrobe-categories";
import { savePetEquippedAction } from "@/app/actions/pet-customization";

export default function PetWardrobePage() {
  const isHydrated = useHydrated();

  // Persisted stores
  const {
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

  const { ownedItemIds, equipped, setEquippedLoadout } = useCosmeticsStore();

  const [saveToast, setSaveToast] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Draft Customization State (isolated from saved store until user explicitly saves)
  const [draftState, setDraftState] = useState<AvatarCustomizationState>(
    () => ({
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
    }),
  );

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
  }, [
    isHydrated,
    species,
    name,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    equipped,
  ]);

  // Compute dirty state (has user modified draft from saved configuration?)
  const isDirty = useMemo(() => {
    if (draftState.characterId !== species) return true;
    if (draftState.earsVariant !== earsVariant) return true;
    if (draftState.tailVariant !== tailVariant) return true;
    if (draftState.faceVariant !== faceVariant) return true;

    const savedColorsStr = JSON.stringify(customColors || {});
    const draftColorsStr = JSON.stringify(draftState.colors || {});
    if (savedColorsStr !== draftColorsStr) return true;

    const slots = ["head", "glasses", "body", "held", "skin", "room"] as const;
    for (const slot of slots) {
      if (
        (draftState.equipped[slot] || `${slot}-none`) !==
        (equipped[slot] || `${slot}-none`)
      ) {
        return true;
      }
    }
    return false;
  }, [
    draftState,
    species,
    earsVariant,
    tailVariant,
    faceVariant,
    customColors,
    equipped,
  ]);

  // Number of wardrobe categories with pending changes (shown as a badge)
  const changedCategoryCount = useMemo(
    () =>
      WARDROBE_CATEGORIES.filter(
        ({ slot }) =>
          (draftState.equipped[slot] || `${slot}-none`) !==
          (equipped[slot] || `${slot}-none`),
      ).length,
    [draftState.equipped, equipped],
  );

  // Equip / Unequip Accessory in Draft State
  const handleEquipItem = useCallback(
    (category: CosmeticCategory, itemId: string) => {
      setDraftState((prev) => ({
        ...prev,
        equipped: {
          ...prev.equipped,
          [category]: itemId,
        },
      }));
    },
    [],
  );

  const handleUnequipItem = useCallback((category: CosmeticCategory) => {
    setDraftState((prev) => ({
      ...prev,
      equipped: {
        ...prev.equipped,
        [category]: `${category}-none`,
      },
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
  }, [
    species,
    name,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    equipped,
  ]);

  // Save / Commit Draft to Zustand Stores and Backend Database (Persistence)
  const handleSaveAvatar = useCallback(async () => {
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

    // 3. Persist to PostgreSQL database
    try {
      const serverResult = await savePetEquippedAction(draftState.equipped);
      if (!serverResult.success) {
        if (!serverResult.message.includes("login")) {
          setSaveToast({
            success: false,
            message: serverResult.message,
          });
          setTimeout(() => setSaveToast(null), 4000);
          return;
        }
      }
    } catch (err) {
      console.warn("[PetWardrobePage] Backend persistence skipped:", err);
    }

    // Feedback toast
    setSaveToast({
      success: true,
      message: "Perubahan penampilan Calpal berhasil disimpan!",
    });
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: CalPal stage + draft actions */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:col-span-5">
          <AvatarPreview
            nickname={name?.trim() || "CalPal"}
            characterId={draftState.characterId}
            colors={draftState.colors}
            earsVariant={draftState.earsVariant}
            tailVariant={draftState.tailVariant}
            faceVariant={draftState.faceVariant}
            equipped={draftState.equipped}
            isDirty={isDirty}
            changedCategoryCount={changedCategoryCount}
            onSave={handleSaveAvatar}
            onCancel={handleRevertDraft}
          />
        </div>

        {/* Right Column: Dandani Calpal Wardrobe */}
        <div className="space-y-4 lg:col-span-7">
          <AccessorySelector
            characterId={draftState.characterId}
            ownedItemIds={ownedItemIds}
            equipped={draftState.equipped}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
          />
        </div>
      </div>

      {/* Save Success Banner (Squircle) */}
      {saveToast && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-navigation border p-3 text-xs font-semibold shadow-xs animate-in slide-in-from-top-2 ${
            saveToast.success
              ? "border-accent-green/30 bg-accent-green/15 text-text-primary"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {saveToast.success ? (
            <Check className="h-4 w-4 shrink-0 stroke-[3] text-accent-green" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 stroke-[2.5] text-destructive" />
          )}
          <span>{saveToast.message}</span>
        </div>
      )}
    </div>
  );
}
