"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, UtensilsCrossed, Award, Users, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Sparkles },
    { href: "/diary", label: "Diary", icon: UtensilsCrossed },
    { href: "/pet-customization/wardrobe", label: "Wardrobe", icon: Award },
    { href: "/social/coop", label: "Co-op", icon: Users },
    { href: "/profile/overview", label: "Profil", icon: UserCircle },
  ];

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface/95 backdrop-blur-lg border-t border-border-divider px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "nav-item flex flex-col items-center justify-center gap-1 py-1.5 px-3 transition-all",
                isActive ? "is-selected" : "text-text-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span
                className={cn(
                  "text-[10px] tracking-tight",
                  isActive ? "font-bold text-text-inverse" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
