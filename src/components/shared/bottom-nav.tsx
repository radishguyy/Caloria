"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, UtensilsCrossed, Award, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Sparkles },
    { href: "/diary", label: "Diary", icon: UtensilsCrossed },
    { href: "/pet", label: "Pet Room", icon: Award },
    { href: "/social", label: "Co-op", icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-lg border-t border-border px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all",
                isActive
                  ? "text-orange-500 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-transform",
                  isActive ? "bg-orange-500/10 scale-110" : ""
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
