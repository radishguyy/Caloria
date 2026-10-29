"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useSocialStore } from "@/store/use-social-store";
import { useWeightStore } from "@/store/use-weight-store";
import { useAchievementsStore } from "@/store/use-achievements-store";
import { createClient } from "@/lib/supabase/client";
import { fetchAppInitialDataAction } from "@/app/actions/profile";
import { claimDailyLoginRewardAction } from "@/server/actions/pet-actions";
import { toastDailyLoginReward } from "@/lib/toast";

async function hydrateStoresFromDatabase() {
  try {
    const data = await fetchAppInitialDataAction();
    if (!data || !data.authenticated || !data.user) {
      useAuthStore.getState().clearUser();
      return;
    }

    // 1. Hydrate Auth
    useAuthStore.getState().setUserFromSession(data.user);

    // 2. Hydrate Food & Biometrics Store
    if (data.profile) {
      useFoodStore.getState().setGoalPlan({
        currentWeightKg: data.profile.currentWeightKg,
        targetWeightKg: data.profile.targetWeightKg,
        heightCm: data.profile.heightCm,
        goalPath: data.profile.goalPath as any,
        currentLevel: data.profile.currentLevel,
        currentWeek: data.profile.currentWeek,
        streakConsecutiveLogs: data.profile.streakConsecutiveLogs,
        totalProjectedDays: data.profile.projectedDays,
      });

      useFoodStore.getState().setTargets({
        calories: data.profile.targetCaloriesKcal,
        protein: data.profile.targetProteinG,
        carbs: data.profile.targetCarbsG,
        fat: data.profile.targetFatG,
      });

      useFoodStore.getState().setQuestProgression({
        goalPath: data.profile.goalPath as any,
        currentLevel: data.profile.currentLevel,
        currentWeek: data.profile.currentWeek,
      });
    }

    if (data.foodLogs && data.foodLogs.length > 0) {
      useFoodStore.getState().setLogs(data.foodLogs as any);
    }

    // 3. Hydrate Pet Store
    if (data.pet) {
      usePetStore.getState().setPetState({
        name: data.pet.name,
        species: data.pet.species,
        stage: data.pet.stage,
        level: data.pet.level,
        exp: data.pet.exp,
        hunger: data.pet.hunger,
        happiness: data.pet.happiness,
        coins: data.pet.coins,
        lastFedAt: data.pet.lastFedAt,
        moodStatus: data.pet.moodStatus,
        customColors: data.pet.customColors,
      });
    }

    // Daily Login Reward Check (awarded on first session launch of the day)
    try {
      const todayKey = new Date().toISOString().split("T")[0];
      const claimStorageKey = `caloria_daily_login_claimed_${todayKey}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(claimStorageKey)) {
        const rewardRes = await claimDailyLoginRewardAction();
        if (rewardRes.success && !rewardRes.alreadyClaimed && rewardRes.rewardAmount) {
          sessionStorage.setItem(claimStorageKey, "true");
          if (rewardRes.newBalance !== undefined) {
            usePetStore.getState().setCoins(rewardRes.newBalance);
          }
          toastDailyLoginReward();
        }
      }
    } catch (loginRewardErr) {
      console.warn("[SessionProvider] Daily login reward check notice:", loginRewardErr);
    }

    // 4. Hydrate Cosmetics & Wardrobe Store
    if (data.cosmetics) {
      useCosmeticsStore.getState().setOwnedItemIds(data.cosmetics.ownedItemIds);
      if (data.cosmetics.equipped) {
        useCosmeticsStore.getState().setEquippedLoadout(data.cosmetics.equipped as any);
      }
    }

    // 5. Hydrate Weight History Store
    if (data.weightLogs) {
      useWeightStore.getState().setWeightLogs(data.weightLogs);
    }

    // 6. Hydrate Achievements Store
    if (data.unlockedBadgeIds) {
      useAchievementsStore.getState().setUnlockedBadgeIds(data.unlockedBadgeIds);
    }

    // 7. Hydrate Social Hub Store
    useSocialStore.getState().fetchSocialData();
    if (data.profile) {
      useSocialStore.getState().setStreak(data.profile.streakCount);
    }
  } catch (err) {
    console.error("[SessionProvider] Hydration error:", err);
  }
}

/**
 * SessionProvider bridges Supabase Auth sessions with client zustand stores.
 * On mount and on auth change, it synchronizes all persistent data from PostgreSQL.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    // Initial hydration
    hydrateStoresFromDatabase();

    // Subscribe to auth state events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        hydrateStoresFromDatabase();
      } else if (event === "SIGNED_OUT") {
        useAuthStore.getState().clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}