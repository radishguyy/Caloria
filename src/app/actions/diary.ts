"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql, ilike, or, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  foodLogs,
  mealLogs,
  dailyNutritionSummaries,
  userMissionEvaluations,
  foods,
  pets,
  profiles,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { triggerFriendLoggedNotification } from "@/lib/server/push-service";
import { FoodCatalogItem } from "@/types";

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
 * Searches the master `foods` table in PostgreSQL using dynamic `ilike` query.
 */
export async function searchFoodsAction(query?: string): Promise<{ success: boolean; data: FoodCatalogItem[] }> {
  try {
    const trimmed = query?.trim() || "";
    let foodRows;

    if (!trimmed) {
      foodRows = await db
        .select()
        .from(foods)
        .where(eq(foods.isVerified, true))
        .limit(40);
    } else {
      foodRows = await db
        .select()
        .from(foods)
        .where(ilike(foods.name, `%${trimmed}%`))
        .limit(40);
    }

    const items: FoodCatalogItem[] = foodRows.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.brand ? `Branded / ${f.brand}` : "Makanan Umum",
      calories: Math.round(Number(f.calories || f.caloriesKcal || 0)),
      proteinG: Math.round(Number(f.protein || f.proteinG || 0) * 10) / 10,
      carbsG: Math.round(Number(f.carbs || f.carbsG || 0) * 10) / 10,
      fatG: Math.round(Number(f.fat || f.fatG || 0) * 10) / 10,
      fiberG: Math.round(Number(f.fiber || f.fiberG || 0) * 10) / 10,
      sugarG: Math.round(Number(f.sugar || f.sugarG || 0) * 10) / 10,
      defaultServingSize: Number(f.servingSize || f.servingSizeDefault || 1),
      servingUnit: f.servingUnit || "porsi",
      gramsPerUnit: Number(f.servingSize || f.servingSizeDefault || 100),
      brandOrSource: f.brand || undefined,
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error("[searchFoodsAction Error]:", error);
    return { success: false, data: [] };
  }
}

/**
 * Allows user to create a custom food item in `foods` table.
 */
export async function createCustomFoodAction(input: {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  servingSize?: number;
  servingUnit?: string;
  brand?: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [newFood] = await db
      .insert(foods)
      .values({
        name: input.name,
        brand: input.brand || null,
        servingSize: String(input.servingSize || 100),
        servingSizeDefault: String(input.servingSize || 100),
        servingUnit: input.servingUnit || "porsi",
        calories: String(input.calories),
        caloriesKcal: String(input.calories),
        protein: String(input.proteinG),
        proteinG: String(input.proteinG),
        carbs: String(input.carbsG),
        carbsG: String(input.carbsG),
        fat: String(input.fatG),
        fatG: String(input.fatG),
        fiber: String(input.fiberG || 0),
        fiberG: String(input.fiberG || 0),
        sugar: String(input.sugarG || 0),
        sugarG: String(input.sugarG || 0),
        isVerified: false,
        createdByUserId: user?.id || null,
      })
      .returning();

    return { success: true, food: newFood };
  } catch (error: any) {
    console.error("[createCustomFoodAction Error]:", error);
    return { success: false, error: error?.message || "Gagal membuat makanan kustom." };
  }
}

