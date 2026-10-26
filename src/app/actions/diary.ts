"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  foodLogs,
  dailyNutritionSummaries,
  foods,
  pets,
  profiles,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface LogFoodItemInput {
  name: string;
  mealTime?: "breakfast" | "lunch" | "dinner" | "snack";
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  servingSize?: number;
  servingUnit?: string;
  foodId?: string | null;
}

export interface DiaryActionResult {
  success: boolean;
  error?: string;
  logIds?: string[];
  totalXpEarned?: number;
}

/**
 * Batch log multiple food items directly to PostgreSQL `food_logs` table,
 * update today's `daily_nutrition_summaries`, and award pet XP.
 */
export async function batchLogFoodsAction(
  items: LogFoodItemInput[],
  logDate: string
): Promise<DiaryActionResult> {
  if (!items || items.length === 0) {
    return { success: false, error: "Tidak ada makanan yang dipilih." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Harap login terlebih dahulu untuk mencatat makanan." };
    }

    const userId = user.id;
    const targetDate = logDate || new Date().toISOString().split("T")[0];

    // Compute aggregated batch totals
    let sumCalories = 0;
    let sumProtein = 0;
    let sumCarbs = 0;
    let sumFat = 0;
    let sumXp = 0;

    const rowsToInsert = items.map((item) => {
      const cal = item.calories || 0;
      const prot = item.proteinG || 0;
      const carb = item.carbsG || 0;
      const fat = item.fatG || 0;
      const fiber = item.fiberG || 0;
      const sugar = item.sugarG || 0;
      const xp = 10; // 10 base XP per logged item

      sumCalories += cal;
      sumProtein += prot;
      sumCarbs += carb;
      sumFat += fat;
      sumXp += xp;

      const targetMealTime = (item.mealTime || item.mealType || "snack") as
        | "breakfast"
        | "lunch"
        | "dinner"
        | "snack";

      return {
        userId,
        foodId: item.foodId || null,
        customFoodName: item.name,
        mealTime: targetMealTime,
        logDate: targetDate,
        servingQuantity: String(item.servingSize || 1),
        calculatedCalories: String(cal),
        calculatedProtein: String(prot),
        calculatedCarbs: String(carb),
        calculatedFat: String(fat),
        calculatedFiber: String(fiber),
        calculatedSugar: String(sugar),
        baseXpEarned: xp,
      };
    });

    // 1. Insert into `food_logs`
    const inserted = await db.insert(foodLogs).values(rowsToInsert).returning({ id: foodLogs.id });
    const logIds = inserted.map((r) => r.id);

    // 2. Fetch user target macros from `profiles`
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

    // 3. Upsert into `daily_nutrition_summaries`
    await db
      .insert(dailyNutritionSummaries)
      .values({
        userId,
        summaryDate: targetDate,
        totalCalories: String(sumCalories),
        totalProtein: String(sumProtein),
        totalCarbs: String(sumCarbs),
        totalFat: String(sumFat),
        targetCalories,
        targetProtein: String(targetProtein),
        targetCarbs: String(targetCarbs),
        targetFat: String(targetFat),
        baseXpTotal: sumXp,
      })
      .onConflictDoUpdate({
        target: [
          dailyNutritionSummaries.userId,
          dailyNutritionSummaries.summaryDate,
        ],
        set: {
          totalCalories: sql`${dailyNutritionSummaries.totalCalories} + ${String(sumCalories)}::numeric`,
          totalProtein: sql`${dailyNutritionSummaries.totalProtein} + ${String(sumProtein)}::numeric`,
          totalCarbs: sql`${dailyNutritionSummaries.totalCarbs} + ${String(sumCarbs)}::numeric`,
          totalFat: sql`${dailyNutritionSummaries.totalFat} + ${String(sumFat)}::numeric`,
          baseXpTotal: sql`${dailyNutritionSummaries.baseXpTotal} + ${sumXp}`,
          updatedAt: new Date(),
        },
      });

    // 4. Increment Pet XP
    await db
      .update(pets)
      .set({
        currentXp: sql`${pets.currentXp} + ${sumXp}`,
        updatedAt: new Date(),
      })
      .where(eq(pets.userId, userId));

    revalidatePath("/diary");
    revalidatePath("/dashboard");

    return {
      success: true,
      logIds,
      totalXpEarned: sumXp,
    };
  } catch (error) {
    console.error("[batchLogFoodsAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan makanan ke database.",
    };
  }
}

/**
 * Delete a food log entry from `food_logs` and decrement macros in `daily_nutrition_summaries`
 */
export async function deleteFoodLogAction(logId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Find the log first to know what macros to subtract
    const [targetLog] = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.id, logId), eq(foodLogs.userId, user.id)))
      .limit(1);

    if (!targetLog) {
      return { success: false, error: "Catatan makanan tidak ditemukan." };
    }

    // Delete log
    await db.delete(foodLogs).where(eq(foodLogs.id, logId));

    // Decrement from summary
    await db
      .update(dailyNutritionSummaries)
      .set({
        totalCalories: sql`GREATEST(0, ${dailyNutritionSummaries.totalCalories} - ${targetLog.calculatedCalories}::numeric)`,
        totalProtein: sql`GREATEST(0, ${dailyNutritionSummaries.totalProtein} - ${targetLog.calculatedProtein}::numeric)`,
        totalCarbs: sql`GREATEST(0, ${dailyNutritionSummaries.totalCarbs} - ${targetLog.calculatedCarbs}::numeric)`,
        totalFat: sql`GREATEST(0, ${dailyNutritionSummaries.totalFat} - ${targetLog.calculatedFat}::numeric)`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dailyNutritionSummaries.userId, user.id),
          eq(dailyNutritionSummaries.summaryDate, targetLog.logDate)
        )
      );

    revalidatePath("/diary");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[deleteFoodLogAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus log makanan.",
    };
  }
}

/**
 * Fetch logs for a given date for the logged-in user
 */
export async function fetchUserDiaryLogsAction(dateStr: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: [] };
    }

    const logs = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, user.id), eq(foodLogs.logDate, dateStr)))
      .orderBy(foodLogs.createdAt);

    return { success: true, data: logs };
  } catch (error) {
    console.error("[fetchUserDiaryLogsAction Error]:", error);
    return { success: false, data: [] };
  }
}

