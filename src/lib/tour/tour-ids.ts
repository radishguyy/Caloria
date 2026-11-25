import type { TourId } from "./types";

export const ALL_TOUR_IDS: readonly TourId[] = [
  "dashboard",
  "diary",
  "diary-add",
  "diary-archive",
  "quests",
  "wardrobe",
  "shop",
  "social",
  "profile",
  "settings",
] as const;

export function buildSeenRecord(
  seen: Partial<Record<TourId, boolean>>,
): Record<TourId, boolean> {
  const result = {} as Record<TourId, boolean>;
  for (const id of ALL_TOUR_IDS) {
    result[id] = Boolean(seen[id]);
  }
  return result;
}
