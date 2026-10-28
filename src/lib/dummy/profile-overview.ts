/**
 * Profile overview data source.
 *
 * Flip USE_DUMMY_PROFILE_DATA to false to read the live stores again.
 * Both branches return the exact same shape so the page never changes.
 */

import { useFoodStore } from "@/store/use-food-store";
import { useWeightStore } from "@/store/use-weight-store";
import { calculateBmi } from "@/lib/nutrition-calculator";
import { formatDateKey, parseDateKey, subDays } from "@/lib/date-utils";

export const USE_DUMMY_PROFILE_DATA = true;

export type BmiCategory =
  | "Underweight"
  | "Normal"
  | "Overweight"
  | "Obese I"
  | "Obese II";

export interface ProfileWeightLog {
  id: string;
  date: string;
  weightKg: number;
}

export interface ProfileOverviewData {
  heightCm: number;
  startWeightKg: number;
  targetWeightKg: number;
  totalProgramDays: number;
  programStartDate: string;
  currentWeightKg: number;
  bmiScore: number;
  bmiCategory: BmiCategory;
  currentDay: number;
  logs: ProfileWeightLog[];
}

/** WHO Asia-Pacific style cutoffs used by the profile summary. */
export function getBmiCategory(score: number): BmiCategory {
  if (score < 18.5) return "Underweight";
  if (score < 23) return "Normal";
  if (score < 25) return "Overweight";
  if (score < 30) return "Obese I";
  return "Obese II";
}

function daysBetween(startDateKey: string, endDateKey: string): number {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function getProgramDay(
  startDateKey: string,
  totalDays: number,
  todayKey: string
): number {
  const raw = daysBetween(startDateKey, todayKey) + 1;
  return Math.min(Math.max(raw, 1), Math.max(totalDays, 1));
}

export function getWeekNumber(startDateKey: string, logDateKey: string): number {
  return Math.max(1, Math.floor(daysBetween(startDateKey, logDateKey) / 7) + 1);
}

/** dd/mm/yy, e.g. 01/10/26 */
export function formatLogDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return dateKey;
  return `${day}/${month}/${year.slice(2)}`;
}

/** dd/mm, used for the chart x-axis. */
export function formatDayMonth(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  if (!month || !day) return dateKey;
  return `${day}/${month}`;
}

/** 75.0 -> "75", 74.40 -> "74.4" */
export function formatWeightValue(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function buildDummyOverview(today: Date): ProfileOverviewData {
  const heightCm = 172;
  const targetWeightKg = 68;
  const totalProgramDays = 108;
  const programStartDate = formatDateKey(subDays(today, 49));
  const weeklyWeights = [75.0, 74.4, 73.9, 73.6, 73.6, 73.0, 72.5, 72.1];

  const logs: ProfileWeightLog[] = weeklyWeights.map((weightKg, index) => ({
    id: `dummy-log-${index}`,
    date: formatDateKey(subDays(today, 49 - index * 7)),
    weightKg,
  }));

  const currentWeightKg = logs[logs.length - 1].weightKg;
  const bmiScore = calculateBmi(heightCm, currentWeightKg).score;

  return {
    heightCm,
    startWeightKg: weeklyWeights[0],
    targetWeightKg,
    totalProgramDays,
    programStartDate,
    currentWeightKg,
    bmiScore,
    bmiCategory: getBmiCategory(bmiScore),
    currentDay: getProgramDay(programStartDate, totalProgramDays, formatDateKey(today)),
    logs,
  };
}

function buildRealOverview(today: Date): ProfileOverviewData {
  const { goalPlan } = useFoodStore.getState();
  const { weightLogs } = useWeightStore.getState();

  const logs: ProfileWeightLog[] = [...weightLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ id, date, weightKg }) => ({ id, date, weightKg }));

  const currentWeightKg = logs.length
    ? logs[logs.length - 1].weightKg
    : goalPlan.currentWeightKg;
  const startWeightKg = logs.length ? logs[0].weightKg : goalPlan.currentWeightKg;
  const bmiScore = calculateBmi(goalPlan.heightCm, currentWeightKg).score;

  return {
    heightCm: goalPlan.heightCm,
    startWeightKg,
    targetWeightKg: goalPlan.targetWeightKg,
    totalProgramDays: goalPlan.totalProjectedDays,
    programStartDate: goalPlan.startDate,
    currentWeightKg,
    bmiScore,
    bmiCategory: getBmiCategory(bmiScore),
    currentDay: getProgramDay(
      goalPlan.startDate,
      goalPlan.totalProjectedDays,
      formatDateKey(today)
    ),
    logs,
  };
}

export function getProfileOverview(today: Date = new Date()): ProfileOverviewData {
  return USE_DUMMY_PROFILE_DATA ? buildDummyOverview(today) : buildRealOverview(today);
}
