export interface RecapMilestoneStatus {
  isAvailable: boolean;
  type: "weekly" | "monthly";
  cycleNumber: number;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  targetWeek: number;
}

/**
 * Pure cadence logic to determine if a recap milestone is ready to unlock
 * or if the user must wait, strictly calculated from registration date in 7-day intervals.
 */
export function checkRecapEligibility(
  userCreatedAt: Date,
  existingRecapsCount: number
): RecapMilestoneStatus {
  const now = new Date();
  const createdAtTime = new Date(userCreatedAt).getTime();
  const daysSinceJoin = Math.max(
    0,
    Math.floor((now.getTime() - createdAtTime) / (1000 * 60 * 60 * 24))
  );

  const targetWeek = Math.max(1, existingRecapsCount + 1);
  const targetUnlockDay = targetWeek * 7;
  const daysRemaining = Math.max(0, targetUnlockDay - daysSinceJoin);
  const isAvailable = daysSinceJoin >= targetUnlockDay;

  const isMonthly = targetWeek > 0 && targetWeek % 4 === 0;

  const startDate = new Date(createdAtTime + (targetWeek - 1) * 7 * 86400000);
  const endDate = new Date(createdAtTime + targetWeek * 7 * 86400000);

  return {
    isAvailable,
    type: isMonthly ? "monthly" : "weekly",
    cycleNumber: isMonthly ? Math.floor(targetWeek / 4) : targetWeek,
    startDate,
    endDate,
    daysRemaining,
    targetWeek,
  };
}

/**
 * Checks eligibility for a specific target week number regardless of existing recaps count.
 */
export function checkSpecificWeekEligibility(
  userCreatedAt: Date,
  weekNumber: number
): RecapMilestoneStatus {
  const now = new Date();
  const createdAtTime = new Date(userCreatedAt).getTime();
  const daysSinceJoin = Math.max(
    0,
    Math.floor((now.getTime() - createdAtTime) / (1000 * 60 * 60 * 24))
  );

  const targetUnlockDay = weekNumber * 7;
  const daysRemaining = Math.max(0, targetUnlockDay - daysSinceJoin);
  const isAvailable = daysSinceJoin >= targetUnlockDay;
  const isMonthly = weekNumber > 0 && weekNumber % 4 === 0;

  const startDate = new Date(createdAtTime + (weekNumber - 1) * 7 * 86400000);
  const endDate = new Date(createdAtTime + weekNumber * 7 * 86400000);

  return {
    isAvailable,
    type: isMonthly ? "monthly" : "weekly",
    cycleNumber: isMonthly ? Math.floor(weekNumber / 4) : weekNumber,
    startDate,
    endDate,
    daysRemaining,
    targetWeek: weekNumber,
  };
}

/**
 * Formats date range in Indonesian locale (e.g., "7 Okt - 14 Okt 2026")
 */
export function formatRecapDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startFormatted = start.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  const endFormatted = end.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startFormatted} – ${endFormatted}`;
}

