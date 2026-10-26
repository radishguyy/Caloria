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
import { useHydrated } from "@/hooks/use-hydrated";

export function Navbar() {
  const pathname = usePathname();
  const isHydrated = useHydrated();
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
    <header className="sticky top-0 z-40 w-full border-b border-border-divider bg-surface/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-navigation bg-accent-green text-text-inverse shadow-xs">
            <Flame className="h-6 w-6 fill-text-inverse" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-text-primary font-heading">
              Caloria
            </span>
            <span className="hidden text-xs xl:inline-block ml-1.5 font-medium text-text-muted">
              Nourish & Level Up
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-pill border border-border-divider bg-surface-subtle">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "nav-item flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold transition-all",
                  active ? "is-selected" : "text-neutral-10"
                )}
              >
                <Icon className="h-4 w-4" />
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold border border-accent-yellow bg-accent-yellow/50 text-text-primary hover:bg-accent-green-light transition-colors"
            title="Caloria Coins — Belanja di Shop"
          >
            <Coins className="h-3.5 w-3.5 text-accent-orange" />
            <span suppressHydrationWarning>{isHydrated ? coins : 240}</span>
          </Link>

          {/* Co-op Streak Badge */}
          <Link
            href="/social/coop"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold border border-accent-orange/30 bg-accent-orange/10 text-accent-orange-dark hover:bg-accent-orange/20 transition-colors"
          >
            <Flame className="h-3.5 w-3.5 fill-accent-orange text-accent-orange" />
            <span suppressHydrationWarning>
              {isHydrated ? coopStreakDays : 5} Hari
            </span>
          </Link>

          {/* Notification Center Trigger */}
          <button
            onClick={toggleDrawer}
            className="relative p-2 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
            title="Buka Notification Center"
          >
            <Bell className="h-4 w-4" />
            {isHydrated && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-pill bg-accent-orange text-[9px] font-bold text-text-inverse ring-2 ring-surface">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Pet Indicator */}
          <Link
            href="/pet-customization/wardrobe"
            className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-pill border border-border-default bg-surface-subtle hover:bg-accent-green-light/40 text-xs font-medium transition-colors"
          >
            <div
              suppressHydrationWarning
              className="h-5 w-5 rounded-pill flex items-center justify-center font-bold text-[10px] bg-accent-green/20 text-text-primary"
            >
              {isHydrated ? level : 4}
            </div>
            <span
              suppressHydrationWarning
              className="truncate max-w-[80px] font-semibold text-neutral-10"
            >
              {isHydrated ? name : "Pyro"}
            </span>
            <span suppressHydrationWarning className="text-[10px] text-text-muted">
              Stg {isHydrated ? stage : 2}
            </span>
          </Link>

          {/* Profile Link */}
          <Link
            href="/profile/overview"
            aria-current={pathname.startsWith("/profile") ? "page" : undefined}
            className={cn(
              "nav-item flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-navigation border transition-colors",
              pathname.startsWith("/profile")
                ? "is-selected border-accent-orange"
                : "border-border-default text-neutral-10"
            )}
          >
            <UserCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
