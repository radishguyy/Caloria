"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Lock,
  ChevronRight,
  RotateCcw,
  Calendar,
  Award,
  Play,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { type Recap } from "@/db/schema";
import { type RecapMilestoneStatus, formatRecapDateRange } from "@/lib/recaps/cadence";
import { type RecapStoryData } from "@/lib/server/recap-ai";
import { CaloriaWrappedModal } from "@/components/diary/archive/CaloriaWrappedModal";
import { useHydrated } from "@/hooks/use-hydrated";
import { toastError } from "@/lib/toast";

interface RecapsStatusResponse {
  success: boolean;
  eligibility: RecapMilestoneStatus;
  history: Recap[];
  userCreatedAt: string;
  daysSinceJoin: number;
  totalRecapsGenerated: number;
}

export function CaloriaWrappedShelf() {
  const isHydrated = useHydrated();
  const [status, setStatus] = useState<RecapsStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecap, setSelectedRecap] = useState<Recap | null>(null);
  const [selectedStoryData, setSelectedStoryData] = useState<RecapStoryData | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/recaps/status");
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.warn("[WrappedShelf] Failed fetching status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      fetchStatus();
    }
  }, [isHydrated, fetchStatus]);

  // Open active or unlocked recap (generates if not yet generated)
  const handleOpenActiveRecap = async () => {
    if (!status) return;

    const { eligibility, history } = status;
    const existing = history.find(
      (r) =>
        r.type === eligibility.type &&
        r.cycleNumber === eligibility.cycleNumber
    );

    if (existing && existing.slidesData) {
      setSelectedRecap(existing);
      setSelectedStoryData(existing.slidesData as RecapStoryData);
      setIsModalOpen(true);
      return;
    }

    // Generate new recap via API
    try {
      setIsGenerating(true);
      const res = await fetch("/api/recaps/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleNumber: eligibility.cycleNumber,
          type: eligibility.type,
        }),
      });

      const data = await res.json();
      if (data.success && data.recap) {
        setSelectedRecap(data.recap);
        setSelectedStoryData(data.storyData);
        setIsModalOpen(true);
        fetchStatus();
      } else {
        toastError(data.error || "Gagal membuat Caloria Wrapped.");
      }
    } catch (err) {
      console.error("[WrappedShelf] Error generating recap:", err);
      toastError("Gagal menghubungi server untuk membuat story.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Replay past recap
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
      <div className="rounded-card border border-border-divider bg-surface p-5 space-y-3 animate-pulse shadow-xs">
        <div className="h-5 w-48 bg-surface-subtle rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-32 bg-surface-subtle rounded-card" />
          <div className="h-32 bg-surface-subtle rounded-card" />
          <div className="h-32 bg-surface-subtle rounded-card" />
        </div>
      </div>
    );
  }

  if (!status) return null;

  const { eligibility, history, userCreatedAt, daysSinceJoin } = status;
  const isAvailable = eligibility.isAvailable;
  const unitLabel = eligibility.type === "monthly" ? "Bulan" : "Pekan";

  // Check if current eligible milestone has already been generated
  const activeExistingRecap = history.find(
    (r) =>
      r.type === eligibility.type &&
      r.cycleNumber === eligibility.cycleNumber
  );

  return (
    <section className="space-y-4">
      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-orange uppercase tracking-wider font-heading">
              <Sparkles className="h-3.5 w-3.5 text-accent-orange" />
              <span>Story Highlights</span>
            </span>
            <span className="text-xs text-text-muted">•</span>
            <span className="text-xs text-text-muted font-medium">
              Bergabung {daysSinceJoin} hari lalu
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary font-heading mt-0.5">
            Caloria Wrapped
          </h2>
        </div>

        <p className="text-xs text-text-muted max-w-sm">
          Recap interaktif ritme gizi & pertumbuhan pet setiap 7 hari siklus akunmu.
        </p>
      </div>

      {/* Cards Shelf Grid / Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Active / Current Milestone Card (Left col-span-5) */}
        <div className="md:col-span-5">
          {isAvailable ? (
            <div
              onClick={handleOpenActiveRecap}
              role="button"
              tabIndex={0}
              className="h-full rounded-card border-2 border-[#5B8E55] bg-gradient-to-br from-[#FCF8E3] to-[#FAF8F5] p-5 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Pulsing Green Beacon Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#5B8E55]/10 rounded-full blur-2xl group-hover:bg-[#5B8E55]/20 transition-all pointer-events-none" />

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B8E55] text-white text-[11px] font-bold shadow-xs animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    <span>✨ Recap {unitLabel} {eligibility.cycleNumber} Siap Dilihat!</span>
                  </span>

                  {activeExistingRecap?.isViewed && (
                    <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-[#5B8E55]" />
                      <span>Sudah Dilihat</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-neutral-900 font-heading mt-3 group-hover:text-text-primary transition-colors">
                  {eligibility.type === "monthly" ? "Rapor Bulanan" : "Rapor Mingguan"} Calpal
                </h3>
                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                  Lihat kepatuhan standar Depkes, menu favorit, serta perolehan EXP dan koin siklus ini!
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-muted font-medium bg-white/70 px-2.5 py-1 rounded-navigation border border-border-divider/50">
                  <Calendar className="h-3.5 w-3.5 text-[#5B8E55]" />
                  <span>{formatRecapDateRange(eligibility.startDate, eligibility.endDate)}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border-divider/50 flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  {isGenerating ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-[#5B8E55] border-t-transparent rounded-full animate-spin" />
                      <span>Menyiapkan Story...</span>
                    </>
                  ) : activeExistingRecap ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-[#5B8E55]" />
                      <span>Putar Ulang Story</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 text-[#5B8E55] fill-[#5B8E55]" />
                      <span>Buka Caloria Wrapped</span>
                    </>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 text-text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ) : (
            /* Locked Future Milestone Card */
            <div className="h-full rounded-card border border-border-divider bg-surface-subtle p-5 flex flex-col justify-between opacity-90 relative overflow-hidden">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-200 text-neutral-700 text-[11px] font-bold">
                  <Lock className="h-3 w-3" />
                  <span>🔒 Terkunci (Cadence 7 Hari)</span>
                </div>

                <h3 className="text-lg font-black text-neutral-700 font-heading mt-3">
                  Recap {unitLabel} ke-{eligibility.cycleNumber}
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Caloria Wrapped terkunci hingga siklus pekananmu selesai. Dihitung secara konsisten dari tanggal pendaftaran akun.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-white border border-border-divider/60 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted font-medium">Sisa Waktu Buka:</span>
                    <span className="font-bold text-accent-orange">
                      {eligibility.daysRemaining} hari lagi
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Jadwal buka: {new Date(eligibility.endDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-text-muted flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-text-muted" />
                <span>Akun dibuat: {new Date(userCreatedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}</span>
              </div>
            </div>
          )}
        </div>

        {/* Past Viewed Recaps Shelf (Right col-span-7) */}
        <div className="md:col-span-7 flex flex-col justify-between rounded-card border border-border-divider bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border-divider">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-accent-orange" />
              <h3 className="text-sm font-black text-neutral-900 font-heading">
                Riwayat Wrapped yang Sudah Selesai
              </h3>
            </div>
            <span className="text-[11px] font-bold text-text-muted">
              {history.length} Recap Tersimpan
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#FCF8E3] text-[#FF9233] flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-xs text-neutral-700 font-medium">
                Belum ada riwayat recap tersimpan.
              </p>
              <p className="text-[11px] text-text-muted max-w-xs">
                Setelah mencapai siklus 7 hari pertamamu, recap akan otomatis diarsipkan di sini agar dapat diputar ulang kapan pun.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 overflow-y-auto max-h-[190px] pr-1">
              {history.map((rec) => {
                const story = rec.slidesData as RecapStoryData | null;
                const recUnit = rec.type === "monthly" ? "Bulan" : "Pekan";
                const grade = story?.grade || "B";

                return (
                  <div
                    key={rec.id}
                    onClick={() => handleReplayPastRecap(rec)}
                    role="button"
                    tabIndex={0}
                    className="p-3 rounded-2xl border border-border-divider bg-surface-subtle hover:bg-[#FCF8E3]/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900 font-heading">
                          {recUnit} {rec.cycleNumber}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#5B8E55]/15 text-[#5B8E55]">
                          Grade {grade}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-1">
                        {story?.archetypeTitle || "Recap Nutrisi Caloria"}
                      </p>
                      <span className="text-[10px] text-text-muted">
                        {formatRecapDateRange(rec.startDate, rec.endDate)}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white group-hover:bg-[#5B8E55] group-hover:text-white text-text-muted flex items-center justify-center border border-border-divider shrink-0 transition-colors shadow-2xs">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-border-divider flex items-center justify-between text-[11px] text-text-muted">
            <span>✨ Seluruh data story terindeks permanen di database PostgreSQL</span>
            <span className="font-medium text-text-primary">Bebas putar ulang 🐾</span>
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      <CaloriaWrappedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recap={selectedRecap}
        storyData={selectedStoryData}
        onViewed={handleRecapViewed}
      />
    </section>
  );
}

