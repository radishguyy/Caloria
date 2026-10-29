"use client";

import { useState } from "react";
import {
  Flame,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Utensils,
  ChevronRight,
  UserPlus,
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
    const poke = pokeFriend(friend.id || friend.userId);
    if (poke) {
      addNotification({
        type: "poke",
        title: "Senggolan Terkirim! 👉",
        message: poke.message,
        actionUrl: "/social",
      });
      toastNudgeSent(friend.fullName || friend.username);
    }
  };

  const completedCount = friends.filter((f) => f.dailyGoalMet).length;

  return (
    <section aria-label="Daftar Teman" className={cn("space-y-4", className)}>
      {/* List Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary font-heading tracking-tight">
              Teman Co-op Aktif
            </h2>
            <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-pill bg-[#FCF8E3] text-text-primary text-xs font-bold border border-accent-orange/30 font-sans">
              {friends.length}
            </span>
          </div>
          <p className="text-xs text-text-muted font-sans">
            {completedCount} dari {friends.length} teman telah mencatat menu gizi hari ini
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-navigation bg-surface-subtle border border-border-divider self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1 rounded-navigation text-xs font-bold transition-all font-sans",
              filter === "all"
                ? "bg-surface text-text-primary shadow-xs border border-border-divider/50"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Semua ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending_log")}
            className={cn(
              "px-3 py-1 rounded-navigation text-xs font-bold transition-all font-sans",
              filter === "pending_log"
                ? "bg-surface text-text-primary shadow-xs border border-border-divider/50"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Belum Log ({friends.length - completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={cn(
              "px-3 py-1 rounded-navigation text-xs font-bold transition-all font-sans",
              filter === "completed"
                ? "bg-surface text-text-primary shadow-xs border border-border-divider/50"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Selesai ({completedCount})
          </button>
        </div>
      </div>

      {/* Friends Cards */}
      {filteredFriends.length === 0 ? (
        <div className="rounded-card bg-surface p-8 text-center border border-border-divider space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
            <Utensils className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-text-primary font-heading">
            {filter === "completed"
              ? "Belum ada teman yang menyelesaikan target hari ini"
              : filter === "pending_log"
              ? "Hebat! Semua temanmu sudah mencatat makan hari ini"
              : "Belum ada teman di daftar kamu"}
          </p>
          {friends.length === 0 && onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-sans"
              style={{ backgroundColor: "#FF9233", color: "#FFFFFF" }}
            >
              <UserPlus className="h-4 w-4" />
              <span>Tambah Teman Sekarang</span>
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
                  "p-4 sm:p-5 rounded-card border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4",
                  friend.dailyGoalMet
                    ? "border-accent-green/35 bg-surface hover:border-accent-green/50"
                    : "border-border-default bg-surface hover:border-accent-orange/40"
                )}
              >
                {/* Left: Avatar & Profile Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Pet Avatar Preview */}
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
                      <h3 className="text-sm sm:text-base font-bold text-text-primary font-heading truncate">
                        {friend.fullName}
                      </h3>
                      <span className="text-xs text-text-muted font-sans truncate">
                        @{friend.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-sans">
                      <span className="px-2 py-0.5 rounded-pill bg-accent-green-light/40 text-text-primary font-semibold border border-border-default/50">
                        {friend.petName || "Pet"} • Lv.{petLevel} {petStage}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-[#FCF8E3] text-text-primary font-bold border border-accent-orange/20">
                        <Flame className="h-3 w-3 fill-accent-orange text-accent-orange" />
                        {streak} Hari Streak
                      </span>
                    </div>

                    <p className="text-[11px] text-text-muted flex items-center gap-1 font-sans">
                      <Clock className="h-3 w-3 text-text-muted" />
                      {friend.lastActiveText || "Aktif di Caloria"}
                    </p>
                  </div>
                </div>

                {/* Right: Nutrition Progress & Senggol Action */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t md:border-t-0 border-border-divider pt-3 md:pt-0">
                  {/* Calorie Progress Bar */}
                  <div className="space-y-1 sm:w-44">
                    <div className="flex items-center justify-between text-[11px] font-sans">
                      <span className="font-semibold text-text-muted">Progres Kalori</span>
                      <span className="font-bold text-text-primary">
                        {calories} / {target} kcal
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-pill bg-surface-subtle border border-border-divider overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-pill transition-all duration-500",
                          friend.dailyGoalMet ? "bg-accent-green" : "bg-accent-orange"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {friend.dailyGoalMet ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-navigation text-xs font-bold text-accent-green bg-accent-green-light/30 border border-accent-green/30 font-sans">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Target Selesai!
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePoke(friend)}
                        className="button-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold font-sans cursor-pointer active:scale-95"
                        style={{
                          backgroundColor: "#FF9233",
                          color: "#FFFFFF",
                        }}
                      >
                          <Send className="h-3.5 w-3.5" />
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

