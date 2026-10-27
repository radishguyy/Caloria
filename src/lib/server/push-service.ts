import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

let isVapidConfigured = false;

function ensureVapidDetails() {
  if (isVapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn(
      "[PushService] NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is not defined."
    );
    return;
  }

  webpush.setVapidDetails(
    "mailto:support@caloria.app",
    publicKey,
    privateKey
  );
  isVapidConfigured = true;
}

/**
 * Dispatches a push notification to all registered subscriptions of a user.
 * Automatically prunes invalid, expired, or revoked subscriptions (HTTP 404 / 410).
 */
export async function sendNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sentCount: number; prunedCount: number }> {
  ensureVapidDetails();

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return { success: false, sentCount: 0, prunedCount: 0 };
  }

  // 1. Fetch user's subscriptions (via Drizzle with Supabase REST fallback)
  let subscriptions: Array<{ id: string; endpoint: string; p256dh: string; auth: string }> = [];

  try {
    if (process.env.DATABASE_URL) {
      subscriptions = await db
        .select({
          id: pushSubscriptions.id,
          endpoint: pushSubscriptions.endpoint,
          p256dh: pushSubscriptions.p256dh,
          auth: pushSubscriptions.auth,
        })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
    } else {
      const supabase = await createClient();
      const { data } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId);
      subscriptions = data || [];
    }
  } catch (err) {
    console.warn("[PushService] Failed to query subscriptions via Drizzle, using Supabase client fallback:", err);
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId);
      subscriptions = data || [];
    } catch (fallbackErr) {
      console.error("[PushService] Failed to query subscriptions:", fallbackErr);
      return { success: false, sentCount: 0, prunedCount: 0 };
    }
  }

  if (subscriptions.length === 0) {
    return { success: true, sentCount: 0, prunedCount: 0 };
  }

  const notificationString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-192x192.png",
    url: payload.url || "/dashboard",
    tag: payload.tag || "caloria-notification",
  });

  let sentCount = 0;
  let prunedCount = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, notificationString);
        sentCount++;
      } catch (error: any) {
        // Automatic Pruning: HTTP 404 (Not Found) or 410 (Gone / Unsubscribed)
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`[PushService] Pruning expired subscription: ${sub.endpoint}`);
          prunedCount++;
          try {
            if (process.env.DATABASE_URL) {
              await db
                .delete(pushSubscriptions)
                .where(eq(pushSubscriptions.id, sub.id));
            } else {
              const supabase = await createClient();
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
            }
          } catch (deleteErr) {
            console.error("[PushService] Error pruning subscription:", deleteErr);
          }
        } else {
          console.warn(`[PushService] Failed to send push to ${sub.endpoint}:`, error.message);
        }
      }
    })
  );

  return { success: true, sentCount, prunedCount };
}
