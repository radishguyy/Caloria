/**
 * Caloria Nutrition & Physical Calculation Engine
 * 
 * Standardized formulas:
 * - BMI: weight (kg) / (height (m))^2
 * - BMR (Mifflin-St Jeor):
 *     Men: 10 * weight (kg) + 6.25 * height (cm) - 5 * age + 5
 *     Women: 10 * weight (kg) + 6.25 * height (cm) - 5 * age - 161
 * - TDEE: BMR * Activity Multiplier
 * - Daily Calorie Target by Goal:
 *     Diet: TDEE - 500 kcal (~0.5 kg loss/week, min 1200 kcal)
 *     Bulking: TDEE + 350 to 500 kcal (~0.3-0.5 kg gain/week)
 *     Maintenance: TDEE
 * - Timeline Projection (N Days):
 *     Fat energy equivalent ~ 7700 kcal/kg
 *     Days = ceil((abs(targetWeight - currentWeight) * 7700) / abs(dailyMargin))
 */

import { GoalProgramType } from "@/types";

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface PhysicalProfileInput {
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalProgramType;
}

export interface BmiAnalysis {
  score: number;
  category: "Underweight" | "Normal" | "Overweight" | "Obese";
  healthyWeightRange: { min: number; max: number };
}

export interface NutritionTargetPlan {
  bmi: BmiAnalysis;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  dailyMarginKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  waterMl: number;
  projectedDays: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; multiplier: number }> = {
  sedentary: { label: "Sedentary (Jarang / Tidak Berolahraga)", multiplier: 1.2 },
  light: { label: "Ringan (Olahraga 1-3 hari/minggu)", multiplier: 1.375 },
  moderate: { label: "Sedang (Olahraga 3-5 hari/minggu)", multiplier: 1.55 },
  active: { label: "Aktif (Olahraga 6-7 hari/minggu)", multiplier: 1.725 },
  very_active: { label: "Sangat Aktif (Latihan berat 2x sehari / Pekerja fisik)", multiplier: 1.9 },
};

/**
 * Calculates Body Mass Index and categorized status
 */
export function calculateBmi(heightCm: number, weightKg: number): BmiAnalysis {
  if (heightCm <= 0 || weightKg <= 0) {
    return { score: 0, category: "Normal", healthyWeightRange: { min: 50, max: 70 } };
  }
  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const score = Math.round(rawBmi * 10) / 10;

  let category: BmiAnalysis["category"] = "Normal";
  if (score < 18.5) category = "Underweight";
  else if (score < 25.0) category = "Normal";
  else if (score < 30.0) category = "Overweight";
  else category = "Obese";

  // Healthy BMI range 18.5 - 24.9
  const minHealthy = Math.round(18.5 * heightM * heightM * 10) / 10;
  const maxHealthy = Math.round(24.9 * heightM * heightM * 10) / 10;

  return {
    score,
    category,
    healthyWeightRange: { min: minHealthy, max: maxHealthy },
  };
}

/**
 * Calculates Basal Metabolic Rate using Mifflin-St Jeor formula
 */
export function calculateBmr(
  gender: Gender,
  age: number,
  heightCm: number,
  weightKg: number
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 1500;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

/**
 * Calculates Total Daily Energy Expenditure
 */
export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel]?.multiplier ?? 1.375;
  return Math.round(bmr * mult);
}

/**
 * Calculates N-day mission projection based on safe caloric margins
 */
export function calculateMissionProjection(
  currentWeightKg: number,
  targetWeightKg: number,
  goalType: GoalProgramType,
  dailyMarginKcal: number
): number {
  const weightDiff = Math.abs(currentWeightKg - targetWeightKg);
  if (goalType === "maintenance" || weightDiff < 0.2) {
    return 30; // standard 30-day maintenance habit cycle
  }

  const safeDailyMargin = Math.max(200, Math.abs(dailyMarginKcal));
  // 1 kg of body mass ~ 7700 kcal
  const totalKcalRequired = weightDiff * 7700;
  const estimatedDays = Math.ceil(totalKcalRequired / safeDailyMargin);

  // Return realistic bounded days (min 7 days, max 365 days)
  return Math.min(365, Math.max(7, estimatedDays));
}

/**
 * Generates a complete personalized nutrition & macro target plan
 */
export function generateNutritionPlan(profile: PhysicalProfileInput): NutritionTargetPlan {
  const bmi = calculateBmi(profile.heightCm, profile.currentWeightKg);
  const bmr = calculateBmr(profile.gender, profile.age, profile.heightCm, profile.currentWeightKg);
  const tdee = calculateTdee(bmr, profile.activityLevel);

  let dailyMarginKcal = 0;
  let dailyCalories = tdee;

  if (profile.goalType === "diet") {
    dailyMarginKcal = -500;
    // Safe floor: minimum 1200 kcal for females, 1500 kcal for males
    const minCalories = profile.gender === "female" ? 1200 : 1500;
    dailyCalories = Math.max(minCalories, tdee - 500);
  } else if (profile.goalType === "bulking") {
    dailyMarginKcal = 400;
    dailyCalories = tdee + 400;
  } else {
    dailyMarginKcal = 0;
    dailyCalories = tdee;
  }

  const projectedDays = calculateMissionProjection(
    profile.currentWeightKg,
    profile.targetWeightKg,
    profile.goalType,
    dailyMarginKcal
  );

  // Macronutrient split:
  // Diet: 30% Protein, 45% Carbs, 25% Fat
  // Bulking: 25% Protein, 55% Carbs, 20% Fat
  // Maintenance: 25% Protein, 50% Carbs, 25% Fat
  let proteinRatio = 0.25;
  let carbsRatio = 0.50;
  let fatRatio = 0.25;

  if (profile.goalType === "diet") {
    proteinRatio = 0.30;
    carbsRatio = 0.45;
    fatRatio = 0.25;
  } else if (profile.goalType === "bulking") {
    proteinRatio = 0.25;
    carbsRatio = 0.55;
    fatRatio = 0.20;
  }

  const proteinG = Math.round((dailyCalories * proteinRatio) / 4);
  const carbsG = Math.round((dailyCalories * carbsRatio) / 4);
  const fatG = Math.round((dailyCalories * fatRatio) / 9);

  // Fiber recommendation: ~14g per 1000 kcal
  const fiberG = Math.round((dailyCalories / 1000) * 14);
  // Sugar recommendation: < 10% of total calories
  const sugarG = Math.round((dailyCalories * 0.10) / 4);

  // Hydration: ~35ml per kg of body weight
  const waterMl = Math.round(profile.currentWeightKg * 35);

  return {
    bmi,
    bmr,
    tdee,
    dailyCalories,
    dailyMarginKcal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    waterMl,
    projectedDays,
  };
}

