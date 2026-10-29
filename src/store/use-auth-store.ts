import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

interface AuthStoreState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  onboardingCompleted: boolean;
  activeOnboardingStep: number; // 1: goal, 2: profile-calculator, 3: projection, 4: adopt-pet

  // Actions
  login: (email: string, username?: string, isOnboardingCompleted?: boolean) => void;
  register: (email: string, username: string, fullName: string) => void;
  logout: () => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  /** Hydrate the store from a verified Supabase session (used by SessionProvider). */
  setUserFromSession: (input: {
    id: string;
    email: string | null;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
    isOnboardingCompleted: boolean;
  }) => void;
  /** Clear the store on sign-out. */
  clearUser: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      onboardingCompleted: false,
      activeOnboardingStep: 1,

      login: (email: string, username?: string, isOnboardingCompleted?: boolean) =>
        set({
          isAuthenticated: true,
          onboardingCompleted: isOnboardingCompleted ?? false,
          activeOnboardingStep: isOnboardingCompleted ? 5 : 1,
          user: {
            id: `user-${Date.now()}`,
            email,
            username: username || email.split("@")[0],
            fullName: username ? username.toUpperCase() : "Caloria User",
          },
        }),

      register: (email: string, username: string, fullName: string) =>
        set({
          isAuthenticated: true,
          user: {
            id: `user-${Date.now()}`,
            email,
            username,
            fullName,
          },
          onboardingCompleted: false, // New users start onboarding
          activeOnboardingStep: 1,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
        }),

      setOnboardingStep: (step: number) =>
        set({
          activeOnboardingStep: step,
        }),

      completeOnboarding: () =>
        set({
          onboardingCompleted: true,
          activeOnboardingStep: 5,
        }),

      resetOnboarding: () =>
        set({
          onboardingCompleted: false,
          activeOnboardingStep: 1,
        }),

      setUserFromSession: (input) =>
        set({
          isAuthenticated: true,
          onboardingCompleted: input.isOnboardingCompleted,
          activeOnboardingStep: input.isOnboardingCompleted ? 5 : 1,
          user: {
            id: input.id,
            email: input.email || "",
            username: input.username,
            fullName: input.fullName || input.username,
            avatarUrl: input.avatarUrl || undefined,
          },
        }),

      clearUser: () =>
        set({
          isAuthenticated: false,
          user: null,
          onboardingCompleted: false,
          activeOnboardingStep: 1,
        }),
    }),
    {
      name: "caloria-auth-storage",
    }
  )
);

