"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";

export default function OnboardingRootPage() {
  const router = useRouter();
  const { activeOnboardingStep, onboardingCompleted } = useAuthStore();

  useEffect(() => {
    if (onboardingCompleted) {
      router.replace("/dashboard");
      return;
    }

    const stepRoutes = [
      "/onboarding/goal",
      "/onboarding/profile-calculator",
      "/onboarding/projection",
      "/onboarding/adopt-pet",
    ];
    const targetRoute = stepRoutes[activeOnboardingStep - 1] || "/onboarding/goal";
    router.replace(targetRoute);
  }, [activeOnboardingStep, onboardingCompleted, router]);

  return (
    <div className="container mx-auto max-w-md px-4 py-20 text-center space-y-3">
      <div className="h-8 w-8 rounded-pill border-2 border-accent-green border-t-transparent animate-spin mx-auto" />
      <p className="text-xs text-text-muted">Menyiapkan langkah Smart Onboarding Caloria...</p>
    </div>
  );
}
