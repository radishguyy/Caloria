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
  fiber?: number;  // grams
  sugar?: number;  // grams
  waterMl?: number;
}

export interface MacroCurrent {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export type GoalProgramType = "diet" | "bulking" | "maintenance";

export interface UserGoalPlan {
  goalType: GoalProgramType;
  currentWeightKg: number;
  targetWeightKg: number;
  heightCm: number;
  bmiScore: number;
  bmiCategory: "Underweight" | "Normal" | "Overweight" | "Obese";
  totalProjectedDays: number;
  currentDayNumber: number;
  dailyMarginKcal: number; // e.g. -500 for diet, +400 for bulking, 0 for maintenance
}

export interface FoodCatalogItem {
  id: string;
  name: string;
  category: string;
  calories: number; // per default serving
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  defaultServingSize: number;
  servingUnit: string;
  gramsPerUnit: number;
}

export interface ExtendedFoodLog extends FoodLog {
  fiberG?: number;
  sugarG?: number;
}

export interface DailyNutritionSummary {
  date: string;
  consumed: MacroCurrent;
  target: MacroTargets;
  percentage: number;
  logs: ExtendedFoodLog[];
}

export interface FoodItemInput {
  name: string;
  mealType: MealTypeId;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
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

// Co-op Streak & Social Types
export interface CoopMemberWithProfile extends CoopMember {
  profile: Pick<Profile, "id" | "username" | "fullName" | "avatarUrl">;
}

export interface CoopPartyDetails extends CoopParty {
  members: CoopMemberWithProfile[];
}

export interface SocialFriendMember {
  id: string;
  username: string;
  fullName: string;
  avatarColor: string;
  petName: string;
  petSpecies: PetSpeciesId;
  petLevel: number;
  goalType: GoalProgramType;
  caloriesLoggedToday: number;
  calorieTarget: number;
  mealsLoggedToday: number;
  dailyGoalMet: boolean;
  lastActiveText: string;
  lastPokedAt?: string | null;
}

export interface PokeNotification {
  id: string;
  fromUser: string;
  toUser: string;
  message: string;
  timestamp: string;
}

