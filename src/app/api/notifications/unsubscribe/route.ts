import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Missing endpoint" },
        { status: 400 }
      );
    }

    try {
      if (process.env.DATABASE_URL) {
        await db
          .delete(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.endpoint, endpoint),
              eq(pushSubscriptions.userId, user.id)
            )
          );
      } else {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", endpoint)
          .eq("user_id", user.id);
      }
    } catch (dbErr) {
      console.warn("[Unsubscribe API] DB fallback:", dbErr);
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Unsubscribe API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
