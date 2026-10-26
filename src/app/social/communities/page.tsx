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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/social/coop"
              className="btn-icon h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Komunitas Misi Gizi Seimbang
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 ml-8 sm:ml-0">
            Temukan grup yang memiliki fokus nutrisi yang sama, pelajari tips ahli gizi, dan lihat rekomendasi menu harian.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Co-op Streak vs Communities */}
      <div className="flex items-center gap-2 border-b border-warm-border pb-1">
        <Link
          href="/social/coop"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-brand-green-light hover:text-brand-green-ink"
        >
          Co-op Streak & Teman
        </Link>
        <Link
          href="/social/communities"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-orange text-ink"
        >
          Komunitas Misi Gizi
        </Link>
      </div>

      {/* Community Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {COMMUNITIES_DATA.map((comm) => {
          const isSelected = selectedCommunityId === comm.id;
          const userJoined = joinedCommunities.includes(comm.id);

          return (
            <div
              key={comm.id}
              onClick={() => setSelectedCommunityId(comm.id)}
              className={cn(
                "p-4 rounded-3xl border-2 cursor-pointer transition-all space-y-2 relative shadow-xs",
                isSelected
                  ? "border-brand-orange bg-highlight ring-2 ring-brand-orange/30"
                  : "border-warm-border bg-card hover:bg-brand-green-light"
              )}
            >
              {userJoined && (
                <span className="absolute top-3 right-3 rounded-full border border-warm-border bg-brand-green-light px-2 py-0.5 text-[9px] font-bold text-brand-green-ink">
                  Tergabung
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-orange text-ink font-bold text-xs">
                  {comm.focusGoal === "diet" ? "DIET" : comm.focusGoal === "bulking" ? "BULK" : "BALANCE"}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink line-clamp-1">{comm.name}</h3>
                  <span className="text-[10px] text-ink-muted">{comm.memberCount} Anggota</span>
                </div>
              </div>

              <p className="text-[11px] text-ink-muted line-clamp-2">
                {comm.tagline}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Community Detail Panel */}
      <div className="rounded-3xl border border-warm-border bg-card p-6 sm:p-8 space-y-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
          <div className="space-y-1">
            <span className="rounded-full bg-highlight px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brown">
              Fokus Misi: {activeCommunity.focusGoal.toUpperCase()}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-ink">
              {activeCommunity.name}
            </h2>
            <p className="text-xs text-ink-muted max-w-xl">
              {activeCommunity.description}
            </p>
          </div>

          <button
            onClick={() => toggleJoin(activeCommunity.id)}
            className={cn(
              "shrink-0 self-start px-5 py-2.5 text-xs sm:self-auto",
              isJoined
                ? "btn-ghost min-h-0 bg-surface-sunken text-ink"
                : "btn-cta min-h-0"
            )}
          >
            {isJoined ? "Tergabung (Keluar)" : "+ Gabung Komunitas Ini"}
          </button>
        </div>

        {/* Guidelines / Rules */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen className="h-4 w-4 text-brand-green" />
            <span>Pedoman Grup & Kebiasaan Sehat:</span>
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-ink-muted">
            {activeCommunity.rules.map((rule, idx) => (
              <li key={idx} className="rounded-2xl border border-warm-border bg-surface-sunken/60 p-3">
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Menus */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider">
            <Utensils className="h-4 w-4 text-brown" />
            <span>Rekomendasi Menu Favorit Anggota:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeCommunity.recommendedMenus.map((menu, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-warm-border bg-surface-raised flex flex-col justify-between space-y-2"
              >
                <p className="text-xs font-bold text-ink leading-snug">{menu}</p>
                <Link
                  href="/diary/add"
                  className="text-[11px] font-semibold text-brand-green-dark hover:underline inline-flex items-center gap-1"
                >
                  <span>Catat Menu Ini &rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Nutritionist Tips */}
        <div className="space-y-2 pt-2 border-t border-warm-border">
          <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider">
            <Lightbulb className="h-4 w-4 text-brand-green" />
            <span>Tips dari Nutrition Advisor & Senior Member:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeCommunity.pinnedTips.map((tip, idx) => (
              <div key={idx} className="rounded-2xl border border-warm-border bg-surface-sunken/60 p-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{tip.author}</span>
                  <span className="text-[10px] text-ink-muted">{tip.role}</span>
                </div>
                <p className="text-[11px] text-ink-muted italic leading-relaxed">
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

