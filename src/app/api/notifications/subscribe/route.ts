import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    const { endpoint, keys, userAgent } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    const p256dh = keys.p256dh;
    const auth = keys.auth;
    const agent = userAgent || request.headers.get("user-agent") || null;

    try {
      if (process.env.DATABASE_URL) {
        await db
          .insert(pushSubscriptions)
          .values({
            userId: user.id,
            endpoint,
            p256dh,
            auth,
            userAgent: agent,
          })
          .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: {
              userId: user.id,
              p256dh,
              auth,
              userAgent: agent,
              updatedAt: new Date(),
            },
          });
      } else {
        await supabase
          .from("push_subscriptions")
          .upsert(
            {
              user_id: user.id,
              endpoint,
              p256dh,
              auth,
              user_agent: agent,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "endpoint" }
          );
      }
    } catch (dbErr) {
      console.warn("[Subscribe API] DB write fallback to Supabase REST:", dbErr);
      await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint,
            p256dh,
            auth,
            user_agent: agent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" }
        );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Subscribe API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save subscription" },
      { status: 500 }
    );
  }
}
