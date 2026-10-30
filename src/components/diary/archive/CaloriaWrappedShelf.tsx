"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Play, RotateCcw, Lock } from "lucide-react";
import { type Recap } from "@/db/schema";
import {
  type RecapMilestoneStatus,
  formatRecapDateRange,
  checkRecapEligibility,
} from "@/lib/recaps/cadence";
import { type RecapStoryData } from "@/lib/server/recap-ai";
import { CaloriaWrappedModal } from "@/components/diary/archive/CaloriaWrappedModal";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAuthStore } from "@/store/use-auth-store";
import { toastError } from "@/lib/toast";

interface RecapsStatusResponse {
  success: boolean;
  eligibility: RecapMilestoneStatus;
  history: Recap[];
  userCreatedAt: string;
  daysSinceJoin: number;
  totalRecapsGenerated: number;
}

function getAuthHeaders(): HeadersInit {
  const currentUserId = useAuthStore.getState().user?.id;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (currentUserId) {
    headers["x-user-id"] = currentUserId;
  }
  return headers;
}

const FALLBACK_START_DATE = new Date("2026-10-09T00:00:00.000Z");
const FALLBACK_END_DATE = new Date("2026-10-16T00:00:00.000Z");

const FALLBACK_STATUS: RecapsStatusResponse = {
  success: true,
  eligibility: {
    isAvailable: false,
    type: "weekly",
    cycleNumber: 1,
    startDate: FALLBACK_START_DATE,
    endDate: FALLBACK_END_DATE,
    daysRemaining: 5,
    targetWeek: 1,
  },
  history: [],
  userCreatedAt: FALLBACK_START_DATE.toISOString(),
  daysSinceJoin: 2,
  totalRecapsGenerated: 0,
};

