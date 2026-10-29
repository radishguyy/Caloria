"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  X,
  Flame,
  Calendar,
  Share2,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { usePetStore } from "@/store/use-pet-store";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import { type PetAnimationState } from "@/types";
import { type WeeklyRecapContent } from "@/lib/server/weekly-recap";
import { cn } from "@/lib/utils";
import { toastSuccess } from "@/lib/toast";

interface WeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  recap: WeeklyRecapContent | null;
  isLoading?: boolean;
  onAdvanceWeek?: () => void;
  onRepeatWeek?: () => void;
}

export function WeeklyRecapModal({
  isOpen,
  onClose,
  recap,
  isLoading = false,
  onAdvanceWeek,
  onRepeatWeek,
}: WeeklyRecapModalProps) {
  const { species, customColors, earsVariant, tailVariant, faceVariant, name } =
    usePetStore();

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const charDef = getCharacterDefinition(species);
  const colors = {
    ...charDef.defaultColors,
    ...Object.fromEntries(
      Object.entries(customColors || {}).filter(([, v]) => Boolean(v))
    ),
  };

  const grade = recap?.grade || "B";
  const passed = grade === "S" || grade === "A" || recap?.stats?.passedLevel;

  const petAnimation: PetAnimationState =
    recap?.calpalMoodReaction === "proud" ||
    recap?.calpalMoodReaction === "energetic"
      ? "happy"
      : recap?.calpalMoodReaction === "hungry"
      ? "eating"
      : "idle";

  const moodBadges = {
    proud: {
      label: "🌟 Sangat Bangga (Proud)",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    },
    energetic: {
      label: "⚡ Penuh Energi (Energetic)",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
    hungry: {
      label: "🍲 Masih Butuh Kalori (Hungry)",
      badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
    },
    determined: {
      label: "🛡️ Penuh Tekad (Determined)",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
    },
  };

  const currentMood =
    moodBadges[recap?.calpalMoodReaction || "determined"] ||
    moodBadges.determined;

  const gradeStyles = {
    S: "from-amber-400 to-yellow-500 text-white border-amber-200 shadow-amber-200",
    A: "from-emerald-500 to-teal-600 text-white border-emerald-200 shadow-emerald-200",
    B: "from-sky-500 to-blue-600 text-white border-sky-200 shadow-sky-200",
    C: "from-orange-400 to-amber-500 text-white border-orange-200 shadow-orange-200",
    D: "from-rose-500 to-red-600 text-white border-rose-200 shadow-rose-200",
  }[grade];

  const handleShare = () => {
    if (!recap) return;
    const text = `Rapor Nutrisi Caloria Minggu Ini: Grade ${grade}!\n${recap.weekTitle}\n"${recap.motivationQuote}" #Caloria`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toastSuccess("Ringkasan rapor mingguan berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-3xl border-2 border-[#1E293B]/10 shadow-2xl p-6 md:p-7 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-subtle transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-text-muted">
              Calpal sedang menyusun rapor nutrisi mingguanmu... ✨
            </p>
          </div>
        ) : recap ? (
          <>
            {/* Header / Week Title */}
            <div className="text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold uppercase tracking-wider bg-accent-green/10 text-accent-green-dark border border-accent-green/20">
                <Sparkles className="w-3.5 h-3.5" />
                Rapor Mingguan Calpal AI
              </span>
              <h2 className="text-xl md:text-2xl font-black text-text-primary font-serif">
                {recap.weekTitle}
              </h2>
            </div>

            {/* Avatar & Tactile Grade Badge */}
            <div className="flex flex-col items-center justify-center pt-1 pb-2">
              <div className="relative flex items-center justify-center">
                {/* Character Avatar */}
                <div className="scale-110 drop-shadow-md">
                  <AvatarRenderer
                    characterId={species}
                    colors={colors}
                    earsVariant={earsVariant}
                    tailVariant={tailVariant}
                    faceVariant={faceVariant}
                    animationState={petAnimation}
                    size={128}
                    showShadow
                  />
                </div>

                {/* Tactile Grade Stamp Badge */}
                <div
                  className={cn(
                    "absolute -bottom-2 -right-2 w-14 h-14 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center font-black border-2 shadow-lg rotate-6 transform hover:rotate-0 transition-transform",
                    gradeStyles
                  )}
                >
                  <span className="text-[10px] uppercase tracking-wider leading-none opacity-90">
                    Grade
                  </span>
                  <span className="text-2xl leading-none">{grade}</span>
                </div>
              </div>

              {/* Mood Pill */}
              <div className="mt-3">
                <span
                  className={cn(
                    "px-3 py-1 rounded-pill text-xs font-bold border",
                    currentMood.badgeClass
                  )}
                >
                  {currentMood.label}
                </span>
              </div>
            </div>

            {/* Summary Paragraph (Voice of Calpal) */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-divider/80 relative">
              <p className="text-sm text-text-primary leading-relaxed font-sans italic">
                &ldquo;{recap.summaryParagraph}&rdquo;
              </p>
              <div className="mt-2 text-right">
                <span className="text-xs font-bold text-accent-green-dark">
                  — {name || "Calpal"}, Sahabat Nutrisimu 🐾
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            {recap.stats && (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-surface border border-border-divider text-center">
                  <div className="flex items-center justify-center text-accent-green-dark mb-1">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-base font-extrabold text-text-primary">
                    {recap.stats.daysLogged} / 7
                  </div>
                  <div className="text-[10px] text-text-muted font-medium">
                    Hari Tercatat
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface border border-border-divider text-center">
                  <div className="flex items-center justify-center text-accent-orange mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="text-base font-extrabold text-text-primary">
                    {recap.stats.averageCalories}
                  </div>
                  <div className="text-[10px] text-text-muted font-medium">
                    Rata-rata kkal
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface border border-border-divider text-center">
                  <div className="flex items-center justify-center text-sky-600 mb-1">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-base font-extrabold text-text-primary">
                    {recap.stats.complianceRate}%
                  </div>
                  <div className="text-[10px] text-text-muted font-medium">
                    Target Kepatuhan
                  </div>
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="space-y-3">
              {/* Strengths */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                  Kelebihan Pekan Ini
                </h4>
                <div className="space-y-1.5">
                  {recap.strengths.map((str, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2.5 rounded-xl bg-accent-green/5 border border-accent-green/15 text-xs text-text-primary"
                    >
                      <span className="font-bold text-accent-green mt-0.5">
                        ✓
                      </span>
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-accent-orange" />
                  Saran Penyesuaian Pekan Depan
                </h4>
                <div className="space-y-1.5">
                  {recap.improvements.map((imp, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2.5 rounded-xl bg-accent-orange/5 border border-accent-orange/15 text-xs text-text-primary"
                    >
                      <span className="font-bold text-accent-orange mt-0.5">
                        💡
                      </span>
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Motivation Quote */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 text-center">
              <p className="text-xs font-bold text-amber-900 font-serif">
                &ldquo;{recap.motivationQuote}&rdquo;
              </p>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {passed ? (
                <button
                  type="button"
                  onClick={() => {
                    onAdvanceWeek?.();
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-accent-green hover:bg-accent-green-dark text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Lanjut ke Pekan Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onRepeatWeek?.();
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-accent-orange hover:bg-accent-orange-dark text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Mulai Ulang Pekan</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold bg-surface border border-border-default hover:bg-surface-subtle text-text-secondary transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? "Tersalin!" : "Bagikan"}</span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

