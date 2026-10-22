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
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-md" style={{ borderColor: 'var(--color-border-divider)' }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md" style={{ background: 'var(--color-accent-orange)' }}>
            <Flame className="h-6 w-6 fill-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
              Caloria
            </span>
            <span className="hidden text-xs xl:inline-block ml-1.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Nourish & Level Up
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full border" style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border-divider)' }}>
          {links.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-item flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium transition-all",
                  active ? "is-selected" : ""
                )}
                style={active ? {} : { color: 'var(--color-neutral-10)' }}
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors"
            style={{
              background: 'color-mix(in srgb, var(--color-accent-orange) 10%, transparent)',
              color: 'var(--color-accent-orange-dark)',
              borderColor: 'color-mix(in srgb, var(--color-accent-orange) 20%, transparent)'
            }}
            title="Caloria Coins — Belanja di Shop"
          >
            <Coins className="h-3.5 w-3.5" style={{ color: 'var(--color-accent-orange)' }} />
            <span>{coins}</span>
          </Link>

          {/* Co-op Streak Badge */}
          <Link
            href="/social/coop"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors"
            style={{
              background: 'color-mix(in srgb, var(--color-accent-orange) 10%, transparent)',
              color: 'var(--color-accent-orange-dark)',
              borderColor: 'color-mix(in srgb, var(--color-accent-orange) 20%, transparent)'
            }}
          >
            <Flame className="h-3.5 w-3.5" style={{ fill: 'var(--color-accent-orange)', color: 'var(--color-accent-orange)' }} />
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
            className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border text-xs font-medium transition-colors"
            style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border-default)' }}
          >
            <div className="h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px]" style={{ background: 'color-mix(in srgb, var(--color-accent-orange) 20%, transparent)', color: 'var(--color-accent-orange)' }}>
              {level}
            </div>
            <span className="truncate max-w-[80px] font-semibold" style={{ color: 'var(--color-neutral-10)' }}>{name}</span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Stg {stage}
            </span>
          </Link>

          {/* Profile Link */}
          <Link
            href="/profile/overview"
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors",
              pathname.startsWith("/profile") ? "" : ""
            )}
            style={pathname.startsWith("/profile") ? {
              borderColor: 'color-mix(in srgb, var(--color-accent-orange) 40%, transparent)',
              background: 'color-mix(in srgb, var(--color-accent-orange) 10%, transparent)',
              color: 'var(--color-accent-orange-dark)',
            } : {
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-neutral-10)',
            }}
          >
            <UserCircle className="h-4 w-4" style={{ color: 'var(--color-accent-orange)' }} />
            <span className="hidden sm:inline">Profil</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
