"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Sparkles, UtensilsCrossed, Users, Award, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePetStore } from "@/store/use-pet-store";

export function Navbar() {
  const pathname = usePathname();
  const { name, level, stage } = usePetStore();

  const links = [
    { href: "/", label: "Dashboard", icon: Sparkles },
    { href: "/diary", label: "Catatan Makanan", icon: UtensilsCrossed },
    { href: "/pet", label: "Virtual Pet", icon: Award },
    { href: "/social", label: "Co-op Streak", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform active:scale-95">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20">
            <Flame className="h-6 w-6 fill-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-foreground">Caloria</span>
            <span className="hidden text-xs text-muted-foreground sm:inline-block ml-1.5 font-medium">
              Gamified Nutrition
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/50">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-sm shadow-black/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-orange-500" : "")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Badges & Pet Status */}
        <div className="flex items-center gap-2.5">
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-semibold border border-orange-500/20 shadow-xs">
            <Flame className="h-4 w-4 fill-orange-500 text-orange-500 animate-pulse" />
            <span>7 Hari</span>
          </div>

          {/* Pet Indicator */}
          <Link
            href="/pet"
            className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 bg-secondary rounded-full border border-border text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <div className="h-5 w-5 rounded-full bg-orange-400/20 flex items-center justify-center text-orange-500 font-bold text-[10px]">
              {level}
            </div>
            <span className="truncate max-w-[80px] font-semibold">{name}</span>
            <span className="text-[10px] text-muted-foreground">Stg {stage}</span>
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Akun</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
