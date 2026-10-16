import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  profiles,
  pets,
  foodLogs,
  userStreaks,
  coopParties,
  coopMembers,
} from "@/db/schema";
import { MealTypeId, PetSpeciesId } from "@/lib/constants";

// Database Model Types
export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

export type Pet = InferSelectModel<typeof pets>;
export type NewPet = InferInsertModel<typeof pets>;

export type FoodLog = InferSelectModel<typeof foodLogs>;
export type NewFoodLog = InferInsertModel<typeof foodLogs>;

export type UserStreak = InferSelectModel<typeof userStreaks>;
export type NewUserStreak = InferInsertModel<typeof userStreaks>;

export type CoopParty = InferSelectModel<typeof coopParties>;
export type NewCoopParty = InferInsertModel<typeof coopParties>;

export type CoopMember = InferSelectModel<typeof coopMembers>;
export type NewCoopMember = InferInsertModel<typeof coopMembers>;

// Nutrition & Macro Types
export interface MacroTargets {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  waterMl?: number;
}

export interface MacroCurrent {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyNutritionSummary {
  date: string;
  consumed: MacroCurrent;
  target: MacroTargets;
  percentage: number;
  logs: FoodLog[];
}

export interface FoodItemInput {
  name: string;
  mealType: MealTypeId;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize?: number;
  servingUnit?: string;
}

// Pet Types
export type PetAnimationState = "idle" | "eating" | "happy" | "sleeping" | "sad";

export interface PetStats {
  name: string;
  species: PetSpeciesId;
  stage: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  hunger: number; // 0 - 100
  happiness: number; // 0 - 100
  health: number; // 0 - 100
  status: PetAnimationState;
}

// Co-op Streak Types
export interface CoopMemberWithProfile extends CoopMember {
  profile: Pick<Profile, "id" | "username" | "fullName" | "avatarUrl">;
}

export interface CoopPartyDetails extends CoopParty {
  members: CoopMemberWithProfile[];
}
