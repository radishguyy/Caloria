"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { AvatarPreview } from "@/components/pet/avatar-preview";
import { usePetStore } from "@/store/use-pet-store";
import { useFoodStore } from "@/store/use-food-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { sanitizeCharacterId } from "@/lib/character-assets/config-schema";
import { extractLoggedMainMealSlots } from "@/lib/pet/needs-engine";
import { petCalpalAction } from "@/server/actions/pet-actions";
import { formatDateKey } from "@/lib/date-utils";
import { toastPetBlocked, toastPetPetted } from "@/lib/toast";

interface PetShowcaseProps {
  className?: string;
}

const DEFAULT_EQUIPPED = {
  head: "head-none",
  glasses: "glasses-none",
  body: "body-none",
  held: "held-none",
  skin: "skin-default",
  room: "room-default",
};

export function PetShowcase({ className }: PetShowcaseProps) {
  const isHydrated = useHydrated();

  const {
    name,
    species,
    earsVariant,
    tailVariant,
    faceVariant,
    checkAndApplyDecay,
    petInteract,
    getEffectiveColors,
  } = usePetStore();

  const logs = useFoodStore((s) => s.logs);
  const { equipped } = useCosmeticsStore();

  useEffect(() => {
    if (!isHydrated) return;
    checkAndApplyDecay();
    const interval = setInterval(() => {
      checkAndApplyDecay();
    }, 60000);
    return () => clearInterval(interval);
  }, [isHydrated, checkAndApplyDecay]);

  const effectiveColors = getEffectiveColors();

  const loggedMainMealsToday = useMemo(() => {
    if (!isHydrated) return [];
    return extractLoggedMainMealSlots(logs, formatDateKey(new Date()));
  }, [isHydrated, logs]);

  const handlePet = useCallback(async () => {
    if (!isHydrated) return;
    const actionNow = new Date();
    const clientRes = petInteract(loggedMainMealsToday, actionNow);
    if (!clientRes.success) {
      if (clientRes.message) {
        toastPetBlocked(clientRes.message);
      }
      return;
    }

    toastPetPetted(10, clientRes.petCountToday);

    try {
      await petCalpalAction({
        clientDateKey: formatDateKey(actionNow),
        loggedMainMealCount: loggedMainMealsToday.length,
      });
    } catch (err) {
      console.warn("[PetShowcase] petCalpalAction warning:", err);
    }
  }, [isHydrated, loggedMainMealsToday, petInteract]);

  return (
    <AvatarPreview
      nickname={isHydrated ? name?.trim() || "CalPal" : "CalPal"}
      characterId={isHydrated ? sanitizeCharacterId(species) : "flameling"}
      colors={isHydrated ? effectiveColors : undefined}
      earsVariant={isHydrated ? earsVariant : undefined}
      tailVariant={isHydrated ? tailVariant : undefined}
      faceVariant={isHydrated ? faceVariant : undefined}
      equipped={isHydrated ? equipped : DEFAULT_EQUIPPED}
      onPet={handlePet}
      dataTour="dashboard-pet"
      className={className}
    />
  );
}
