"use client";

import {
  Check,
  Target,
  UserRound,
  CalendarDays,
  Flame,
  PawPrint,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStepperProps {
  currentStep: number; // 1, 2, 3, 4, 5
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  const steps = [
    { number: 1, label: "Tujuan", icon: Target },
    { number: 2, label: "Profil", icon: UserRound },
    { number: 3, label: "Proyeksi", icon: CalendarDays },
    { number: 4, label: "Gizi", icon: Flame },
    { number: 5, label: "CalPal", icon: PawPrint },
  ];

  const progressWidth = `${((currentStep - 1) / (steps.length - 1)) * 100}%`;

  return (
    <nav
      aria-label="Tahapan onboarding"
      className="w-full max-w-xl mx-auto mb-6 sm:mb-8"
    >
      <div className="relative flex items-start justify-between">
        <div
          aria-hidden="true"
          className="absolute left-5 right-5 sm:left-6 sm:right-6 top-[18px] h-0.5 bg-border-divider"
        >
          <div
            className="h-full bg-accent-green transition-all duration-300"
            style={{ width: progressWidth }}
          />
        </div>

        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div
              key={step.number}
              className="relative z-10 flex flex-col items-center gap-1.5 px-1"
            >
              <div
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  isDone
                    ? "bg-accent-green text-text-inverse"
                    : isCurrent
                      ? "bg-accent-orange text-text-inverse ring-4 ring-accent-orange/20"
                      : "bg-surface text-text-muted border border-border-default",
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4" aria-hidden="true" />
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold text-center whitespace-nowrap",
                  isCurrent ? "text-text-primary font-bold" : "text-text-muted",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
