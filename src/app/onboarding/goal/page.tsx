"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingDown, Dumbbell, ShieldCheck, ArrowRight } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useAuthStore } from "@/store/use-auth-store";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { GoalProgramType } from "@/types";
import { cn } from "@/lib/utils";

export default function OnboardingGoalPage() {
  const router = useRouter();
  const { goalPlan, setGoalPlan } = useFoodStore();
  const { setOnboardingStep } = useAuthStore();

  const [selectedGoal, setSelectedGoal] = useState<GoalProgramType>(goalPlan.goalType || "diet");

  const goals = [
    {
      id: "diet" as GoalProgramType,
      title: "Diet (Weight Loss / Defisit Kalori)",
      subtitle: "Menurunkan berat badan secara sehat, bertahap, dan terukur.",
      marginText: "-500 kkal / hari (~0.5 kg lemak per minggu)",
      icon: TrendingDown,
      color: "border-warm-border bg-highlight/40",
      badgeText: "Populer untuk Fat Loss",
    },
    {
      id: "bulking" as GoalProgramType,
      title: "Bulking (Weight / Muscle Gain / Surplus)",
      subtitle: "Menambah massa otot dan berat badan dengan asupan tinggi protein & energi.",
      marginText: "+400 kkal / hari (Surplus bersih untuk hipertrofi)",
      icon: Dumbbell,
      color: "border-warm-border bg-highlight/40",
      badgeText: "Optimal untuk Pembentukan Otot",
    },
    {
      id: "maintenance" as GoalProgramType,
      title: "Maintenance (Stabilkan Berat Badan)",
      subtitle: "Menjaga berat badan ideal dan memperbaiki komposisi gizi harian seimbang.",
      marginText: "Keseimbangan energi (TDEE seimbang)",
      icon: ShieldCheck,
      color: "border-warm-border bg-highlight/40",
      badgeText: "Gaya Hidup & Pola Makan Sehat",
    },
  ];

  const handleNext = () => {
    let dailyMargin = -500;
    if (selectedGoal === "bulking") dailyMargin = 400;
    else if (selectedGoal === "maintenance") dailyMargin = 0;

    setGoalPlan({
      goalType: selectedGoal,
      dailyMarginKcal: dailyMargin,
    });
    setOnboardingStep(2);
    router.push("/onboarding/profile-calculator");
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-6">
      <OnboardingStepper currentStep={1} />

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Langkah 1: Penentuan Tujuan Utama
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted max-w-lg mx-auto">
          Pilih fokus utama perjalanan nutrisimu menggunakan Caloria. Parameter misi dan kebutuhan kalorimu akan disesuaikan secara otomatis.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;

          return (
            <div
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={cn(
                "p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-start gap-4 shadow-xs",
                isSelected
                  ? "border-brand-orange bg-highlight/60 ring-2 ring-brand-orange/20"
                  : "border-warm-border bg-card hover:bg-brand-green-light/20"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl shrink-0 mt-0.5",
                  isSelected
                    ? "bg-brand-orange text-ink shadow-sm"
                    : "bg-surface-sunken text-ink-muted"
                )}
              >
                <Icon className="h-6 w-6" />
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-ink">
                    {goal.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-warm-border bg-surface-raised text-ink-muted">
                    {goal.badgeText}
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {goal.subtitle}
                </p>
                <p className="text-xs font-semibold text-brand-green-dark pt-1">
                  Margin: {goal.marginText}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 flex justify-end">
        <button
          onClick={handleNext}
          className="btn-cta w-full text-sm sm:w-auto"
        >
          <span>Lanjut: Profil Fisik & BMI</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

