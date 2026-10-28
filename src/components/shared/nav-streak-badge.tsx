"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocialStore } from "@/store/use-social-store";

interface NavStreakBadgeProps {
  className?: string;
}

/**
 * Compact co-op streak indicator. The parent positions it; this component only
 * draws the flame badge so desktop and mobile navs can share the same markup.
 */
export function NavStreakBadge({ className }: NavStreakBadgeProps) {
  const days = useSocialStore((state) => state.coopStreakDays);
  const label = days > 99 ? "99+" : String(days);

  return (
    <span
      role="img"
      aria-label={`Streak ${days} hari`}
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 whitespace-nowrap rounded-full bg-brand-orange px-1.5 text-[11px] font-extrabold leading-none text-ink ring-2 ring-surface",
        className
      )}
    >
      <Flame className="h-3 w-3 fill-current" aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
    </span>
  );
}