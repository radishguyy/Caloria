"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  Sparkles,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Utensils,
  Lightbulb,
} from "lucide-react";
import { COMMUNITIES_DATA, CommunityGroup } from "@/lib/communities-data";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/social/coop"
              className="p-1.5 rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Komunitas Misi Gizi Seimbang
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-8 sm:ml-0">
            Temukan grup yang memiliki fokus nutrisi yang sama, pelajari tips ahli gizi, dan lihat rekomendasi menu harian.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Co-op Streak vs Communities */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <Link
          href="/social/coop"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Co-op Streak & Teman
        </Link>
        <Link
          href="/social/communities"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-foreground text-background"
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
                  ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20"
                  : "border-border bg-card hover:bg-muted/30"
              )}
            >
              {userJoined && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Tergabung
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-500 text-white font-bold text-xs">
                  {comm.focusGoal === "diet" ? "🔥" : comm.focusGoal === "bulking" ? "💪" : "⚖️"}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{comm.name}</h3>
                  <span className="text-[10px] text-muted-foreground">{comm.memberCount} Anggota</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {comm.tagline}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Community Detail Panel */}
      <div className="rounded-3xl border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400">
              Fokus Misi: {activeCommunity.focusGoal.toUpperCase()}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              {activeCommunity.name}
            </h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              {activeCommunity.description}
            </p>
          </div>

          <button
            onClick={() => toggleJoin(activeCommunity.id)}
            className={cn(
              "px-5 py-2.5 rounded-2xl font-bold text-xs transition-transform active:scale-95 shrink-0 self-start sm:self-auto",
              isJoined
                ? "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
            )}
          >
            {isJoined ? "Tergabung (Keluar)" : "+ Gabung Komunitas Ini"}
          </button>
        </div>

        {/* Guidelines / Rules */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen className="h-4 w-4 text-orange-500" />
            <span>Pedoman Grup & Kebiasaan Sehat:</span>
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-muted-foreground">
            {activeCommunity.rules.map((rule, idx) => (
              <li key={idx} className="p-3 rounded-2xl bg-muted/40 border">
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Menus */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <Utensils className="h-4 w-4 text-amber-500" />
            <span>Rekomendasi Menu Favorit Anggota:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeCommunity.recommendedMenus.map((menu, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border bg-background flex flex-col justify-between space-y-2"
              >
                <p className="text-xs font-bold text-foreground leading-snug">{menu}</p>
                <Link
                  href="/diary/add"
                  className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Catat Menu Ini &rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Nutritionist Tips */}
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span>Tips dari Nutrition Advisor & Senior Member:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeCommunity.pinnedTips.map((tip, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-muted/30 border space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{tip.author}</span>
                  <span className="text-[10px] text-muted-foreground">{tip.role}</span>
                </div>
                <p className="text-[11px] text-muted-foreground italic leading-relaxed">
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

