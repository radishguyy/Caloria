import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerFriendLoggedNotification } from "@/lib/server/push-service";

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

    let userId = user?.id;

    // Allow internal service calls authenticated via CRON_SECRET or authorization header
    if (!userId) {
      const authHeader = request.headers.get("authorization");
      const cronSecret = process.env.CRON_SECRET;
      if (
        cronSecret &&
        (authHeader === `Bearer ${cronSecret}` ||
          request.headers.get("x-cron-secret") === cronSecret)
      ) {
        const body = await request.json().catch(() => ({}));
        userId = body.userId;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await triggerFriendLoggedNotification(userId);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[trigger-friend-event Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to trigger event" },
      { status: 500 }
    );
  }
}
