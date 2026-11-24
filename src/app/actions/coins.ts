"use server";

import { db } from "@/db";
import { profiles, coinTransactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

/**
 * Centralized, idempotent coin award server action.
 * 
 * Awards coins to a user with the following guarantees:
 * - Auth validation (rejects unauthenticated users)
 * - Eligibility verification (checks ledger for duplicate claims)
 * - Atomic balance update (transaction: insert ledger → update profile)
 * - Unique constraint guard against concurrent double-rewards
 * 
 * Returns { success, coinsEarned, newBalance, error } for UI feedback.
 */
export async function awardCoins({
  userId,
  amount,
  rewardType,
  rewardId,
}: {
  userId: string;
  amount: number;
  rewardType: string;
  rewardId: string;
}): Promise<{
  success: boolean;
  coinsEarned: number;
  newBalance: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.id !== userId) {
    return { success: false, coinsEarned: 0, newBalance: 0, error: "Unauthorized" };
  }

  // 1. Check ledger for existing award (idempotency)
  const [existing] = await db
    .select({ amount: coinTransactions.amount })
    .from(coinTransactions)
    .where(
      and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.reward_type, rewardType),
        eq(coinTransactions.reward_id, rewardId),
      ),
    )
    .limit(1);

  if (existing) {
    // Already awarded — return current balance from profile
    const [profile] = await db
      .select({ caloriaCoins: profiles.caloriaCoins })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    return {
      success: true,
      coinsEarned: existing.amount,
      newBalance: profile?.caloriaCoins ?? 0,
      error: undefined,
    };
  }

  // 2. Begin transaction: insert ledger + update profile balance atomically
  try {
    const [profile] = await db
      .select({ caloriaCoins: profiles.caloriaCoins })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return { success: false, coinsEarned: 0, newBalance: 0, error: "Profile not found" };
    }

    const newCoins = profile.caloriaCoins + amount;

    await db.transaction(async (tx) => {
      // Insert into coin_transactions ledger
      await tx.insert(coinTransactions).values({
        userId,
        amount,
        reward_type: rewardType,
        reward_id: rewardId,
      });

      // Update profile balance
      await tx
        .update(profiles)
        .set({
          caloriaCoins: newCoins,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));
    });

    return {
      success: true,
      coinsEarned: amount,
      newBalance: newCoins,
      error: undefined,
    };
  } catch (err: any) {
    // Unique constraint violation (concurrent double-award)
    if (err?.code === "23505") {
      // Re-check ledger after collision
      const [colliding] = await db
        .select({ amount: coinTransactions.amount })
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.reward_type, rewardType),
            eq(coinTransactions.reward_id, rewardId),
          ),
        )
        .limit(1);

      if (colliding) {
        const [profile] = await db
          .select({ caloriaCoins: profiles.caloriaCoins })
          .from(profiles)
          .where(eq(profiles.id, userId))
          .limit(1);

        return {
          success: true,
          coinsEarned: colliding.amount,
          newBalance: profile?.caloriaCoins ?? 0,
          error: undefined,
        };
      }
    }

    console.error("[awardCoins] Transaction failed:", err);
    return {
      success: false,
      coinsEarned: 0,
      newBalance: 0,
      error: "Gagal mengasai koin. Silakan coba lagi.",
    };
  }
}