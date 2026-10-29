"use server";

import { db } from "@/db";
import { pets, profiles, coinTransactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export interface FeedPetResult {
  success: boolean;
  coinsRemaining?: number;
  lastFedAt?: string;
  hunger?: number;
  happiness?: number;
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
 * Deducts 5 Caloria Coins atomically, updates last_fed_at to current timestamp,
 * resets moodStatus to 'happy', and boosts hunger/happiness.
 */
export async function feedPetAction(): Promise<FeedPetResult> {
  try {
    const user = await getAuthUser();
    const pet = await db.query.pets.findFirst({
      where: eq(pets.userId, user.id),
    });

    if (!pet) {
      return { success: false, error: "PET_NOT_FOUND", message: "Pet not found" };
    }

    const FEED_COST = 5;

    if (pet.coins < FEED_COST) {
      return {
        success: false,
        error: "INSUFFICIENT_COINS",
        message: "Need at least 5 coins to feed your pet",
      };
    }

    const updatedCoins = pet.coins - FEED_COST;
    const now = new Date();
    const newHunger = Math.min(100, (pet.hunger ?? 100) + 30);
    const newHappiness = Math.min(100, (pet.happiness ?? 100) + 20);

    await db.transaction(async (tx) => {
      // 1. Update Pet state
      await tx
        .update(pets)
        .set({
          coins: updatedCoins,
          lastFedAt: now,
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
      hunger: newHunger,
      happiness: newHappiness,
    };
  } catch (error: any) {
    console.error("[feedPetAction] Error:", error);
    return {
      success: false,
      error: "FEED_FAILED",
      message: error?.message || "Failed to feed pet",
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
