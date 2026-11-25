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
  mealLogs,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DEFAULT_FREE_ITEM_IDS } from "@/lib/cosmetics-catalog";
import { evaluatePetCondition } from "@/lib/pet/decay-evaluator";
import { stageSlugToNumber } from "@/lib/pet/evolution";
import { STREAK_RULES } from "@/lib/constants";
import { evaluateEffectiveStreak } from "@/lib/server/streak-service";
import {
  generateNutritionPlan,
  type ActivityLevel,
  type Gender,
  type NutritionTargetPlan,
} from "@/lib/nutrition-calculator";
import type { GoalProgramType } from "@/types";

/**
 * Returns the authenticated user's profile data for client-side rendering.
 * Used by the SessionProvider and any server component that needs profile info.
 *
 * Returns null when the user is not authenticated.
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

  // Ensure profile exists (idempotent) — this is also where a fresh Google
  // user gets their first profile row.
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
    walletAddress: profileRow.profile.walletAddress ?? null,
    walletChainId: profileRow.profile.walletChainId ?? null,
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
 * Checks whether a chosen username is available for registration or onboarding
 */
export async function checkUsernameAvailabilityAction(username: string): Promise<{
  available: boolean;
  error?: string;
}> {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean.length < 3) {
    return { available: false, error: "Minimal 3 karakter (huruf, angka, _)" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.username, clean))
      .limit(1);

    if (existing && (!user || existing.id !== user.id)) {
      return { available: false, error: "Username sudah digunakan" };
    }

    return { available: true };
  } catch (err) {
    console.error("[checkUsernameAvailabilityAction Error]:", err);
    return { available: true };
  }
}

/**
 * Updates user profile username and full name during onboarding or settings
 */
