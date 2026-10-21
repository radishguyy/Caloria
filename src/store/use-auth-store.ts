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
  login: (email: string, username?: string) => void;
  register: (email: string, username: string, fullName: string) => void;
  logout: () => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      isAuthenticated: true,
      user: {
        id: "user-iman-1",
        email: "iman@caloria.app",
        username: "iman_dev",
        fullName: "Iman Nur",
      },
      onboardingCompleted: true, // Default to true so existing users go straight to dashboard
      activeOnboardingStep: 1,

      login: (email: string, username?: string) =>
        set((state) => ({
          isAuthenticated: true,
          user: {
            id: `user-${Date.now()}`,
            email,
            username: username || email.split("@")[0],
            fullName: username ? username.toUpperCase() : "Caloria User",
          },
        })),

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
          activeOnboardingStep: 4,
        }),

      resetOnboarding: () =>
        set({
          onboardingCompleted: false,
          activeOnboardingStep: 1,
        }),
    }),
    {
      name: "caloria-auth-storage",
    }
  )
);

