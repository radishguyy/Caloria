"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/profile";
import { db } from "@/db";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";

/**
 * Returns the authenticated user's profile data for client-side rendering.
 * Used by the SessionProvider and any server component that needs profile info.
 *
 * Returns null when the user is not authenticated.
 */
export async function getProfileData() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Ensure profile exists (idempotent) — this is also where a fresh Google
  // user gets their first profile row.
  let profileRow;
  try {
    profileRow = await ensureProfileForUser({
      userId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    });
  } catch (err) {
    console.error("[getProfileData] ensureProfileForUser failed", err);
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    username: profileRow.profile.username,
    fullName: profileRow.profile.fullName,
    avatarUrl: profileRow.profile.avatarUrl,
    isOnboardingCompleted: profileRow.profile.isOnboardingCompleted,
  };
}

/**
 * Marks onboarding as complete for the current user and redirects to dashboard.
 */
export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  await db
    .update(profiles)
    .set({ isOnboardingCompleted: true, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  redirect("/dashboard");
}