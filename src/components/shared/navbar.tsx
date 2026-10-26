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
    <header className="sticky top-0 z-40 w-full border-b border-warm-border bg-surface/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2.5 transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-green text-surface-raised shadow-[0_4px_0_var(--brand-green-dark)]">
            <Flame className="h-6 w-6 fill-current" />
          </div>
          <div>
            <span className="font-heading text-xl font-bold tracking-tight text-ink">
              Caloria
            </span>
            <span className="ml-1.5 hidden text-xs font-medium text-ink-muted xl:inline-block">
              Nourish & Level Up
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-warm-border bg-surface-sunken p-1 lg:flex">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-item flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all",
                  active ? "is-selected" : "text-brand-green-dark"
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
            className="chip gap-1.5 px-2.5 py-1 text-[11px] transition-colors hover:bg-brand-green-light hover:text-brand-green-ink"
            title="Caloria Coins - Belanja di Shop"
          >
            <Coins className="h-3.5 w-3.5 text-brown" />
            <span>{coins}</span>
          </Link>

          {/* Co-op Streak Badge */}
          <Link
            href="/social/coop"
            className="chip-green gap-1.5 px-2.5 py-1 text-[11px] transition-colors hover:bg-brand-green hover:text-surface-raised"
          >
            <Flame className="h-3.5 w-3.5 fill-current" />
            <span>{coopStreakDays} Hari</span>
          </Link>

          {/* Notification Center Trigger */}
          <button
            onClick={toggleDrawer}
            className="btn-icon relative"
            title="Buka Notification Center"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-ink ring-2 ring-surface">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Pet Indicator */}
          <Link
            href="/pet-customization/wardrobe"
            className="hidden items-center gap-2 rounded-full border border-warm-border bg-surface-raised py-1 pl-2 pr-3 text-xs font-medium transition-colors hover:bg-brand-green-light sm:flex"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-green-light text-[10px] font-bold text-brand-green-ink">
              {level}
            </div>
            <span className="max-w-[80px] truncate font-semibold text-ink">
              {name}
            </span>
            <span className="text-[10px] text-ink-muted">Stg {stage}</span>
          </Link>

          {/* Profile Link */}
          <Link
            href="/profile/overview"
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors",
              pathname.startsWith("/profile")
                ? "border-brand-orange bg-brand-orange text-ink"
                : "border-warm-border bg-surface-raised text-ink hover:border-brand-green-light hover:bg-brand-green-light hover:text-brand-green-ink"
            )}
          >
            <UserCircle
              className={cn(
                "h-4 w-4",
                pathname.startsWith("/profile") ? "text-ink" : "text-brand-green-dark"
              )}
            />
            <span className="hidden sm:inline">Profil</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
