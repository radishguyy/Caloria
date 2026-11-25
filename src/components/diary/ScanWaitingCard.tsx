"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ScanLine } from "lucide-react";
import type { ScanStage } from "@/lib/nutrition/scan-client";
import { getScanWaitState } from "@/lib/nutrition/scan-progress";
import { cn } from "@/lib/utils";

export interface ScanWaitingCardProps {
  stage: ScanStage;
  previewUrl?: string | null;
}

export function ScanWaitingCard({ stage, previewUrl }: ScanWaitingCardProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  const waitState = getScanWaitState(stage, elapsedMs);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative z-20 mx-4 w-full max-w-md rounded-card border border-white/15 bg-[#111F18]/95 backdrop-blur-md p-5 sm:p-6 space-y-4 text-white shadow-xl"
    >
      {previewUrl && (
        <div className="relative h-32 sm:h-40 w-full rounded-2xl overflow-hidden bg-black/80 border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Area label gizi yang sedang dipindai"
            className="w-full h-full object-contain opacity-95"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/4 caloria-scan-beam bg-accent-green-light/40 border-b-2 border-accent-green-light"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-input bg-accent-green/30 text-accent-green-light flex items-center justify-center shrink-0 mt-0.5">
            <ScanLine className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-extrabold font-heading leading-snug">
              {waitState.headline}
            </p>
            <p className="text-sm font-semibold text-accent-green-light/90 leading-snug mt-1">
              {waitState.detail}
            </p>
          </div>
        </div>

        <span className="shrink-0 px-3 py-1 rounded-pill bg-accent-green/25 text-accent-green-light text-sm font-mono font-extrabold tabular-nums">
          {waitState.elapsedLabel}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Progres pembacaan label gizi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={waitState.progressPercent}
        className="h-2.5 w-full rounded-full bg-white/15 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-accent-green-light transition-[width] duration-300 ease-out"
          style={{ width: `${waitState.progressPercent}%` }}
        />
      </div>

      <ol className="space-y-2.5 pt-0.5">
        {waitState.steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3 text-sm">
            {step.status === "done" && (
              <span className="h-6 w-6 rounded-full bg-accent-green-light text-text-primary flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </span>
            )}
            {step.status === "active" && (
              <span className="h-6 w-6 rounded-full bg-accent-green/35 text-accent-green-light flex items-center justify-center shrink-0">
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            )}
            {step.status === "pending" && (
              <span className="h-6 w-6 rounded-full bg-white/10 text-text-muted flex items-center justify-center shrink-0">
                <span className="h-2 w-2 rounded-full bg-current" />
              </span>
            )}
            <span
              className={cn(
                "leading-snug",
                step.status === "done" && "text-accent-green-light font-bold",
                step.status === "active" && "text-white font-extrabold",
                step.status === "pending" && "text-white/70 font-semibold",
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}