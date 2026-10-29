"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/profile";
import { db } from "@/db";
import {
  profiles,
  weightLogs,
  pets,
  userWardrobe,
  plazaItems,
  userLoadouts,
  userBadges,
  foodLogs,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DEFAULT_FREE_ITEM_IDS } from "@/lib/cosmetics-catalog";
import { evaluatePetCondition } from "@/lib/pet/decay-evaluator";

/**
 * Returns the authenticated user's profile data for client-side rendering.
 * Used by the SessionProvider and any server component that needs profile info.
 */
export async function getProfileData() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  let profileRow;
  try {
    profileRow = await ensureProfileForUser({
      userId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    });
  } catch (err) {
    console.error("[getProfileData] ensureProfileForUser failed", err);
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    username: profileRow.profile.username,
    fullName: profileRow.profile.fullName,
    avatarUrl: profileRow.profile.avatarUrl,
    isOnboardingCompleted: profileRow.profile.isOnboardingCompleted,
  };
}

/**
 * Marks onboarding as complete for the current user and redirects to dashboard.
 */
export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  await db
    .update(profiles)
    .set({ isOnboardingCompleted: true, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  redirect("/dashboard");
}

/**
 * Fetches all weight logs for the authenticated user from PostgreSQL
 */
export async function fetchWeightLogsAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: [] };
    }

    const rows = await db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, user.id))
      .orderBy(weightLogs.loggedDate);

    const formatted = rows.map((r) => ({
      id: r.id,
      date: r.loggedDate,
      weightKg: Number(r.weightKg),
      notes: r.notes || "Catatan penimbangan berkala",
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error("[fetchWeightLogsAction Error]:", err);
    return { success: false, data: [] };
  }
}

/**
 * Saves or updates a weight log entry in PostgreSQL and updates profiles currentWeightKg
 */
export async function saveWeightLogAction(
  weightKg: number,
  notes?: string,
  customDate?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const targetDate = customDate || new Date().toISOString().split("T")[0];
    const weightVal = Math.round(weightKg * 10) / 10;

    // 1. Upsert weight log
    await db
      .insert(weightLogs)
      .values({
        userId: user.id,
        weightKg: String(weightVal),
        loggedDate: targetDate,
        notes: notes || "Pencatatan berat badan berkala",
      })
      .onConflictDoUpdate({
        target: [weightLogs.userId, weightLogs.loggedDate],
        set: {
          weightKg: String(weightVal),
          notes: notes || "Pencatatan berat badan berkala",
        },
      });

    // 2. Update user profile current weight
    await db
      .update(profiles)
      .set({
        currentWeightKg: String(weightVal),
        weightKg: String(weightVal),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    revalidatePath("/profile/overview");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    console.error("[saveWeightLogAction Error]:", err);
    return { success: false, error: err?.message || "Gagal menyimpan berat badan." };
  }
}

/**
 * Comprehensive application stores hydration action:
 * Fetches all persistent user data from Supabase PostgreSQL tables in one request.
 */
export async function fetchAppInitialDataAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { authenticated: false };
    }

    // 1. Fetch Profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    // 2. Fetch Pet
    const [pet] = await db
      .select()
      .from(pets)
      .where(eq(pets.userId, user.id))
      .limit(1);

    // 3. Fetch Weight Logs
    const wLogs = await db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, user.id))
      .orderBy(weightLogs.loggedDate);

    // 4. Fetch User Badges
    const uBadges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, user.id));

    // 5. Fetch User Wardrobe / Accessories
    const wardrobeRows = await db
      .select({ assetUrl: plazaItems.assetUrl })
      .from(userWardrobe)
      .innerJoin(plazaItems, eq(userWardrobe.itemId, plazaItems.id))
      .where(eq(userWardrobe.userId, user.id));

    const ownedItemIds = Array.from(
      new Set([
        ...DEFAULT_FREE_ITEM_IDS,
        ...wardrobeRows.map((r) => r.assetUrl),
      ])
    );

    // 6. Fetch User Loadout
    const [loadoutRow] = await db
      .select()
      .from(userLoadouts)
      .where(eq(userLoadouts.userId, user.id))
      .limit(1);

    // 7. Fetch Recent Food Logs (last 30 days)
    const recentLogs = await db
      .select()
      .from(foodLogs)
      .where(eq(foodLogs.userId, user.id))
      .orderBy(desc(foodLogs.createdAt))
      .limit(100);

    let petExp = pet?.exp || pet?.currentXp || 0;
    let petMood = pet?.moodStatus || "happy";
    const petLastFed = pet?.lastFedAt || pet?.createdAt || new Date();

    if (pet) {
      const condition = evaluatePetCondition({
        lastFedAt: petLastFed,
        exp: petExp,
        level: pet.level || 1,
        moodStatus: petMood,
      });

      if (condition.isComplaining) {
        petMood = "complaining";
        petExp = condition.adjustedExp;
        if (pet.moodStatus !== "complaining" || pet.exp !== condition.adjustedExp) {
          db.update(pets)
            .set({
              moodStatus: "complaining",
              exp: condition.adjustedExp,
              currentXp: condition.adjustedExp,
              updatedAt: new Date(),
            })
            .where(eq(pets.id, pet.id))
            .catch((e) => console.warn("[fetchAppInitialDataAction] pet decay update warning:", e));
        }
      }
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email || null,
        username: profile?.username || user.email?.split("@")[0] || "User",
        fullName: profile?.fullName || user.user_metadata?.full_name || null,
        avatarUrl: profile?.avatarUrl || user.user_metadata?.avatar_url || null,
        isOnboardingCompleted: profile?.isOnboardingCompleted ?? false,
      },
      profile: profile
        ? {
            heightCm: Number(profile.heightCm) || 170,
            weightKg: Number(profile.weightKg || profile.currentWeightKg) || 70,
            initialWeightKg: Number(profile.initialWeightKg) || 70,
            currentWeightKg: Number(profile.currentWeightKg) || 70,
            targetWeightKg: Number(profile.targetWeightKg) || 65,
            goal: profile.goal || "maintenance",
            goalPath: profile.goalPath || "lose_weight",
            currentLevel: profile.currentLevel || 1,
            currentWeek: profile.currentWeek || 1,
            streakCount: profile.streakCount || profile.currentStreakDays || 0,
            streakConsecutiveLogs: profile.streakConsecutiveLogs || 0,
            targetCaloriesKcal: profile.targetCaloriesKcal || 2000,
            targetProteinG: Number(profile.targetProteinG) || 125,
            targetCarbsG: Number(profile.targetCarbsG) || 250,
            targetFatG: Number(profile.targetFatG) || 55,
            caloriaCoins: profile.caloriaCoins || 0,
            lastLoginClaimDate: profile.lastLoginClaimDate || null,
            projectedDays: profile.projectedDays || 90,
          }
        : null,
      pet: pet
        ? {
            name: pet.name || "Pyro",
            species: (pet.species || pet.characterId || "flameling") as any,
            stage: pet.stage === "juvenile" ? 2 : 1,
            level: pet.level || 1,
            exp: petExp,
            hunger: pet.hunger ?? 100,
            happiness: pet.happiness ?? 100,
            coins: profile?.caloriaCoins ?? pet.coins ?? 0,
            lastFedAt:
              petLastFed instanceof Date
                ? petLastFed.toISOString()
                : new Date(petLastFed).toISOString(),
            moodStatus: petMood as "happy" | "neutral" | "complaining",
            customColors: (pet.customColors as any) || {},
          }
        : null,
      weightLogs: wLogs.map((r) => ({
        id: r.id,
        date: r.loggedDate,
        weightKg: Number(r.weightKg),
        notes: r.notes || "Catatan berkala",
      })),
      unlockedBadgeIds: uBadges.map((b) => b.badgeId),
      cosmetics: {
        ownedItemIds,
        equipped: {
          head: loadoutRow?.headId || "head-none",
          glasses: loadoutRow?.glassesId || "glasses-none",
          body: loadoutRow?.bodyId || "body-none",
          held: loadoutRow?.heldId || "held-none",
          skin: loadoutRow?.skinId || "skin-default",
          room: loadoutRow?.roomId || "room-default",
        },
      },
      foodLogs: recentLogs.map((l) => ({
        id: l.id,
        userId: l.userId,
        name: l.customFoodName || "Makanan",
        mealType: l.mealTime as any,
        calories: Number(l.calculatedCalories),
        proteinG: Number(l.calculatedProtein),
        carbsG: Number(l.calculatedCarbs),
        fatG: Number(l.calculatedFat),
        fiberG: Number(l.calculatedFiber),
        sugarG: Number(l.calculatedSugar),
        servingSize: Number(l.servingQuantity),
        servingUnit: "porsi",
        loggedDate: l.logDate,
        loggedAt: l.createdAt,
        createdAt: l.createdAt,
      })),
    };
  } catch (err: any) {
    console.error("[fetchAppInitialDataAction Error]:", err);
    return { authenticated: false };
  }
}