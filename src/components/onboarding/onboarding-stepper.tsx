"use client";

import { Check, Target, Calculator, Sparkles, Egg } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStepperProps {
  currentStep: number; // 1, 2, 3, 4
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  const steps = [
    { number: 1, label: "Tujuan Utama", icon: Target },
    { number: 2, label: "Profil Fisik & BMI", icon: Calculator },
    { number: 3, label: "Proyeksi N Hari", icon: Sparkles },
    { number: 4, label: "Adopsi Pet", icon: Egg },
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-8 space-y-3">
      {/* Step Numbers & Labels */}
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-0" />
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-orange-500 transition-all duration-500 -z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center gap-1.5 z-10 bg-background px-1">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs",
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-orange-500 text-white ring-4 ring-orange-500/20"
                    : "bg-secondary text-muted-foreground border border-border"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-semibold text-center whitespace-nowrap",
                  isCurrent ? "text-foreground font-bold" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