export async function updateUsernameAction(username: string, fullName?: string): Promise<{
  success: boolean;
  error?: string;
  username?: string;
}> {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean.length < 3) {
    return { success: false, error: "Username minimal 3 karakter (huruf, angka, _)." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Harap masuk terlebih dahulu." };
    }

    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.username, clean))
      .limit(1);

    if (existing && existing.id !== user.id) {
      return { success: false, error: "Username sudah dipakai oleh pengguna lain." };
    }

    const updates: Record<string, any> = {
      username: clean,
      updatedAt: new Date(),
    };
    if (fullName && fullName.trim()) {
      updates.fullName = fullName.trim();
    }

    await db.update(profiles).set(updates).where(eq(profiles.id, user.id));
    revalidatePath("/", "layout");
    return { success: true, username: clean };
  } catch (err) {
    console.error("[updateUsernameAction Error]:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui username.",
    };
  }
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

    // Run all 7 queries in parallel for fast initial load, with Supabase REST fallback
    const [
      profile,
      rawPet,
      wLogs,
      uBadges,
      wardrobeRows,
      loadoutRow,
      recentFoodLogs,
    ] = await Promise.all([
      db
        .select()
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1)
        .then((r) => r[0] || null)
        .catch(async (e) => {
          console.warn("[fetchAppInitialDataAction] profile query fallback:", e);
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          return data
            ? ({
                id: data.id,
                username: data.username,
                fullName: data.full_name,
                avatarUrl: data.avatar_url,
                goal: data.goal,
                goalPath: data.goal_path,
                currentLevel: data.current_level,
                currentWeek: data.current_week,
                streakCount: data.streak_count,
                streakConsecutiveLogs: data.streak_consecutive_logs,
                heightCm: data.height_cm,
                weightKg: data.weight_kg,
                initialWeightKg: data.initial_weight_kg,
                currentWeightKg: data.current_weight_kg,
                targetWeightKg: data.target_weight_kg,
                targetCaloriesKcal: data.target_calories_kcal,
                targetProteinG: data.target_protein_g,
                targetCarbsG: data.target_carbs_g,
                targetFatG: data.target_fat_g,
                caloriaCoins: data.caloria_coins,
                lastLoginClaimDate: data.last_login_claim_date,
                projectedDays: data.projected_days,
                currentStreakDays: data.current_streak_days,
                isOnboardingCompleted: data.is_onboarding_completed,
                createdAt: data.created_at,
              } as any)
            : null;
        }),
      db
        .select()
        .from(pets)
        .where(eq(pets.userId, user.id))
        .limit(1)
        .then((r) => r[0] || null)
        .catch(async (e) => {
          console.warn("[fetchAppInitialDataAction] pet query fallback:", e);
          const { data } = await supabase
            .from("pets")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          return data
            ? ({
                id: data.id,
                userId: data.user_id,
                name: data.name,
                species: data.species,
                characterId: data.character_id,
                stage: data.stage,
                level: data.level,
                exp: data.exp ?? data.current_xp ?? 0,
                currentXp: data.current_xp ?? data.exp ?? 0,
                hunger: data.hunger ?? 100,
                happiness: data.happiness ?? 100,
                coins: data.coins ?? 50,
                lastFedAt: data.last_fed_at,
                moodStatus: data.mood_status,
                customColors: data.custom_colors,
                createdAt: data.created_at,
              } as any)
            : null;
        }),
      db
        .select()
        .from(weightLogs)
        .where(eq(weightLogs.userId, user.id))
        .orderBy(weightLogs.loggedDate)
        .catch(() => [] as any[]),
      db
        .select()
        .from(userBadges)
        .where(eq(userBadges.userId, user.id))
        .catch(() => [] as any[]),
      db
        .select({ assetUrl: plazaItems.assetUrl })
        .from(userWardrobe)
        .innerJoin(plazaItems, eq(userWardrobe.itemId, plazaItems.id))
        .where(eq(userWardrobe.userId, user.id))
        .catch(() => [] as any[]),
      db
        .select()
        .from(userLoadouts)
        .where(eq(userLoadouts.userId, user.id))
        .limit(1)
        .then((r) => r[0] || null)
        .catch(() => null as any),
      db
        .select()
        .from(foodLogs)
        .where(eq(foodLogs.userId, user.id))
        .orderBy(desc(foodLogs.createdAt))
        .limit(500)
        .catch(() => [] as any[]),
    ]);

    const VALID_SPECIES = [
      "flameling",
      "droplet",
      "bloomie",
      "sunny",
      "mochi",
      "kuma",
      "nyx",
      "bambi",
      "pippin",
      "ziggy",
      "clover",
      "biscuit",
    ];
    const rawSpecies = rawPet?.species || rawPet?.characterId;
    const validSpecies =
      rawSpecies && VALID_SPECIES.includes(rawSpecies)
        ? rawSpecies
        : VALID_SPECIES[
            user.id
              .split("")
              .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
              VALID_SPECIES.length
          ];

    const pet = rawPet
      ? {
          ...rawPet,
          name:
            rawPet.name && rawPet.name !== "Egg Starter"
              ? rawPet.name
              : validSpecies.charAt(0).toUpperCase() + validSpecies.slice(1),
          species: validSpecies,
          characterId: validSpecies,
        }
      : {
          id: user.id,
          userId: user.id,
          name: validSpecies.charAt(0).toUpperCase() + validSpecies.slice(1),
          species: validSpecies,
          characterId: validSpecies,
          stage: "baby",
          level: 1,
          exp: 0,
          currentXp: 0,
          hunger: 100,
          happiness: 100,
          coins: profile?.caloriaCoins ?? 50,
          lastFedAt: new Date(),
          moodStatus: "happy",
          customColors: {},
          createdAt: new Date(),
        };

    const ownedItemIds = Array.from(
      new Set([
        ...DEFAULT_FREE_ITEM_IDS,
        ...wardrobeRows.map((r: any) => r.assetUrl),
      ])
    );

    // Map Food Logs (with mealLogs fallback if empty)
    let mappedFoodLogs: any[] = [];
    try {
      mappedFoodLogs = recentFoodLogs.map((l: any) => {
        let loggedDateStr = new Date().toISOString().split("T")[0];
        try {
          if (typeof l.logDate === "string") {
            loggedDateStr = l.logDate;
          } else if (l.logDate) {
            loggedDateStr = new Date(l.logDate).toISOString().split("T")[0];
          }
        } catch {}

        return {
          id: l.id,
          userId: l.userId,
          name: l.customFoodName || "Makanan",
          mealType: l.mealTime as any,
          calories: Number(l.calculatedCalories),
          proteinG: Number(l.calculatedProtein),
          carbsG: Number(l.calculatedCarbs),
          fatG: Number(l.calculatedFat),
          fiberG: Number(l.calculatedFiber || 0),
          sugarG: Number(l.calculatedSugar || 0),
          servingSize: Number(l.servingQuantity || 1),
          servingUnit: "porsi",
          loggedDate: loggedDateStr,
          loggedAt: l.createdAt,
          createdAt: l.createdAt,
        };
      });

      if (mappedFoodLogs.length === 0) {
        const recentMealLogs = await db
          .select()
          .from(mealLogs)
          .where(eq(mealLogs.userId, user.id))
          .orderBy(desc(mealLogs.createdAt))
          .limit(500)
          .catch(() => [] as any[]);

        mappedFoodLogs = recentMealLogs.map((m: any) => {
          let loggedDateStr = new Date().toISOString().split("T")[0];
          try {
            if (typeof m.loggedDate === "string") {
              loggedDateStr = m.loggedDate;
            } else if (m.loggedDate) {
              loggedDateStr = new Date(m.loggedDate).toISOString().split("T")[0];
            }
          } catch {}

          return {
            id: m.id,
            userId: m.userId,
            name: m.customFoodName || "Makanan",
            mealType: m.mealType as any,
            calories: Number(m.calculatedCalories),
            proteinG: Number(m.calculatedProtein),
            carbsG: Number(m.calculatedCarbs),
            fatG: Number(m.calculatedFat),
            fiberG: 0,
            sugarG: 0,
            servingSize: Number(m.servings || 1),
            servingUnit: "porsi",
            loggedDate: loggedDateStr,
            loggedAt: m.createdAt,
            createdAt: m.createdAt,
          };
        });
      }
    } catch (e) {
      console.warn("[fetchAppInitialDataAction] food logs query warning:", e);
    }

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

    // Compute effective start date from earliest weight log date or profile creation date
    const earliestWeightDate = wLogs[0]?.loggedDate;
    const profileCreatedDate = profile?.createdAt
      ? (profile.createdAt instanceof Date
          ? profile.createdAt.toISOString().split("T")[0]
          : new Date(profile.createdAt).toISOString().split("T")[0])
      : null;
    const effectiveStartDate = earliestWeightDate && profileCreatedDate
      ? (earliestWeightDate < profileCreatedDate ? earliestWeightDate : profileCreatedDate)
      : earliestWeightDate || profileCreatedDate || new Date().toISOString().split("T")[0];

    // Treat as completed if flag is set, or if user already has pet, weight logs, or food logs
    const isUserOnboardingCompleted =
      Boolean(profile?.isOnboardingCompleted) ||
      Boolean(pet) ||
      wLogs.length > 0 ||
      mappedFoodLogs.length > 0;

    if (profile && !profile.isOnboardingCompleted && isUserOnboardingCompleted) {
      db.update(profiles)
        .set({ isOnboardingCompleted: true, updatedAt: new Date() })
        .where(eq(profiles.id, user.id))
        .catch((e) => console.warn("[fetchAppInitialDataAction] update onboarding status warning:", e));
    }

    const rawStreak = profile
      ? Math.max(profile.streakCount || 0, profile.currentStreakDays || 0)
      : 0;
    const streakEval = profile
      ? evaluateEffectiveStreak({
          lastLoggedDate: profile.lastLoggedDate,
          currentStreak: rawStreak,
          streakFreezes: profile.streakFreezes,
          lastRestDayDate: profile.lastRestDayDate,
        })
      : {
          effectiveStreak: 0,
          isExpired: false,
          isFreezeProtected: false,
          isRestProtected: false,
        };

    const expiredBrokenCount =
      profile &&
      streakEval.isExpired &&
      rawStreak >= STREAK_RULES.REPAIR_MIN_BROKEN_STREAK
        ? rawStreak
        : profile?.brokenStreakCount || 0;
    const expiredBrokenAt =
      profile &&
      streakEval.isExpired &&
      rawStreak >= STREAK_RULES.REPAIR_MIN_BROKEN_STREAK
        ? new Date()
        : profile?.brokenStreakAt || null;

    if (profile && streakEval.isExpired) {
      db.update(profiles)
        .set({
          currentStreakDays: 0,
          streakCount: 0,
          streakConsecutiveLogs: 0,
          brokenStreakCount: expiredBrokenCount,
          brokenStreakAt: expiredBrokenAt,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, user.id))
        .catch((e) =>
          console.warn(
            "[fetchAppInitialDataAction] reset expired streak warning:",
            e
          )
        );
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email || null,
        username:
          profile?.username ||
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          "user",
        fullName:
          profile?.fullName ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          profile?.username ||
          null,
        avatarUrl:
          profile?.avatarUrl ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null,
        role:
          (profile?.role as "user" | "nutritionist" | "admin") || "user",
        walletAddress: profile?.walletAddress ?? null,
        walletChainId: profile?.walletChainId ?? null,
        isOnboardingCompleted: isUserOnboardingCompleted,
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
            streakCount: streakEval.effectiveStreak,
            streakConsecutiveLogs: streakEval.isExpired
              ? 0
              : profile.streakConsecutiveLogs || 0,
            longestStreakDays: Math.max(
              profile.longestStreakDays || 0,
              streakEval.effectiveStreak
            ),
            streakFreezes: profile.streakFreezes ?? 1,
            lastFreezeUsedDate: profile.lastFreezeUsedDate || null,
            restPasses: profile.restPasses ?? 1,
            lastRestDayDate: profile.lastRestDayDate || null,
            brokenStreakCount: expiredBrokenCount,
            brokenStreakAt: expiredBrokenAt
              ? expiredBrokenAt instanceof Date
                ? expiredBrokenAt.toISOString()
                : new Date(expiredBrokenAt).toISOString()
              : null,
            lastLoggedDate: profile.lastLoggedDate || null,
            targetCaloriesKcal: profile.targetCaloriesKcal || 2000,
            targetProteinG: Number(profile.targetProteinG) || 125,
            targetCarbsG: Number(profile.targetCarbsG) || 250,
            targetFatG: Number(profile.targetFatG) || 55,
            caloriaCoins: profile.caloriaCoins || 0,
            lastLoginClaimDate: profile.lastLoginClaimDate || null,
            projectedDays: profile.projectedDays || 90,
            startDate: effectiveStartDate,
          }
        : null,
      pet: pet
        ? {
            name: pet.name || "Pyro",
            species: (pet.species || pet.characterId || "flameling") as any,
            stage: stageSlugToNumber(pet.stage, pet.level || 1),
            level: pet.level || 1,
            exp: petExp,
            hunger: pet.hunger ?? 100,
            happiness: pet.happiness ?? 100,
            coins: profile?.caloriaCoins ?? pet.coins ?? 0,
            lastFedAt:
              petLastFed instanceof Date
                ? petLastFed.toISOString()
                : new Date(petLastFed).toISOString(),
            lastPettedAt: pet.lastPettedAt
              ? pet.lastPettedAt instanceof Date
                ? pet.lastPettedAt.toISOString()
                : new Date(pet.lastPettedAt).toISOString()
              : new Date().toISOString(),
            fedSlotsToday: Array.isArray(pet.fedSlotsToday)
              ? (pet.fedSlotsToday as any)
              : [],
            petCountToday: pet.petCountToday ?? 0,
            needsResetDate: pet.needsResetDate ?? null,
            moodStatus: petMood as "happy" | "neutral" | "complaining",
            customColors: (pet.customColors as any) || {},
            nftTokenId: pet.nftTokenId ?? null,
            nftContractAddress: pet.nftContractAddress ?? null,
            nftChainId: pet.nftChainId ?? null,
            mintTxHash: pet.mintTxHash ?? null,
            mintStatus:
              (pet.mintStatus as "unminted" | "minting" | "minted") ||
              "unminted",
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
      foodLogs: mappedFoodLogs,
    };
  } catch (err: any) {
    console.error("[fetchAppInitialDataAction Error]:", err);
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email || null,
            username:
              user.user_metadata?.username ||
              user.email?.split("@")[0] ||
              "User",
            fullName:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              null,
            avatarUrl:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null,
            isOnboardingCompleted: true,
          },
          profile: null,
          pet: null,
          weightLogs: [],
          unlockedBadgeIds: [],
          cosmetics: {
            ownedItemIds: DEFAULT_FREE_ITEM_IDS,
            equipped: null,
          },
          foodLogs: [],
        };
      }
    } catch {}
    return { authenticated: false };
  }
}

