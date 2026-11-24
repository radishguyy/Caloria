/**
 * Caloria XP & Reward Engine
 * 
 * Rules:
 * - Base XP: Awarded per meal log (+20 to +25 XP)
 * - Bonus Multiplier XP: 1.5x multiplier when meal supports protein target (>= 20g protein)
 *   or when macros are well balanced.
 * - Daily Jackpot: Awarded when closing the day within +/- 10% of calorie target
 *   (+50 XP and +25 Caloria Coins).
 * - Pet Level Thresholds: Level * 100 XP (with 1.25x scaling).
 * - Pet Stage Evolution:
 *     Stage 1: Egg (Level 1-2)
 *     Stage 2: Hatchling (Level 3-6)
 *     Stage 3: Juvenile (Level 7-14)
 *     Stage 4: Adult (Level 15-29)
 *     Stage 5: Mythic (Level 30+)
 */

import { PET_CONFIG } from "@/lib/constants";

export interface RewardEvaluationResult {
  baseXp: number;
  bonusMultiplier: number;
  totalXp: number;
  isDailyJackpot: boolean;
  leveledUp: boolean;
  evolvedStage: boolean;
  newLevel: number;
  newStage: number;
  newExp: number;
  feedbackType: "success" | "warning" | "info";
  title: string;
  message: string;
}

export interface RewardEvaluationInput {
  foodName: string;
  foodCalories: number;
  foodProteinG: number;
  foodFatG: number;
  currentDailyConsumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goalType: "diet" | "bulking" | "maintenance";
  currentLevel: number;
  currentExp: number;
  currentStage: number;
}

export function evaluateFoodReward(input: RewardEvaluationInput): RewardEvaluationResult {
  const {
    foodName,
    foodCalories,
    foodProteinG,
    currentDailyConsumed,
    dailyTargets,
    goalType,
    currentLevel,
    currentExp,
    currentStage,
  } = input;

  let baseXp = 20;
  let bonusMultiplier = 1.0;
  let isDailyJackpot = false;
  let feedbackType: "success" | "warning" | "info" = "info";
  let title = "Catatan Makanan Tersimpan";
  let message = `${foodName} (${foodCalories} kkal) berhasil dicatat ke dalam diary. Pet kamu mendapatkan energi baru!`;

  const newTotalCalories = currentDailyConsumed.calories + foodCalories;
  const newTotalProtein = currentDailyConsumed.protein + foodProteinG;
  const caloriePercent = Math.round((newTotalCalories / dailyTargets.calories) * 100);
  const proteinPercent = Math.round((newTotalProtein / dailyTargets.protein) * 100);

  // 1. High Protein / Balanced Macro bonus
  if (foodProteinG >= 20 || proteinPercent >= 70) {
    bonusMultiplier = 1.5;
    feedbackType = "success";
    title = "Misi Asupan Protein Ideal!";
    message = `Menu ${foodName} menyumbang ${foodProteinG}g Protein! Kamu sudah memenuhi ${Math.min(100, proteinPercent)}% misi protein harian untuk program ${goalType.toUpperCase()}-mu (+Bonus XP!).`;
  }

  // 2. Daily Goal Jackpot
  if (caloriePercent >= 90 && caloriePercent <= 110) {
    isDailyJackpot = true;
    baseXp += 30;
    feedbackType = "success";
    title = "Jackpot Kalori Tercapai!";
    message = `Luar biasa! Asupan kalori harianmu (${newTotalCalories} kkal) tepat berada di zona ideal program ${goalType.toUpperCase()}. Jackpot XP ditambahkan!`;
  }

  const totalXp = Math.round(baseXp * bonusMultiplier);

  // 3. Level-up and Stage Evolution evaluation
  let exp = currentExp + totalXp;
  let level = currentLevel;
  let stage = currentStage;
  let leveledUp = false;
  let evolvedStage = false;

  const expNeeded = Math.round(
    PET_CONFIG.EXP_BASE * Math.pow(PET_CONFIG.EXP_MULTIPLIER, level - 1)
  );

  if (exp >= expNeeded) {
    level += 1;
    exp = exp - expNeeded;
    leveledUp = true;

    let targetStage = 1;
    if (level >= 30) targetStage = 5;
    else if (level >= 15) targetStage = 4;
    else if (level >= 7) targetStage = 3;
    else if (level >= 3) targetStage = 2;

    if (targetStage > stage) {
      stage = targetStage;
      evolvedStage = true;
    }
  }

  return {
    baseXp,
    bonusMultiplier,
    totalXp,
    isDailyJackpot,
    leveledUp,
    evolvedStage,
    newLevel: level,
    newStage: stage,
    newExp: exp,
    feedbackType,
    title,
    message,
  };
}