export function CaloriaWrappedShelf() {
  const isHydrated = useHydrated();
  const [status, setStatus] = useState<RecapsStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecap, setSelectedRecap] = useState<Recap | null>(null);
  const [selectedStoryData, setSelectedStoryData] =
    useState<RecapStoryData | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/recaps/status", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.eligibility) {
        setStatus(data);
      } else {
        const defaultCreatedAt = new Date(Date.now() - 2 * 86400000);
        setStatus({
          success: true,
          eligibility: checkRecapEligibility(defaultCreatedAt, 0),
          history: [],
          userCreatedAt: defaultCreatedAt.toISOString(),
          daysSinceJoin: 2,
          totalRecapsGenerated: 0,
        });
      }
    } catch (err) {
      console.warn("[WrappedShelf] Failed fetching status:", err);
      const defaultCreatedAt = new Date(Date.now() - 2 * 86400000);
      setStatus({
        success: true,
        eligibility: checkRecapEligibility(defaultCreatedAt, 0),
        history: [],
        userCreatedAt: defaultCreatedAt.toISOString(),
        daysSinceJoin: 2,
        totalRecapsGenerated: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    let active = true;
    fetch("/api/recaps/status", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.success && data.eligibility) {
          setStatus(data);
        } else {
          setStatus(FALLBACK_STATUS);
        }
      })
      .catch(() => {
        if (active) setStatus(FALLBACK_STATUS);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isHydrated]);

  const handleOpenActiveRecap = async () => {
    const currentEligibility = status?.eligibility || {
      isAvailable: false,
      type: "weekly" as const,
      cycleNumber: 1,
      startDate: new Date(Date.now() - 7 * 86400000),
      endDate: new Date(),
      daysRemaining: 0,
      targetWeek: 1,
    };

    const existing = status?.history.find(
      (r) =>
        r.type === currentEligibility.type &&
        r.cycleNumber === currentEligibility.cycleNumber
    );

    if (existing && existing.slidesData) {
      setSelectedRecap(existing);
      setSelectedStoryData(existing.slidesData as RecapStoryData);
      setIsModalOpen(true);
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/recaps/generate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          cycleNumber: currentEligibility.cycleNumber,
          type: currentEligibility.type,
        }),
      });

      const data = await res.json();
      if (data.success && data.recap) {
        setSelectedRecap(data.recap);
        setSelectedStoryData(data.storyData);
        setIsModalOpen(true);
        fetchStatus();
      } else {
        toastError(data.error || "Gagal membuat recap.");
      }
    } catch (err) {
      console.error("[WrappedShelf] Error generating recap:", err);
      toastError("Gagal menghubungi server.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReplayPastRecap = (recap: Recap) => {
    if (!recap.slidesData) return;
    setSelectedRecap(recap);
    setSelectedStoryData(recap.slidesData as RecapStoryData);
    setIsModalOpen(true);
  };

  const handleRecapViewed = (recapId: string) => {
    setStatus((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        history: prev.history.map((r) =>
          r.id === recapId ? { ...r, isViewed: true } : r
        ),
      };
    });
  };

  if (!isHydrated || isLoading) {
    return (
      <div
        aria-hidden="true"
        className="h-36 animate-pulse rounded-2xl border border-border-divider bg-surface-subtle"
      />
    );
  }

  const currentStatus: RecapsStatusResponse = status || FALLBACK_STATUS;

  const { eligibility, history } = currentStatus;
  const isAvailable = eligibility.isAvailable;
  const unitLabel = eligibility.type === "monthly" ? "Bulan" : "Pekan";

  const activeExistingRecap = history.find(
    (r) =>
      r.type === eligibility.type &&
      r.cycleNumber === eligibility.cycleNumber
  );

  return (
    <section className="rounded-2xl border border-border-divider bg-surface p-5 shadow-xs sm:p-6">
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-0">
        {/* Left: Current Recap */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 lg:col-span-2 lg:pr-6">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Recap {unitLabel} •{" "}
              {formatRecapDateRange(eligibility.startDate, eligibility.endDate)}
            </p>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary">
              {unitLabel} {eligibility.cycleNumber}
            </h2>
            <p className="text-xs font-medium text-neutral-10">
              {isAvailable
                ? "Ringkasan nutrisi dan progres pet 7 hari terakhir siap dilihat."
                : `Terbuka dalam ${eligibility.daysRemaining} hari lagi.`}
            </p>
          </div>

          <div className="shrink-0">
            {isAvailable ? (
              <button
                type="button"
                onClick={handleOpenActiveRecap}
                disabled={isGenerating}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent-green px-5 py-2.5 text-xs font-bold text-text-inverse transition-colors hover:bg-accent-green/90 disabled:opacity-50"
              >
                {activeExistingRecap ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {isGenerating ? "Memuat..." : "Putar Ulang Recap"}
                    </span>
                  </>
                ) : (
                  <>
                    <Play
                      className="h-3.5 w-3.5 fill-current"
                      aria-hidden="true"
                    />
                    <span>{isGenerating ? "Memuat..." : "Lihat Recap"}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-xs font-bold text-text-muted">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{eligibility.daysRemaining} Hari Lagi</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Past Recaps List */}
        <div className="border-t border-border-divider pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h3 className="text-sm font-bold text-text-primary">
            Riwayat Recap
          </h3>
          <div className="mt-2.5 max-h-[110px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {history.length === 0 ? (
              <p className="text-xs text-text-muted">
                Belum ada riwayat recap tersimpan.
              </p>
            ) : (
              <ul className="divide-y divide-border-divider/60">
                {history.map((rec) => {
                  const story = rec.slidesData as RecapStoryData | null;
                  const recUnit = rec.type === "monthly" ? "Bulan" : "Pekan";
                  const grade = story?.grade || "B";

                  return (
                    <li
                      key={rec.id}
                      className="flex items-center justify-between gap-2 py-2 text-[11px] font-medium text-neutral-10"
                    >
                      <span className="truncate">
                        {recUnit} {rec.cycleNumber} - Grade {grade} -{" "}
                        {formatRecapDateRange(rec.startDate, rec.endDate)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReplayPastRecap(rec)}
                        className="shrink-0 font-bold text-text-primary hover:underline"
                      >
                        Buka
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <CaloriaWrappedModal
        key={`${selectedRecap?.id ?? "none"}-${isModalOpen}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recap={selectedRecap}
        storyData={selectedStoryData}
        onViewed={handleRecapViewed}
      />
    </section>
  );
}
