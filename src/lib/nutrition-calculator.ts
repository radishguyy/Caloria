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
  customMarginKcal?: number;
}

export interface BmiGoalRecommendation {
  recommendedGoal: GoalProgramType;
  label: string;
  reason: string;
}

export interface PaceOption {
  id: string;
  label: string;
  description: string;
  marginKcal: number;
}

export const GOAL_PACE_OPTIONS: Record<"diet" | "bulking", PaceOption[]> = {
  diet: [
    {
      id: "diet_relaxed",
      label: "Santai",
      description: "~0,25 kg/minggu · lebih fleksibel",
      marginKcal: -250,
    },
    {
      id: "diet_standard",
      label: "Standar",
      description: "~0,5 kg/minggu · seimbang & efektif",
      marginKcal: -500,
    },
  ],
  bulking: [
    {
      id: "bulking_lean",
      label: "Lean Bulk",
      description: "~0,25 kg/minggu · minim lemak",
      marginKcal: 250,
    },
    {
      id: "bulking_standard",
      label: "Standar",
      description: "~0,35 kg/minggu · progres lebih cepat",
      marginKcal: 400,
    },
  ],
};

/**
 * Recommends a goal program based on BMI category (soft guidance, not a hard lock)
 */
export function recommendGoalFromBmi(
  bmiCategory: BmiAnalysis["category"] | string
): BmiGoalRecommendation {
  switch (bmiCategory) {
    case "Underweight":
      return {
        recommendedGoal: "bulking",
        label: "Naik Massa Otot",
        reason:
          "BMI kamu di bawah rentang normal. Surplus kalori sehat membantu mencapai berat ideal dan menambah massa otot.",
      };
    case "Overweight":
      return {
        recommendedGoal: "diet",
        label: "Turun Berat Badan",
        reason:
          "BMI kamu sedikit di atas rentang normal. Defisit kalori terukur membantu kembali ke berat badan sehat.",
      };
    case "Obese":
    case "Obese I":
    case "Obese II":
      return {
        recommendedGoal: "diet",
        label: "Turun Berat Badan",
        reason:
          "BMI kamu berada di kategori obesitas. Defisit kalori bertahap dan konsisten sangat disarankan untuk kesehatan.",
      };
    case "Normal":
    default:
      return {
        recommendedGoal: "maintenance",
        label: "Jaga Berat Badan",
        reason:
          "BMI kamu sudah di rentang normal. Fokus menjaga keseimbangan kalori dan pola makan sehat.",
      };
  }
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
  isCalorieFloorApplied?: boolean;
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

export interface GoalCompletionStatus {
  isReached: boolean;
  reason: "weight_reached" | "duration_completed" | null;
  summaryText: string;
}

/**
 * Evaluates whether the user's active goal target (weight or projected cycle) has been reached.
 */
export function evaluateGoalCompletion(params: {
  goalType: GoalProgramType;
  currentWeightKg: number;
  targetWeightKg: number;
  currentDayNumber?: number;
  totalProjectedDays?: number;
}): GoalCompletionStatus {
  const {
    goalType,
    currentWeightKg,
    targetWeightKg,
    currentDayNumber = 1,
    totalProjectedDays = 30,
  } = params;

  if (currentWeightKg <= 0 || targetWeightKg <= 0) {
    return { isReached: false, reason: null, summaryText: "" };
  }

  if (goalType === "diet" && currentWeightKg <= targetWeightKg) {
    return {
      isReached: true,
      reason: "weight_reached",
      summaryText: `Berat badanmu (${currentWeightKg} kg) sudah mencapai target ${targetWeightKg} kg!`,
    };
  }

  if (goalType === "bulking" && currentWeightKg >= targetWeightKg) {
    return {
      isReached: true,
      reason: "weight_reached",
      summaryText: `Berat badanmu (${currentWeightKg} kg) sudah mencapai target ${targetWeightKg} kg!`,
    };
  }

  if (totalProjectedDays > 0 && currentDayNumber >= totalProjectedDays) {
    return {
      isReached: true,
      reason: "duration_completed",
      summaryText:
        goalType === "maintenance"
          ? `Siklus jaga berat badan ${totalProjectedDays} hari telah selesai!`
          : `Durasi program ${totalProjectedDays} hari telah selesai!`,
    };
  }

  return { isReached: false, reason: null, summaryText: "" };
}

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

  const safeDailyMargin = Math.max(100, Math.abs(dailyMarginKcal));
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
  let isCalorieFloorApplied = false;

  if (profile.goalType === "diet") {
    const requestedMargin =
      typeof profile.customMarginKcal === "number" && profile.customMarginKcal < 0
        ? Math.max(-750, Math.min(-150, Math.round(profile.customMarginKcal)))
        : -500;
    // Safe floor: minimum 1200 kcal for females, 1500 kcal for males
    const minCalories = profile.gender === "female" ? 1200 : 1500;
    const rawTarget = tdee + requestedMargin;
    if (rawTarget < minCalories) {
      dailyCalories = minCalories;
      isCalorieFloorApplied = true;
    } else {
      dailyCalories = rawTarget;
    }
    dailyMarginKcal = Math.min(0, dailyCalories - tdee);
  } else if (profile.goalType === "bulking") {
    const requestedMargin =
      typeof profile.customMarginKcal === "number" && profile.customMarginKcal > 0
        ? Math.min(750, Math.max(150, Math.round(profile.customMarginKcal)))
        : 400;
    dailyMarginKcal = requestedMargin;
    dailyCalories = tdee + dailyMarginKcal;
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
    isCalorieFloorApplied,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    waterMl,
    projectedDays,
  };
}