/**
 * Batch log multiple food items directly to PostgreSQL `food_logs` & `meal_logs` tables,
 * update today's `daily_nutrition_summaries` & `user_mission_evaluations`, and award pet stats.
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

    // 1. Insert into `food_logs` and `meal_logs`
    const inserted = await db.insert(foodLogs).values(rowsToInsert).returning({ id: foodLogs.id });
    const logIds = inserted.map((r) => r.id);

    try {
      const mealRows = items.map((item) => ({
        userId,
        foodId: item.foodId || null,
        loggedDate: targetDate,
        mealType: (item.mealTime || item.mealType || "snack") as string,
        servings: String(item.servingSize || 1),
        calculatedCalories: String(item.calories || 0),
        calculatedProtein: String(item.proteinG || 0),
        calculatedCarbs: String(item.carbsG || 0),
        calculatedFat: String(item.fatG || 0),
        customFoodName: item.name,
      }));
      await db.insert(mealLogs).values(mealRows);
    } catch (e) {
      console.warn("meal_logs mirror insert notice:", e);
    }

    // 2. Fetch user target macros from `profiles`
    const [userProfile] = await db
      .select()
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

    // 4. Upsert into `user_mission_evaluations`
    const isCalorieTargetMet = sumCalories >= targetCalories * 0.8 && sumCalories <= targetCalories * 1.15;
    try {
      await db
        .insert(userMissionEvaluations)
        .values({
          userId,
          evaluationDate: targetDate,
          totalCalories: String(sumCalories),
          totalProtein: String(sumProtein),
          totalCarbs: String(sumCarbs),
          totalFat: String(sumFat),
          isMacroCompliant: isCalorieTargetMet,
          isCalorieTargetMet,
          passedDay: isCalorieTargetMet,
          xpEarned: sumXp,
          coinsEarned: 10,
        })
        .onConflictDoUpdate({
          target: [
            userMissionEvaluations.userId,
            userMissionEvaluations.evaluationDate,
          ],
          set: {
            totalCalories: sql`${userMissionEvaluations.totalCalories} + ${String(sumCalories)}::numeric`,
            totalProtein: sql`${userMissionEvaluations.totalProtein} + ${String(sumProtein)}::numeric`,
            totalCarbs: sql`${userMissionEvaluations.totalCarbs} + ${String(sumCarbs)}::numeric`,
            totalFat: sql`${userMissionEvaluations.totalFat} + ${String(sumFat)}::numeric`,
            xpEarned: sql`${userMissionEvaluations.xpEarned} + ${sumXp}`,
            updatedAt: new Date(),
          },
        });
    } catch (e) {
      console.warn("user_mission_evaluations notice:", e);
    }

    // 5. Update Pet XP, Exp, Hunger, Coins
    await db
      .update(pets)
      .set({
        currentXp: sql`${pets.currentXp} + ${sumXp}`,
        exp: sql`${pets.exp} + ${sumXp}`,
        hunger: sql`LEAST(100, ${pets.hunger} + 25)`,
        coins: sql`${pets.coins} + 10`,
        updatedAt: new Date(),
      })
      .where(eq(pets.userId, userId));

    // 6. Update Profile streak & last_logged_date
    const prevLoggedDate = userProfile?.lastLoggedDate;
    const isNewDay = prevLoggedDate !== targetDate;
    await db
      .update(profiles)
      .set({
        lastLoggedDate: targetDate,
        caloriaCoins: sql`${profiles.caloriaCoins} + 10`,
        currentStreakDays: isNewDay
          ? sql`${profiles.currentStreakDays} + 1`
          : profiles.currentStreakDays,
        streakCount: isNewDay
          ? sql`${profiles.streakCount} + 1`
          : profiles.streakCount,
        streakConsecutiveLogs: isNewDay
          ? sql`${profiles.streakConsecutiveLogs} + 1`
          : profiles.streakConsecutiveLogs,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId));

    // 7. Trigger Peer Pressure notification
    triggerFriendLoggedNotification(userId).catch((err) => {
      console.warn("[batchLogFoodsAction] Friend event trigger notice:", err.message);
    });

    revalidatePath("/diary");
    revalidatePath("/dashboard");
    revalidatePath("/diary/archive");

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

    const [targetLog] = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.id, logId), eq(foodLogs.userId, user.id)))
      .limit(1);

    if (!targetLog) {
      return { success: false, error: "Catatan makanan tidak ditemukan." };
    }

    await db.delete(foodLogs).where(eq(foodLogs.id, logId));

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
    revalidatePath("/diary/archive");

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

/**
 * Fetches user aggregated daily nutrition summaries for a date range (for Archive view).
 */
export async function fetchUserArchiveSummariesAction(startDate: string, endDate: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: {} };
    }

    const summaries = await db
      .select()
      .from(dailyNutritionSummaries)
      .where(
        and(
          eq(dailyNutritionSummaries.userId, user.id),
          gte(dailyNutritionSummaries.summaryDate, startDate),
          lte(dailyNutritionSummaries.summaryDate, endDate)
        )
      );

    const map: Record<string, any> = {};
    for (const s of summaries) {
      map[s.summaryDate] = {
        date: s.summaryDate,
        totalCalories: Number(s.totalCalories),
        totalProtein: Number(s.totalProtein),
        totalCarbs: Number(s.totalCarbs),
        totalFat: Number(s.totalFat),
        calorieTarget: s.targetCalories,
        proteinTarget: Number(s.targetProtein),
        carbsTarget: Number(s.targetCarbs),
        fatTarget: Number(s.targetFat),
        isCalorieTargetMet: s.isCalorieTargetMet,
        isMacroBalanced: s.isMacroBalanced,
        baseXpTotal: s.baseXpTotal,
      };
    }

    return { success: true, data: map };
  } catch (error) {
    console.error("[fetchUserArchiveSummariesAction Error]:", error);
    return { success: false, data: {} };
  }
}
