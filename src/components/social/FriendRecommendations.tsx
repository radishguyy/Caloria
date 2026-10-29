"use client";

import { useState } from "react";
import { Check, UserPlus, Sparkles, X } from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { FriendRecommendation } from "@/types";
import { useSocialStore } from "@/stores/social-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { toastFriendRequestSent } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface FriendRecommendationsProps {
  className?: string;
}

export function FriendRecommendations({ className }: FriendRecommendationsProps) {
  const isHydrated = useHydrated();
  const { recommendations, sendFriendRequest, dismissRecommendation } = useSocialStore();
  const [sendingIds, setSendingIds] = useState<Record<string, boolean>>({});
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({});

  if (!isHydrated) {
    return (
      <div className={cn("p-5 rounded-card bg-surface border border-border-divider", className)}>
        <div className="h-6 w-44 bg-surface-subtle animate-pulse rounded-navigation mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-card bg-surface-subtle animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Strictly limit to 3 accounts
  const visibleRecommendations = recommendations.slice(0, 3);

  if (visibleRecommendations.length === 0) {
    return (
      <section
        aria-label="Rekomendasi Teman"
        className={cn(
          "rounded-card bg-surface p-5 border border-border-default shadow-xs space-y-2 text-center",
          className
        )}
      >
        <div className="flex items-center justify-center gap-2 text-text-muted text-xs font-bold font-sans">
          <Sparkles className="h-4 w-4 text-accent-orange" />
          <span>Semua rekomendasi teman telah ditinjau!</span>
        </div>
        <p className="text-xs text-text-muted font-sans">
          Kamu juga bisa mengundang teman secara langsung dengan membagikan kode party atau tautan squad di atas.
        </p>
      </section>
    );
  }

  const handleAdd = async (rec: FriendRecommendation) => {
    setSendingIds((prev) => ({ ...prev, [rec.id]: true }));
    try {
      await sendFriendRequest(rec.id);
      toastFriendRequestSent(rec.fullName || rec.username);
      setSentIds((prev) => ({ ...prev, [rec.id]: true }));
      // Briefly show "Terkirim", then remove card smoothly
      setTimeout(() => {
        dismissRecommendation(rec.id);
        setSentIds((prev) => {
          const next = { ...prev };
          delete next[rec.id];
          return next;
        });
      }, 1200);
    } finally {
      setSendingIds((prev) => ({ ...prev, [rec.id]: false }));
    }
  };

  return (
    <section
      aria-label="Rekomendasi Teman"
      className={cn(
        "rounded-card bg-surface p-5 sm:p-6 border border-border-default shadow-xs space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-orange/15 text-accent-orange">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary font-heading tracking-tight">
              Rekomendasi Teman
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Teman dengan target kalori dan ritme logging yang cocok untukmu
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-text-muted bg-surface-subtle px-2.5 py-1 rounded-pill">
          {visibleRecommendations.length} Calon Teman
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {visibleRecommendations.map((rec) => {
          const isSending = sendingIds[rec.id];
          const isSent = sentIds[rec.id];

          return (
            <div
              key={rec.id}
              className="group relative flex flex-col justify-between p-4 rounded-card border border-border-divider bg-surface hover:border-accent-orange/40 hover:bg-[#FCF8E3]/30 transition-all shadow-xs"
            >
              {/* Dismiss button */}
              <button
                onClick={() => dismissRecommendation(rec.id)}
                title="Abaikan rekomendasi"
                className="absolute top-2.5 right-2.5 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors opacity-60 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-3">
                {/* Mini Pet Avatar Preview */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-subtle border border-border-divider overflow-hidden group-hover:scale-105 transition-transform">
                  <AvatarRenderer
                    characterId={rec.petSpecies || "bloomie"}
                    size="sm"
                    className="h-12 w-12"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <h3 className="text-sm font-bold text-text-primary truncate font-sans">
                    {rec.fullName}
                  </h3>
                  <p className="text-xs text-text-muted truncate font-sans">@{rec.username}</p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-accent-green-light/40 text-text-primary border border-border-default/50 font-sans">
                      Lv. {rec.petLevel} {rec.petStage}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-[#FCF8E3] text-text-primary border border-accent-orange/20 font-sans">
                      {rec.mutualTag}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action CTA */}
              <div className="mt-3.5 pt-3 border-t border-border-divider/70 flex items-center justify-between">
                <span className="text-[11px] text-text-muted font-sans">
                  Target: <strong className="text-text-primary font-bold">{rec.calorieTarget} kcal</strong>
                </span>

                <button
                  type="button"
                  disabled={isSending || isSent}
                  onClick={() => handleAdd(rec)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-navigation text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95",
                    isSent
                      ? "bg-accent-green text-text-inverse border-0"
                      : "bg-accent-orange hover:bg-accent-orange/90 text-text-inverse border-0"
                  )}
                >
                  {isSent ? (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Terkirim</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>+ Tambah</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

