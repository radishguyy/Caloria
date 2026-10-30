"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, pets } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface SaveOnboardingInput {
  goal: "diet" | "bulking" | "maintenance";
  username?: string;
  fullName?: string;
  gender: string;
  birthDate?: string;
  heightCm: number;
  initialWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active";
  bmiScore: number;
  tdeeKcal: number;
  targetCaloriesKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  projectedDays: number;
  petSpecies: string;
  petName: string;
}

export async function saveOnboardingAction(input: SaveOnboardingInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Harap login untuk menyimpan hasil onboarding." };
    }

    const userId = user.id;
    const goalPath =
      input.goal === "bulking"
        ? "gain_muscle"
        : input.goal === "maintenance"
        ? "maintain_weight"
        : "lose_weight";

    // 1. Update Profile
    const profileUpdates: Record<string, any> = {
      goal: input.goal,
      goalPath,
      currentLevel: 1,
      currentWeek: 1,
      streakConsecutiveLogs: 0,
      gender: input.gender,
      birthDate: input.birthDate || null,
      heightCm: String(input.heightCm),
      initialWeightKg: String(input.initialWeightKg),
      currentWeightKg: String(input.currentWeightKg),
      targetWeightKg: String(input.targetWeightKg),
      activityLevel: input.activityLevel,
      bmiScore: String(input.bmiScore),
      tdeeKcal: input.tdeeKcal,
      targetCaloriesKcal: input.targetCaloriesKcal,
      targetProteinG: String(input.targetProteinG),
      targetCarbsG: String(input.targetCarbsG),
      targetFatG: String(input.targetFatG),
      projectedDays: input.projectedDays,
      isOnboardingCompleted: true,
      updatedAt: new Date(),
    };

    if (input.username && input.username.trim().length >= 3) {
      const cleanUsername = input.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      // Check if username is taken by another user
      const existing = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.username, cleanUsername))
        .limit(1);

      if (existing.length === 0 || existing[0].id === userId) {
        profileUpdates.username = cleanUsername;
      }
    }

    if (input.fullName && input.fullName.trim()) {
      profileUpdates.fullName = input.fullName.trim();
    }

    try {
      await db
        .update(profiles)
        .set(profileUpdates)
        .where(eq(profiles.id, userId));

      // 2. Update Pet selection
      await db
        .insert(pets)
        .values({
          userId,
          name: input.petName || "Pyro",
          species: input.petSpecies || "flameling",
          characterId: input.petSpecies || "flameling",
          stage: "hatchling",
          level: 1,
          exp: 0,
          currentXp: 0,
          nextLevelXp: 100,
        })
        .onConflictDoUpdate({
          target: [pets.userId],
          set: {
            name: input.petName || "Pyro",
            species: input.petSpecies || "flameling",
            characterId: input.petSpecies || "flameling",
            updatedAt: new Date(),
          },
        });
    } catch (dbErr) {
      console.warn("[saveOnboardingAction] fallback to Supabase REST:", dbErr);
      await supabase
        .from("profiles")
        .update({
          goal: input.goal,
          goal_path: goalPath,
          current_level: 1,
          current_week: 1,
          gender: input.gender,
          height_cm: String(input.heightCm),
          initial_weight_kg: String(input.initialWeightKg),
          current_weight_kg: String(input.currentWeightKg),
          target_weight_kg: String(input.targetWeightKg),
          activity_level: input.activityLevel,
          bmi_score: String(input.bmiScore),
          tdee_kcal: input.tdeeKcal,
          target_calories_kcal: input.targetCaloriesKcal,
          target_protein_g: String(input.targetProteinG),
          target_carbs_g: String(input.targetCarbsG),
          target_fat_g: String(input.targetFatG),
          projected_days: input.projectedDays,
          is_onboarding_completed: true,
          ...(profileUpdates.username ? { username: profileUpdates.username } : {}),
          ...(profileUpdates.fullName ? { full_name: profileUpdates.fullName } : {}),
        })
        .eq("id", userId);

      await supabase.from("pets").upsert(
        {
          user_id: userId,
          name: input.petName || "Pyro",
          species: input.petSpecies || "flameling",
          character_id: input.petSpecies || "flameling",
          stage: "hatchling",
          level: 1,
          exp: 0,
          current_xp: 0,
          next_level_xp: 100,
        },
        { onConflict: "user_id" }
      );
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[saveOnboardingAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan onboarding.",
    };
  }
}

