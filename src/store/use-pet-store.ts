import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PetAnimationState } from "@/types";
import { PET_CONFIG, PetSpeciesId } from "@/lib/constants";

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

  // Actions
  feedPet: (caloriesFed?: number, xpReward?: number, coinReward?: number) => void;
  petInteract: () => void;
  toggleSleep: () => void;
  gainExp: (amount: number) => void;
  addCoins: (amount: number) => void;
  setAnimationState: (state: PetAnimationState) => void;
  setPetName: (name: string) => void;
  setSpecies: (species: PetSpeciesId) => void;

  // Helpers
  getExpNeededForNextLevel: () => number;
}

export const usePetStore = create<PetStoreState>()(
  persist(
    (set, get) => ({
      name: "Pyro",
      species: "flameling",
      stage: 2, // Hatchling
      level: 4,
      exp: 140,
      coins: 240,
      hunger: 75,
      happiness: 85,
      health: 100,
      animationState: "idle",

      getExpNeededForNextLevel: () => {
        const { level } = get();
        return Math.round(
          PET_CONFIG.EXP_BASE * Math.pow(PET_CONFIG.EXP_MULTIPLIER, level - 1)
        );
      },

      feedPet: (caloriesFed = 300, xpReward = 25, coinReward = 10) => {
        const current = get();
        const hungerGain = Math.min(30, Math.max(10, Math.round(caloriesFed / 25)));
        const newHunger = Math.min(
          PET_CONFIG.MAX_HUNGER,
          current.hunger + hungerGain
        );

        set({
          hunger: newHunger,
          coins: current.coins + coinReward,
          animationState: "eating",
        });

        get().gainExp(xpReward);

        setTimeout(() => {
          set({ animationState: "happy" });
          setTimeout(() => {
            set({ animationState: "idle" });
          }, 1800);
        }, 1500);
      },

      petInteract: () => {
        const current = get();
        const newHappiness = Math.min(
          PET_CONFIG.MAX_HAPPINESS,
          current.happiness + 15
        );

        set({
          happiness: newHappiness,
          animationState: "happy",
        });

        get().gainExp(10);

        setTimeout(() => {
          set({ animationState: "idle" });
        }, 2000);
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
            PET_CONFIG.EXP_BASE * Math.pow(PET_CONFIG.EXP_MULTIPLIER, newLevel - 1)
          );

          if (newExp >= expNeeded) {
            newLevel += 1;
            newExp = newExp - expNeeded;

            // Stage evolution check
            if (newLevel >= 30) newStage = 5; // Mythic
            else if (newLevel >= 15) newStage = 4; // Adult
            else if (newLevel >= 7) newStage = 3; // Juvenile
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

      setAnimationState: (animationState: PetAnimationState) =>
        set({ animationState }),
      setPetName: (name: string) => set({ name }),
      setSpecies: (species: PetSpeciesId) => set({ species }),
    }),
    {
      name: "caloria-pet-storage",
    }
  )
);
