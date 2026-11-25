"use client";

import { useState } from "react";
import { Check, Flame, X } from "lucide-react";
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
        <div className="flex items-center justify-center gap-2 text-neutral-10 text-sm font-bold font-sans">
          <Flame className="h-4 w-4 text-accent-orange" />
          <span>Semua rekomendasi teman telah ditinjau!</span>
        </div>
        <p className="text-sm text-neutral-10 font-sans">
          Kamu juga bisa mengundang teman dengan membagikan kode party atau tautan di atas.
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
      {/* Header: Co-op Streak Squad icon (Flame), no subtitle, no calon teman badge */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-navigation bg-accent-orange text-text-inverse">
          <Flame className="h-5 w-5 fill-text-inverse" />
        </div>
        <h2 className="text-xl font-extrabold text-text-primary font-heading tracking-tight">
          Rekomendasi Teman
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleRecommendations.map((rec) => {
          const isSending = sendingIds[rec.id];
          const isSent = sentIds[rec.id];

          return (
            <div
              key={rec.id}
              className="group relative flex flex-col justify-between p-4 rounded-card border border-border-divider bg-surface hover:border-accent-green/50 transition-colors"
            >
              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => dismissRecommendation(rec.id)}
                title="Abaikan rekomendasi"
                aria-label={`Abaikan ${rec.fullName}`}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-neutral-10 hover:text-text-primary hover:bg-surface-subtle transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3.5 pr-6">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-subtle border border-border-divider overflow-hidden">
                  <AvatarRenderer
                    characterId={rec.petSpecies || "bloomie"}
                    size="sm"
                    className="h-12 w-12"
                  />
                </div>

                {/* Enlarged name, no @username, no pet level */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-text-primary truncate font-heading">
                    {rec.fullName}
                  </h3>
                  {rec.mutualTag && (
                    <span className="inline-flex items-center text-sm font-bold px-2.5 py-0.5 rounded-pill bg-[#FCF8E3] text-text-primary font-sans">
                      {rec.mutualTag}
                    </span>
                  )}
                </div>
              </div>

              {/* Action CTA: green button, no icon, "+ Tambah" */}
              <div className="mt-4 pt-3 border-t border-border-divider/70 flex items-center justify-between gap-2">
                <span className="text-sm text-neutral-10 font-sans">
                  Target: <strong className="text-text-primary font-extrabold">{rec.calorieTarget} kcal</strong>
                </span>

                <button
                  type="button"
                  disabled={isSending || isSent}
                  onClick={() => handleAdd(rec)}
                  className={cn(
                    "min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-navigation text-sm font-extrabold transition-colors cursor-pointer",
                    isSent
                      ? "bg-accent-green text-text-inverse"
                      : "bg-accent-green-light hover:bg-[#a9ce46] text-[#244710]"
                  )}
                >
                  {isSent ? (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Terkirim</span>
                    </>
                  ) : (
                    <span>+ Tambah</span>
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
