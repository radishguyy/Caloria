"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingDown, Dumbbell, ShieldCheck } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingDemoStore } from "@/store/use-onboarding-demo-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingDemoBanner } from "@/components/onboarding/onboarding-demo-banner";
import { GoalProgramType } from "@/types";
import { cn } from "@/lib/utils";

function OnboardingGoalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "1";
  const isHydrated = useHydrated();

  const { goalPlan, setGoalPlan } = useFoodStore();
  const { setOnboardingStep, onboardingCompleted } = useAuthStore();
  const demoGoalType = useOnboardingDemoStore((state) => state.goalType);
  const setDemoData = useOnboardingDemoStore((state) => state.setDemoData);

  useEffect(() => {
    if (!isDemo && onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [isDemo, onboardingCompleted, router]);

  const [manualGoal, setManualGoal] = useState<GoalProgramType | null>(null);
  const selectedGoal: GoalProgramType =
    manualGoal ??
    (isDemo
      ? isHydrated
        ? demoGoalType
        : "diet"
      : goalPlan.goalType || "diet");

  const goals = [
    {
      id: "diet" as GoalProgramType,
      title: "Turun Berat Badan",
      marginText: "-500 kkal/hari",
      icon: TrendingDown,
    },
    {
      id: "bulking" as GoalProgramType,
      title: "Naik Massa Otot",
      marginText: "+400 kkal/hari",
      icon: Dumbbell,
    },
    {
      id: "maintenance" as GoalProgramType,
      title: "Jaga Berat Badan",
      marginText: "Kalori seimbang",
      icon: ShieldCheck,
    },
  ];

  const handleNext = () => {
    let dailyMargin = -500;
    if (selectedGoal === "bulking") dailyMargin = 400;
    else if (selectedGoal === "maintenance") dailyMargin = 0;

    if (isDemo) {
      setDemoData({
        goalType: selectedGoal,
        dailyMarginKcal: dailyMargin,
      });
      router.push("/onboarding/profile-calculator?demo=1");
      return;
    }

    const goalPath =
      selectedGoal === "bulking"
        ? "gain_muscle"
        : selectedGoal === "maintenance"
          ? "maintain_weight"
          : "lose_weight";

    setGoalPlan({
      goalType: selectedGoal,
      goalPath,
      currentLevel: 1,
      currentWeek: 1,
      startDate: new Date().toISOString().split("T")[0],
      streakConsecutiveLogs: 0,
      dailyMarginKcal: dailyMargin,
    });
    setOnboardingStep(2);
    router.push("/onboarding/profile-calculator");
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-6">
      {isDemo && <OnboardingDemoBanner />}
      <OnboardingStepper currentStep={1} />

      <div className="text-center">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          Pilih Tujuan
        </h1>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;

          return (
            <button
              key={goal.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setManualGoal(goal.id)}
              className={cn(
                "w-full text-left p-4 sm:p-5 rounded-2xl border cursor-pointer transition-colors flex items-center gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary",
                isSelected
                  ? "border-accent-green bg-accent-green/8 ring-2 ring-accent-green/25"
                  : "border-border-divider bg-surface hover:bg-surface-subtle",
              )}
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-xl shrink-0 flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-accent-green text-text-inverse"
                    : "bg-surface-subtle border border-border-default text-text-primary",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base sm:text-lg font-extrabold text-text-primary">
                  {goal.title}
                </h2>
                <p className="text-xs sm:text-sm font-medium text-text-muted mt-0.5">
                  {goal.marginText}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          className="w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-xl bg-accent-green text-text-inverse text-sm font-bold hover:bg-accent-green/90 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}

export default function OnboardingGoalPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin mx-auto" />
        </div>
      }
    >
      <OnboardingGoalContent />
    </Suspense>
  );
}
