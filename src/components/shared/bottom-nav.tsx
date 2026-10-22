"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, UtensilsCrossed, Award, Users, UserCircle } from "lucide-react";

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden backdrop-blur-lg border-t px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]" style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'var(--color-border-divider)' }}>
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="nav-item flex flex-col items-center justify-center gap-1 py-1 px-2.5 transition-all"
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className="p-1 rounded-lg transition-transform"
                style={isActive ? { background: 'color-mix(in srgb, var(--color-accent-orange) 10%, transparent)', transform: 'scale(1.1)' } : {}}
              >
                <Icon className="h-5 w-5" style={{ color: isActive ? 'var(--color-accent-orange)' : 'var(--color-text-muted)' }} />
              </div>
              <span className="text-[10px] tracking-tight" style={{ color: isActive ? 'var(--color-accent-orange)' : 'var(--color-text-muted)', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
