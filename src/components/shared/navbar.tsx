"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Sparkles,
  UtensilsCrossed,
  Users,
  Award,
  UserCircle,
  Compass,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePetStore } from "@/store/use-pet-store";
import { useSocialStore } from "@/store/use-social-store";

export function Navbar() {
  const pathname = usePathname();
  const { name, level, stage, coins } = usePetStore();
  const { coopStreakDays } = useSocialStore();

  const links = [
    { href: "/", label: "Dashboard", icon: Sparkles },
    { href: "/diary", label: "Food Diary", icon: UtensilsCrossed },
    { href: "/social", label: "Co-op Streak", icon: Users },
    { href: "/pet", label: "Wardrobe & Shop", icon: Award },
    { href: "/onboarding", label: "Goal & BMI", icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20">
            <Flame className="h-6 w-6 fill-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Caloria
            </span>
            <span className="hidden text-xs text-muted-foreground xl:inline-block ml-1.5 font-medium">
              Nourish & Level Up
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/50">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-full transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-sm shadow-black/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon
                  className={cn("h-4 w-4", isActive ? "text-orange-500" : "")}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Badges & Pet Status */}
        <div className="flex items-center gap-2">
          {/* Caloria Coins Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-semibold border border-amber-500/20">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span>{coins}</span>
          </div>

          {/* Streak Badge */}
          <Link
            href="/social"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-semibold border border-orange-500/20 hover:bg-orange-500/15 transition-colors"
          >
            <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
            <span>{coopStreakDays} Hari</span>
          </Link>

          {/* Pet Indicator */}
          <Link
            href="/pet"
            className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 bg-secondary rounded-full border border-border text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <div className="h-5 w-5 rounded-full bg-orange-400/20 flex items-center justify-center text-orange-500 font-bold text-[10px]">
              {level}
            </div>
            <span className="truncate max-w-[80px] font-semibold">{name}</span>
            <span className="text-[10px] text-muted-foreground">
              Stg {stage}
            </span>
          </Link>

          {/* Profile Link */}
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors",
              pathname === "/profile"
                ? "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                : "border-border hover:bg-accent text-foreground"
            )}
          >
            <UserCircle className="h-4 w-4 text-orange-500" />
            <span className="hidden sm:inline">Profil</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
