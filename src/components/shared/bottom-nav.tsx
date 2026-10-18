"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, UtensilsCrossed, Award, Users, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Sparkles },
    { href: "/diary", label: "Diary", icon: UtensilsCrossed },
    { href: "/social", label: "Co-op", icon: Users },
    { href: "/pet", label: "Pet Shop", icon: Award },
    { href: "/profile", label: "Profil", icon: UserCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-lg border-t border-border px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all",
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
