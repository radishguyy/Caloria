"use server";

import { db } from "@/db";
import { pets, profiles, coinTransactions, foodLogs, mealLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { getEvolutionForLevel } from "@/lib/pet/evolution";
import {
  type MainMealSlot,
  MAX_DAILY_FEEDS,
  MAX_DAILY_PETS,
  evaluateFeedEligibility,
  normalizeDailyFedSlots,
  normalizeDailyPetCount,
} from "@/lib/pet/needs-engine";
import { formatDateKey } from "@/lib/date-utils";

export interface FeedPetResult {
  success: boolean;
  coinsRemaining?: number;
  lastFedAt?: string;
  fedSlotsToday?: MainMealSlot[];
  needsResetDate?: string;
  hunger?: number;
  happiness?: number;
  error?: string;
  message?: string;
}

export interface PetCalpalResult {
  success: boolean;
  petCountToday?: number;
  lastPettedAt?: string;
  needsResetDate?: string;
  happiness?: number;
  exp?: number;
  error?: string;
  message?: string;
}

export interface DailyLoginRewardResult {
  success: boolean;
  alreadyClaimed: boolean;
  rewardAmount?: number;
  newBalance?: number;
  error?: string;
}

export interface LevelUpPromotionResult {
  success: boolean;
  coinsEarned?: number;
  newBalance?: number;
  error?: string;
}

/**
 * Server Action: Feed Pet
 * Enforces max 3x/day feeding aligned with human meal windows (pagi, siang, malam),
 * deducts 5 Caloria Coins atomically, updates last_fed_at & fed_slots_today,
 * resets moodStatus to 'happy', and boosts hunger/happiness.
 */
export async function feedPetAction(input?: {
  clientDateKey?: string;
  clientHour?: number;
}): Promise<FeedPetResult> {
  try {
    const user = await getAuthUser();
    const pet = await db.query.pets.findFirst({
      where: eq(pets.userId, user.id),
    });

    if (!pet) {
      return { success: false, error: "PET_NOT_FOUND", message: "Pet not found" };
    }

    const now = new Date();
    const todayKey =
      input?.clientDateKey && /^\d{4}-\d{2}-\d{2}$/.test(input.clientDateKey)
        ? input.clientDateKey
        : formatDateKey(now);

    const evalDate = new Date(now);
    if (
      typeof input?.clientHour === "number" &&
      input.clientHour >= 0 &&
      input.clientHour <= 23
    ) {
      evalDate.setHours(Math.floor(input.clientHour), 0, 0, 0);
    }

    const currentFedSlots = normalizeDailyFedSlots(
      pet.fedSlotsToday,
      pet.needsResetDate,
      todayKey,
    );
    const eligibility = evaluateFeedEligibility(currentFedSlots, evalDate);

    if (!eligibility.canFeed || !eligibility.currentSlot) {
      return {
        success: false,
        error: eligibility.reason ?? "FEED_BLOCKED",
        message: eligibility.message,
        fedSlotsToday: currentFedSlots,
        needsResetDate: todayKey,
      };
    }

    const FEED_COST = 5;

    if (pet.coins < FEED_COST) {
      return {
        success: false,
        error: "INSUFFICIENT_COINS",
        message: "Butuh minimal 5 koin untuk memberi makan CalPal.",
      };
    }

    const updatedCoins = pet.coins - FEED_COST;
    const updatedFedSlots: MainMealSlot[] = [
      ...currentFedSlots,
      eligibility.currentSlot,
    ].slice(0, MAX_DAILY_FEEDS);
    const updatedPetCount = normalizeDailyPetCount(
      pet.petCountToday,
      pet.needsResetDate,
      todayKey,
    );
    const newHunger = Math.min(
      100,
      Math.round((updatedFedSlots.length / MAX_DAILY_FEEDS) * 100),
    );
    const newHappiness = Math.min(100, (pet.happiness ?? 100) + 15);

    await db.transaction(async (tx) => {
      // 1. Update Pet state
      await tx
        .update(pets)
        .set({
          coins: updatedCoins,
          lastFedAt: now,
          fedSlotsToday: updatedFedSlots,
          petCountToday: updatedPetCount,
          needsResetDate: todayKey,
          moodStatus: "happy",
          hunger: newHunger,
          happiness: newHappiness,
          updatedAt: now,
        })
        .where(eq(pets.id, pet.id));

      // 2. Keep Profile coins in sync
      await tx
        .update(profiles)
        .set({
          caloriaCoins: updatedCoins,
          updatedAt: now,
        })
        .where(eq(profiles.id, user.id));
    });

    return {
      success: true,
      coinsRemaining: updatedCoins,
      lastFedAt: now.toISOString(),
      fedSlotsToday: updatedFedSlots,
      needsResetDate: todayKey,
      hunger: newHunger,
      happiness: newHappiness,
    };
  } catch (error: any) {
    console.error("[feedPetAction] Error:", error);
    return {
      success: false,
      error: "FEED_FAILED",
      message: error?.message || "Gagal memberi makan CalPal",
    };
  }
}

/**
 * Server Action: Pet (Elus) CalPal
 * Enforces max 3x/day petting and requires user to have logged main meals (pagi/siang/malam).
 */
export async function petCalpalAction(input?: {
  clientDateKey?: string;
  loggedMainMealCount?: number;
}): Promise<PetCalpalResult> {
  try {
    const user = await getAuthUser();
    const pet = await db.query.pets.findFirst({
      where: eq(pets.userId, user.id),
    });

    if (!pet) {
      return { success: false, error: "PET_NOT_FOUND", message: "Pet tidak ditemukan" };
    }

    const now = new Date();
    const todayKey =
      input?.clientDateKey && /^\d{4}-\d{2}-\d{2}$/.test(input.clientDateKey)
        ? input.clientDateKey
        : formatDateKey(now);

    const currentPetCount = normalizeDailyPetCount(
      pet.petCountToday,
      pet.needsResetDate,
      todayKey,
    );
    const currentFedSlots = normalizeDailyFedSlots(
      pet.fedSlotsToday,
      pet.needsResetDate,
      todayKey,
    );

    if (currentPetCount >= MAX_DAILY_PETS) {
      return {
        success: false,
        error: "MAX_DAILY_PETS_REACHED",
        message: "CalPal sudah dielus 3/3 kali hari ini!",
        petCountToday: currentPetCount,
        needsResetDate: todayKey,
      };
    }

    // Verify logged main meals (breakfast, lunch, dinner) in DB for today
    const mainSlots = new Set<MainMealSlot>(["breakfast", "lunch", "dinner"]);
    const loggedDbSlots = new Set<MainMealSlot>();

    try {
      const [fLogs, mLogs] = await Promise.all([
        db
          .select({ mealTime: foodLogs.mealTime })
          .from(foodLogs)
          .where(and(eq(foodLogs.userId, user.id), eq(foodLogs.logDate, todayKey))),
        db
          .select({ mealType: mealLogs.mealType })
          .from(mealLogs)
          .where(and(eq(mealLogs.userId, user.id), eq(mealLogs.loggedDate, todayKey))),
      ]);

      for (const row of fLogs) {
        if (mainSlots.has(row.mealTime as MainMealSlot)) {
          loggedDbSlots.add(row.mealTime as MainMealSlot);
        }
      }
      for (const row of mLogs) {
        if (mainSlots.has(row.mealType as MainMealSlot)) {
          loggedDbSlots.add(row.mealType as MainMealSlot);
        }
      }
    } catch (logErr) {
      console.warn("[petCalpalAction] Meal log verification warning:", logErr);
    }

    const clientCount = Math.max(
      0,
      Math.min(MAX_DAILY_PETS, Math.floor(input?.loggedMainMealCount ?? 0)),
    );
    const unlockedCount = Math.min(
      MAX_DAILY_PETS,
      Math.max(loggedDbSlots.size, clientCount),
    );

    if (currentPetCount >= unlockedCount) {
      return {
        success: false,
        error: "NEED_MAIN_MEAL_LOG",
        message:
          "Catat dulu data makanan utama (Pagi, Siang, atau Malam) agar bisa mengelus CalPal!",
        petCountToday: currentPetCount,
        needsResetDate: todayKey,
      };
    }

    const nextPetCount = currentPetCount + 1;
    const newHappiness = Math.min(
      100,
      Math.max(pet.happiness ?? 0, Math.round((nextPetCount / MAX_DAILY_PETS) * 100)),
    );
    const newExp = (pet.exp ?? 0) + 10;

    await db
      .update(pets)
      .set({
        petCountToday: nextPetCount,
        fedSlotsToday: currentFedSlots,
        needsResetDate: todayKey,
        lastPettedAt: now,
        happiness: newHappiness,
        exp: newExp,
        currentXp: newExp,
        moodStatus: "happy",
        updatedAt: now,
      })
      .where(eq(pets.id, pet.id));

    return {
      success: true,
      petCountToday: nextPetCount,
      lastPettedAt: now.toISOString(),
      needsResetDate: todayKey,
      happiness: newHappiness,
      exp: newExp,
    };
  } catch (error: any) {
    console.error("[petCalpalAction] Error:", error);
    return {
      success: false,
      error: "PET_FAILED",
      message: error?.message || "Gagal mengelus CalPal",
    };
  }
}

/**
 * Server Action: Claim Daily Login Reward
 * Awards +20 Caloria Coins once per calendar date (YYYY-MM-DD).
 */
export async function claimDailyLoginRewardAction(): Promise<DailyLoginRewardResult> {
  try {
    const user = await getAuthUser();
    const [profile] = await db
      .select({
        id: profiles.id,
        caloriaCoins: profiles.caloriaCoins,
        lastLoginClaimDate: profiles.lastLoginClaimDate,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return { success: false, alreadyClaimed: false, error: "Profile not found" };
    }

    // Determine current calendar date YYYY-MM-DD
    const todayStr = new Date().toISOString().split("T")[0];

    if (profile.lastLoginClaimDate === todayStr) {
      return {
        success: true,
        alreadyClaimed: true,
        newBalance: profile.caloriaCoins,
      };
    }

    const DAILY_REWARD = 20;
    const newCoins = (profile.caloriaCoins || 0) + DAILY_REWARD;
    const now = new Date();

    await db.transaction(async (tx) => {
      // 1. Insert ledger entry for idempotency audit
      await tx
        .insert(coinTransactions)
        .values({
          userId: user.id,
          amount: DAILY_REWARD,
          reward_type: "daily_login",
          reward_id: `daily_login_${todayStr}`,
        })
        .onConflictDoNothing();

      // 2. Update profile balance & claim date
      await tx
        .update(profiles)
        .set({
          caloriaCoins: newCoins,
          lastLoginClaimDate: todayStr,
          updatedAt: now,
        })
        .where(eq(profiles.id, user.id));

      // 3. Sync pet coins
      await tx
        .update(pets)
        .set({
          coins: newCoins,
          updatedAt: now,
        })
        .where(eq(pets.userId, user.id));
    });

    return {
      success: true,
      alreadyClaimed: false,
      rewardAmount: DAILY_REWARD,
      newBalance: newCoins,
    };
  } catch (error: any) {
    console.error("[claimDailyLoginRewardAction] Error:", error);
    return {
      success: false,
      alreadyClaimed: false,
      error: error?.message || "Failed to claim daily reward",
    };
  }
}

/**
 * Server Action: Claim Level-Up Promotion Reward
 * Awards +100 Caloria Coins milestone lump sum when advancing a quest level.
 */
export async function claimLevelUpPromotionAction(
  targetLevel: number,
): Promise<LevelUpPromotionResult> {
  try {
    const user = await getAuthUser();
    const rewardId = `level_up_promo_lvl_${targetLevel}`;

    // 1. Check idempotency in coin_transactions ledger
    const [existing] = await db
      .select({ amount: coinTransactions.amount })
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.userId, user.id),
          eq(coinTransactions.reward_type, "level_up_promotion"),
          eq(coinTransactions.reward_id, rewardId),
        ),
      )
      .limit(1);

    const [profile] = await db
      .select({ caloriaCoins: profiles.caloriaCoins })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (existing) {
      return {
        success: true,
        coinsEarned: 0,
        newBalance: profile?.caloriaCoins ?? 0,
      };
    }

    const BONUS_COINS = 100;
    const newCoins = (profile?.caloriaCoins ?? 0) + BONUS_COINS;
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(coinTransactions).values({
        userId: user.id,
        amount: BONUS_COINS,
        reward_type: "level_up_promotion",
        reward_id: rewardId,
      });

      await tx
        .update(profiles)
        .set({
          caloriaCoins: newCoins,
          updatedAt: now,
        })
        .where(eq(profiles.id, user.id));

      await tx
        .update(pets)
        .set({
          coins: newCoins,
          updatedAt: now,
        })
        .where(eq(pets.userId, user.id));
    });

    return {
      success: true,
      coinsEarned: BONUS_COINS,
      newBalance: newCoins,
    };
  } catch (error: any) {
    console.error("[claimLevelUpPromotionAction] Error:", error);
    return {
      success: false,
      error: error?.message || "Failed to claim level-up bonus",
    };
  }
}

