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
      className="relative z-20 mx-4 mb-16 sm:mb-8 w-full max-w-sm rounded-card bg-[#111F18]/95 backdrop-blur-md p-4 sm:p-5 space-y-3.5 shadow-2xl text-white"
    >
      {previewUrl && (
        <div className="relative h-24 sm:h-28 w-full rounded-2xl overflow-hidden bg-black/75">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Area label gizi yang sedang dipindai"
            className="w-full h-full object-contain opacity-90"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/4 caloria-scan-beam bg-gradient-to-b from-transparent via-accent-green-light/35 to-accent-green-light/85 border-b-2 border-accent-green-light"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-accent-green/30 text-accent-green-light flex items-center justify-center shrink-0">
            <ScanLine className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold font-heading leading-tight truncate">
              {waitState.headline}
            </p>
            <p className="text-xs text-[#E2F3D1] leading-snug mt-0.5">
              {waitState.detail}
            </p>
          </div>
        </div>

        <span className="shrink-0 px-2.5 py-1 rounded-pill bg-accent-green/25 text-[#D9F99D] text-xs font-mono font-bold tabular-nums">
          {waitState.elapsedLabel}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Progres pembacaan label gizi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={waitState.progressPercent}
        className="h-2 w-full rounded-full bg-white/15 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-accent-green-light transition-[width] duration-300 ease-out"
          style={{ width: `${waitState.progressPercent}%` }}
        />
      </div>

      <ol className="space-y-2 pt-0.5">
        {waitState.steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2.5 text-xs">
            {step.status === "done" && (
              <span className="h-5 w-5 rounded-full bg-accent-green-light text-[#1E3A10] flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            )}
            {step.status === "active" && (
              <span className="h-5 w-5 rounded-full bg-accent-green/35 text-accent-green-light flex items-center justify-center shrink-0">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </span>
            )}
            {step.status === "pending" && (
              <span className="h-5 w-5 rounded-full bg-white/10 text-[#94A3B8] flex items-center justify-center shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              </span>
            )}
            <span
              className={cn(
                "leading-tight",
                step.status === "done" && "text-[#D9F99D] font-semibold",
                step.status === "active" && "text-white font-bold",
                step.status === "pending" && "text-[#CBD5E1]"
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
