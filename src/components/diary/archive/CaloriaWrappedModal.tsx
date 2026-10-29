"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  CheckCircle2,
  Flame,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  Utensils,
  Trophy,
  Coins,
  TrendingUp,
  Heart,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { usePetStore } from "@/store/use-pet-store";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import { type PetAnimationState } from "@/types";
import { type RecapStoryData, type RecapSlideData } from "@/lib/server/recap-ai";
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

  // Mark as viewed on open if not viewed
  useEffect(() => {
    if (isOpen && recap && !recap.isViewed) {
      fetch(`/api/recaps/${recap.id}/viewed`, { method: "PATCH" })
        .then(() => {
          if (onViewed) onViewed(recap.id);
        })
        .catch((err) => console.warn("[WrappedModal] Failed marking as viewed:", err));
    }
  }, [isOpen, recap, onViewed]);

  // Reset to first slide when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, recap?.id]);

  // Navigation handlers
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Completed last slide
      setProgress(100);
    }
  }, [currentSlideIndex, totalSlides]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentSlideIndex]);

  // Timer interval for auto progression
  useEffect(() => {
    if (!isOpen || isPaused || currentSlideIndex >= totalSlides - 1 && progress >= 100) {
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

  // Keyboard navigation
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
  const effectiveColors = getEffectiveColors ? getEffectiveColors() : {
    ...charDef.defaultColors,
    ...Object.fromEntries(
      Object.entries(customColors || {}).filter(([, v]) => Boolean(v))
    ),
  };

  const cycleUnit = recap?.type === "monthly" ? "Bulan" : "Pekan";
  const cycleNum = recap?.cycleNumber || 1;
  const grade = storyData.grade || "B";

  // Pet animation state per slide
  let petAnimation: PetAnimationState = "idle";
  if (currentSlide.petMood === "dancing" || currentSlide.petMood === "proud") {
    petAnimation = "happy";
  } else if (currentSlide.petMood === "eating") {
    petAnimation = "eating";
  } else if (currentSlide.petMood === "sleepy") {
    petAnimation = "sleeping";
  }

  // Grade color theme
  const gradeThemes: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    S: {
      bg: "from-amber-400 to-yellow-500",
      text: "text-amber-950",
      border: "border-amber-300",
      glow: "shadow-amber-400/40",
    },
    A: {
      bg: "from-[#5B8E55] to-emerald-600",
      text: "text-emerald-950",
      border: "border-emerald-300",
      glow: "shadow-emerald-500/40",
    },
    B: {
      bg: "from-sky-400 to-blue-600",
      text: "text-blue-950",
      border: "border-sky-300",
      glow: "shadow-sky-400/40",
    },
    C: {
      bg: "from-[#FF9233] to-amber-600",
      text: "text-amber-950",
      border: "border-orange-300",
      glow: "shadow-orange-400/40",
    },
    D: {
      bg: "from-rose-400 to-red-600",
      text: "text-rose-950",
      border: "border-rose-300",
      glow: "shadow-rose-400/40",
    },
  };

  const gradeTheme = gradeThemes[grade] || gradeThemes.B;

  // Export card as high-res PNG image
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

      // Background gradient: warm cream to pastel yellow
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#FCF8E3");
      gradient.addColorStop(0.5, "#FAF8F5");
      gradient.addColorStop(1, "#FCF8E3");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative outer border
      ctx.strokeStyle = "#5B8E55";
      ctx.lineWidth = 14;
      ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

      // Inner card box
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(64, 64, canvas.width - 128, canvas.height - 128, 36);
      ctx.fill();
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Top Header Badge
      ctx.fillStyle = "#FF9233";
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 160, 110, 320, 52, 26);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px 'Open Runde', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✨ CALORIA WRAPPED", canvas.width / 2, 144);

      // Cycle Title
      ctx.fillStyle = "#2D3748";
      ctx.font = "900 48px 'Secuela', sans-serif";
      ctx.fillText(`Recap ${cycleUnit} ke-${cycleNum}`, canvas.width / 2, 230);

      // Archetype Badge
      ctx.fillStyle = "#5B8E55";
      ctx.font = "bold 32px 'Open Runde', sans-serif";
      ctx.fillText(storyData.archetypeTitle, canvas.width / 2, 280);

      // Grade Stamp Box
      ctx.fillStyle = "#FCF8E3";
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 100, 330, 200, 160, 28);
      ctx.fill();
      ctx.strokeStyle = "#FF9233";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = "#FF9233";
      ctx.font = "bold 20px 'Open Runde', sans-serif";
      ctx.fillText("EVALUASI GIZI", canvas.width / 2, 370);

      ctx.fillStyle = "#2D3748";
      ctx.font = "900 78px 'Secuela', sans-serif";
      ctx.fillText(grade, canvas.width / 2, 450);

      // Highlight stats panel
      const rawStats = storyData.rawStats;
      const statItems = [
        { label: "Standar Depkes", val: `${rawStats?.depkesPercentage || 0}% Asupan Baik` },
        { label: "Menu Favorit", val: rawStats?.topFood || "Pilihan Sehat" },
        { label: "Pet Progression", val: `+${rawStats?.expEarned || 150} EXP • +${rawStats?.coinsGained || 50} Koin` },
      ];

      let startY = 540;
      statItems.forEach((item) => {
        ctx.fillStyle = "#F8FAFC";
        ctx.beginPath();
        ctx.roundRect(120, startY, canvas.width - 240, 90, 20);
        ctx.fill();
        ctx.strokeStyle = "#E2E8F0";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#718096";
        ctx.font = "bold 20px 'Open Runde', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(item.label, 150, startY + 38);

        ctx.fillStyle = "#1A202C";
        ctx.font = "bold 28px 'Open Runde', sans-serif";
        ctx.fillText(item.val, 150, startY + 72);

        startY += 106;
      });

      // Letter excerpt
      ctx.fillStyle = "#FAF8F5";
      ctx.beginPath();
      ctx.roundRect(120, 880, canvas.width - 240, 260, 24);
      ctx.fill();
      ctx.strokeStyle = "#5B8E55";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#5B8E55";
      ctx.font = "bold 24px 'Secuela', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Pesan dari ${storePetName || "Calpal"}:`, canvas.width / 2, 925);

      ctx.fillStyle = "#4A5568";
      ctx.font = "italic 22px 'Open Runde', sans-serif";
      // Split commentary into lines
      const commentary = currentSlide.commentary || storyData.headline;
      const words = commentary.split(" ");
      let line = "";
      let lineY = 970;
      for (const word of words) {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 700 && line !== "") {
          ctx.fillText(line, canvas.width / 2, lineY);
          line = word + " ";
          lineY += 34;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, lineY);

      // Target next cycle
      ctx.fillStyle = "#FF9233";
      ctx.font = "bold 22px 'Open Runde', sans-serif";
      ctx.fillText(`🎯 Target Berikutnya: ${storyData.actionableTipNextWeek}`, canvas.width / 2, 1090);

      // Footer branding
      ctx.fillStyle = "#A0AEC0";
      ctx.font = "bold 20px 'Open Runde', sans-serif";
      ctx.fillText("caloria.app • Gamified Nutrition & Virtual Pet Companion", canvas.width / 2, 1260);

      // Trigger download / share
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toastError("Gagal merender gambar.");
          return;
        }

        const fileName = `caloria-wrapped-${cycleUnit.toLowerCase()}-${cycleNum}.png`;

        if (
          typeof navigator !== "undefined" &&
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [new File([blob], fileName, { type: "image/png" })] })
        ) {
          try {
            await navigator.share({
              files: [new File([blob], fileName, { type: "image/png" })],
              title: "Caloria Wrapped",
              text: `Caloria Wrapped ${cycleUnit} ke-${cycleNum}! Grade ${grade} bersama ${storePetName || "Calpal"}! #CaloriaWrapped`,
            });
            toastSuccess("Berhasil membagikan kartu recap!");
            return;
          } catch {
            // Fall back to direct download
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toastSuccess("Kartu Caloria Wrapped berhasil diunduh! 📸");
      }, "image/png");
    } catch (err) {
      console.error("[ExportShareCard] Error exporting:", err);
      toastError("Gagal mengunduh kartu cerita.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Story Mobile/Tablet Frame */}
      <div
        className="relative w-full max-w-md h-[92vh] max-h-[760px] rounded-[34px] overflow-hidden shadow-2xl flex flex-col border border-border-divider/30 bg-[#FAF8F5]"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story Progress Indicators: 5 Segmented Bars */}
        <div className="absolute top-3 left-4 right-4 z-40 flex items-center gap-1.5 pointer-events-none">
          {slides.map((_, idx) => {
            let fillPercent = 0;
            if (idx < currentSlideIndex) fillPercent = 100;
            else if (idx === currentSlideIndex) fillPercent = progress;

            return (
              <div
                key={idx}
                className="h-1.5 flex-1 rounded-full bg-black/20 overflow-hidden backdrop-blur-xs"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#5B8E55] to-[#FF9233] rounded-full transition-all duration-75"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Header: Badge, Step Indicator & Close Button */}
        <div className="absolute top-7 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-bold font-heading uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#FF9233]" />
              <span>Wrapped • {cycleUnit} {cycleNum}</span>
            </span>
            {isPaused && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-white text-[10px] font-bold">
                Jeda
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-transform active:scale-90"
            title="Tutup Story"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tap navigation regions: Left 30% for Prev, Right 70% for Next */}
        <div className="absolute inset-0 z-30 flex">
          <div
            className="w-[30%] h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevSlide();
            }}
            title="Slide Sebelumnya"
          />
          <div
            className="w-[70%] h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToNextSlide();
            }}
            title="Slide Selanjutnya"
          />
        </div>

        {/* Slide Content with AnimatePresence */}
        <div className="relative flex-1 flex flex-col z-20 pt-16 pb-6 px-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* SLIDE 1: INTRO / COVER */}
              {currentSlide.slideType === "intro" && (
                <div className="flex-1 flex flex-col items-center justify-between text-center pt-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF9233]/20 text-[#FF9233] text-xs font-bold border border-[#FF9233]/30">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{currentSlide.highlightStat}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-text-primary font-heading tracking-tight leading-tight">
                      {currentSlide.title}
                    </h2>
                    <p className="text-base sm:text-lg font-bold text-[#FF9233] font-heading">
                      "{storyData.archetypeTitle}"
                    </p>
                  </div>

                  {/* Character Avatar Hero */}
                  <div className="relative my-auto py-2 flex flex-col items-center">
                    <div className="w-48 h-60 drop-shadow-xl">
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

                  {/* Commentary Speech Bubble */}
                  <div className="w-full rounded-card border-2 border-border-divider bg-[#FCF8E3] p-4 text-xs sm:text-sm text-neutral-800 shadow-sm relative space-y-1">
                    <div className="font-bold text-accent-orange text-[11px] uppercase tracking-wider">
                      💬 Kata {storePetName || "Calpal"}:
                    </div>
                    <p className="leading-relaxed font-medium">
                      "{currentSlide.commentary}"
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 2: NUTRITION STATS & DEPKES COMPLIANCE */}
              {currentSlide.slideType === "nutrition_stats" && (
                <div className="flex-1 flex flex-col items-center justify-between text-center pt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#5B8E55] uppercase tracking-wider">
                      Standar Depkes RI (80% - 120%)
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-text-primary font-heading tracking-tight">
                      {currentSlide.title}
                    </h2>
                    <p className="text-xs text-text-muted font-medium">
                      {currentSlide.subtitle}
                    </p>
                  </div>

                  {/* Visual Depkes Compliance Circle Ring */}
                  <div className="my-auto flex flex-col items-center">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          className="stroke-gray-200 fill-none"
                          strokeWidth="10"
                        />
                        {/* Progress ring */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          className="stroke-[#5B8E55] fill-none"
                          strokeWidth="10"
                          strokeDasharray={264}
                          strokeDashoffset={
                            264 - (264 * (storyData.rawStats?.depkesPercentage || 75)) / 100
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-text-primary font-heading">
                          {storyData.rawStats?.depkesPercentage || 0}%
                        </span>
                        <span className="text-[10px] font-bold text-[#5B8E55] uppercase">
                          Asupan Baik
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B8E55]/15 border border-[#5B8E55]/30 text-[#5B8E55] text-xs font-bold">
                      <Award className="h-4 w-4" />
                      <span>{currentSlide.highlightStat}</span>
                    </div>
                  </div>

                  {/* Big stats row */}
                  <div className="w-full grid grid-cols-2 gap-2.5">
                    <div className="rounded-card border border-border-divider bg-surface p-3 text-left">
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        Total Kalori
                      </span>
                      <p className="text-lg font-black text-text-primary font-heading mt-0.5">
                        {storyData.rawStats?.totalCalories || 0} <span className="text-xs font-normal">kkal</span>
                      </p>
                    </div>
                    <div className="rounded-card border border-border-divider bg-surface p-3 text-left">
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        Rata-Rata / Hari
                      </span>
                      <p className="text-lg font-black text-text-primary font-heading mt-0.5">
                        {storyData.rawStats?.averageCalories || 0} <span className="text-xs font-normal">kkal</span>
                      </p>
                    </div>
                  </div>

                  {/* Commentary */}
                  <div className="w-full rounded-card border border-border-divider bg-[#FCF8E3] p-3 text-xs text-neutral-800 text-left mt-2.5">
                    <p className="leading-relaxed font-medium">
                      "{currentSlide.commentary}"
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 3: FOOD SPOTLIGHT */}
              {currentSlide.slideType === "food_spotlight" && (
                <div className="flex-1 flex flex-col items-center justify-between text-center pt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-accent-orange uppercase tracking-wider">
                      🍽️ Pilihan Terfavorit
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-text-primary font-heading tracking-tight">
                      {currentSlide.title}
                    </h2>
                    <p className="text-xs text-text-muted font-medium">
                      {currentSlide.subtitle}
                    </p>
                  </div>

                  {/* Food plate spotlight visual */}
                  <div className="my-auto flex flex-col items-center">
                    <div className="relative w-40 h-40 rounded-full bg-[#FCF8E3] border-4 border-[#FF9233]/40 shadow-inner flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full bg-white shadow-md flex flex-col items-center justify-center p-3 text-center border border-border-divider">
                        <Utensils className="h-8 w-8 text-[#FF9233] mb-1" />
                        <span className="text-xs font-black text-neutral-900 line-clamp-2 leading-tight">
                          {currentSlide.highlightStat}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 px-4 py-1.5 rounded-full bg-[#FF9233]/15 text-[#FF9233] text-xs font-bold border border-[#FF9233]/30">
                      Menu #1 Paling Sering Dicatat
                    </div>

                    {storyData.rawStats?.topFoods && storyData.rawStats.topFoods.length > 1 && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-text-muted font-medium">
                        <span>Pilihan lain:</span>
                        {storyData.rawStats.topFoods.slice(1, 3).map((f, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border-divider text-neutral-700">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Small Pet eating preview */}
                  <div className="w-full flex items-center gap-3 rounded-card border border-border-divider bg-surface p-3 text-left">
                    <div className="w-14 h-16 shrink-0">
                      <AvatarRenderer
                        characterId={species}
                        colors={effectiveColors}
                        animationState="eating"
                        size="sm"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="text-xs text-neutral-800">
                      <div className="font-bold text-[#FF9233] text-[11px]">
                        Review Rasa dari {storePetName || "Calpal"}:
                      </div>
                      <p className="leading-snug font-medium mt-0.5">
                        "{currentSlide.commentary}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 4: PET GROWTH & PROGRESSION */}
              {currentSlide.slideType === "pet_milestone" && (
                <div className="flex-1 flex flex-col items-center justify-between text-center pt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-accent-green uppercase tracking-wider">
                      Level & Progres Sahabat
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-text-primary font-heading tracking-tight">
                      {currentSlide.title}
                    </h2>
                    <p className="text-xs text-text-muted font-medium">
                      {currentSlide.subtitle}
                    </p>
                  </div>

                  {/* Happy bouncing pet */}
                  <div className="my-auto flex flex-col items-center">
                    <div className="w-40 h-52 drop-shadow-md">
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

                  {/* Rewards collected cards */}
                  <div className="w-full grid grid-cols-2 gap-2.5">
                    <div className="rounded-card border border-border-divider bg-[#5B8E55]/10 p-3 text-left flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#5B8E55] text-white flex items-center justify-center shrink-0">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#5B8E55] uppercase">
                          Pet EXP
                        </span>
                        <p className="text-base font-black text-text-primary font-heading">
                          +{storyData.rawStats?.expEarned || 150} XP
                        </p>
                      </div>
                    </div>

                    <div className="rounded-card border border-border-divider bg-[#FF9233]/10 p-3 text-left flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#FF9233] text-white flex items-center justify-center shrink-0">
                        <Coins className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#FF9233] uppercase">
                          Caloria Coins
                        </span>
                        <p className="text-base font-black text-neutral-900 font-heading">
                          +{storyData.rawStats?.coinsGained || 50} Koin
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Commentary */}
                  <div className="w-full rounded-card border border-border-divider bg-[#FCF8E3] p-3 text-xs text-neutral-800 text-left mt-2.5">
                    <p className="leading-relaxed font-medium">
                      "{currentSlide.commentary}"
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 5: LETTER FROM CALPAL & SHARE CARD */}
              {currentSlide.slideType === "letter_from_calpal" && (
                <div className="flex-1 flex flex-col justify-between pt-1">
                  {/* Shareable tactile card container */}
                  <div className="rounded-card border-2 border-border-divider bg-white p-4 shadow-sm flex flex-col items-center text-center space-y-3">
                    {/* Grade Badge */}
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-text-muted uppercase">
                          Rapor Nutrisi
                        </span>
                        <h4 className="text-base font-black text-text-primary font-heading">
                          Grade {grade}
                        </h4>
                      </div>

                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradeTheme.bg} ${gradeTheme.glow} shadow-lg border-2 ${gradeTheme.border} flex items-center justify-center font-heading font-black text-2xl text-white`}
                      >
                        {grade}
                      </div>
                    </div>

                    {/* Headline and archetype */}
                    <div className="border-t border-border-divider/50 pt-2 w-full text-left">
                      <span className="text-xs font-bold text-accent-orange font-heading">
                        {storyData.archetypeTitle}
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 mt-0.5">
                        {storyData.headline}
                      </p>
                    </div>

                    {/* Letter Body */}
                    <div className="rounded-2xl bg-[#FCF8E3] p-3 text-left w-full text-xs text-neutral-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                        <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                        <span>Surat Hangat dari {storePetName || "Calpal"}</span>
                      </div>
                      <p className="italic leading-relaxed font-medium text-neutral-700">
                        "{currentSlide.commentary}"
                      </p>
                    </div>

                    {/* Actionable tip for next cycle */}
                    <div className="rounded-2xl bg-[#5B8E55]/10 border border-[#5B8E55]/20 p-2.5 text-left w-full text-xs">
                      <span className="font-bold text-[#5B8E55] text-[11px] flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Fokus Perbaikan Pekan Depan:</span>
                      </span>
                      <p className="text-neutral-800 font-medium mt-0.5">
                        {storyData.actionableTipNextWeek}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Simpan & Selesai and Download / Bagikan */}
                  <div className="space-y-2 mt-3 pointer-events-auto">
                    <button
                      onClick={handleExportShareCard}
                      disabled={isDownloading}
                      className="w-full py-2.5 px-4 rounded-button bg-white hover:bg-neutral-50 border-2 border-border-default text-text-primary text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
                    >
                      {isDownloading ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-accent-orange border-t-transparent rounded-full animate-spin" />
                          <span>Menyiapkan Gambar...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 text-accent-orange" />
                          <span>Download / Bagikan Kartu</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        toastSuccess("Selamat! Story Caloria Wrapped tersimpan di Arsip.");
                        onClose();
                      }}
                      className="button-primary w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Simpan & Selesai</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Carousel Navigation Controls */}
        <div className="relative z-30 px-6 pb-4 flex items-center justify-between text-xs text-text-muted border-t border-border-divider/40 pt-3">
          <button
            onClick={goToPrevSlide}
            disabled={currentSlideIndex === 0}
            className="p-1 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-[11px] font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="text-[11px] font-bold text-neutral-600">
            {currentSlideIndex + 1} / {totalSlides}
          </span>

          <button
            onClick={goToNextSlide}
            disabled={currentSlideIndex === totalSlides - 1}
            className="p-1 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-[11px] font-medium"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
