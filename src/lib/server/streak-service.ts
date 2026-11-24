import { and, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { coopMembers, coopParties, profiles } from "@/db/schema";
import { STREAK_RULES } from "@/lib/constants";

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface NextStreakInput {
  prevLoggedDate: string | Date | null | undefined;
  targetDate: string;
  currentStreak: number;
  longestStreak: number;
  streakFreezes?: number;
}

export interface NextStreakResult {
  nextStreak: number;
  nextLongestStreak: number;
  nextLastLoggedDate: string;
  shouldIncrementConsecutiveLogs: boolean;
  wasReset: boolean;
  usedFreeze: boolean;
  frozenDate: string | null;
  remainingFreezes: number;
  brokenStreakSaved: number;
}

export interface EffectiveStreakInput {
  lastLoggedDate: string | Date | null | undefined;
  currentStreak: number;
  todayStr?: string;
  streakFreezes?: number;
  lastRestDayDate?: string | Date | null | undefined;
}

export interface EffectiveStreakResult {
  effectiveStreak: number;
  isExpired: boolean;
  isFreezeProtected: boolean;
  isRestProtected: boolean;
}

/**
 * Normalizes a Date or date-like string into `YYYY-MM-DD`.
 */
export function normalizeDateStr(
  value: string | Date | null | undefined
): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  const str = String(value).trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(str);
  return match ? match[1] : null;
}

/**
 * Parses a `YYYY-MM-DD` string into UTC midnight milliseconds.
 */
