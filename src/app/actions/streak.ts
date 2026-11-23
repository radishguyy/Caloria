"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { foodLogs, pets, profiles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { STREAK_RULES } from "@/lib/constants";
import { isRepairEligible } from "@/lib/streak-utils";
import { getJakartaTodayStr } from "@/lib/server/streak-service";

export interface StreakPowerUpActionResult {
  success: boolean;
  message: string;
  newCoins?: number;
  streakFreezes?: number;
  restPasses?: number;
  lastRestDayDate?: string | null;
  restoredStreak?: number;
}

/**
 * Purchases 1 Streak Freeze slot using Caloria Coins (max 2 slots).
 */
export async function buyStreakFreezeAction(): Promise<StreakPowerUpActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Harap login terlebih dahulu untuk membeli Streak Freeze.",
      };
    }

    const [profile] = await db
      .select({
        caloriaCoins: profiles.caloriaCoins,
        streakFreezes: profiles.streakFreezes,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return { success: false, message: "Profil pengguna tidak ditemukan." };
    }

    if (profile.streakFreezes >= STREAK_RULES.MAX_FREEZE_COUNT) {
      return {
        success: false,
        message: `Slot Streak Freeze kamu sudah penuh (${STREAK_RULES.MAX_FREEZE_COUNT}/${STREAK_RULES.MAX_FREEZE_COUNT}).`,
        streakFreezes: profile.streakFreezes,
      };
    }

    if (profile.caloriaCoins < STREAK_RULES.FREEZE_PRICE_COINS) {
      return {
        success: false,
        message: `Koin tidak cukup! Dibutuhkan ${STREAK_RULES.FREEZE_PRICE_COINS} Koin untuk Streak Freeze.`,
      };
    }

    const newCoins = profile.caloriaCoins - STREAK_RULES.FREEZE_PRICE_COINS;
    const newFreezes = profile.streakFreezes + 1;

    await db
      .update(profiles)
      .set({
        caloriaCoins: newCoins,
        streakFreezes: newFreezes,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    await db
      .update(pets)
      .set({
        coins: newCoins,
        updatedAt: new Date(),
      })
      .where(eq(pets.userId, user.id));

    revalidatePath("/dashboard");
    revalidatePath("/pet-customization/shop");

    return {
      success: true,
      message: `Streak Freeze berhasil dibeli! Sekarang kamu punya ${newFreezes} pelindung streak.`,
      newCoins,
      streakFreezes: newFreezes,
    };
  } catch (err) {
    console.error("[buyStreakFreezeAction Error]:", err);
    return {
      success: false,
      message: "Terjadi kesalahan saat membeli Streak Freeze.",
    };
  }
}

/**
 * Purchases 1 Rest Day / Weekend Pass using Caloria Coins (max 2 slots).
 */
export async function buyRestPassAction(): Promise<StreakPowerUpActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Harap login terlebih dahulu untuk membeli Rest Day Pass.",
      };
    }

    const [profile] = await db
      .select({
        caloriaCoins: profiles.caloriaCoins,
        restPasses: profiles.restPasses,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return { success: false, message: "Profil pengguna tidak ditemukan." };
    }

    if (profile.restPasses >= STREAK_RULES.MAX_REST_PASS_COUNT) {
      return {
        success: false,
        message: `Slot Rest Day Pass kamu sudah penuh (${STREAK_RULES.MAX_REST_PASS_COUNT}/${STREAK_RULES.MAX_REST_PASS_COUNT}).`,
        restPasses: profile.restPasses,
      };
    }

    if (profile.caloriaCoins < STREAK_RULES.REST_PASS_PRICE_COINS) {
      return {
        success: false,
        message: `Koin tidak cukup! Dibutuhkan ${STREAK_RULES.REST_PASS_PRICE_COINS} Koin untuk Rest Day Pass.`,
      };
    }

    const newCoins = profile.caloriaCoins - STREAK_RULES.REST_PASS_PRICE_COINS;
    const newPasses = profile.restPasses + 1;

    await db
      .update(profiles)
      .set({
        caloriaCoins: newCoins,
        restPasses: newPasses,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    await db
      .update(pets)
      .set({
        coins: newCoins,
        updatedAt: new Date(),
      })
      .where(eq(pets.userId, user.id));

    revalidatePath("/dashboard");
    revalidatePath("/pet-customization/shop");

    return {
      success: true,
      message: `Rest Day Pass berhasil dibeli! Kamu punya ${newPasses} pass istirahat aktif.`,
      newCoins,
      restPasses: newPasses,
    };
  } catch (err) {
    console.error("[buyRestPassAction Error]:", err);
    return {
      success: false,
      message: "Terjadi kesalahan saat membeli Rest Day Pass.",
    };
  }
}

/**
 * Activates a Rest Day Pass for today (WIB) so streak remains protected without logging.
 */
export async function activateRestDayAction(): Promise<StreakPowerUpActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Harap login terlebih dahulu untuk mengaktifkan Rest Day.",
      };
    }

    const jakartaToday = getJakartaTodayStr();

    const [profile] = await db
      .select({
        restPasses: profiles.restPasses,
        lastRestDayDate: profiles.lastRestDayDate,
        currentStreakDays: profiles.currentStreakDays,
        streakCount: profiles.streakCount,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return { success: false, message: "Profil pengguna tidak ditemukan." };
    }

    if (profile.lastRestDayDate === jakartaToday) {
      return {
        success: false,
        message: "Rest Day sudah aktif untuk hari ini!",
        restPasses: profile.restPasses,
        lastRestDayDate: profile.lastRestDayDate,
      };
    }

    if (profile.restPasses <= 0) {
      return {
        success: false,
        message: "Rest Day Pass habis. Kamu bisa membelinya di Plaza Shop.",
        restPasses: 0,
      };
    }

    const remainingPasses = profile.restPasses - 1;
    const hasActiveStreak =
      Math.max(profile.currentStreakDays, profile.streakCount) > 0;

    await db
      .update(profiles)
      .set({
        restPasses: remainingPasses,
        lastRestDayDate: jakartaToday,
        ...(hasActiveStreak ? { lastLoggedDate: jakartaToday } : {}),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Rest Day aktif hari ini! Streak kamu tetap aman sementara kamu beristirahat. 🌙",
      restPasses: remainingPasses,
      lastRestDayDate: jakartaToday,
    };
  } catch (err) {
    console.error("[activateRestDayAction Error]:", err);
    return {
      success: false,
      message: "Terjadi kesalahan saat mengaktifkan Rest Day.",
    };
  }
}