export interface UpdateGoalProgramInput {
  goalType: GoalProgramType;
  currentWeightKg: number;
  targetWeightKg: number;
  customMarginKcal?: number;
  gender: Gender;
  age: number;
  heightCm: number;
  activityLevel: ActivityLevel;
}

export interface UpdateGoalProgramResult {
  success: boolean;
  unauthenticated?: boolean;
  error?: string;
  goalPath?: "lose_weight" | "gain_muscle" | "maintain_weight";
  plan?: NutritionTargetPlan;
}

/**
 * Recalibrates the user's nutrition plan and persists a new goal phase
 * (Option 1: Maintenance or Option 2: New Target) after reaching a previous target.
 */
export async function updateGoalProgramAction(
  input: UpdateGoalProgramInput
): Promise<UpdateGoalProgramResult> {
  const effectiveTargetWeight =
    input.goalType === "maintenance"
      ? input.currentWeightKg
      : input.targetWeightKg;

  if (
    input.goalType === "diet" &&
    effectiveTargetWeight >= input.currentWeightKg
  ) {
    return {
      success: false,
      error: "Berat target diet harus lebih rendah dari berat saat ini.",
    };
  }

  if (
    input.goalType === "bulking" &&
    effectiveTargetWeight <= input.currentWeightKg
  ) {
    return {
      success: false,
      error: "Berat target naik otot harus lebih tinggi dari berat saat ini.",
    };
  }

  const plan = generateNutritionPlan({
    gender: input.gender,
    age: input.age,
    heightCm: input.heightCm,
    currentWeightKg: input.currentWeightKg,
    targetWeightKg: effectiveTargetWeight,
    activityLevel: input.activityLevel,
    goalType: input.goalType,
    customMarginKcal:
      input.goalType === "maintenance" ? 0 : input.customMarginKcal,
  });

  const goalPath: "lose_weight" | "gain_muscle" | "maintain_weight" =
    input.goalType === "bulking"
      ? "gain_muscle"
      : input.goalType === "maintenance"
        ? "maintain_weight"
        : "lose_weight";

  const activityMap: Record<
    ActivityLevel,
    | "sedentary"
    | "lightly_active"
    | "moderately_active"
    | "very_active"
    | "extra_active"
  > = {
    sedentary: "sedentary",
    light: "lightly_active",
    moderate: "moderately_active",
    active: "very_active",
    very_active: "extra_active",
  };
  const dbActivity = activityMap[input.activityLevel] || "moderately_active";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        unauthenticated: true,
        goalPath,
        plan,
        error: "Sesi login tidak ditemukan.",
      };
    }

    try {
      await db
        .update(profiles)
        .set({
          goal: input.goalType,
          goalPath,
          currentLevel: 1,
          currentWeek: 1,
          initialWeightKg: String(input.currentWeightKg),
          currentWeightKg: String(input.currentWeightKg),
          targetWeightKg: String(effectiveTargetWeight),
          activityLevel: dbActivity,
          bmiScore: String(plan.bmi.score),
          tdeeKcal: plan.tdee,
          targetCaloriesKcal: plan.dailyCalories,
          targetProteinG: String(plan.proteinG),
          targetCarbsG: String(plan.carbsG),
          targetFatG: String(plan.fatG),
          projectedDays: plan.projectedDays,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, user.id));
    } catch (dbErr) {
      console.warn(
        "[updateGoalProgramAction] fallback to Supabase REST:",
        dbErr
      );
      const { error: restErr } = await supabase
        .from("profiles")
        .update({
          goal: input.goalType,
          goal_path: goalPath,
          current_level: 1,
          current_week: 1,
          initial_weight_kg: String(input.currentWeightKg),
          current_weight_kg: String(input.currentWeightKg),
          target_weight_kg: String(effectiveTargetWeight),
          activity_level: dbActivity,
          bmi_score: String(plan.bmi.score),
          tdee_kcal: plan.tdee,
          target_calories_kcal: plan.dailyCalories,
          target_protein_g: String(plan.proteinG),
          target_carbs_g: String(plan.carbsG),
          target_fat_g: String(plan.fatG),
          projected_days: plan.projectedDays,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (restErr) {
        return {
          success: false,
          error: restErr.message || "Gagal memperbarui target program.",
        };
      }
    }

    revalidatePath("/", "layout");
    return { success: true, goalPath, plan };
  } catch (error) {
    console.error("[updateGoalProgramAction Error]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui target program.",
    };
  }
}
