import { STREAK_RULES } from "@/lib/constants";

export type StreakSocietyTierId = "none" | "bronze" | "silver" | "gold";

export interface StreakSocietyTier {
  tier: Exclude<StreakSocietyTierId, "none">;
  minDays: number;
  label: string;
  rewardText: string;
}

export const STREAK_SOCIETY_TIERS: readonly StreakSocietyTier[] = [
  {
    tier: "bronze",
    minDays: 7,
    label: "Api Pemula",
    rewardText: "+1 Streak Freeze",
  },
  {
    tier: "silver",
    minDays: 30,
    label: "Penjaga Nutrisi",
    rewardText: "+150 Koin",
  },
  {
    tier: "gold",
    minDays: 100,
    label: "Legenda Caloria",
    rewardText: "+500 Koin",
  },
] as const;

/**
 * Returns the highest Streak Society tier unlocked for `days`, or `null` if `< 7`.
 */
export function getStreakSocietyTier(days: number): StreakSocietyTier | null {
  const cleanDays = Math.max(0, Math.trunc(days || 0));
  let unlocked: StreakSocietyTier | null = null;
  for (const tier of STREAK_SOCIETY_TIERS) {
    if (cleanDays >= tier.minDays) {
      unlocked = tier;
    }
  }
  return unlocked;
}

/**
 * Checks whether a broken streak can still be repaired within the 48-hour recovery window.
 */
export function isRepairEligible(
  brokenStreakCount: number,
  brokenStreakAt: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!brokenStreakAt || brokenStreakCount < STREAK_RULES.REPAIR_MIN_BROKEN_STREAK) {
    return false;
  }
  const brokenMs =
    brokenStreakAt instanceof Date
      ? brokenStreakAt.getTime()
      : new Date(brokenStreakAt).getTime();
  if (!Number.isFinite(brokenMs)) {
    return false;
  }
  const diffHours = (now.getTime() - brokenMs) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= STREAK_RULES.REPAIR_WINDOW_HOURS;
}
