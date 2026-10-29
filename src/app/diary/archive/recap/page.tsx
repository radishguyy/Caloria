"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  Calendar,
  Flame,
  CheckCircle2,
  Lightbulb,
  Share2,
  RotateCcw,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { usePetStore } from "@/store/use-pet-store";
import { useFoodStore } from "@/store/use-food-store";
import { getCharacterDefinition } from "@/lib/character-assets/catalog";
import { type PetAnimationState } from "@/types";
import { type WeeklyRecapContent } from "@/lib/server/weekly-recap";
import { cn } from "@/lib/utils";
import { toastSuccess } from "@/lib/toast";

function WeeklyRecapArchiveContent() {
  const searchParams = useSearchParams();
  const weekParam = Number(searchParams?.get("week") || 1);

  const { species, customColors, earsVariant, tailVariant, faceVariant, name } =
    usePetStore();
  const { getWeeklyProgression, getConsumed, targets } = useFoodStore();

  const [recap, setRecap] = useState<WeeklyRecapContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const weeklyProg = getWeeklyProgression();
  const consumed = getConsumed();

  useEffect(() => {
    let isMounted = true;

    async function fetchRecap() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/recap/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekNumber: weekParam,
            clientData: {
              weekNumber: weekParam,
              daysLogged: weeklyProg.currentWeekMetDays,
              averageCalories: consumed.calories,
              targetTee: targets.calories,
              passedLevel:
                weeklyProg.canAdvance ||
                weeklyProg.currentWeekComplianceRate >= 75,
              complianceRate: weeklyProg.currentWeekComplianceRate,
              macroComplianceDistribution: {
                baikPercent: weeklyProg.currentWeekComplianceRate,
                lebihPercent: 0,
                defisitPercent: Math.max(
                  0,
                  100 - weeklyProg.currentWeekComplianceRate
                ),
              },
              petStatus: {
                name: name || "Calpal",
                level: weeklyProg.activeStage.level,
                expGained: 150,
              },
            },
          }),
        });

        const data = await res.json();
        if (isMounted && data.success && data.recap) {
          setRecap(data.recap);
        }
      } catch (err) {
        console.error("Gagal memuat recap mingguan:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchRecap();

    return () => {
      isMounted = false;
    };
  }, [weekParam, weeklyProg.currentWeekMetDays, weeklyProg.currentWeekComplianceRate, targets.calories, consumed.calories, weeklyProg.canAdvance, weeklyProg.activeStage.level, name]);

  const charDef = getCharacterDefinition(species);
  const colors = {
    ...charDef.defaultColors,
    ...Object.fromEntries(
      Object.entries(customColors || {}).filter(([, v]) => Boolean(v))
    ),
  };

  const grade = recap?.grade || "B";
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
    const shareText = `Rapor Nutrisi Caloria Minggu Ke-${weekParam}: Grade ${grade}!\n${recap.weekTitle}\n"${recap.motivationQuote}" #Caloria`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toastSuccess("Rapor mingguan berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-divider">
        <div className="flex items-center gap-3">
          <Link
            href="/diary/archive"
            className="p-2 rounded-navigation border border-border-default hover:bg-surface-subtle text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-accent-green-dark uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Arsip Rapor Mingguan AI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary font-heading">
              Evaluasi Nutrisi Minggu Ke-{weekParam}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          disabled={!recap}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-navigation border border-border-default bg-surface hover:bg-surface-subtle text-text-primary text-xs font-bold transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-text-muted" />
          <span>{copied ? "Tersalin!" : "Bagikan"}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-4 rounded-3xl bg-surface border border-border-divider">
          <div className="w-12 h-12 border-4 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-text-muted">
            Calpal sedang menyiapkan arsip laporan nutrisi...
          </p>
        </div>
      ) : recap ? (
        <div className="rounded-3xl border-2 border-[#1E293B]/10 bg-surface shadow-md p-6 sm:p-8 space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary font-serif">
              {recap.weekTitle}
            </h2>
            <p className="text-xs text-text-muted">
              Evaluasi 7 Hari Standar Depkes RI & Capaian Misi RPG Caloria
            </p>
          </div>

          {/* Calpal Avatar & Grade Badge */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative flex items-center justify-center">
              <div className="scale-125 drop-shadow-lg">
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

              {/* Tactile Grade Badge */}
              <div
                className={cn(
                  "absolute -bottom-2 -right-4 w-16 h-16 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center font-black border-2 shadow-xl rotate-6 hover:rotate-0 transition-transform",
                  gradeStyles
                )}
              >
                <span className="text-[10px] uppercase tracking-wider leading-none opacity-90">
                  Grade
                </span>
                <span className="text-3xl leading-none">{grade}</span>
              </div>
            </div>

            <div className="mt-4">
              <span
                className={cn(
                  "px-3.5 py-1 rounded-pill text-xs font-bold border",
                  currentMood.badgeClass
                )}
              >
                {currentMood.label}
              </span>
            </div>
          </div>

          {/* Summary Voice of Calpal */}
          <div className="p-5 rounded-2xl bg-surface-subtle border border-border-divider/80">
            <p className="text-sm sm:text-base text-text-primary leading-relaxed font-sans italic">
              &ldquo;{recap.summaryParagraph}&rdquo;
            </p>
            <div className="mt-3 text-right">
              <span className="text-xs font-bold text-accent-green-dark">
                — {name || "Calpal"}, Sahabat Nutrisimu 🐾
              </span>
            </div>
          </div>

          {/* Stats Ribbon */}
          {recap.stats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-surface border border-border-divider text-center shadow-2xs">
                <div className="flex items-center justify-center text-accent-green-dark mb-1">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-lg font-extrabold text-text-primary">
                  {recap.stats.daysLogged} / 7
                </div>
                <div className="text-xs text-text-muted">Hari Tercatat</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-border-divider text-center shadow-2xs">
                <div className="flex items-center justify-center text-accent-orange mb-1">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="text-lg font-extrabold text-text-primary">
                  {recap.stats.averageCalories}
                </div>
                <div className="text-xs text-text-muted">Rata-rata kkal</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-border-divider text-center shadow-2xs">
                <div className="flex items-center justify-center text-sky-600 mb-1">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-lg font-extrabold text-text-primary">
                  {recap.stats.complianceRate}%
                </div>
                <div className="text-xs text-text-muted">Target Kepatuhan</div>
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-2xl bg-accent-green/5 border border-accent-green/20 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent-green-dark flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-accent-green" />
                Kelebihan Pekan Ini
              </h4>
              <ul className="space-y-1.5 text-xs text-text-primary">
                {recap.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold text-accent-green">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="p-4 rounded-2xl bg-accent-orange/5 border border-accent-orange/20 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent-orange-dark flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-accent-orange" />
                Saran Penyesuaian
              </h4>
              <ul className="space-y-1.5 text-xs text-text-primary">
                {recap.improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold text-accent-orange">💡</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Motivation Quote */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-center">
            <p className="text-sm font-bold text-amber-900 font-serif">
              &ldquo;{recap.motivationQuote}&rdquo;
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function WeeklyRecapArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-4xl px-4 py-12 text-center text-text-muted">
          Memuat Rapor Mingguan...
        </div>
      }
    >
      <WeeklyRecapArchiveContent />
    </Suspense>
  );
}

