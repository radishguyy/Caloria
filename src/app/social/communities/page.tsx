"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Utensils,
  Lightbulb,
} from "lucide-react";
import { COMMUNITIES_DATA } from "@/lib/communities-data";
import { useFoodStore } from "@/store/use-food-store";
import { cn } from "@/lib/utils";

export default function SocialCommunitiesPage() {
  const { goalPlan } = useFoodStore();

  const [selectedCommunityId, setSelectedCommunityId] = useState(
    goalPlan.goalType === "bulking"
      ? "community-bulking-club"
      : goalPlan.goalType === "maintenance"
      ? "community-balance-squad"
      : "community-diet-warriors"
  );

  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([
    "community-diet-warriors",
  ]);

  const activeCommunity =
    COMMUNITIES_DATA.find((c) => c.id === selectedCommunityId) ||
    COMMUNITIES_DATA[0];

  const isJoined = joinedCommunities.includes(activeCommunity.id);

  const toggleJoin = (id: string) => {
    if (joinedCommunities.includes(id)) {
      setJoinedCommunities((prev) => prev.filter((item) => item !== id));
    } else {
      setJoinedCommunities((prev) => [...prev, id]);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/social/coop"
              className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Komunitas Misi Gizi Seimbang
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1 ml-8 sm:ml-0">
            Temukan grup yang memiliki fokus nutrisi yang sama, pelajari tips ahli gizi, dan lihat rekomendasi menu harian.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Co-op Streak vs Communities */}
      <div className="flex items-center gap-2 border-b border-border-divider pb-2">
        <Link
          href="/social/coop"
          className="nav-item px-4 py-2 text-xs font-semibold text-neutral-10"
        >
          Co-op Streak & Teman
        </Link>
        <Link
          href="/social/communities"
          aria-current="page"
          className="nav-item is-selected px-4 py-2 text-xs font-bold"
        >
          Komunitas Misi Gizi
        </Link>
      </div>

      {/* Community Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {COMMUNITIES_DATA.map((comm) => {
          const isSelected = selectedCommunityId === comm.id;
          const userJoined = joinedCommunities.includes(comm.id);

          return (
            <div
              key={comm.id}
              onClick={() => setSelectedCommunityId(comm.id)}
              className={cn(
                "p-5 rounded-card border-2 cursor-pointer transition-all space-y-2 relative shadow-xs",
                isSelected
                  ? "border-accent-orange bg-accent-yellow/50 ring-2 ring-accent-orange/20"
                  : "border-border-divider bg-surface hover:bg-surface-subtle"
              )}
            >
              {userJoined && (
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-pill text-[9px] font-bold bg-accent-green/15 text-text-primary border border-accent-green/30">
                  Tergabung
                </span>
              )}

              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-navigation bg-accent-green text-text-inverse font-bold text-xs">
                  {comm.focusGoal === "diet"
                    ? "🔥"
                    : comm.focusGoal === "bulking"
                    ? "💪"
                    : "⚖️"}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-text-primary line-clamp-1">
                    {comm.name}
                  </h3>
                  <span className="text-[10px] text-text-muted">
                    {comm.memberCount} Anggota
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-10 line-clamp-2">
                {comm.tagline}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Community Detail Panel */}
      <div className="rounded-card border border-border-divider bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wider bg-accent-green/15 text-text-primary">
              Fokus Misi: {activeCommunity.focusGoal.toUpperCase()}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary font-heading pt-1">
              {activeCommunity.name}
            </h2>
            <p className="text-xs text-neutral-10 max-w-xl">
              {activeCommunity.description}
            </p>
          </div>

          <button
            onClick={() => toggleJoin(activeCommunity.id)}
            className={cn(
              "px-5 py-2.5 rounded-button font-bold text-xs transition-transform active:scale-95 shrink-0 self-start sm:self-auto",
              isJoined
                ? "bg-accent-yellow hover:bg-accent-green-light text-text-primary border border-border-default"
                : "button-primary"
            )}
          >
            {isJoined ? "Tergabung (Keluar)" : "+ Gabung Komunitas Ini"}
          </button>
        </div>

        {/* Guidelines / Rules */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen className="h-4 w-4 text-accent-green" />
            <span>Pedoman Grup & Kebiasaan Sehat:</span>
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-neutral-10">
            {activeCommunity.rules.map((rule, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-button bg-surface-subtle border border-border-divider"
              >
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Menus */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
            <Utensils className="h-4 w-4 text-accent-green" />
            <span>Rekomendasi Menu Favorit Anggota:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeCommunity.recommendedMenus.map((menu, idx) => (
              <div
                key={idx}
                className="p-4 rounded-button border border-border-divider bg-surface-subtle flex flex-col justify-between space-y-2"
              >
                <p className="text-xs font-bold text-text-primary leading-snug">
                  {menu}
                </p>
                <Link
                  href="/diary/add"
                  className="text-[11px] font-bold text-text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Catat Menu Ini &rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Nutritionist Tips */}
        <div className="space-y-2 pt-2 border-t border-border-divider">
          <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
            <Lightbulb className="h-4 w-4 text-accent-orange" />
            <span>Tips dari Nutrition Advisor & Senior Member:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeCommunity.pinnedTips.map((tip, idx) => (
              <div
                key={idx}
                className="review-card p-4 border border-accent-green/25 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">{tip.author}</span>
                  <span className="text-[10px] text-neutral-10 font-medium">
                    {tip.role}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-10 italic leading-relaxed">
                  &ldquo;{tip.tip}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