/**
 * Repairs a recently broken streak (>= 3 days within 48 hours) via Coins or 2x Daily Food Logs Quest.
 */
export async function repairStreakAction(
  method: "coins" | "quest"
): Promise<StreakPowerUpActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Harap login terlebih dahulu untuk memulihkan streak.",
      };
    }

    const jakartaToday = getJakartaTodayStr();

    const [profile] = await db
      .select({
        caloriaCoins: profiles.caloriaCoins,
        longestStreakDays: profiles.longestStreakDays,
        brokenStreakCount: profiles.brokenStreakCount,
        brokenStreakAt: profiles.brokenStreakAt,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return { success: false, message: "Profil pengguna tidak ditemukan." };
    }

    if (!isRepairEligible(profile.brokenStreakCount, profile.brokenStreakAt)) {
      return {
        success: false,
        message: "Batas waktu pemulihan streak (48 jam) sudah berakhir atau belum memenuhi syarat.",
      };
    }

    let updatedCoins = profile.caloriaCoins;

    if (method === "coins") {
      if (profile.caloriaCoins < STREAK_RULES.REPAIR_PRICE_COINS) {
        return {
          success: false,
          message: `Koin tidak cukup! Butuh ${STREAK_RULES.REPAIR_PRICE_COINS} Koin untuk memulihkan streak.`,
        };
      }
      updatedCoins = profile.caloriaCoins - STREAK_RULES.REPAIR_PRICE_COINS;
    } else {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(foodLogs)
        .where(
          and(eq(foodLogs.userId, user.id), eq(foodLogs.logDate, jakartaToday))
        );

      const loggedCount = Number(count || 0);
      if (loggedCount < 2) {
        const remaining = 2 - loggedCount;
        return {
          success: false,
          message: `Catat ${remaining} makanan lagi hari ini untuk menyelesaikan misi pemulihan streak gratis! (${loggedCount}/2)`,
        };
      }
    }

    const restoredStreak = profile.brokenStreakCount;
    const nextLongest = Math.max(profile.longestStreakDays, restoredStreak);

    await db
      .update(profiles)
      .set({
        currentStreakDays: restoredStreak,
        streakCount: restoredStreak,
        streakConsecutiveLogs: restoredStreak,
        longestStreakDays: nextLongest,
        lastLoggedDate: jakartaToday,
        brokenStreakCount: 0,
        brokenStreakAt: null,
        caloriaCoins: updatedCoins,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    if (method === "coins") {
      await db
        .update(pets)
        .set({
          coins: updatedCoins,
          updatedAt: new Date(),
        })
        .where(eq(pets.userId, user.id));
    }

    revalidatePath("/dashboard");
    revalidatePath("/social");

    return {
      success: true,
      message: `Selamat! Streak ${restoredStreak} harimu berhasil dipulihkan! 🔥`,
      restoredStreak,
      newCoins: updatedCoins,
    };
  } catch (err) {
    console.error("[repairStreakAction Error]:", err);
    return {
      success: false,
      message: "Terjadi kesalahan saat memulihkan streak.",
    };
  }
}
