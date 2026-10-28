import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  profiles,
  foodLogs,
  coopMembers,
  pushSubscriptions,
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { sendNotificationToUser } from "@/lib/server/push-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // 1. Cron Security Authorization check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const secretParam = request.nextUrl.searchParams.get("secret");

    if (
      cronSecret &&
      authHeader !== `Bearer ${cronSecret}` &&
      request.headers.get("x-cron-secret") !== cronSecret &&
      secretParam !== cronSecret
    ) {
      return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
    }

    // Current local time in Indonesia (WIB UTC+7)
    const now = new Date();
    const jakartaDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const jakartaHours = jakartaDate.getUTCHours();
    const todayStr = jakartaDate.toISOString().split("T")[0];

    // Optional query overrides for testing
    const forceSlot = request.nextUrl.searchParams.get("slot") as
      | "breakfast"
      | "lunch"
      | "dinner"
      | null;
    const forceEvening = request.nextUrl.searchParams.get("evening") === "true";
    const forceReengagement = request.nextUrl.searchParams.get("reengagement") === "true";

    const stats = {
      mealtimeSent: 0,
      streakSaver10PmSelfSent: 0,
      streakSaver10PmFriendSent: 0,
      reengagementSent: 0,
    };

    // =========================================================================
    // A. SCENARIO 1: Mealtime Food Log Reminder
    // Sarapan: 07:00 - 09:59 (peak ~08:00)
    // Makan Siang: 12:00 - 14:59 (peak ~12:30)
    // Makan Malam: 18:00 - 20:59 (peak ~19:00)
    // =========================================================================
    const isBreakfastTime = jakartaHours >= 7 && jakartaHours <= 9;
    const isLunchTime = jakartaHours >= 12 && jakartaHours <= 14;
    const isDinnerTime = jakartaHours >= 18 && jakartaHours <= 20;

    let currentMealSlot: "breakfast" | "lunch" | "dinner" | null = forceSlot || null;
    if (!currentMealSlot) {
      if (isBreakfastTime) currentMealSlot = "breakfast";
      else if (isLunchTime) currentMealSlot = "lunch";
      else if (isDinnerTime) currentMealSlot = "dinner";
    }

    if (currentMealSlot) {
      const subscribedUsers = await getSubscribedUserIds();

      for (const userId of subscribedUsers) {
        const hasLoggedThisMeal = await userLoggedMealSlot(userId, todayStr, currentMealSlot);
        if (!hasLoggedThisMeal) {
          await sendNotificationToUser(userId, {
            title: "Waktunya makan! 🍽️",
            body: "Jangan lupa catat menu kamu sekarang biar pet kamu tetap kenyang dan XP nambah!",
            url: "/diary/add",
            tag: `meal-reminder-${currentMealSlot}-${todayStr}`,
          });
          stats.mealtimeSent++;
        }
      }
    }

    // =========================================================================
    // B. SCENARIO 3 & 4: 10 PM Streak Savers (Runs between 21:00 - 23:59 WIB)
    // =========================================================================
    const isEveningWindow = (jakartaHours >= 21 && jakartaHours <= 23) || forceEvening;

    if (isEveningWindow) {
      const subscribedUsers = await getSubscribedUserIds();

      for (const userId of subscribedUsers) {
        const hasLoggedAnyToday = await userHasAnyLogsToday(userId, todayStr);
        const userProfile = await getUserProfile(userId);
        const streakDays = userProfile?.currentStreakDays ?? 0;

        // SCENARIO 3: Self Missed Log (active streak > 0, 0 logs today)
        if (!hasLoggedAnyToday && streakDays > 0) {
          await sendNotificationToUser(userId, {
            title: "Streak kamu hampir putus! 🔥⚠️",
            body: "Udah jam 10 malam dan kamu belum catat makan hari ini. Sayang banget streak-nya kalau hangus, yuk log sekarang!",
            url: "/diary/add",
            tag: `streak-saver-self-${todayStr}`,
          });
          stats.streakSaver10PmSelfSent++;
        }

        // SCENARIO 4: Co-op Social Streak Saver (Friend Missed Log)
        const friendsMissingLogs = await getTeammatesWithoutLogsToday(userId, todayStr);
        for (const friend of friendsMissingLogs) {
          await sendNotificationToUser(userId, {
            title: "Social streak kalian dalam bahaya! 🤝🔥",
            body: `${friend.name} belum nyatet makan hari ini. Colek dia sekarang biar streak party kalian tetap aman!`,
            url: "/social/coop",
            tag: `streak-saver-coop-${friend.id}-${todayStr}`,
          });
          stats.streakSaver10PmFriendSent++;
        }
      }
    }

    // =========================================================================
    // C. SCENARIO 5: Re-engagement / Broken Streak Recovery
    // Cadence: Day 2, Day 5, Day 7, Day 14 after streak break
    // =========================================================================
    const subscribedUsers = await getSubscribedUserIds();
    for (const userId of subscribedUsers) {
      const userProfile = await getUserProfile(userId);
      if (!userProfile) continue;

      // Condition: streak is 0, and user has not logged anything today
      if (userProfile.currentStreakDays === 0) {
        const hasLoggedToday = await userHasAnyLogsToday(userId, todayStr);
        if (!hasLoggedToday) {
          const daysSinceBreak = await getDaysSinceLastLogOrCreation(userId, userProfile.createdAt);

          // Dispatch only on cadence days: Day 2, Day 5, Day 7, Day 14 (or forced)
          if ([2, 5, 7, 14].includes(daysSinceBreak) || forceReengagement) {
            await sendNotificationToUser(userId, {
              title: "Pet kamu kangen berat... 🥺🐾",
              body: "Streak boleh reset, tapi petualanganmu belum selesai. Yuk balik lagi dan mulai kebiasaan sehat bareng hari ini!",
              url: "/dashboard",
              tag: `re-engagement-day-${daysSinceBreak}-${todayStr}`,
            });
            stats.reengagementSent++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      jakartaHours,
      todayStr,
      stats,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_")) {
      throw error;
    }
    console.error("[Cron Notifications Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helpers
async function getSubscribedUserIds(): Promise<string[]> {
  try {
    if (process.env.DATABASE_URL) {
      const rows = await db
        .select({ userId: pushSubscriptions.userId })
        .from(pushSubscriptions);
      return Array.from(new Set(rows.map((r) => r.userId)));
    } else {
      const supabase = await createClient();
      const { data } = await supabase.from("push_subscriptions").select("user_id");
      return Array.from(new Set((data || []).map((r: any) => r.user_id)));
    }
  } catch {
    return [];
  }
}

async function userLoggedMealSlot(
  userId: string,
  dateStr: string,
  mealTime: string
): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL) {
      const logs = await db
        .select({ id: foodLogs.id })
        .from(foodLogs)
        .where(
          and(
            eq(foodLogs.userId, userId),
            eq(foodLogs.logDate, dateStr),
            eq(foodLogs.mealTime, mealTime as any)
          )
        )
        .limit(1);
      return logs.length > 0;
    } else {
      const supabase = await createClient();
      const { data } = await supabase
        .from("food_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("log_date", dateStr)
        .eq("meal_time", mealTime)
        .limit(1);
      return (data || []).length > 0;
    }
  } catch {
    return false;
  }
}

async function userHasAnyLogsToday(userId: string, dateStr: string): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL) {
      const logs = await db
        .select({ id: foodLogs.id })
        .from(foodLogs)
        .where(and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, dateStr)))
        .limit(1);
      return logs.length > 0;
    } else {
      const supabase = await createClient();
      const { data } = await supabase
        .from("food_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("log_date", dateStr)
        .limit(1);
      return (data || []).length > 0;
    }
  } catch {
    return false;
  }
}

