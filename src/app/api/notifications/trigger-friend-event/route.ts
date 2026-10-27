import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { coopMembers, profiles, foodLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendNotificationToUser } from "@/lib/server/push-service";

/**
 * Scenario 2: Friend Logged, User Behind (Peer Pressure Trigger)
 * Triggered when User A logs food. Checks User A's co-op teammates.
 * If a teammate has 0 logs today, dispatches:
 *   Title: "Temanmu udah makan nih! 👀"
 *   Body: "{friend_name} baru aja nyatet makanannya. Kamu jangan mau kalah, yuk log makananmu!"
 *   URL: "/diary/add"
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Fetch current user's profile name
    let actorName = "Temanmu";
    if (process.env.DATABASE_URL) {
      const [actor] = await db
        .select({ fullName: profiles.fullName, username: profiles.username })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
      actorName = actor?.fullName || actor?.username || "Temanmu";
    } else {
      const { data: actor } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", userId)
        .maybeSingle();
      actorName = actor?.full_name || actor?.username || "Temanmu";
    }

    // 2. Find groups that user belongs to
    let userGroups: Array<{ groupId: string }> = [];
    if (process.env.DATABASE_URL) {
      userGroups = await db
        .select({ groupId: coopMembers.groupId })
        .from(coopMembers)
        .where(eq(coopMembers.userId, userId));
    } else {
      const { data } = await supabase
        .from("coop_members")
        .select("group_id")
        .eq("user_id", userId);
      userGroups = (data || []).map((g: any) => ({ groupId: g.group_id }));
    }

    if (userGroups.length === 0) {
      return NextResponse.json({ success: true, message: "No co-op groups found for user." });
    }

    const groupIds = userGroups.map((g) => g.groupId);

    // 3. Find teammates in those groups (excluding the actor)
    const notifiedUserIds = new Set<string>();

    for (const gId of groupIds) {
      let teammates: Array<{ userId: string }> = [];
      if (process.env.DATABASE_URL) {
        teammates = await db
          .select({ userId: coopMembers.userId })
          .from(coopMembers)
          .where(and(eq(coopMembers.groupId, gId), sql`${coopMembers.userId} != ${userId}`));
      } else {
        const { data } = await supabase
          .from("coop_members")
          .select("user_id")
          .eq("group_id", gId)
          .neq("user_id", userId);
        teammates = (data || []).map((t: any) => ({ userId: t.user_id }));
      }

      for (const t of teammates) {
        if (notifiedUserIds.has(t.userId)) continue;

        // Check if teammate has logged any meal today
        let hasLoggedToday = false;
        if (process.env.DATABASE_URL) {
          const logsToday = await db
            .select({ id: foodLogs.id })
            .from(foodLogs)
            .where(and(eq(foodLogs.userId, t.userId), eq(foodLogs.logDate, todayStr)))
            .limit(1);
          hasLoggedToday = logsToday.length > 0;
        } else {
          const { data: logsToday } = await supabase
            .from("food_logs")
            .select("id")
            .eq("user_id", t.userId)
            .eq("log_date", todayStr)
            .limit(1);
          hasLoggedToday = (logsToday || []).length > 0;
        }

        // If teammate hasn't logged food today, dispatch peer pressure notification
        if (!hasLoggedToday) {
          notifiedUserIds.add(t.userId);
          await sendNotificationToUser(t.userId, {
            title: "Temanmu udah makan nih! 👀",
            body: `${actorName} baru aja nyatet makanannya. Kamu jangan mau kalah, yuk log makananmu!`,
            url: "/diary/add",
            tag: `friend-logged-${todayStr}`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      notifiedCount: notifiedUserIds.size,
    });
  } catch (err: any) {
    console.error("[trigger-friend-event Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to trigger event" },
      { status: 500 }
    );
  }
}