export interface BatchItemInput {
  name: string;
  category?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

export interface BatchRewardEvaluationInput {
  items: BatchItemInput[];
  mealLabel: string; // e.g. "Makan Siang"
  currentDailyConsumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goalType: "diet" | "bulking" | "maintenance";
  currentLevel: number;
  currentExp: number;
  currentStage: number;
}

export interface BatchRewardEvaluationResult extends RewardEvaluationResult {
  isComboBalanced: boolean;
  itemCount: number;
  totalBatchCalories: number;
  totalBatchProtein: number;
}

export function evaluateBatchFoodReward(input: BatchRewardEvaluationInput): BatchRewardEvaluationResult {
  const {
    items,
    mealLabel,
    currentDailyConsumed,
    dailyTargets,
    goalType,
    currentLevel,
    currentExp,
    currentStage,
  } = input;

  const itemCount = Math.max(1, items.length);
  const totalBatchCalories = items.reduce((sum, i) => sum + i.calories, 0);
  const totalBatchProtein = items.reduce((sum, i) => sum + i.proteinG, 0);
  const totalBatchCarbs = items.reduce((sum, i) => sum + i.carbsG, 0);
  const totalBatchFiber = items.reduce((sum, i) => sum + (i.fiberG ?? 0), 0);

  // 1. Base XP scaling with batch size (prevents single-log farming and rewards comprehensive logging)
  // 1 item = 25 XP; 2 items = 40 XP; 3 items = 55 XP; 4+ items = 70 XP
  const baseXp = Math.min(80, 25 + (itemCount - 1) * 15);
  let bonusMultiplier = 1.0;
  let isDailyJackpot = false;
  let isComboBalanced = false;
  let feedbackType: "success" | "warning" | "info" = "info";

  // Check Balanced Plate Combo (Protein + Carb + Veggie/Fiber)
  const hasSubstantialProtein = totalBatchProtein >= 18;
  const hasSubstantialCarbs = totalBatchCarbs >= 20;
  const hasSubstantialFiberOrVeg = totalBatchFiber >= 2.5 || items.some((i) =>
    (i.category || "").toLowerCase().includes("sayur") || (i.category || "").toLowerCase().includes("buah")
  );

  if (hasSubstantialProtein && hasSubstantialCarbs && hasSubstantialFiberOrVeg) {
    isComboBalanced = true;
    bonusMultiplier = 1.4;
    feedbackType = "success";
  } else if (hasSubstantialProtein) {
    bonusMultiplier = 1.25;
    feedbackType = "success";
  }

  const newTotalCalories = currentDailyConsumed.calories + totalBatchCalories;
  const caloriePercent = Math.round((newTotalCalories / dailyTargets.calories) * 100);

  // Daily Jackpot Check
  if (caloriePercent >= 90 && caloriePercent <= 110) {
    isDailyJackpot = true;
    feedbackType = "success";
  }

  const totalXp = Math.round(baseXp * bonusMultiplier + (isDailyJackpot ? 30 : 0));

  let title = "Menu Lengkap Berhasil Dicatat!";
  let message = `${itemCount} menu untuk ${mealLabel} (${totalBatchCalories} kkal) telah ditambahkan ke diary. Pet kamu kenyang dan bersemangat!`;

  if (isComboBalanced) {
    title = "✨ Combo Piring Seimbang!";
    message = `Hebat! Piring ${mealLabel} ini memadukan Karbohidrat, Protein (${Math.round(totalBatchProtein)}g), dan Serat sayuran. Bonus Combo Multiplier x${bonusMultiplier} diaktifkan!`;
  } else if (isDailyJackpot) {
    title = "🎰 Jackpot Kalori Harian Tercapai!";
    message = `Luar biasa! Asupan kalori harianmu (${newTotalCalories} kkal) tepat berada di zona target ideal program ${goalType.toUpperCase()}. Jackpot XP dan Koin telah diberikan!`;
  }

  // Pet Level-up and Stage Evolution evaluation
  let exp = currentExp + totalXp;
  let level = currentLevel;
  let stage = currentStage;
  let leveledUp = false;
  let evolvedStage = false;

  const expNeeded = Math.round(
    PET_CONFIG.EXP_BASE * Math.pow(PET_CONFIG.EXP_MULTIPLIER, level - 1)
  );

  if (exp >= expNeeded) {
    level += 1;
    exp = exp - expNeeded;
    leveledUp = true;

    let targetStage = 1;
    if (level >= 30) targetStage = 5;
    else if (level >= 15) targetStage = 4;
    else if (level >= 7) targetStage = 3;
    else if (level >= 3) targetStage = 2;

    if (targetStage > stage) {
      stage = targetStage;
      evolvedStage = true;
    }
  }

  return {
    baseXp,
    bonusMultiplier,
    totalXp,
    isDailyJackpot,
    isComboBalanced,
    itemCount,
    totalBatchCalories,
    totalBatchProtein,
    leveledUp,
    evolvedStage,
    newLevel: level,
    newStage: stage,
    newExp: exp,
    feedbackType,
    title,
    message,
  };
}

