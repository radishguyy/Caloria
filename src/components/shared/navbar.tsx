"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings, UserRound, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAuthStore } from "@/store/use-auth-store";
import { useNotificationStore } from "@/store/use-notification-store";
import { NAV_ITEMS, isNavItemActive } from "./nav-config";
import { NavStreakBadge } from "./nav-streak-badge";
import { logoutAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

const controlClass =
  "relative inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-canvas text-ink transition-colors duration-200 hover:bg-brand-green-light hover:text-brand-green-ink focus-visible:bg-brand-green-light focus-visible:text-brand-green-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink motion-reduce:transition-none";

function getInitials(fullName: string | undefined, username: string | undefined) {
  const source = (fullName || username || "").trim();
  if (!source) return "";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return letters.toUpperCase();
}

export function Navbar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { isAuthenticated, user, logout } = useAuthStore();
  const toggleDrawer = useNotificationStore((state) => state.toggleDrawer);
  const isDrawerOpen = useNotificationStore((state) => state.isDrawerOpen);
  const storedUnreadCount = useNotificationStore((state) =>
    state.notifications.filter((n) => !n.isRead).length
  );

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Client signOut warning:", e);
    }
    await logoutAction();
    logout();
    try {
      localStorage.removeItem("caloria-auth-storage");
    } catch {}
    window.location.href = "/login";
  };

  const isAuthed = hydrated && isAuthenticated;
  const unreadCount = hydrated ? storedUnreadCount : 0;
  const profileActive = isAuthed && pathname.startsWith("/profile");
  const settingsActive = pathname.startsWith("/profile/settings");
  const profileHref = isAuthed ? "/profile/overview" : "/login";
  const profileLabel = isAuthed
    ? `Profil ${user?.fullName ?? user?.username ?? ""}`.trim()
    : "Masuk";
  const initials = isAuthed ? getInitials(user?.fullName, user?.username) : "";

  return (
    <header className="sticky top-0 z-40 w-full overflow-visible border-b border-warm-border bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-stretch gap-4 px-4 sm:px-6 lg:gap-6">
        {/* Brand */}
        <Link
          href="/dashboard"
          aria-label="Caloria - ke Dashboard"
          className="flex shrink-0 items-center gap-2.5 self-center rounded-lg transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green-ink active:scale-95 motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-green shadow-[0_4px_0_var(--brand-green-dark)]"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#fffdf8">
              <path d="M12.6 2.2c.3 2.6-.9 4.2-2.3 5.8C8.9 9.6 7.5 11.2 7.5 14a4.5 4.5 0 0 0 9 0c0-1.5-.6-2.6-1.3-3.6-.3 1.1-.9 1.9-1.8 2.3.6-3.5-.1-7.3-.8-10.5Z" />
              <path d="M12 22a6 6 0 0 1-6-6c0-2 .9-3.4 1.9-4.5-.1 2.8 1.6 4.3 3.1 4.3 1.2 0 2.1-.8 2.4-1.9.9 1 1.6 2.2 1.6 3.9a6 6 0 0 1-3 4.2Z" opacity=".55" />
            </svg>
          </span>
          <span className="font-heading text-xl font-bold tracking-tight text-ink">
            Caloria
          </span>
        </Link>

        {/* Desktop navigation: squircle tabs */}
        <nav aria-label="Navigasi utama" className="hidden self-start pt-3 lg:block">
          <ul className="flex items-start gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(pathname, item);
              return (
                <li key={item.href} className="relative shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-bold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-ink motion-reduce:transition-none",
                      active
                        ? "bg-brand-orange text-ink"
                        : "bg-brand-green-light text-brand-green-ink hover:bg-brand-green hover:text-ink"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                  {hydrated && item.showStreak && (
                    <span className="pointer-events-none absolute -right-[15px] -top-2 z-20">
                      <NavStreakBadge />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1" aria-hidden="true" />

        {/* Right-side controls */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleDrawer}
            aria-label={
              unreadCount > 0
                ? `Buka notifikasi, ${unreadCount} belum dibaca`
                : "Buka notifikasi"
            }
            aria-expanded={hydrated && isDrawerOpen}
            aria-haspopup="dialog"
            className={controlClass}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold leading-none text-ink ring-2 ring-surface"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <Link
            href="/profile/settings"
            aria-label="Pengaturan"
            title="Pengaturan"
            aria-current={settingsActive ? "page" : undefined}
            className={cn(
              controlClass,
              settingsActive && "bg-brand-orange text-ink hover:bg-brand-orange hover:text-ink"
            )}
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>

          <Link
            href={profileHref}
            aria-label={profileLabel}
            aria-current={profileActive ? "page" : undefined}
            className={cn(
              controlClass,
              "overflow-hidden",
              profileActive && "bg-brand-orange text-ink hover:bg-brand-orange hover:text-ink"
            )}
          >
            {isAuthenticated && user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : isAuthenticated && initials ? (
              <span aria-hidden="true" className="text-sm font-bold">
                {initials}
              </span>
            ) : (
              <UserRound className="h-5 w-5" aria-hidden="true" />
            )}
          </Link>

          {isAuthed && (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar dari akun"
              title="Keluar (Logout)"
              className={cn(
                controlClass,
                "text-destructive hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}