async function getUserProfile(userId: string) {
  try {
    if (process.env.DATABASE_URL) {
      const [p] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
      return p;
    } else {
      const supabase = await createClient();
      const { data } = await supabase.from("profiles").select().eq("id", userId).maybeSingle();
      return data;
    }
  } catch {
    return null;
  }
}

async function getTeammatesWithoutLogsToday(
  userId: string,
  todayStr: string
): Promise<Array<{ id: string; name: string }>> {
  try {
    let groupIds: string[] = [];
    if (process.env.DATABASE_URL) {
      const groups = await db
        .select({ groupId: coopMembers.groupId })
        .from(coopMembers)
        .where(eq(coopMembers.userId, userId));
      groupIds = groups.map((g) => g.groupId);
    } else {
      const supabase = await createClient();
      const { data } = await supabase.from("coop_members").select("group_id").eq("user_id", userId);
      groupIds = (data || []).map((g: any) => g.group_id);
    }

    if (groupIds.length === 0) return [];

    const result: Array<{ id: string; name: string }> = [];
    const seenUserIds = new Set<string>();

    for (const gid of groupIds) {
      let mates: Array<{ userId: string }> = [];
      if (process.env.DATABASE_URL) {
        mates = await db
          .select({ userId: coopMembers.userId })
          .from(coopMembers)
          .where(and(eq(coopMembers.groupId, gid), sql`${coopMembers.userId} != ${userId}`));
      } else {
        const supabase = await createClient();
        const { data } = await supabase
          .from("coop_members")
          .select("user_id")
          .eq("group_id", gid)
          .neq("user_id", userId);
        mates = (data || []).map((m: any) => ({ userId: m.user_id }));
      }

      for (const m of mates) {
        if (seenUserIds.has(m.userId)) continue;
        seenUserIds.add(m.userId);

        const hasLog = await userHasAnyLogsToday(m.userId, todayStr);
        if (!hasLog) {
          const profile = await getUserProfile(m.userId);
          result.push({
            id: m.userId,
            name: profile?.fullName || profile?.username || "Temanmu",
          });
        }
      }
    }

    return result;
  } catch {
    return [];
  }
}

async function getDaysSinceLastLogOrCreation(userId: string, createdAt: Date): Promise<number> {
  const now = new Date();
  try {
    if (process.env.DATABASE_URL) {
      const [lastLog] = await db
        .select({ logDate: foodLogs.logDate })
        .from(foodLogs)
        .where(eq(foodLogs.userId, userId))
        .orderBy(desc(foodLogs.logDate))
        .limit(1);

      if (lastLog?.logDate) {
        const lastDate = new Date(lastLog.logDate);
        return Math.floor(Math.abs(now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
  } catch {
    // fallback to profile createdAt
  }

  const profileDate = new Date(createdAt);
  return Math.floor(Math.abs(now.getTime() - profileDate.getTime()) / (1000 * 60 * 60 * 24));
}
