"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, pets } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    isOnboardingCompleted: boolean;
  };
}

/**
 * Register a new user with Supabase Auth and initialize `profiles` + `pets` rows
 */
export async function registerAction(formData: {
  email: string;
  password: string;
  fullName: string;
  username: string;
}): Promise<AuthActionResult> {
  const { email, password, fullName, username } = formData;

  if (!email || !password || !fullName || !username) {
    return { success: false, error: "Semua kolom harus diisi." };
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (cleanUsername.length < 3) {
    return { success: false, error: "Username minimal 3 karakter (huruf, angka, _)." };
  }

  try {
    const supabase = await createClient();

    // 1. Check if username already exists in `profiles` (Supabase REST fallback if DB is direct pooler)
    if (process.env.DATABASE_URL) {
      try {
        const existing = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.username, cleanUsername))
          .limit(1);

        if (existing.length > 0) {
          return { success: false, error: "Username sudah digunakan, silakan pilih yang lain." };
        }
      } catch (dbErr) {
        console.warn("[registerAction DB check fallback to supabase client]:", dbErr);
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (existingUser) {
          return { success: false, error: "Username sudah digunakan, silakan pilih yang lain." };
        }
      }
    } else {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: "Username sudah digunakan, silakan pilih yang lain." };
      }
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: cleanUsername,
        },
      },
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Gagal membuat akun dengan Supabase.",
      };
    }

    const userId = authData.user.id;

    // Create default profile in `profiles` table & starter egg pet in `pets` table
    try {
      if (process.env.DATABASE_URL) {
        await db
          .insert(profiles)
          .values({
            id: userId,
            username: cleanUsername,
            fullName: fullName.trim(),
            isOnboardingCompleted: false,
          })
          .onConflictDoNothing();

        await db
          .insert(pets)
          .values({
            userId,
            name: "Pyro",
            species: "flameling",
            characterId: "flameling",
            stage: "baby",
            level: 1,
            exp: 0,
            currentXp: 0,
            nextLevelXp: 100,
          })
          .onConflictDoNothing();
      } else {
        await supabase
          .from("profiles")
          .upsert({
            id: userId,
            username: cleanUsername,
            full_name: fullName.trim(),
            is_onboarding_completed: false,
          }, { onConflict: "id" });

        await supabase
          .from("pets")
          .upsert({
            user_id: userId,
            name: "Pyro",
            species: "flameling",
            character_id: "flameling",
            stage: "baby",
            level: 1,
            current_xp: 0,
            next_level_xp: 100,
          }, { onConflict: "user_id" });
      }
    } catch (insertErr) {
      console.warn("[registerAction insert fallback]:", insertErr);
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          username: cleanUsername,
          full_name: fullName.trim(),
          is_onboarding_completed: false,
        }, { onConflict: "id" });

      await supabase
        .from("pets")
        .upsert({
          user_id: userId,
          name: "Pyro",
          species: "flameling",
          character_id: "flameling",
          stage: "baby",
          level: 1,
          current_xp: 0,
          next_level_xp: 100,
        }, { onConflict: "user_id" });
    }

    revalidatePath("/", "layout");

    return {
      success: true,
      user: {
        id: userId,
        email,
        username: cleanUsername,
        fullName: fullName.trim(),
        isOnboardingCompleted: false,
      },
    };
  } catch (error) {
    console.error("[registerAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
    };
  }
}

/**
 * Log in an existing user with Supabase Auth and fetch profile state
 */
export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const { email, password } = formData;

  if (!email || !password) {
    return { success: false, error: "Email dan password wajib diisi." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error:
          error?.message === "Invalid login credentials"
            ? "Email atau kata sandi tidak cocok."
            : error?.message || "Gagal masuk.",
      };
    }

    const userId = data.user.id;

    let userUsername =
      data.user.user_metadata?.username ||
      data.user.email?.split("@")[0] ||
      "user";
    let userFullName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      userUsername;
    let userOnboardingCompleted = true;

    // Query user profile with Supabase client fallback
    try {
      if (process.env.DATABASE_URL) {
        const [profile] = await db
          .select({
            username: profiles.username,
            fullName: profiles.fullName,
            isOnboardingCompleted: profiles.isOnboardingCompleted,
          })
          .from(profiles)
          .where(eq(profiles.id, userId))
          .limit(1);

        if (profile) {
          userUsername = profile.username;
          userFullName = profile.fullName || userFullName;
          userOnboardingCompleted = true; // Existing users logging in are done with onboarding

          if (!profile.isOnboardingCompleted) {
            db.update(profiles)
              .set({ isOnboardingCompleted: true, updatedAt: new Date() })
              .where(eq(profiles.id, userId))
              .catch((e) => console.warn("[loginAction] update onboarding status warning:", e));
          }
        }
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name, is_onboarding_completed")
          .eq("id", userId)
          .maybeSingle();

        if (profile) {
          userUsername = profile.username;
          userFullName = profile.full_name || userFullName;
          userOnboardingCompleted = true;

          if (!profile.is_onboarding_completed) {
            supabase
              .from("profiles")
              .update({ is_onboarding_completed: true, updated_at: new Date().toISOString() })
              .eq("id", userId)
              .then(() => {});
          }
        }
      }
    } catch (queryErr) {
      console.warn("[loginAction profile fetch fallback]:", queryErr);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name, is_onboarding_completed")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        userUsername = profile.username;
        userFullName = profile.full_name || userFullName;
        userOnboardingCompleted = true;
      }
    }

    revalidatePath("/", "layout");

    return {
      success: true,
      user: {
        id: userId,
        email: data.user.email || email,
        username: userUsername,
        fullName: userFullName,
        isOnboardingCompleted: userOnboardingCompleted,
      },
    };
  } catch (error) {
    console.error("[loginAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat masuk.",
    };
  }
}

/**
 * Log out user from Supabase session
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[logoutAction Error]:", err);
    return { success: false };
  }
}

