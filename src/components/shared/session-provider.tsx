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
      // Fallback: check if client-side Supabase has an active session before clearing
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const u = session.user;
        const [{ data: prof }, { data: petRow }] = await Promise.all([
          supabase
            .from("profiles")
            .select("username, full_name, avatar_url, caloria_coins")
            .eq("id", u.id)
            .maybeSingle(),
          supabase
            .from("pets")
            .select("*")
            .eq("user_id", u.id)
            .maybeSingle(),
        ]);

        useAuthStore.getState().setUserFromSession({
          id: u.id,
          email: u.email || null,
          username:
            prof?.username ||
            u.user_metadata?.username ||
            u.email?.split("@")[0] ||
            "user",
          fullName:
            prof?.full_name ||
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            prof?.username ||
            null,
          avatarUrl:
            prof?.avatar_url ||
            u.user_metadata?.avatar_url ||
            u.user_metadata?.picture ||
            null,
          isOnboardingCompleted: true,
        });

        if (petRow) {
          usePetStore.getState().setPetState({
            name: petRow.name || "Pyro",
            species: (petRow.species || petRow.character_id || "flameling") as any,
            stage: petRow.stage === "juvenile" ? 2 : 1,
            level: petRow.level || 1,
            exp: petRow.exp ?? petRow.current_xp ?? 0,
            hunger: petRow.hunger ?? 100,
            happiness: petRow.happiness ?? 100,
            coins: prof?.caloria_coins ?? petRow.coins ?? 50,
            lastFedAt: petRow.last_fed_at || new Date().toISOString(),
            moodStatus: (petRow.mood_status as any) || "happy",
            customColors: (petRow.custom_colors as any) || {},
          });
        }
        return;
      }
      useAuthStore.getState().clearUser();
      return;
    }

    // 1. Hydrate Auth
    useAuthStore.getState().setUserFromSession(data.user);

    // 2. Hydrate Food & Weight Logs First (so progression calculations have full historical data)
    if (Array.isArray(data.foodLogs)) {
      useFoodStore.getState().setLogs(data.foodLogs as any);
    }

    if (Array.isArray(data.weightLogs)) {
      useWeightStore.getState().setWeightLogs(data.weightLogs);
    }

    // 3. Hydrate Food & Biometrics Store
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
        startDate: data.profile.startDate,
      });

      useFoodStore.getState().setTargets({
        calories: data.profile.targetCaloriesKcal,
        protein: data.profile.targetProteinG,
        carbs: data.profile.targetCarbsG,
        fat: data.profile.targetFatG,
      });

      // Synchronize quest progression with evaluated weekly history
      const prog = useFoodStore.getState().getWeeklyProgression();
      const activeStage = prog.activeStage;
      const targetLevel = activeStage?.level || data.profile.currentLevel || 1;
      const targetWeek = activeStage?.week || data.profile.currentWeek || 1;

      useFoodStore.getState().setQuestProgression({
        goalPath: data.profile.goalPath as any,
        currentLevel: targetLevel,
        currentWeek: targetWeek,
      });
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

    // 5. Hydrate Achievements Store
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