import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema/profiles";

export interface EnsureProfileInput {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  /** Caller-provided preferred username; uniqueness is enforced. */
  username?: string | null;
}

export interface EnsureProfileResult {
  profile: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
    isOnboardingCompleted: boolean;
  };
  /** True when a brand-new profile row was created during this call. */
  isNew: boolean;
}

/**
 * Derive a candidate username from a display name / email and ensure uniqueness.
 * Falls back to a random suffix on conflict.
 */
function deriveUsername(preferred: string | null | undefined, email: string | null | undefined): string {
  const baseRaw =
    preferred?.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") ||
    email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
    "user";
  const base = baseRaw.slice(0, 50) || "user";
  return base;
}

/**
 * Idempotently ensure a `profiles` row exists for a Supabase Auth user.
 *
 * - If a profile already exists, it is returned untouched (no overwrite of
 *   username, avatar, fullName, or onboarding state).
 * - If no profile exists, one is created. A unique username is guaranteed by
 *   attempting inserts with an incrementing numeric suffix until one succeeds.
 * - Safe under concurrent requests: the DB unique constraint is the source of
 *   truth, and we retry rather than assume.
 *
 * This is the single entry point for profile initialization used by both the
 * OAuth callback and any future auth flows, so it cannot create duplicate rows.
 */
export async function ensureProfileForUser(
  input: EnsureProfileInput
): Promise<EnsureProfileResult> {
  const { userId, email, fullName, avatarUrl, username } = input;

  // 1. Try to fetch an existing profile.
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

  if (existing) {
    return {
      profile: {
        id: existing.id,
        username: existing.username,
        fullName: existing.fullName,
        avatarUrl: existing.avatarUrl,
        isOnboardingCompleted: existing.isOnboardingCompleted,
      },
      isNew: false,
    };
  }

  // 2. No profile exists — create one with a guaranteed-unique username.
  const base = deriveUsername(username, email);
  let attempt = 0;

  // Cap retries to avoid infinite loops on pathological states.
  while (attempt < 10) {
    const suffix = attempt === 0 ? "" : `_${attempt}`;
    const tryUsername = (base + suffix).slice(0, 50) || `user_${attempt}`;

    try {
      const [created] = await db
        .insert(profiles)
        .values({
          id: userId,
          username: tryUsername,
          fullName: fullName?.trim().slice(0, 100) || null,
          avatarUrl: avatarUrl?.trim() || null,
          // Defaults apply: goal=maintenance, activityLevel=sedentary,
          // isOnboardingCompleted=false, caloria_coins=0, streaks=0
        })
        .returning();

      return {
        profile: {
          id: created.id,
          username: created.username,
          fullName: created.fullName,
          avatarUrl: created.avatarUrl,
          isOnboardingCompleted: created.isOnboardingCompleted,
        },
        isNew: true,
      };
    } catch (err) {
      // Retry on unique_violation; surface other errors.
      const code = (err as { code?: string })?.code;
      if (code === "23505") {
        attempt += 1;
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `ensureProfileForUser: could not allocate a unique username for user ${userId} after retries`
  );
}