function parseDateUtcMs(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Formats UTC midnight milliseconds back into `YYYY-MM-DD`.
 */
function formatUtcMsToDateStr(utcMs: number): string {
  return new Date(utcMs).toISOString().split("T")[0];
}

/**
 * Returns today's calendar date (`YYYY-MM-DD`) in Asia/Jakarta (WIB, UTC+7).
 */
export function getJakartaTodayStr(now: Date = new Date()): string {
  return new Date(now.getTime() + JAKARTA_OFFSET_MS).toISOString().split("T")[0];
}

/**
 * Returns the signed calendar day difference (`toDateStr - fromDateStr`).
 */
export function diffCalendarDays(fromDateStr: string, toDateStr: string): number {
  const fromMs = parseDateUtcMs(fromDateStr);
  const toMs = parseDateUtcMs(toDateStr);
  return Math.round((toMs - fromMs) / MS_PER_DAY);
}

/**
 * Pure state machine computing the next personal streak values when a food log is saved.
 */
export function calculateNextStreakState(input: NextStreakInput): NextStreakResult {
  const prevDate = normalizeDateStr(input.prevLoggedDate);
  const targetDate = normalizeDateStr(input.targetDate) || getJakartaTodayStr();
  const currentStreak = Math.max(0, Math.trunc(input.currentStreak || 0));
  const longestStreak = Math.max(0, Math.trunc(input.longestStreak || 0));
  const streakFreezes = Math.max(0, Math.trunc(input.streakFreezes ?? 0));

  if (!prevDate) {
    const nextStreak = 1;
    return {
      nextStreak,
      nextLongestStreak: Math.max(longestStreak, nextStreak),
      nextLastLoggedDate: targetDate,
      shouldIncrementConsecutiveLogs: true,
      wasReset: false,
      usedFreeze: false,
      frozenDate: null,
      remainingFreezes: streakFreezes,
      brokenStreakSaved: 0,
    };
  }

  const diff = diffCalendarDays(prevDate, targetDate);

  if (diff === 0) {
    const nextStreak = Math.max(1, currentStreak);
    return {
      nextStreak,
      nextLongestStreak: Math.max(longestStreak, nextStreak),
      nextLastLoggedDate: prevDate,
      shouldIncrementConsecutiveLogs: currentStreak === 0,
      wasReset: false,
      usedFreeze: false,
      frozenDate: null,
      remainingFreezes: streakFreezes,
      brokenStreakSaved: 0,
    };
  }

  if (diff === 1) {
    const nextStreak = currentStreak + 1;
    return {
      nextStreak,
      nextLongestStreak: Math.max(longestStreak, nextStreak),
      nextLastLoggedDate: targetDate,
      shouldIncrementConsecutiveLogs: true,
      wasReset: false,
      usedFreeze: false,
      frozenDate: null,
      remainingFreezes: streakFreezes,
      brokenStreakSaved: 0,
    };
  }

  if (diff === 2 && currentStreak > 0 && streakFreezes > 0) {
    // Missed exactly 1 day, protected by 1 Streak Freeze
    const frozenDate = formatUtcMsToDateStr(parseDateUtcMs(prevDate) + MS_PER_DAY);
    const nextStreak = currentStreak + 1;
    return {
      nextStreak,
      nextLongestStreak: Math.max(longestStreak, nextStreak),
      nextLastLoggedDate: targetDate,
      shouldIncrementConsecutiveLogs: true,
      wasReset: false,
      usedFreeze: true,
      frozenDate,
      remainingFreezes: streakFreezes - 1,
      brokenStreakSaved: 0,
    };
  }

  if (diff > 1) {
    // Missed full day(s) without freeze protection -> reset to 1
    const nextStreak = 1;
    const brokenStreakSaved =
      currentStreak >= STREAK_RULES.REPAIR_MIN_BROKEN_STREAK ? currentStreak : 0;
    return {
      nextStreak,
      nextLongestStreak: Math.max(longestStreak, nextStreak),
      nextLastLoggedDate: targetDate,
      shouldIncrementConsecutiveLogs: true,
      wasReset: currentStreak > 0,
      usedFreeze: false,
      frozenDate: null,
      remainingFreezes: streakFreezes,
      brokenStreakSaved,
    };
  }

  // diff < 0: Backfilling a past date preserves newer streak/lastLoggedDate
  return {
    nextStreak: currentStreak,
    nextLongestStreak: Math.max(longestStreak, currentStreak),
    nextLastLoggedDate: prevDate,
    shouldIncrementConsecutiveLogs: false,
    wasReset: false,
    usedFreeze: false,
    frozenDate: null,
    remainingFreezes: streakFreezes,
    brokenStreakSaved: 0,
  };
}

/**
 * Pure helper to determine whether a stored streak is active, freeze/rest-protected, or expired.
 */
export function evaluateEffectiveStreak(
  input: EffectiveStreakInput
): EffectiveStreakResult {
  const currentStreak = Math.max(0, Math.trunc(input.currentStreak || 0));
  const lastDate = normalizeDateStr(input.lastLoggedDate);
  const lastRestDate = normalizeDateStr(input.lastRestDayDate);
  const todayStr = input.todayStr || getJakartaTodayStr();
  const streakFreezes = Math.max(0, Math.trunc(input.streakFreezes ?? 0));

  if (currentStreak <= 0) {
    return {
      effectiveStreak: 0,
      isExpired: false,
      isFreezeProtected: false,
      isRestProtected: false,
    };
  }

  if (lastRestDate) {
    const daysSinceRest = diffCalendarDays(lastRestDate, todayStr);
    if (daysSinceRest === 0 || daysSinceRest === 1) {
      return {
        effectiveStreak: currentStreak,
        isExpired: false,
        isFreezeProtected: false,
        isRestProtected: true,
      };
    }
  }

  if (!lastDate) {
    return {
      effectiveStreak: 0,
      isExpired: false,
      isFreezeProtected: false,
      isRestProtected: false,
    };
  }

  const daysSinceLastLog = diffCalendarDays(lastDate, todayStr);

  if (daysSinceLastLog === 2 && streakFreezes > 0) {
    return {
      effectiveStreak: currentStreak,
      isExpired: false,
      isFreezeProtected: true,
      isRestProtected: false,
    };
  }

  if (daysSinceLastLog > 1) {
    return {
      effectiveStreak: 0,
      isExpired: true,
      isFreezeProtected: false,
      isRestProtected: false,
    };
  }

  return {
    effectiveStreak: currentStreak,
    isExpired: false,
    isFreezeProtected: false,
    isRestProtected: false,
  };
}

/**
 * Updates personal streak (with auto-freeze, milestones, broken-streak snapshot, and co-op sync) in PostgreSQL.
 */
export async function recordFoodLogStreak(
  userId: string,
  targetDate: string,
  options: { bonusCoins?: number } = {}
): Promise<{
  currentStreak: number;
  longestStreak: number;
  wasReset: boolean;
  usedFreeze: boolean;
  streakFreezes: number;
}> {
  const normalizedTarget = normalizeDateStr(targetDate) || getJakartaTodayStr();
  const bonusCoins = options.bonusCoins ?? 0;

  const [profile] = await db
    .select({
      currentStreakDays: profiles.currentStreakDays,
      streakCount: profiles.streakCount,
      longestStreakDays: profiles.longestStreakDays,
      lastLoggedDate: profiles.lastLoggedDate,
      streakFreezes: profiles.streakFreezes,
      restPasses: profiles.restPasses,
      lastRestDayDate: profiles.lastRestDayDate,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      wasReset: false,
      usedFreeze: false,
      streakFreezes: 0,
    };
  }

  const baselineStreak = Math.max(profile.currentStreakDays, profile.streakCount);
  const next = calculateNextStreakState({
    prevLoggedDate: profile.lastLoggedDate,
    targetDate: normalizedTarget,
    currentStreak: baselineStreak,
    longestStreak: profile.longestStreakDays,
    streakFreezes: profile.streakFreezes,
  });

  // Streak Society Milestone Rewards
  let updatedFreezes = next.remainingFreezes;
  let milestoneCoins = 0;

  if (baselineStreak < 7 && next.nextStreak >= 7) {
    updatedFreezes = Math.min(STREAK_RULES.MAX_FREEZE_COUNT, updatedFreezes + 1);
  }
  if (baselineStreak < 30 && next.nextStreak >= 30) {
    milestoneCoins += 150;
  }
  if (baselineStreak < 100 && next.nextStreak >= 100) {
    milestoneCoins += 500;
  }

  const totalCoinReward = bonusCoins + milestoneCoins;

  await db
    .update(profiles)
    .set({
      lastLoggedDate: next.nextLastLoggedDate,
      currentStreakDays: next.nextStreak,
      streakCount: next.nextStreak,
      streakConsecutiveLogs: next.wasReset
        ? 1
        : next.shouldIncrementConsecutiveLogs
          ? sql`${profiles.streakConsecutiveLogs} + 1`
          : profiles.streakConsecutiveLogs,
      longestStreakDays: next.nextLongestStreak,
      streakFreezes: updatedFreezes,
      ...(next.usedFreeze && next.frozenDate
        ? { lastFreezeUsedDate: next.frozenDate }
        : {}),
      ...(next.brokenStreakSaved > 0
        ? {
            brokenStreakCount: next.brokenStreakSaved,
            brokenStreakAt: new Date(),
          }
        : next.nextStreak >= STREAK_RULES.REPAIR_MIN_BROKEN_STREAK
          ? {
              brokenStreakCount: 0,
              brokenStreakAt: null,
            }
          : {}),
      ...(totalCoinReward > 0
        ? { caloriaCoins: sql`${profiles.caloriaCoins} + ${totalCoinReward}` }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));

  // Sync Co-op party progress only when logging for today (WIB)
  const jakartaToday = getJakartaTodayStr();
  if (normalizedTarget === jakartaToday) {
    try {
      await db
        .update(coopMembers)
        .set({ hasCompletedToday: true })
        .where(eq(coopMembers.userId, userId));

      const memberships = await db
        .select({ groupId: coopMembers.groupId })
        .from(coopMembers)
        .where(eq(coopMembers.userId, userId));

      const groupIds = Array.from(new Set(memberships.map((m) => m.groupId)));

      if (groupIds.length > 0) {
        const parties = await db
          .select()
          .from(coopParties)
          .where(inArray(coopParties.id, groupIds));

        for (const party of parties) {
          const memberRows = await db
            .select({
              memberId: coopMembers.id,
              userId: coopMembers.userId,
              hasCompletedToday: coopMembers.hasCompletedToday,
              lastLoggedDate: profiles.lastLoggedDate,
              lastRestDayDate: profiles.lastRestDayDate,
            })
            .from(coopMembers)
            .innerJoin(profiles, eq(coopMembers.userId, profiles.id))
            .where(eq(coopMembers.groupId, party.id));

          // Reconcile stale `hasCompletedToday` flags from previous dates
          const staleIds: string[] = [];
          const activeTodayIds: string[] = [];
          let allCompletedToday = memberRows.length > 0;

          for (const m of memberRows) {
            const memberLastLog = normalizeDateStr(m.lastLoggedDate);
            const memberLastRest = normalizeDateStr(m.lastRestDayDate);
            const isActiveToday =
              memberLastLog === jakartaToday || memberLastRest === jakartaToday;

            if (!isActiveToday) {
              allCompletedToday = false;
              if (m.hasCompletedToday) staleIds.push(m.memberId);
            } else if (!m.hasCompletedToday) {
              activeTodayIds.push(m.memberId);
            }
          }

          if (staleIds.length > 0) {
            await db
              .update(coopMembers)
              .set({ hasCompletedToday: false })
              .where(inArray(coopMembers.id, staleIds));
          }
          if (activeTodayIds.length > 0) {
            await db
              .update(coopMembers)
              .set({ hasCompletedToday: true })
              .where(inArray(coopMembers.id, activeTodayIds));
          }

          const lastPartyDate = normalizeDateStr(party.lastStreakDate);
          if (lastPartyDate === jakartaToday) continue;

          if (allCompletedToday) {
            const isConsecutive =
              lastPartyDate !== null &&
              diffCalendarDays(lastPartyDate, jakartaToday) === 1;
            const nextPartyStreak = isConsecutive ? party.streakCount + 1 : 1;

            await db
              .update(coopParties)
              .set({
                streakCount: nextPartyStreak,
                lastStreakDate: jakartaToday,
                updatedAt: new Date(),
              })
              .where(eq(coopParties.id, party.id));
          }
        }
      }
    } catch (err) {
      console.warn("[StreakService] Co-op streak sync warning:", err);
    }
  }

  return {
    currentStreak: next.nextStreak,
    longestStreak: next.nextLongestStreak,
    wasReset: next.wasReset,
    usedFreeze: next.usedFreeze,
    streakFreezes: updatedFreezes,
  };
}

/**
 * Resets expired personal and co-op streaks while respecting Freeze & Rest Day protection.
 */
export async function syncExpiredStreaks(
  todayStr: string = getJakartaTodayStr()
): Promise<{ profilesReset: number; partiesReset: number }> {
  const todayUtcMs = parseDateUtcMs(todayStr);
  const yesterdayStr = formatUtcMsToDateStr(todayUtcMs - MS_PER_DAY);
  const twoDaysAgoStr = formatUtcMsToDateStr(todayUtcMs - 2 * MS_PER_DAY);

  let profilesReset = 0;
  let partiesReset = 0;

  try {
    const resetProfiles = await db
      .update(profiles)
      .set({
        brokenStreakCount: sql`CASE WHEN GREATEST(${profiles.currentStreakDays}, ${profiles.streakCount}) >= ${STREAK_RULES.REPAIR_MIN_BROKEN_STREAK} THEN GREATEST(${profiles.currentStreakDays}, ${profiles.streakCount}) ELSE ${profiles.brokenStreakCount} END`,
        brokenStreakAt: sql`CASE WHEN GREATEST(${profiles.currentStreakDays}, ${profiles.streakCount}) >= ${STREAK_RULES.REPAIR_MIN_BROKEN_STREAK} THEN NOW() ELSE ${profiles.brokenStreakAt} END`,
        currentStreakDays: 0,
        streakCount: 0,
        streakConsecutiveLogs: 0,
        updatedAt: new Date(),
      })
      .where(
        and(
          or(gt(profiles.currentStreakDays, 0), gt(profiles.streakCount, 0)),
          or(
            lt(profiles.lastLoggedDate, twoDaysAgoStr),
            and(
              eq(profiles.lastLoggedDate, twoDaysAgoStr),
              lt(profiles.streakFreezes, 1)
            )
          ),
          or(
            isNull(profiles.lastRestDayDate),
            lt(profiles.lastRestDayDate, yesterdayStr)
          )
        )
      )
      .returning({ id: profiles.id });

    profilesReset = resetProfiles.length;

    const resetParties = await db
      .update(coopParties)
      .set({
        streakCount: 0,
        updatedAt: new Date(),
      })
      .where(
        and(
          gt(coopParties.streakCount, 0),
          lt(coopParties.lastStreakDate, yesterdayStr)
        )
      )
      .returning({ id: coopParties.id });

    partiesReset = resetParties.length;
  } catch (err) {
    console.warn("[StreakService] syncExpiredStreaks warning:", err);
  }

  return { profilesReset, partiesReset };
}
