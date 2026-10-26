import {
  Profile,
  NewProfile,
  WeightLog,
  NewWeightLog,
  PlazaItem,
  NewPlazaItem,
  UserWardrobeItem,
  NewUserWardrobeItem,
  Pet,
  NewPet,
  Food,
  NewFood,
  FoodLog,
  NewFoodLog,
  DailyNutritionSummaryRecord,
  NewDailyNutritionSummaryRecord,
  Friendship,
  NewFriendship,
  CoopGroup,
  NewCoopGroup,
  CoopMember,
  NewCoopMember,
  PokeLog,
  NewPokeLog,
  Badge,
  NewBadge,
  UserBadge,
  NewUserBadge,
  PushSubscription,
  NewPushSubscription,
  NotificationRecord,
  NewNotificationRecord,
} from "@/db/schema";
import { MealTypeId, PetSpeciesId } from "@/lib/constants";

// Re-export Database Model Types
export type {
  Profile,
  NewProfile,
  WeightLog,
  NewWeightLog,
  PlazaItem,
  NewPlazaItem,
  UserWardrobeItem,
  NewUserWardrobeItem,
  Pet,
  NewPet,
  Food,
  NewFood,
  FoodLog,
  NewFoodLog,
  DailyNutritionSummaryRecord,
  NewDailyNutritionSummaryRecord,
  Friendship,
  NewFriendship,
  CoopGroup,
  NewCoopGroup,
  CoopMember,
  NewCoopMember,
  PokeLog,
  NewPokeLog,
  Badge,
  NewBadge,
  UserBadge,
  NewUserBadge,
  PushSubscription,
  NewPushSubscription,
  NotificationRecord,
  NewNotificationRecord,
};

export type CoopParty = CoopGroup;
export type NewCoopParty = NewCoopGroup;

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
  gender: "male" | "female";
  age: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  bmiScore: number;
  bmiCategory: "Underweight" | "Normal" | "Overweight" | "Obese";
  totalProjectedDays: number;
  currentDayNumber: number;
  dailyMarginKcal: number; // e.g. -500 for diet, +400 for bulking, 0 for maintenance
  startDate: string;
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

export interface ExtendedFoodLog {
  id: string;
  userId: string;
  name: string;
  mealType: MealTypeId;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  servingSize: number;
  servingUnit: string;
  loggedDate: string;
  loggedAt: Date;
  createdAt: Date;
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

export interface EquippedCosmetics {
  head: string;
  body: string;
  glasses: string;
  skin: string;
  room: string;
}

export interface PetStats {
  name: string;
  species: PetSpeciesId;
  stage: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  coins: number;
  hunger: number; // 0 - 100
  happiness: number; // 0 - 100
  health: number; // 0 - 100
  status: PetAnimationState;
  equipped: EquippedCosmetics;
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

// Weight Tracking Entry
export interface WeightLogEntry {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
}

// Notification Center
export interface AppNotification {
  id: string;
  type: "meal_reminder" | "poke" | "nutrition_eval" | "achievement";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}
