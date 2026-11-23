import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PetAnimationState } from "@/types";
import { PET_CONFIG, PetSpeciesId } from "@/lib/constants";
import {
  CharacterColorPalette,
  CharacterId,
} from "@/lib/character-assets/types";
import {
  CHARACTER_COLOR_PALETTES,
  getCharacterDefinition,
} from "@/lib/character-assets/catalog";
import { evaluatePetCondition, PetConditionResult } from "@/lib/pet/decay-evaluator";
import {
  type MainMealSlot,
  MAX_DAILY_FEEDS,
  MAX_DAILY_PETS,
  evaluateFeedEligibility,
  evaluatePetEligibility,
  normalizeDailyFedSlots,
  normalizeDailyPetCount,
} from "@/lib/pet/needs-engine";
import { formatDateKey } from "@/lib/date-utils";

interface PetStoreState {
  name: string;
  species: PetSpeciesId;
  stage: number;
  level: number;
  exp: number;
  coins: number;
  hunger: number;
  happiness: number;
  health: number;
  animationState: PetAnimationState;
  lastFedAt: string;
  lastPettedAt: string;
  fedSlotsToday: MainMealSlot[];
  petCountToday: number;
  needsResetDate: string | null;
  moodStatus: "happy" | "neutral" | "complaining";

  // Modular Character Customization State
  customColors: Partial<CharacterColorPalette>;
  earsVariant?: CharacterId;
  tailVariant?: CharacterId;
  faceVariant?: CharacterId;

  // Soulbound NFT State (Phase 2)
  nftTokenId: number | null;
  nftContractAddress: string | null;
  nftChainId: number | null;
  mintTxHash: string | null;
  mintStatus: "unminted" | "minting" | "minted";

  // Actions
  feedPet: (
    caloriesFed?: number,
    xpReward?: number,
    coinReward?: number,
  ) => void;
  feedWithCoins: (
    cost?: number,
    now?: Date,
  ) => {
    success: boolean;
    error?: string;
    message?: string;
    slot?: MainMealSlot;
  };
  checkAndApplyDecay: () => PetConditionResult;
  petInteract: (
    loggedMainMealsToday?: MainMealSlot[],
    now?: Date,
  ) => {
    success: boolean;
    error?: string;
    message?: string;
    petCountToday?: number;
  };
  toggleSleep: () => void;
  gainExp: (amount: number) => void;
  addCoins: (amount: number) => void;
  setCoins: (amount: number) => void;
  setAnimationState: (state: PetAnimationState) => void;
  setPetName: (name: string) => void;
  setSpecies: (species: PetSpeciesId) => void;

  // Customization Actions
  setPetState: (data: Partial<PetStoreState>) => void;
  setCustomColors: (colors: Partial<CharacterColorPalette>) => void;
  applyColorPalette: (paletteId: CharacterId) => void;
  resetCustomColors: () => void;
  setEarsVariant: (variant?: CharacterId) => void;
  setTailVariant: (variant?: CharacterId) => void;
  setFaceVariant: (variant?: CharacterId) => void;
  resetCharacterCustomization: () => void;

  // Helpers
  getExpNeededForNextLevel: () => number;
  getEffectiveColors: () => CharacterColorPalette;
}

