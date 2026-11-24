"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedToggleOption {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SegmentedToggleProps {
  options: SegmentedToggleOption[];
  label: string;
  className?: string;
  optionClassName?: string;
}

/**
 * Shared squircle segmented navigation used by the pet-customization top bar
 * and the profile section. Active state follows the current pathname.
 */
export function SegmentedToggle({
  options,
  label,
  className,
  optionClassName,
}: SegmentedToggleProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-navigation border border-border-default bg-surface-subtle p-1 shadow-2xs",
        className,
      )}
    >
      {options.map(({ href, label: optionLabel, icon: Icon }) => {
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink",
              isActive
                ? "bg-accent-green text-text-inverse shadow-2xs"
                : "text-neutral-10 hover:bg-surface hover:text-text-primary",
              optionClassName,
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{optionLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
