"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-config";
import { NavStreakBadge } from "./nav-streak-badge";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed bottom-0 left-0 right-0 z-40 overflow-visible border-t border-warm-border bg-surface px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4 lg:hidden"
    >
      <ul className="mx-auto grid w-full max-w-lg grid-cols-4 gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(pathname, item);

          return (
            <li key={item.href} className="relative min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 w-full flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg px-0.5 py-2 text-[11px] font-bold leading-none transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink motion-reduce:transition-none",
                  active
                    ? "bg-brand-orange text-ink"
                    : "bg-brand-green-light text-brand-green-ink active:bg-brand-green"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
              {item.showStreak && (
                <span className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2">
                  <NavStreakBadge className="-translate-y-4" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}