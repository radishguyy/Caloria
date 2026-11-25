import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ActivityLevel, Gender } from "@/lib/nutrition-calculator";
import type { PetSpeciesId } from "@/lib/constants";
import type { GoalProgramType } from "@/types";

export interface OnboardingDemoState {
  goalType: GoalProgramType;
  dailyMarginKcal: number;
  fullName: string;
  username: string;
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  bmiScore: number;
  bmiCategory: string;
  totalProjectedDays: number;
  petSpecies: PetSpeciesId;
  petNickname: string;

  setDemoData: (partial: Partial<OnboardingDemoState>) => void;
  resetDemo: () => void;
}

const INITIAL_DEMO_DATA = {
  goalType: "diet" as GoalProgramType,
  dailyMarginKcal: -500,
  fullName: "",
  username: "",
  gender: "male" as Gender,
  age: 24,
  heightCm: 172,
  currentWeightKg: 75,
  targetWeightKg: 68,
  activityLevel: "moderate" as ActivityLevel,
  bmiScore: 25.4,
  bmiCategory: "Overweight",
  totalProjectedDays: 108,
  petSpecies: "flameling" as PetSpeciesId,
  petNickname: "Pyro",
};

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useOnboardingDemoStore = create<OnboardingDemoState>()(
  persist(
    (set) => ({
      ...INITIAL_DEMO_DATA,
      setDemoData: (partial) => set((state) => ({ ...state, ...partial })),
      resetDemo: () => set({ ...INITIAL_DEMO_DATA }),
    }),
    {
      name: "caloria-onboarding-demo",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.sessionStorage : noopStorage
      ),
    }
  )
);
