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
  Coins,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePetStore } from "@/store/use-pet-store";
import { useSocialStore } from "@/store/use-social-store";
import { useNotificationStore } from "@/store/use-notification-store";

export function Navbar() {
  const pathname = usePathname();
  const { name, level, stage, coins } = usePetStore();
  const { coopStreakDays } = useSocialStore();
  const { toggleDrawer, getUnreadCount } = useNotificationStore();

  const unreadCount = getUnreadCount();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Sparkles },
    { href: "/diary", label: "Food Diary", icon: UtensilsCrossed },
    { href: "/pet-customization/wardrobe", label: "Pet Wardrobe", icon: Award },
    { href: "/social/coop", label: "Co-op Streak", icon: Users },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/dashboard"
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
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-full transition-all",
                  active
                    ? "bg-background text-foreground shadow-sm shadow-black/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon
                  className={cn("h-4 w-4", active ? "text-orange-500" : "")}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Badges, Notifications & Pet Status */}
        <div className="flex items-center gap-2">
          {/* Caloria Coins Badge */}
          <Link
            href="/pet-customization/shop"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-semibold border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            title="Caloria Coins — Belanja di Shop"
          >
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span>{coins}</span>
          </Link>

          {/* Co-op Streak Badge */}
          <Link
            href="/social/coop"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-semibold border border-orange-500/20 hover:bg-orange-500/15 transition-colors"
          >
            <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
            <span>{coopStreakDays} Hari</span>
          </Link>

          {/* Notification Center Trigger */}
          <button
            onClick={toggleDrawer}
            className="relative p-2 rounded-xl border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Buka Notification Center"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2 ring-background">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Pet Indicator */}
          <Link
            href="/pet-customization/wardrobe"
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
            href="/profile/overview"
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors",
              pathname.startsWith("/profile")
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
