import webpush from "web-push";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  pushSubscriptions,
  coopMembers,
  profiles,
  foodLogs,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { sendEmailNotificationToUser } from "@/lib/server/email-service";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  actionText?: string;
}

export type PushNotificationPayload = NotificationPayload;

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
 * Dispatches a notification to all registered subscriptions of a user,
 * and simultaneously sends an email notification.
 * Automatically prunes invalid, expired, or revoked subscriptions (HTTP 404 / 410).
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload,
  options: { sendPush?: boolean; sendEmail?: boolean } = { sendPush: true, sendEmail: true }
): Promise<{ success: boolean; sentCount: number; prunedCount: number; emailSent: boolean }> {
  ensureVapidDetails();

  const shouldSendPush = options.sendPush !== false;
  const shouldSendEmail = options.sendEmail !== false;

  let emailSent = false;
  let sentCount = 0;
  let prunedCount = 0;

  // Run Email notification dispatch in parallel if enabled
  const emailPromise = shouldSendEmail
    ? sendEmailNotificationToUser(userId, {
        title: payload.title,
        body: payload.body,
        url: payload.url,
        actionText: payload.actionText,
      })
        .then((res) => {
          emailSent = !!res.success;
        })
        .catch((err) => {
          console.warn(`[PushService] Failed to send email to user ${userId}:`, err);
        })
    : Promise.resolve();

  // Web Push Dispatch
  const pushPromise = (async () => {
    if (!shouldSendPush) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return;
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
        return;
      }
    }

    if (subscriptions.length === 0) {
      return;
    }

    const notificationString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/icon-192x192.png",
      url: payload.url || "/dashboard",
      tag: payload.tag || "caloria-notification",
    });

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
          const statusCode = error?.statusCode || error?.status;
          // Automatic Pruning: HTTP 404 (Not Found) or 410 (Gone / Unsubscribed)
          if (statusCode === 404 || statusCode === 410) {
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
            console.warn(`[PushService] Failed to send push to ${sub.endpoint}:`, error?.message || error);
          }
        }
      })
    );
  })();

  await Promise.allSettled([pushPromise, emailPromise]);

  return { success: sentCount > 0 || emailSent, sentCount, prunedCount, emailSent };
}

/**
 * Scenario 2: Friend Logged, User Behind (Peer Pressure Trigger)
 * Triggered when User A logs food. Checks User A's co-op teammates.
 * If a teammate has 0 logs today, dispatches:
 *   Title: "Temanmu udah makan nih! 👀"
 *   Body: "{friend_name} baru aja nyatet makanannya. Kamu jangan mau kalah, yuk log makananmu!"
 *   URL: "/diary/add"
 */
export async function triggerFriendLoggedNotification(actorUserId: string): Promise<{
  success: boolean;
  notifiedCount: number;
}> {
  try {
    const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

    // 1. Fetch current actor's name
    let actorName = "Temanmu";
    if (process.env.DATABASE_URL) {
      const [actor] = await db
        .select({ fullName: profiles.fullName, username: profiles.username })
        .from(profiles)
        .where(eq(profiles.id, actorUserId))
        .limit(1);
      actorName = actor?.fullName || actor?.username || "Temanmu";
    } else {
      const supabase = await createClient();
      const { data: actor } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", actorUserId)
        .maybeSingle();
      actorName = actor?.full_name || actor?.username || "Temanmu";
    }

    // 2. Find groups that actor belongs to
    let userGroups: Array<{ groupId: string }> = [];
    if (process.env.DATABASE_URL) {
      userGroups = await db
        .select({ groupId: coopMembers.groupId })
        .from(coopMembers)
        .where(eq(coopMembers.userId, actorUserId));
    } else {
      const supabase = await createClient();
      const { data } = await supabase
        .from("coop_members")
        .select("group_id")
        .eq("user_id", actorUserId);
      userGroups = (data || []).map((g: any) => ({ groupId: g.group_id }));
    }

    if (userGroups.length === 0) {
      return { success: true, notifiedCount: 0 };
    }

    const groupIds = userGroups.map((g) => g.groupId);
    const notifiedUserIds = new Set<string>();

    for (const gId of groupIds) {
      let teammates: Array<{ userId: string }> = [];
      if (process.env.DATABASE_URL) {
        teammates = await db
          .select({ userId: coopMembers.userId })
          .from(coopMembers)
          .where(and(eq(coopMembers.groupId, gId), sql`${coopMembers.userId} != ${actorUserId}`));
      } else {
        const supabase = await createClient();
        const { data } = await supabase
          .from("coop_members")
          .select("user_id")
          .eq("group_id", gId)
          .neq("user_id", actorUserId);
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
          const supabase = await createClient();
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

    return { success: true, notifiedCount: notifiedUserIds.size };
  } catch (err: any) {
    console.error("[triggerFriendLoggedNotification Error]:", err);
    return { success: false, notifiedCount: 0 };
  }
}
