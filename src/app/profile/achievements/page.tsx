"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Lock,
  CheckCircle2,
  Coins,
  ArrowLeft,
  Sparkles,
  X,
} from "lucide-react";
import {
  ACHIEVEMENTS_DATA,
  AchievementBadge,
  AchievementCategory,
} from "@/lib/achievements-data";
import { useAchievementsStore } from "@/store/use-achievements-store";
import { cn } from "@/lib/utils";

export default function ProfileAchievementsPage() {
  const { unlockedBadgeIds } = useAchievementsStore();

  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

  const categories: { id: AchievementCategory | "all"; label: string }[] = [
    { id: "all", label: "Semua Badge" },
    { id: "consistency", label: "Konsistensi Streak" },
    { id: "nutrition", label: "Misi Gizi & Target" },
    { id: "social", label: "Sosial & Co-op" },
  ];

  const filteredBadges =
    activeCategory === "all"
      ? ACHIEVEMENTS_DATA
      : ACHIEVEMENTS_DATA.filter((b) => b.category === activeCategory);

  const totalUnlocked = ACHIEVEMENTS_DATA.filter((b) =>
    unlockedBadgeIds.includes(b.id)
  ).length;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile/overview"
              className="p-1.5 rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Galeri Badge & Prestasi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-8 sm:ml-0">
            Penghargaan otomatis atas rekam jejak konsistensi gizi, penyelesaian misi, dan kerja sama Co-op.
          </p>
        </div>

        {/* Unlocked Counter Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
          <Award className="h-4 w-4 text-amber-500" />
          <span>
            {totalUnlocked} dari {ACHIEVEMENTS_DATA.length} Terbuka
          </span>
        </div>
      </div>

      {/* Sub-Tabs: Overview vs Achievements vs Settings */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <Link
          href="/profile/overview"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Overview & Berat Badan
        </Link>
        <Link
          href="/profile/achievements"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-foreground text-background"
        >
          Galeri Achievement
        </Link>
        <Link
          href="/profile/settings"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Pengaturan Notifikasi
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border",
              activeCategory === cat.id
                ? "bg-orange-500 text-white border-orange-500 font-bold shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isUnlocked = unlockedBadgeIds.includes(badge.id);

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={cn(
                "p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-start gap-4 shadow-xs relative group",
                isUnlocked
                  ? "bg-card border-orange-500/30 hover:border-orange-500 hover:shadow-md"
                  : "bg-muted/30 border-border opacity-70 hover:opacity-90"
              )}
            >
              {isUnlocked ? (
                <span className="absolute top-3 right-3 text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              ) : (
                <span className="absolute top-3 right-3 text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                </span>
              )}

              {/* Badge Icon Bubble */}
              <div
                className={cn(
                  "h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-105",
                  isUnlocked
                    ? "bg-orange-500/10 border border-orange-500/20"
                    : "bg-muted/80 grayscale"
                )}
              >
                {badge.iconEmoji}
              </div>

              <div className="space-y-1 flex-1 pr-4">
                <h3 className="text-sm font-bold text-foreground line-clamp-1">
                  {badge.name}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                    <Coins className="h-3 w-3" />
                    +{badge.rewardCoins} Koin
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.2 rounded-full",
                      isUnlocked
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isUnlocked ? "Terbuka" : "Terkunci"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* [Modal] Detail Pencapaian Badge Terbuka */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border bg-card p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-20 w-20 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-4xl mx-auto shadow-sm">
              {selectedBadge.iconEmoji}
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                Kategori {selectedBadge.category}
              </span>
              <h3 className="text-lg font-black text-foreground">
                {selectedBadge.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border text-xs space-y-1 text-left">
              <span className="text-muted-foreground font-semibold">Syarat Terbuka:</span>
              <p className="font-bold text-foreground">{selectedBadge.requirementText}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="font-semibold text-muted-foreground">Hadiah Bonus:</span>
              <span className="font-black text-amber-500 flex items-center gap-1">
                <Coins className="h-4 w-4" />
                +{selectedBadge.rewardCoins} Caloria Coins
              </span>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