export interface SyncPetEvolutionResult {
  success: boolean;
  level: number;
  stageSlug: string;
  stageName: string;
  stageChanged: boolean;
  nftTokenId: number | null;
  message?: string;
}

/**
 * Server Action: Sync Pet Level & Evolution Stage Milestone
 * Keeps PostgreSQL `pets` in sync with client gameplay progression so Dynamic NFT
 * SVG & metadata reflect current level/stage at $0 gas.
 */
export async function syncPetEvolutionProgressAction(input: {
  level: number;
  exp: number;
}): Promise<SyncPetEvolutionResult> {
  try {
    const user = await getAuthUser();
    const [pet] = await db
      .select()
      .from(pets)
      .where(eq(pets.userId, user.id))
      .limit(1);

    if (!pet) {
      return {
        success: false,
        level: 1,
        stageSlug: "egg",
        stageName: "Egg",
        stageChanged: false,
        nftTokenId: null,
        message: "Pet tidak ditemukan.",
      };
    }

    const safeLevel = Math.max(pet.level, Math.min(100, Math.floor(input.level || 1)));
    const safeExp = Math.max(0, Math.floor(input.exp || 0));
    const evolution = getEvolutionForLevel(safeLevel);
    const stageChanged = pet.stage !== evolution.stageSlug;

    await db
      .update(pets)
      .set({
        level: safeLevel,
        exp: safeExp,
        currentXp: safeExp,
        stage: evolution.stageSlug,
        updatedAt: new Date(),
      })
      .where(eq(pets.id, pet.id));

    return {
      success: true,
      level: safeLevel,
      stageSlug: evolution.stageSlug,
      stageName: evolution.stageName,
      stageChanged,
      nftTokenId: pet.nftTokenId ?? null,
      message: stageChanged
        ? `CalPal berevolusi ke tahap ${evolution.stageName}! Metadata NFT diperbarui.`
        : "Progres level & metadata NFT berhasil disinkronkan.",
    };
  } catch (err) {
    console.error("[syncPetEvolutionProgressAction] Error:", err);
    return {
      success: false,
      level: 1,
      stageSlug: "egg",
      stageName: "Egg",
      stageChanged: false,
      nftTokenId: null,
      message: "Gagal menyinkronkan progres evolusi CalPal.",
    };
  }
}
