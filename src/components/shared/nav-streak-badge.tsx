"use client";

import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocialStore } from "@/store/use-social-store";
import { getStreakSocietyTier } from "@/lib/streak-utils";

interface NavStreakBadgeProps {
  className?: string;
}

/**
 * Compact streak indicator showing active days, Streak Society tier tint,
 * and an ice dot when at least 1 Streak Freeze is equipped.
 */
export function NavStreakBadge({ className }: NavStreakBadgeProps) {
  const days = useSocialStore((state) => state.coopStreakDays);
  const streakFreezes = useSocialStore((state) => state.streakFreezes);
  const label = days > 99 ? "99+" : String(days);
  const tier = getStreakSocietyTier(days);

  const tierBgClass =
    tier?.tier === "gold"
      ? "bg-amber-400 text-amber-950"
      : tier?.tier === "silver"
        ? "bg-slate-200 text-slate-900"
        : tier?.tier === "bronze"
          ? "bg-amber-700 text-white"
          : "bg-brand-orange text-ink";

  return (
    <span
      role="img"
      aria-label={`Streak ${days} hari${tier ? ` (${tier.label})` : ""}${streakFreezes > 0 ? `, ${streakFreezes} Freeze aktif` : ""}`}
      title={
        tier
          ? `${tier.label} • ${days} hari${streakFreezes > 0 ? ` • ${streakFreezes} Streak Freeze` : ""}`
          : `Streak ${days} hari${streakFreezes > 0 ? ` • ${streakFreezes} Streak Freeze` : ""}`
      }
      className={cn(
        "relative inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 whitespace-nowrap rounded-full px-1.5 text-[11px] font-extrabold leading-none ring-2 ring-surface transition-colors",
        tierBgClass,
        className
      )}
    >
      <Flame className="h-3 w-3 fill-current" aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
      {streakFreezes > 0 && (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-sky-500 text-white"
        >
          <Snowflake className="h-2 w-2" />
        </span>
      )}
    </span>
  );
}
