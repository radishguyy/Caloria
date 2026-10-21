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
  coinsEarned: number;
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
  let coinsEarned = 10;
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
    coinsEarned += 5;
    feedbackType = "success";
    title = "Misi Asupan Protein Ideal!";
    message = `Menu ${foodName} menyumbang ${foodProteinG}g Protein! Kamu sudah memenuhi ${Math.min(100, proteinPercent)}% misi protein harian untuk program ${goalType.toUpperCase()}-mu (+Bonus XP!).`;
  }

  // 2. Daily Goal Jackpot
  if (caloriePercent >= 90 && caloriePercent <= 110) {
    isDailyJackpot = true;
    baseXp += 30;
    coinsEarned += 20;
    feedbackType = "success";
    title = "Jackpot Kalori Tercapai!";
    message = `Luar biasa! Asupan kalori harianmu (${newTotalCalories} kkal) tepat berada di zona ideal program ${goalType.toUpperCase()}. Jackpot XP dan Caloria Coins ditambahkan!`;
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

    // Check stage evolution
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
    coinsEarned,
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

