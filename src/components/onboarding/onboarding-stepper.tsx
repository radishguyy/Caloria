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
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-warm-border -z-0" />
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 -z-0">
          <div
            className="h-full bg-brand-green transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center gap-1.5 z-10 bg-canvas px-1">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs",
                  isDone
                    ? "bg-brand-green text-surface-raised"
                    : isCurrent
                    ? "bg-brand-green text-surface-raised ring-4 ring-brand-green/20"
                    : "border border-warm-border bg-surface-sunken text-ink-muted"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-semibold text-center whitespace-nowrap",
                  isCurrent ? "text-ink font-bold" : "text-ink-muted"
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

