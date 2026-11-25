"use client";

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";

export function OnboardingDemoBanner() {
  return (
    <div
      role="status"
      className="rounded-card border border-border-divider bg-surface-subtle px-4 py-3 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-button bg-accent-yellow text-text-primary">
          <Eye className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-text-primary">
            Mode Demo Onboarding
          </p>
          <p className="text-[11px] text-text-muted">
            Simulasi ini tidak mengubah data profil, target kalori, atau pet aslimu.
          </p>
        </div>
      </div>

      <Link
        href="/profile/settings"
        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-button border border-border-default bg-surface px-3.5 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink shrink-0"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Keluar Demo</span>
      </Link>
    </div>
  );
}
