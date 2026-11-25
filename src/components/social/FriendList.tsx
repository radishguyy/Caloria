"use client";

import { useState } from "react";
import {
  Flame,
  Send,
  CheckCircle2,
  Clock,
  Utensils,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { Friend } from "@/types";
import { useSocialStore } from "@/stores/social-store";
import { useNotificationStore } from "@/store/use-notification-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { toastNudgeSent } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface FriendListProps {
  className?: string;
  onOpenAddModal?: () => void;
}

export function FriendList({ className, onOpenAddModal }: FriendListProps) {
  const isHydrated = useHydrated();
  const { friends, pokeFriend } = useSocialStore();
  const { addNotification } = useNotificationStore();
  const [filter, setFilter] = useState<"all" | "pending_log" | "completed">("all");

  if (!isHydrated) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-8 w-48 bg-surface-subtle animate-pulse rounded-navigation" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-card bg-surface-subtle animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const filteredFriends = friends.filter((f) => {
    if (filter === "pending_log") return !f.dailyGoalMet;
    if (filter === "completed") return f.dailyGoalMet;
    return true;
  });

  const handlePoke = (friend: Friend) => {
    const targetId = friend.userId || friend.id;
    const poke = pokeFriend(friend.id || friend.userId);
    if (poke) {
      addNotification({
        type: "poke",
        title: "Senggolan Terkirim!",
        message: poke.message,
        actionUrl: "/social",
      });
      toastNudgeSent(friend.fullName || friend.username);

      if (targetId) {
        fetch("/api/notifications/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: targetId,
            type: "poke",
          }),
        }).catch((err) => {
          console.warn("[FriendList] Failed to dispatch poke push/email:", err);
        });
      }
    }
  };

  return (
    <section aria-label="Daftar Teman" className={cn("space-y-4", className)}>
      {/* List Header & Filters (no count badge, no subtitle, no filter counts) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-text-primary font-heading tracking-tight">
          Teman Co-op Aktif
        </h2>

        {/* Filter Pills (clean labels without counts) */}
        <div className="flex items-center gap-1.5 p-1 rounded-navigation bg-surface-subtle border border-border-divider self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "min-h-10 px-4 py-1.5 rounded-navigation text-sm font-bold transition-colors font-sans",
              filter === "all"
                ? "bg-surface text-text-primary border border-border-divider/70"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending_log")}
            className={cn(
              "min-h-10 px-4 py-1.5 rounded-navigation text-sm font-bold transition-colors font-sans",
              filter === "pending_log"
                ? "bg-surface text-text-primary border border-border-divider/70"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            Belum Log
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={cn(
              "min-h-10 px-4 py-1.5 rounded-navigation text-sm font-bold transition-colors font-sans",
              filter === "completed"
                ? "bg-surface text-text-primary border border-border-divider/70"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Friends Cards */}
      {filteredFriends.length === 0 ? (
        <div className="rounded-card bg-surface p-8 text-center border border-border-divider space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-neutral-10">
            <Utensils className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-text-primary font-heading">
            {filter === "completed"
              ? "Belum ada teman yang menyelesaikan target hari ini"
              : filter === "pending_log"
              ? "Hebat! Semua temanmu sudah mencatat makan hari ini"
              : "Belum ada teman di daftar kamu"}
          </p>
          {friends.length === 0 && onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="min-h-12 inline-flex items-center justify-center px-5 py-2.5 rounded-button bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-sm sm:text-base font-extrabold font-sans transition-colors cursor-pointer"
            >
              + Tambah Teman
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredFriends.map((friend) => {
            const petSpecies = friend.petSpecies || "bloomie";
            const petLevel = friend.petLevel || 1;
            const petStage = friend.petStage || (petLevel >= 5 ? "Juvenile" : "Hatchling");
            const streak = friend.streakDays || 1;
            const calories = friend.caloriesLoggedToday || 0;
            const target = friend.calorieTarget || 2000;
            const pct = Math.min(100, Math.round((calories / target) * 100));

            return (
              <div
                key={friend.id || friend.userId}
                className={cn(
                  "p-4 sm:p-5 rounded-card border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4",
                  friend.dailyGoalMet
                    ? "border-accent-green/35 bg-surface hover:border-accent-green/50"
                    : "border-border-default bg-surface hover:border-accent-orange/40"
                )}
              >
                {/* Left: Avatar & Profile Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-subtle border border-border-divider overflow-hidden">
                    <AvatarRenderer characterId={petSpecies} size="sm" className="h-12 w-12" />
                    {friend.dailyGoalMet && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-green text-text-inverse border-2 border-surface">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-extrabold text-text-primary font-heading truncate">
                        {friend.fullName}
                      </h3>
                      <span className="text-sm text-neutral-10 font-sans truncate">
                        @{friend.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-sm font-sans">
                      <span className="px-2.5 py-0.5 rounded-pill bg-accent-green-light/40 text-text-primary font-bold">
                        {friend.petName || "Pet"} • Lv.{petLevel} {petStage}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-[#FCF8E3] text-text-primary font-bold">
                        <Flame className="h-3.5 w-3.5 fill-accent-orange text-accent-orange" />
                        {streak} Hari Streak
                      </span>
                    </div>

                    <p className="text-sm text-neutral-10 flex items-center gap-1.5 font-sans">
                      <Clock className="h-3.5 w-3.5 text-neutral-10" />
                      {friend.lastActiveText || "Aktif di Caloria"}
                    </p>
                  </div>
                </div>

                {/* Right: Nutrition Progress & Senggol Action */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t md:border-t-0 border-border-divider pt-3 md:pt-0">
                  <div className="space-y-1.5 sm:w-48">
                    <div className="flex items-center justify-between text-sm font-sans">
                      <span className="font-semibold text-neutral-10">Kalori</span>
                      <span className="font-extrabold text-text-primary tabular-nums">
                        {calories} / {target} kcal
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-pill bg-surface-subtle border border-border-divider overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-pill transition-all duration-500",
                          friend.dailyGoalMet ? "bg-accent-green" : "bg-accent-orange"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {friend.dailyGoalMet ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-navigation text-sm font-bold text-[#244710] bg-accent-green-light/40 font-sans">
                        <CheckCircle2 className="h-4 w-4" />
                        Target Selesai!
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePoke(friend)}
                        className="min-h-11 inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-accent-orange hover:bg-accent-orange-dark text-white text-sm font-extrabold font-sans cursor-pointer transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        <span>Senggol</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
