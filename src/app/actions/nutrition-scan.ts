"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  foods,
  foodLogs,
  dailyNutritionSummaries,
  pets,
  profiles,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface LogScannedNutritionInput {
  foodName: string;
  servingSize: number | null;
  servingUnit: string;
  servingsConsumed: number;
  mealTime: "breakfast" | "lunch" | "dinner" | "snack";
  perServing: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
  };
  saveToCatalog: boolean;
}

export interface LogScannedNutritionResult {
  success: boolean;
  persistedToDb: boolean;
  foodId?: string | null;
  logId?: string;
  baseXpEarned: number;
  calculated: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  error?: string;
}

export async function logScannedNutritionAction(
  input: LogScannedNutritionInput
): Promise<LogScannedNutritionResult> {
  const mult = Math.max(0.01, input.servingsConsumed);
  const calculated = {
    calories: Math.round(input.perServing.caloriesKcal * mult * 100) / 100,
    protein: Math.round(input.perServing.proteinG * mult * 100) / 100,
    carbs: Math.round(input.perServing.carbsG * mult * 100) / 100,
    fat: Math.round(input.perServing.fatG * mult * 100) / 100,
    fiber: Math.round(input.perServing.fiberG * mult * 100) / 100,
    sugar: Math.round(input.perServing.sugarG * mult * 100) / 100,
  };

  const baseXpEarned = 10;
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      // Unauthenticated / local guest session fallback:
      // Still revalidate paths and return calculated macros so client store updates seamlessly
      revalidatePath("/diary");
      revalidatePath("/dashboard");
      return {
        success: true,
        persistedToDb: false,
        foodId: null,
        baseXpEarned,
        calculated,
      };
    }

    const userId = user.id;
    let savedFoodId: string | null = null;

    // 1. Optional: Save to `foods` catalog
    if (input.saveToCatalog) {
      const [insertedFood] = await db
        .insert(foods)
        .values({
          name: input.foodName.trim() || "Scanned Food",
          servingSizeDefault: String(input.servingSize ?? 100),
          servingUnit: input.servingUnit.trim() || "g",
          caloriesKcal: String(input.perServing.caloriesKcal),
          proteinG: String(input.perServing.proteinG),
          carbsG: String(input.perServing.carbsG),
          fatG: String(input.perServing.fatG),
          fiberG: String(input.perServing.fiberG),
          sugarG: String(input.perServing.sugarG),
          isVerified: false,
        })
        .returning({ id: foods.id });

      savedFoodId = insertedFood?.id ?? null;
    }

    // 2. Insert into `food_logs`
    const [insertedLog] = await db
      .insert(foodLogs)
      .values({
        userId,
        foodId: savedFoodId,
        customFoodName: input.foodName.trim() || "Scanned Food",
        mealTime: input.mealTime,
        logDate: todayStr,
        servingQuantity: String(mult),
        calculatedCalories: String(calculated.calories),
        calculatedProtein: String(calculated.protein),
        calculatedCarbs: String(calculated.carbs),
        calculatedFat: String(calculated.fat),
        calculatedFiber: String(calculated.fiber),
        calculatedSugar: String(calculated.sugar),
        baseXpEarned,
      })
      .returning({ id: foodLogs.id });

    // 3. Upsert / increment `daily_nutrition_summaries` for today
    const [userProfile] = await db
      .select({
        targetCaloriesKcal: profiles.targetCaloriesKcal,
        targetProteinG: profiles.targetProteinG,
        targetCarbsG: profiles.targetCarbsG,
        targetFatG: profiles.targetFatG,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const targetCalories = userProfile?.targetCaloriesKcal ?? 2000;
    const targetProtein = userProfile?.targetProteinG ?? "125.00";
    const targetCarbs = userProfile?.targetCarbsG ?? "250.00";
    const targetFat = userProfile?.targetFatG ?? "55.00";

    await db
      .insert(dailyNutritionSummaries)
      .values({
        userId,
        summaryDate: todayStr,
        totalCalories: String(calculated.calories),
        totalProtein: String(calculated.protein),
        totalCarbs: String(calculated.carbs),
        totalFat: String(calculated.fat),
        targetCalories,
        targetProtein: String(targetProtein),
        targetCarbs: String(targetCarbs),
        targetFat: String(targetFat),
        baseXpTotal: baseXpEarned,
      })
      .onConflictDoUpdate({
        target: [
          dailyNutritionSummaries.userId,
          dailyNutritionSummaries.summaryDate,
        ],
        set: {
          totalCalories: sql`${dailyNutritionSummaries.totalCalories} + ${String(
            calculated.calories
          )}::numeric`,
          totalProtein: sql`${dailyNutritionSummaries.totalProtein} + ${String(
            calculated.protein
          )}::numeric`,
          totalCarbs: sql`${dailyNutritionSummaries.totalCarbs} + ${String(
            calculated.carbs
          )}::numeric`,
          totalFat: sql`${dailyNutritionSummaries.totalFat} + ${String(
            calculated.fat
          )}::numeric`,
          baseXpTotal: sql`${dailyNutritionSummaries.baseXpTotal} + ${baseXpEarned}`,
          updatedAt: new Date(),
        },
      });

    // 4. Increment user's pet XP by 10 (`current_xp`)
    await db
      .update(pets)
      .set({
        currentXp: sql`${pets.currentXp} + ${baseXpEarned}`,
        updatedAt: new Date(),
      })
      .where(eq(pets.userId, userId));

    // 5. Revalidate paths
    revalidatePath("/diary");
    revalidatePath("/dashboard");

    return {
      success: true,
      persistedToDb: true,
      foodId: savedFoodId,
      logId: insertedLog?.id,
      baseXpEarned,
      calculated,
    };
  } catch (error) {
    console.error("[logScannedNutritionAction Error]:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to log scanned nutrition entry.";
    return {
      success: false,
      persistedToDb: false,
      baseXpEarned,
      calculated,
      error: message,
    };
  }
}

