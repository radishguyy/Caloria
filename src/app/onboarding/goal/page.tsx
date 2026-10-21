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
      color: "border-orange-500 bg-orange-500/5",
      badgeText: "Populer untuk Fat Loss",
    },
    {
      id: "bulking" as GoalProgramType,
      title: "Bulking (Weight / Muscle Gain / Surplus)",
      subtitle: "Menambah massa otot dan berat badan dengan asupan tinggi protein & energi.",
      marginText: "+400 kkal / hari (Surplus bersih untuk hipertrofi)",
      icon: Dumbbell,
      color: "border-amber-500 bg-amber-500/5",
      badgeText: "Optimal untuk Pembentukan Otot",
    },
    {
      id: "maintenance" as GoalProgramType,
      title: "Maintenance (Stabilkan Berat Badan)",
      subtitle: "Menjaga berat badan ideal dan memperbaiki komposisi gizi harian seimbang.",
      marginText: "Keseimbangan energi (TDEE seimbang)",
      icon: ShieldCheck,
      color: "border-blue-500 bg-blue-500/5",
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
        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
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
                  ? `${goal.color} ring-2 ring-orange-500/20`
                  : "border-border bg-card hover:bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl shrink-0 mt-0.5",
                  isSelected
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-6 w-6" />
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {goal.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-background border text-muted-foreground">
                    {goal.badgeText}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {goal.subtitle}
                </p>
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 pt-1">
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
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-transform active:scale-95"
        >
          <span>Lanjut: Profil Fisik & BMI</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

