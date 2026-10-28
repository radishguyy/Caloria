"use client";

import { useState } from "react";
import { Award, Lock, CheckCircle2, Coins } from "lucide-react";
import {
  ACHIEVEMENTS_DATA,
  AchievementBadge,
  AchievementCategory,
} from "@/lib/achievements-data";
import { useAchievementsStore } from "@/store/use-achievements-store";
import { ProfileHeader } from "@/components/profile/profile-header";
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
      <ProfileHeader title="Galeri Badge & Prestasi" />

      <div className="flex justify-end">
        <div className="flex items-center gap-2 rounded-xl bg-accent-yellow border border-accent-green/30 px-4 py-2 text-text-primary font-bold text-xs">
          <Award className="h-4 w-4 text-accent-green" aria-hidden="true" />
          <span>
            {totalUnlocked} dari {ACHIEVEMENTS_DATA.length} Terbuka
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "nav-item px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border",
              activeCategory === cat.id
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default"
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
                "p-5 rounded-card border-2 cursor-pointer transition-all flex items-start gap-4 shadow-xs relative group",
                isUnlocked
                  ? "bg-surface border-accent-green/40 hover:border-accent-green hover:shadow-md"
                  : "bg-surface-subtle border-border-divider opacity-75 hover:opacity-95"
              )}
            >
              {isUnlocked ? (
                <span className="absolute top-3 right-3 text-accent-green">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              ) : (
                <span className="absolute top-3 right-3 text-text-muted">
                  <Lock className="h-3.5 w-3.5" />
                </span>
              )}

              {/* Badge Icon Bubble */}
              <div
                className={cn(
                  "h-14 w-14 shrink-0 rounded-button flex items-center justify-center text-3xl shadow-2xs transition-transform group-hover:scale-105",
                  isUnlocked
                    ? "bg-accent-yellow border border-accent-green/30"
                    : "bg-surface border border-border-default grayscale"
                )}
              >
                {badge.iconEmoji}
              </div>

              <div className="space-y-1 flex-1 pr-4">
                <h3 className="text-sm font-bold text-text-primary line-clamp-1">
                  {badge.name}
                </h3>
                <p className="text-[11px] text-neutral-10 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-accent-orange-dark flex items-center gap-0.5">
                    <Coins className="h-3 w-3 text-accent-orange" />
                    +{badge.rewardCoins} Koin
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-md",
                      isUnlocked
                        ? "bg-accent-green/15 text-text-primary"
                        : "bg-surface border border-border-default text-text-muted"
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
          <div className="w-full max-w-sm rounded-card border border-border-divider bg-surface p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-20 w-20 rounded-card bg-accent-yellow border border-accent-green/30 flex items-center justify-center text-4xl mx-auto shadow-xs">
              {selectedBadge.iconEmoji}
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-subtle border border-border-divider text-text-muted">
                Kategori {selectedBadge.category}
              </span>
              <h3 className="text-lg font-black text-text-primary font-heading">
                {selectedBadge.name}
              </h3>
              <p className="text-xs text-neutral-10 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            <div className="p-3 rounded-button bg-surface-subtle border border-border-divider text-xs space-y-1 text-left">
              <span className="text-text-muted font-semibold">Syarat Terbuka:</span>
              <p className="font-bold text-text-primary">{selectedBadge.requirementText}</p>
            </div>

            <div className="review-card flex items-center justify-between p-3.5 border border-accent-green/25 text-xs">
              <span className="font-semibold text-neutral-10">Hadiah Bonus:</span>
              <span className="font-black text-accent-orange-dark flex items-center gap-1">
                <Coins className="h-4 w-4 text-accent-orange" />
                +{selectedBadge.rewardCoins} Caloria Coins
              </span>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="button-primary w-full py-2.5 text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
