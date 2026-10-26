export const APP_NAME = "Caloria";
export const APP_DESCRIPTION = "Aplikasi pencatat nutrisi gamifikasi dengan virtual pet dan co-op streak";

// Default Nutrition Values
export const DEFAULT_NUTRITION_TARGETS = {
  calories: 2000,
  protein: 125, // grams (25% of 2000 kcal = 500 kcal / 4)
  carbs: 250,   // grams (50% of 2000 kcal = 1000 kcal / 4)
  fat: 55,      // grams (25% of 2000 kcal = 500 kcal / 9)
  waterMl: 2500,
} as const;

// Meal Types
export const MEAL_TYPES = [
  { id: "breakfast", label: "Sarapan", icon: "Coffee", color: "text-brown", targetPercent: 0.25 },
  { id: "lunch", label: "Makan Siang", icon: "Utensils", color: "text-brand-green-dark", targetPercent: 0.35 },
  { id: "dinner", label: "Makan Malam", icon: "Moon", color: "text-brand-green", targetPercent: 0.30 },
  { id: "snack", label: "Camilan", icon: "Apple", color: "text-brand-green", targetPercent: 0.10 },
] as const;

export type MealTypeId = typeof MEAL_TYPES[number]["id"];

// Virtual Pet Constants
export const PET_SPECIES = [
  {
    id: "flameling",
    name: "Flameling",
    element: "fire",
    description: "Naga api kecil yang bersemangat membakar kalori dan memelihara metabolisme aktif.",
    color: "#f97316",
    primaryMacro: "protein",
  },
  {
    id: "bloomie",
    name: "Bloomie",
    element: "plant",
    description: "Roh hutan ceria yang menyukai sayuran segar, serat, dan mikronutrisi.",
    color: "#22c55e",
    primaryMacro: "carbs",
  },
  {
    id: "droplet",
    name: "Droplet",
    element: "water",
    description: "Makhluk air penyayang hidrasi seimbang dan menjaga lemak sehat.",
    color: "#06b6d4",
    primaryMacro: "fat",
  },
] as const;

export type PetSpeciesId = typeof PET_SPECIES[number]["id"];

export const PET_STAGES = [
  { stage: 1, name: "Egg", minLevel: 1 },
  { stage: 2, name: "Hatchling", minLevel: 3 },
  { stage: 3, name: "Juvenile", minLevel: 7 },
  { stage: 4, name: "Adult", minLevel: 15 },
  { stage: 5, name: "Mythic", minLevel: 30 },
] as const;

export const PET_CONFIG = {
  MAX_HUNGER: 100,
  MAX_HAPPINESS: 100,
  MAX_HEALTH: 100,
  HUNGER_DECAY_PER_HOUR: 3.5,
  HAPPINESS_DECAY_PER_HOUR: 2.5,
  EXP_BASE: 100,
  EXP_MULTIPLIER: 1.25,
  HUNGER_WARNING_THRESHOLD: 30,
  HAPPINESS_WARNING_THRESHOLD: 30,
} as const;

// Gamification & Streak Rules
export const STREAK_RULES = {
  MIN_LOGS_PER_DAY: 1,
  MIN_CALORIE_PERCENTAGE: 70, // Minimal 70% dari target harian agar streak dihitung
  COOP_MAX_MEMBERS: 5,
  DEFAULT_FREEZE_COUNT: 2,
  EXP_PER_FOOD_LOG: 20,
  EXP_PER_DAILY_GOAL: 100,
  EXP_PER_COOP_BONUS: 50,
} as const;

// Navigation items
export const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: "Home" },
  { href: "/diary", label: "Catatan Makanan", icon: "UtensilsCrossed" },
  { href: "/pet", label: "Pet Virtual", icon: "Sparkles" },
  { href: "/social", label: "Co-op Streak", icon: "Users" },
] as const;
