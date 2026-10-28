"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useSocialStore } from "@/store/use-social-store";
import { createClient } from "@/lib/supabase/client";
import { getProfileData } from "@/app/actions/profile";

interface SessionUser {
  id: string;
  email: string | null;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  isOnboardingCompleted: boolean;
}

function applySession(
  setUser: (input: SessionUser) => void,
  setStreak: (days: number) => void,
  sessionUser: SessionUser,
  supabase: ReturnType<typeof createClient>
) {
  setUser({
    id: sessionUser.id,
    email: sessionUser.email,
    username: sessionUser.username,
    fullName: sessionUser.fullName,
    avatarUrl: sessionUser.avatarUrl,
    isOnboardingCompleted: sessionUser.isOnboardingCompleted,
  });

  // Streak lives on the profile row; surface it into the social store so the
  // existing NavStreakBadge continues to read from the store.
  supabase
    .from("profiles")
    .select("current_streak_days")
    .eq("id", sessionUser.id)
    .single()
    .then(({ data }) => {
      setStreak(data?.current_streak_days ?? 0);
    });
}

/**
 * SessionProvider bridges Supabase Auth sessions with the existing zustand
 * stores. It must be mounted once, at the root, so every component that reads
 * `useAuthStore` reflects the real authenticated session.
 *
 * - On mount, hydrates the auth store from the current Supabase session.
 * - Subscribes to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
 * - On SIGNED_OUT, clears the stores.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUserFromSession);
  const clearUser = useAuthStore((state) => state.clearUser);
  const setStreak = useSocialStore((state) => state.setStreak);

  useEffect(() => {
    const supabase = createClient();

    // Hydrate from the current session.
    const hydrate = async () => {
      const profile = await getProfileData();
      if (profile) {
        applySession(setUser, setStreak, profile, supabase);
      } else {
        clearUser();
      }
    };

    hydrate();

    // Keep the stores in sync across tabs / token refreshes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await getProfileData();
        if (profile) {
          applySession(setUser, setStreak, profile, supabase);
        }
      } else if (event === "SIGNED_OUT") {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearUser, setStreak]);

  return <>{children}</>;
}