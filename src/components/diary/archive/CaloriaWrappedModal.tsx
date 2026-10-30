"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { usePetStore } from "@/store/use-pet-store";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import { type PetAnimationState } from "@/types";
import { type RecapStoryData } from "@/lib/server/recap-ai";
import { type Recap } from "@/db/schema";
import { toastSuccess, toastError } from "@/lib/toast";

interface CaloriaWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  recap: Recap | null;
  storyData: RecapStoryData | null;
  onViewed?: (recapId: string) => void;
}

const SLIDE_DURATION_MS = 6000;
const TICK_INTERVAL_MS = 50;

export function CaloriaWrappedModal({
  isOpen,
  onClose,
  recap,
  storyData,
  onViewed,
}: CaloriaWrappedModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    species,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    name: storePetName,
    level: storePetLevel,
    getEffectiveColors,
  } = usePetStore();

  const slides = storyData?.slides || [];
  const totalSlides = slides.length || 5;

  useEffect(() => {
    if (isOpen && recap && !recap.isViewed) {
      fetch(`/api/recaps/${recap.id}/viewed`, { method: "PATCH" })
        .then(() => {
          if (onViewed) onViewed(recap.id);
        })
        .catch((err) => console.warn("[WrappedModal] Failed marking as viewed:", err));
    }
  }, [isOpen, recap, onViewed]);

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setProgress(100);
    }
  }, [currentSlideIndex, totalSlides]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentSlideIndex]);

  useEffect(() => {
    if (!isOpen || isPaused || (currentSlideIndex >= totalSlides - 1 && progress >= 100)) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const increment = (TICK_INTERVAL_MS / SLIDE_DURATION_MS) * 100;
        const next = prev + increment;
        if (next >= 100) {
          if (currentSlideIndex < totalSlides - 1) {
            setCurrentSlideIndex((curr) => curr + 1);
            return 0;
          }
          return 100;
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentSlideIndex, totalSlides, progress]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNextSlide, goToPrevSlide, onClose]);

  if (!isOpen || !storyData || slides.length === 0) return null;

  const currentSlide = slides[currentSlideIndex] || slides[0];
  const charDef = getCharacterDefinition(species);
  const effectiveColors = getEffectiveColors
    ? getEffectiveColors()
    : {
        ...charDef.defaultColors,
        ...Object.fromEntries(
          Object.entries(customColors || {}).filter(([, v]) => Boolean(v))
        ),
      };

  const cycleUnit = recap?.type === "monthly" ? "Bulan" : "Pekan";
  const cycleNum = recap?.cycleNumber || 1;
  const grade = storyData.grade || "B";

  let petAnimation: PetAnimationState = "idle";
  if (currentSlide.petMood === "dancing" || currentSlide.petMood === "proud") {
    petAnimation = "happy";
  } else if (currentSlide.petMood === "eating") {
    petAnimation = "eating";
  } else if (currentSlide.petMood === "sleepy") {
    petAnimation = "sleeping";
  }

  const handleExportShareCard = async () => {
    try {
      setIsDownloading(true);
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toastError("Tidak dapat menginisialisasi kanvas gambar.");
        return;
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#D1D9E2";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(64, 64, canvas.width - 128, canvas.height - 128, 32);
      ctx.stroke();

      ctx.fillStyle = "#8CA2C0";
      ctx.font = "600 24px 'Open Runde', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`RECAP ${cycleUnit.toUpperCase()} ${cycleNum}`, 120, 150);

      ctx.fillStyle = "#529028";
      ctx.font = "800 56px 'Secuela', sans-serif";
      ctx.fillText(storyData.archetypeTitle, 120, 220);

      ctx.textAlign = "right";
      ctx.fillStyle = "#8CA2C0";
      ctx.font = "600 22px 'Open Runde', sans-serif";
      ctx.fillText("GRADE", canvas.width - 120, 150);
      ctx.fillStyle = "#529028";
      ctx.font = "800 84px 'Secuela', sans-serif";
      ctx.fillText(grade, canvas.width - 120, 235);

      ctx.strokeStyle = "#D1D9E2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 280);
      ctx.lineTo(canvas.width - 120, 280);
      ctx.stroke();

      const rawStats = storyData.rawStats;
      const statItems = [
        { label: "KEPATUHAN KALORI", val: `${rawStats?.depkesPercentage || 0}% (${rawStats?.daysLogged || 0} hari)` },
        { label: "RATA-RATA HARIAN", val: `${(rawStats?.averageCalories || 0).toLocaleString("id-ID")} kkal` },
        { label: "MENU UTAMA", val: rawStats?.topFood || "-" },
        { label: "PROGRES PET", val: `+${rawStats?.expEarned || 150} XP • +${rawStats?.coinsGained || 50} Koin` },
      ];

      let startY = 340;
      ctx.textAlign = "left";
      statItems.forEach((item) => {
        ctx.fillStyle = "#F8FAFC";
        ctx.beginPath();
        ctx.roundRect(120, startY, canvas.width - 240, 130, 20);
        ctx.fill();
        ctx.strokeStyle = "#D1D9E2";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#8CA2C0";
        ctx.font = "600 20px 'Open Runde', sans-serif";
        ctx.fillText(item.label, 156, startY + 48);

        ctx.fillStyle = "#529028";
        ctx.font = "800 36px 'Secuela', sans-serif";
        ctx.fillText(item.val, 156, startY + 98);

        startY += 154;
      });

      ctx.fillStyle = "#8CA2C0";
      ctx.font = "600 20px 'Open Runde', sans-serif";
      ctx.fillText("FOKUS BERIKUTNYA", 120, 1020);

      ctx.fillStyle = "#486284";
      ctx.font = "600 28px 'Open Runde', sans-serif";
      ctx.fillText(storyData.actionableTipNextWeek, 120, 1068);

      ctx.fillStyle = "#8CA2C0";
      ctx.font = "600 22px 'Open Runde', sans-serif";
      ctx.fillText("Caloria", 120, 1220);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toastError("Gagal merender gambar.");
          return;
        }

        const fileName = `caloria-recap-${cycleUnit.toLowerCase()}-${cycleNum}.png`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toastSuccess("Gambar ringkasan berhasil diunduh.");
      }, "image/png");
    } catch (err) {
      console.error("[ExportShareCard] Error exporting:", err);
      toastError("Gagal mengunduh gambar.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div
        className="relative w-full max-w-md h-[86vh] max-h-[660px] rounded-2xl border border-border-divider bg-surface shadow-2xl flex flex-col overflow-hidden"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Segmented Progress Bars */}
        <div className="px-5 pt-4 flex items-center gap-1.5 z-40">
          {slides.map((_, idx) => {
            let fillPercent = 0;
            if (idx < currentSlideIndex) fillPercent = 100;
            else if (idx === currentSlideIndex) fillPercent = progress;

            return (
              <div
                key={idx}
                className="h-1.5 flex-1 rounded-sm bg-border-divider overflow-hidden"
              >
                <div
                  className="h-full bg-accent-green transition-all duration-75"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Clean Minimal Header */}
        <div className="px-5 pt-3 pb-3 border-b border-border-divider flex items-center justify-between z-40">
          <span className="text-xs font-semibold text-text-muted">
            Recap {cycleUnit} {cycleNum}
            {isPaused ? " • Jeda" : ""}
          </span>

          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-xl p-1 text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tap Navigation Regions */}
        <div className="absolute inset-x-0 top-16 bottom-14 z-30 flex">
          <div
            className="w-[30%] h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevSlide();
            }}
          />
          <div
            className="w-[70%] h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToNextSlide();
            }}
          />
        </div>

        {/* Slide Content */}
        <div className="relative flex-1 flex flex-col z-20 p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* SLIDE 1: INTRO */}
              {currentSlide.slideType === "intro" && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      {currentSlide.subtitle}
                    </p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading">
                      {currentSlide.title}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-neutral-10">
                      {storyData.archetypeTitle}
                    </p>
                  </div>

                  <div className="my-auto flex justify-center">
                    <div className="w-44 h-56">
                      <AvatarRenderer
                        characterId={species}
                        colors={effectiveColors}
                        earsVariant={earsVariant}
                        tailVariant={tailVariant}
                        faceVariant={faceVariant}
                        animationState={petAnimation}
                        size="interactive"
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border-divider pt-4">
                    <p className="text-xs font-medium text-neutral-10 leading-relaxed">
                      {currentSlide.commentary}
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 2: NUTRITION STATS */}
              {currentSlide.slideType === "nutrition_stats" && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Target {storyData.rawStats?.targetTee || 2000} kkal / hari
                    </p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading">
                      Kepatuhan Kalori
                    </h2>
                  </div>

                  <div className="my-auto space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Kepatuhan Target
                      </p>
                      <p
                        className="font-heading font-extrabold leading-none text-text-primary mt-1"
                        style={{ fontSize: "clamp(3.25rem, 11vw, 4.75rem)" }}
                      >
                        {storyData.rawStats?.depkesPercentage || 0}%
                      </p>
                      <p className="mt-2 text-xs font-semibold text-text-muted">
                        {storyData.rawStats?.daysMeetingDepkes || 0} dari{" "}
                        {storyData.rawStats?.daysLogged || 7} hari sesuai target
                      </p>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-md bg-border-divider">
                      <div
                        className="h-full rounded-md bg-accent-green"
                        style={{
                          width: `${Math.min(100, storyData.rawStats?.depkesPercentage || 0)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 border-t border-border-divider pt-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Rata-Rata / Hari
                        </p>
                        <p className="mt-1 font-heading text-2xl font-extrabold text-text-primary">
                          {(storyData.rawStats?.averageCalories || 0).toLocaleString("id-ID")}
                          <span className="ml-1 text-xs font-bold text-text-muted">
                            kkal
                          </span>
                        </p>
                      </div>
                      <div className="border-l border-border-divider pl-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Total Siklus
                        </p>
                        <p className="mt-1 font-heading text-2xl font-extrabold text-text-primary">
                          {(storyData.rawStats?.totalCalories || 0).toLocaleString("id-ID")}
                          <span className="ml-1 text-xs font-bold text-text-muted">
                            kkal
                          </span>
                        </p>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-neutral-10 border-t border-border-divider pt-3">
                      {currentSlide.commentary}
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 3: FOOD SPOTLIGHT */}
              {currentSlide.slideType === "food_spotlight" && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Dominan {storyData.rawStats?.topMacro || "Protein"}
                    </p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading">
                      Menu Terfavorit
                    </h2>
                  </div>

                  <div className="my-auto rounded-2xl border border-border-divider bg-surface-subtle p-5 space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Paling Sering Dicatat
                      </p>
                      <p className="mt-1 font-heading text-2xl font-extrabold leading-tight text-text-primary">
                        {currentSlide.highlightStat}
                      </p>
                    </div>

                    {storyData.rawStats?.topFoods &&
                      storyData.rawStats.topFoods.length > 1 && (
                        <div className="border-t border-border-divider pt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                            Menu Lainnya
                          </p>
                          <ul className="divide-y divide-border-divider/60">
                            {storyData.rawStats.topFoods.slice(1, 3).map((food, i) => (
                              <li
                                key={i}
                                className="py-1.5 text-xs font-medium text-neutral-10"
                              >
                                {i + 2}. {food}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-3 border-t border-border-divider pt-4">
                    <div className="w-12 h-14 shrink-0">
                      <AvatarRenderer
                        characterId={species}
                        colors={effectiveColors}
                        animationState="eating"
                        size="sm"
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-xs font-medium text-neutral-10 leading-relaxed">
                      {currentSlide.commentary}
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 4: PET MILESTONE */}
              {currentSlide.slideType === "pet_milestone" && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Level {storyData.rawStats?.petLevel || storePetLevel}
                    </p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading">
                      Progres {storePetName || "Calpal"}
                    </h2>
                  </div>

                  <div className="my-auto flex justify-center">
                    <div className="w-40 h-52">
                      <AvatarRenderer
                        characterId={species}
                        colors={effectiveColors}
                        earsVariant={earsVariant}
                        tailVariant={tailVariant}
                        faceVariant={faceVariant}
                        animationState="happy"
                        size="interactive"
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 border-t border-border-divider pt-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          EXP Diperoleh
                        </p>
                        <p className="mt-1 font-heading text-2xl font-extrabold text-text-primary">
                          +{storyData.rawStats?.expEarned || 150}
                          <span className="ml-1 text-xs font-bold text-text-muted">
                            XP
                          </span>
                        </p>
                      </div>

                      <div className="border-l border-border-divider pl-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Koin Diperoleh
                        </p>
                        <p className="mt-1 font-heading text-2xl font-extrabold text-text-primary">
                          +{storyData.rawStats?.coinsGained || 50}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-neutral-10 border-t border-border-divider pt-3">
                      {currentSlide.commentary}
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 5: SUMMARY & EXPORT */}
              {currentSlide.slideType === "letter_from_calpal" && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="rounded-2xl border border-border-divider bg-surface-subtle p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Evaluasi {cycleUnit} {cycleNum}
                        </p>
                        <h3 className="mt-1 text-xl font-extrabold text-text-primary font-heading">
                          {storyData.archetypeTitle}
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Grade
                        </p>
                        <p className="font-heading text-4xl font-extrabold leading-none text-text-primary mt-0.5">
                          {grade}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-border-divider pt-3 gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Kepatuhan
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-text-primary">
                          {storyData.rawStats?.depkesPercentage || 0}% (
                          {storyData.rawStats?.daysLogged || 0} hari)
                        </p>
                      </div>
                      <div className="border-l border-border-divider pl-4 min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Menu Utama
                        </p>
                        <p className="mt-0.5 truncate text-sm font-bold text-text-primary">
                          {storyData.rawStats?.topFood || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border-divider pt-3">
                      <p className="text-xs font-medium text-neutral-10 leading-relaxed">
                        {currentSlide.commentary}
                      </p>
                    </div>

                    <div className="border-t border-border-divider pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Fokus Berikutnya
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-text-primary">
                        {storyData.actionableTipNextWeek}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-3 pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleExportShareCard}
                      disabled={isDownloading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-default bg-surface py-2.5 px-4 text-xs font-bold text-neutral-10 hover:bg-surface-subtle transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{isDownloading ? "Mengunduh..." : "Unduh"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-green py-2.5 px-4 text-xs font-bold text-text-inverse transition-colors hover:bg-accent-green/90"
                    >
                      <span>Selesai</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="relative z-40 px-5 py-3 border-t border-border-divider flex items-center justify-between text-xs text-text-muted">
          <button
            type="button"
            onClick={goToPrevSlide}
            disabled={currentSlideIndex === 0}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-10 disabled:opacity-30 hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="text-xs font-semibold text-text-muted">
            {currentSlideIndex + 1} / {totalSlides}
          </span>

          <button
            type="button"
            onClick={goToNextSlide}
            disabled={currentSlideIndex === totalSlides - 1}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-10 disabled:opacity-30 hover:text-text-primary transition-colors"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
