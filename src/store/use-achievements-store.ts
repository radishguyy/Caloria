import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENTS_DATA, AchievementBadge } from "@/lib/achievements-data";

interface AchievementsStoreState {
  unlockedBadgeIds: string[];
  newlyUnlockedBadge: AchievementBadge | null;

  // Actions
  unlockBadge: (badgeId: string, addCoinsCallback?: (coins: number) => void) => boolean;
  clearNewlyUnlockedBadge: () => void;
  checkAutomaticUnlocks: (stats: {
    currentStreak: number;
    highestStreak: number;
    totalLogsCount: number;
    hasReachedWeightTarget: boolean;
    friendsCount: number;
    pokesCount: number;
  }, addCoinsCallback?: (coins: number) => void) => AchievementBadge[];
}

export const useAchievementsStore = create<AchievementsStoreState>()(
  persist(
    (set, get) => ({
      unlockedBadgeIds: [
        "badge-consistency-3",
        "badge-consistency-7",
        "badge-coop-starter",
      ],
      newlyUnlockedBadge: null,

      unlockBadge: (badgeId: string, addCoinsCallback?: (coins: number) => void) => {
        if (get().unlockedBadgeIds.includes(badgeId)) return false;

        const badge = ACHIEVEMENTS_DATA.find((b) => b.id === badgeId);
        if (!badge) return false;

        set((state) => ({
          unlockedBadgeIds: [...state.unlockedBadgeIds, badgeId],
          newlyUnlockedBadge: badge,
        }));

        if (addCoinsCallback && badge.rewardCoins > 0) {
          addCoinsCallback(badge.rewardCoins);
        }

        return true;
      },

      clearNewlyUnlockedBadge: () => set({ newlyUnlockedBadge: null }),

      checkAutomaticUnlocks: (stats, addCoinsCallback) => {
        const newlyUnlocked: AchievementBadge[] = [];

        // Check consistency streaks
        if (stats.currentStreak >= 3 && !get().unlockedBadgeIds.includes("badge-consistency-3")) {
          if (get().unlockBadge("badge-consistency-3", addCoinsCallback)) {
            const b = ACHIEVEMENTS_DATA.find((x) => x.id === "badge-consistency-3");
            if (b) newlyUnlocked.push(b);
          }
        }
        if (stats.currentStreak >= 7 && !get().unlockedBadgeIds.includes("badge-consistency-7")) {
          if (get().unlockBadge("badge-consistency-7", addCoinsCallback)) {
            const b = ACHIEVEMENTS_DATA.find((x) => x.id === "badge-consistency-7");
            if (b) newlyUnlocked.push(b);
          }
        }
        if (stats.currentStreak >= 30 && !get().unlockedBadgeIds.includes("badge-consistency-30")) {
          if (get().unlockBadge("badge-consistency-30", addCoinsCallback)) {
            const b = ACHIEVEMENTS_DATA.find((x) => x.id === "badge-consistency-30");
            if (b) newlyUnlocked.push(b);
          }
        }
        if (stats.currentStreak >= 100 && !get().unlockedBadgeIds.includes("badge-consistency-100")) {
          if (get().unlockBadge("badge-consistency-100", addCoinsCallback)) {
            const b = ACHIEVEMENTS_DATA.find((x) => x.id === "badge-consistency-100");
            if (b) newlyUnlocked.push(b);
          }
        }

        // Check goal weight target
        if (stats.hasReachedWeightTarget && !get().unlockedBadgeIds.includes("badge-goal-finisher")) {
          if (get().unlockBadge("badge-goal-finisher", addCoinsCallback)) {
            const b = ACHIEVEMENTS_DATA.find((x) => x.id === "badge-goal-finisher");
            if (b) newlyUnlocked.push(b);
          }
        }

        // Check social co-op starter
        if (stats.friendsCount >= 1 && !get().unlockedBadgeIds.includes("badge-coop-starter")) {
          if (get().unlockBadge("badge-coop-starter", addCoinsCallback)) {
            const b = ACHIEVEMENTS_DATA.find((x) => x.id === "badge-coop-starter");
            if (b) newlyUnlocked.push(b);
          }
        }

        // Check duo unstoppable (14-day streak with friend)
        if (stats.highestStreak >= 14 && !get().unlockedBadgeIds.includes("badge-duo-unstoppable")) {
          if (get().unlockBadge("badge-duo-unstoppable", addCoinsCallback)) {
            const b = ACHIEVEMENTS_DATA.find((x) => x.id === "badge-duo-unstoppable");
            if (b) newlyUnlocked.push(b);
          }
        }

        // Check poke master (5 pokes)
        if (stats.pokesCount >= 5 && !get().unlockedBadgeIds.includes("badge-senggol-master")) {
          if (get().unlockBadge("badge-senggol-master", addCoinsCallback)) {
            const b = ACHIEVEMENTS_DATA.find((x) => x.id === "badge-senggol-master");
            if (b) newlyUnlocked.push(b);
          }
        }

        return newlyUnlocked;
      },
    }),
    {
      name: "caloria-achievements-storage",
    }
  )
);