export const usePetStore = create<PetStoreState>()(
  persist(
    (set, get) => ({
      name: "Pyro",
      species: "flameling",
      stage: 1,
      level: 1,
      exp: 0,
      coins: 0,
      hunger: 100,
      happiness: 100,
      health: 100,
      animationState: "idle",
      lastFedAt: "2026-10-30T00:00:00.000Z",
      lastPettedAt: "2026-10-30T00:00:00.000Z",
      fedSlotsToday: [],
      petCountToday: 0,
      needsResetDate: null,
      moodStatus: "happy",
      customColors: {},
      earsVariant: undefined,
      tailVariant: undefined,
      faceVariant: undefined,
      nftTokenId: null,
      nftContractAddress: null,
      nftChainId: null,
      mintTxHash: null,
      mintStatus: "unminted",

      setPetState: (data) => set((state) => ({ ...state, ...data })),

      getExpNeededForNextLevel: () => {
        const { level } = get();
        return Math.round(
          PET_CONFIG.EXP_BASE * Math.pow(PET_CONFIG.EXP_MULTIPLIER, level - 1),
        );
      },

      getEffectiveColors: () => {
        const { species, customColors } = get();
        const charDef = getCharacterDefinition(species);
        return {
          ...charDef.defaultColors,
          ...Object.fromEntries(
            Object.entries(customColors || {}).filter(([, v]) => Boolean(v)),
          ),
        };
      },

      feedPet: (caloriesFed = 300, xpReward = 25, coinReward = 10) => {
        const current = get();
        const hungerGain = Math.min(
          30,
          Math.max(10, Math.round(caloriesFed / 25)),
        );
        const newHunger = Math.min(
          PET_CONFIG.MAX_HUNGER,
          current.hunger + hungerGain,
        );

        set({
          hunger: newHunger,
          coins: current.coins + coinReward,
          animationState: "eating",
          lastFedAt: new Date().toISOString(),
          moodStatus: "happy",
        });

        get().gainExp(xpReward);

        setTimeout(() => {
          set({ animationState: "happy" });
          setTimeout(() => {
            set({ animationState: "idle" });
          }, 1800);
        }, 1500);
      },

      feedWithCoins: (cost = 5, now = new Date()) => {
        const current = get();
        const todayKey = formatDateKey(now);
        const currentFedSlots = normalizeDailyFedSlots(
          current.fedSlotsToday,
          current.needsResetDate,
          todayKey,
        );
        const currentPetCount = normalizeDailyPetCount(
          current.petCountToday,
          current.needsResetDate,
          todayKey,
        );

        const eligibility = evaluateFeedEligibility(currentFedSlots, now);
        if (!eligibility.canFeed || !eligibility.currentSlot) {
          return {
            success: false,
            error: eligibility.reason ?? "FEED_BLOCKED",
            message: eligibility.message,
          };
        }

        if (current.coins < cost) {
          return {
            success: false,
            error: "INSUFFICIENT_COINS",
            message: "Koin tidak cukup! Butuh minimal 5 koin untuk memberi makan.",
          };
        }

        const newCoins = current.coins - cost;
        const updatedFedSlots: MainMealSlot[] = [
          ...currentFedSlots,
          eligibility.currentSlot,
        ].slice(0, MAX_DAILY_FEEDS);
        const newHunger = Math.min(
          PET_CONFIG.MAX_HUNGER,
          Math.round((updatedFedSlots.length / MAX_DAILY_FEEDS) * 100),
        );
        const newHappiness = Math.min(
          PET_CONFIG.MAX_HAPPINESS,
          current.happiness + 15,
        );
        const nowIso = now.toISOString();

        set({
          coins: newCoins,
          hunger: newHunger,
          happiness: newHappiness,
          lastFedAt: nowIso,
          fedSlotsToday: updatedFedSlots,
          petCountToday: currentPetCount,
          needsResetDate: todayKey,
          moodStatus: "happy",
          animationState: "eating",
        });

        setTimeout(() => {
          set({ animationState: "happy" });
          setTimeout(() => {
            set({ animationState: "idle" });
          }, 1800);
        }, 1500);

        return {
          success: true,
          slot: eligibility.currentSlot,
        };
      },

      checkAndApplyDecay: () => {
        const { lastFedAt, exp, level, moodStatus } = get();
        const evaluation = evaluatePetCondition({
          lastFedAt,
          exp,
          level,
          moodStatus,
        });

        if (evaluation.isComplaining) {
          set({
            moodStatus: "complaining",
            exp: evaluation.adjustedExp,
          });
        } else if (moodStatus === "complaining") {
          set({
            moodStatus: "happy",
          });
        }

        return evaluation;
      },

      petInteract: (loggedMainMealsToday = [], now = new Date()) => {
        const current = get();
        const todayKey = formatDateKey(now);
        const currentPetCount = normalizeDailyPetCount(
          current.petCountToday,
          current.needsResetDate,
          todayKey,
        );
        const currentFedSlots = normalizeDailyFedSlots(
          current.fedSlotsToday,
          current.needsResetDate,
          todayKey,
        );

        const eligibility = evaluatePetEligibility(
          currentPetCount,
          loggedMainMealsToday,
        );

        if (!eligibility.canPet) {
          return {
            success: false,
            error: eligibility.reason ?? "PET_BLOCKED",
            message: eligibility.message,
            petCountToday: currentPetCount,
          };
        }

        const nextPetCount = Math.min(MAX_DAILY_PETS, currentPetCount + 1);
        const newHappiness = Math.min(
          PET_CONFIG.MAX_HAPPINESS,
          Math.max(
            current.happiness,
            Math.round((nextPetCount / MAX_DAILY_PETS) * 100),
          ),
        );

        set({
          happiness: newHappiness,
          petCountToday: nextPetCount,
          fedSlotsToday: currentFedSlots,
          needsResetDate: todayKey,
          lastPettedAt: now.toISOString(),
          animationState: "happy",
        });

        get().gainExp(10);

        setTimeout(() => {
          set({ animationState: "idle" });
        }, 2000);

        return {
          success: true,
          petCountToday: nextPetCount,
        };
      },

      toggleSleep: () => {
        const current = get();
        const nextState =
          current.animationState === "sleeping" ? "idle" : "sleeping";
        set({ animationState: nextState });
      },

      gainExp: (amount: number) => {
        set((state) => {
          let newExp = state.exp + amount;
          let newLevel = state.level;
          let newStage = state.stage;

          const expNeeded = Math.round(
            PET_CONFIG.EXP_BASE *
              Math.pow(PET_CONFIG.EXP_MULTIPLIER, newLevel - 1),
          );

          if (newExp >= expNeeded) {
            newLevel += 1;
            newExp = newExp - expNeeded;

            // Stage evolution check
            if (newLevel >= 30)
              newStage = 5; // Mythic
            else if (newLevel >= 15)
              newStage = 4; // Adult
            else if (newLevel >= 7)
              newStage = 3; // Juvenile
            else if (newLevel >= 3) newStage = 2; // Hatchling
          }

          return {
            exp: newExp,
            level: newLevel,
            stage: newStage,
          };
        });
      },

      addCoins: (amount: number) =>
        set((state) => ({ coins: Math.max(0, state.coins + amount) })),

      setCoins: (amount: number) => set({ coins: Math.max(0, amount) }),

      setAnimationState: (animationState: PetAnimationState) =>
        set({ animationState }),
      setPetName: (name: string) => set({ name }),
      setSpecies: (species: PetSpeciesId) =>
        set({
          species,
          customColors: {},
          earsVariant: undefined,
          tailVariant: undefined,
          faceVariant: undefined,
        }),

      setCustomColors: (colors: Partial<CharacterColorPalette>) =>
        set((state) => ({
          customColors: {
            ...state.customColors,
            ...colors,
          },
        })),

      applyColorPalette: (paletteId: CharacterId) => {
        const palette = CHARACTER_COLOR_PALETTES[paletteId];
        if (!palette) return;
        set({
          customColors: {
            primary: palette.primary,
            secondary: palette.secondary,
            belly: palette.belly,
            innerEar: palette.innerEar,
            blush: palette.blush,
          },
        });
      },

      resetCustomColors: () => set({ customColors: {} }),

      setEarsVariant: (earsVariant?: CharacterId) => set({ earsVariant }),
      setTailVariant: (tailVariant?: CharacterId) => set({ tailVariant }),
      setFaceVariant: (faceVariant?: CharacterId) => set({ faceVariant }),

      resetCharacterCustomization: () =>
        set({
          customColors: {},
          earsVariant: undefined,
          tailVariant: undefined,
          faceVariant: undefined,
        }),
    }),
    {
      name: "caloria-pet-storage",
    },
  ),
);
