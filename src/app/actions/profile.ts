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

    // 1. Fetch Profile
    let profile: any = null;
    try {
      const [p] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);
      profile = p;
    } catch (e) {
      console.warn("[fetchAppInitialDataAction] profile query warning:", e);
    }

    // 2. Fetch Pet
    let pet: any = null;
    try {
      const [pt] = await db
        .select()
        .from(pets)
        .where(eq(pets.userId, user.id))
        .limit(1);
      pet = pt;
    } catch (e) {
      console.warn("[fetchAppInitialDataAction] pet query warning:", e);
    }

    // 3. Fetch Weight Logs
    let wLogs: any[] = [];
    try {
      wLogs = await db
        .select()
        .from(weightLogs)
        .where(eq(weightLogs.userId, user.id))
        .orderBy(weightLogs.loggedDate);
    } catch (e) {
      console.warn("[fetchAppInitialDataAction] weightLogs query warning:", e);
    }

    // 4. Fetch User Badges
    let uBadges: any[] = [];
    try {
      uBadges = await db
        .select()
        .from(userBadges)
        .where(eq(userBadges.userId, user.id));
    } catch (e) {
      console.warn("[fetchAppInitialDataAction] userBadges query warning:", e);
    }

    // 5. Fetch User Wardrobe / Accessories
    let wardrobeRows: any[] = [];
    try {
      wardrobeRows = await db
        .select({ assetUrl: plazaItems.assetUrl })
        .from(userWardrobe)
        .innerJoin(plazaItems, eq(userWardrobe.itemId, plazaItems.id))
        .where(eq(userWardrobe.userId, user.id));
    } catch (e) {
      console.warn("[fetchAppInitialDataAction] wardrobe query warning:", e);
    }

    const ownedItemIds = Array.from(
      new Set([
        ...DEFAULT_FREE_ITEM_IDS,
        ...wardrobeRows.map((r) => r.assetUrl),
      ])
    );

    // 6. Fetch User Loadout
    let loadoutRow: any = null;
    try {
      const [lr] = await db
        .select()
        .from(userLoadouts)
        .where(eq(userLoadouts.userId, user.id))
        .limit(1);
      loadoutRow = lr;
    } catch (e) {
      console.warn("[fetchAppInitialDataAction] loadout query warning:", e);
    }

    // 7. Fetch Recent Food Logs (from foodLogs with mealLogs fallback)
    let mappedFoodLogs: any[] = [];
    try {
      const recentFoodLogs = await db
        .select()
        .from(foodLogs)
        .where(eq(foodLogs.userId, user.id))
        .orderBy(desc(foodLogs.createdAt))
        .limit(500);

      mappedFoodLogs = recentFoodLogs.map((l) => {
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
          .limit(500);

        mappedFoodLogs = recentMealLogs.map((m) => {
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

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email || null,
        username: profile?.username || user.email?.split("@")[0] || "User",
        fullName: profile?.fullName || user.user_metadata?.full_name || null,
        avatarUrl: profile?.avatarUrl || user.user_metadata?.avatar_url || null,
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
            streakCount: profile.streakCount || profile.currentStreakDays || 0,
            streakConsecutiveLogs: profile.streakConsecutiveLogs || 0,
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