"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

interface OnboardingActionBarProps {
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  nextLoadingLabel?: string;
}

export function OnboardingActionBar({
  backHref,
  onBack,
  backLabel = "Kembali",
  onNext,
  nextLabel = "Lanjut",
  nextDisabled = false,
  nextLoading = false,
  nextLoadingLabel = "Memproses...",
}: OnboardingActionBarProps) {
  const backButtonClass =
    "inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-xl border border-border-default bg-surface text-xs sm:text-sm font-bold text-neutral-10 hover:bg-surface-subtle transition-colors cursor-pointer";

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border-divider bg-surface/95 backdrop-blur-sm">
      <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
        {backHref ? (
          <Link href={backHref} className={backButtonClass}>
            {backLabel}
          </Link>
        ) : onBack ? (
          <button type="button" onClick={onBack} className={backButtonClass}>
            {backLabel}
          </button>
        ) : (
          <div aria-hidden="true" />
        )}

        <button
          type="button"
          disabled={nextDisabled || nextLoading}
          onClick={onNext}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-accent-green text-text-inverse text-xs sm:text-sm font-bold hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          {nextLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{nextLoadingLabel}</span>
            </>
          ) : (
            <span>{nextLabel}</span>
          )}
        </button>
      </div>
    </div>
  );
}
