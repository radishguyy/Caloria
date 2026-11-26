"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Check, Snowflake, Moon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getWeekDays, formatDateKey } from "@/lib/date-utils";
import { useFoodStore } from "@/store/use-food-store";
import { useSocialStore } from "@/store/use-social-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { activateRestDayAction } from "@/app/actions/streak";
import { cn } from "@/lib/utils";

interface DashboardCalendarStripProps {
  className?: string;
  onSelectDate?: (dateKey: string) => void;
  embedded?: boolean;
}

type PowerupModalType = "freeze" | "rest" | null;

export function DashboardCalendarStrip({
  className,
  onSelectDate,
  embedded = false,
}: DashboardCalendarStripProps) {
  const isHydrated = useHydrated();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const { selectedDate, setSelectedDate, getDailySummary } = useFoodStore();
  const {
    coopStreakDays,
    streakFreezes,
    lastFreezeUsedDate,
    restPasses,
    lastRestDayDate,
    setStreakMeta,
  } = useSocialStore();

  const [isActivatingRest, setIsActivatingRest] = useState(false);
  const [activePowerupModal, setActivePowerupModal] =
    useState<PowerupModalType>(null);

  const todayKey = isHydrated ? formatDateKey(new Date()) : "";
  const isRestToday = Boolean(todayKey && lastRestDayDate === todayKey);

  useEffect(() => {
    if (!activePowerupModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isActivatingRest) {
        setActivePowerupModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePowerupModal, isActivatingRest]);

  const handleActivateRestDay = async (): Promise<boolean> => {
    setIsActivatingRest(true);
    try {
      const res = await activateRestDayAction();
      if (res.success) {
        setStreakMeta({
          restPasses: res.restPasses,
          lastRestDayDate: res.lastRestDayDate ?? todayKey,
          ...(coopStreakDays > 0 ? { lastLoggedDate: todayKey } : {}),
        });
        toast.success(res.message);
        return true;
      } else {
        toast.error(res.message);
        return false;
      }
    } catch {
      toast.error("Gagal mengaktifkan Rest Day.");
      return false;
    } finally {
      setIsActivatingRest(false);
    }
  };

  const weekDays = isHydrated ? getWeekDays(new Date()) : [];

  const handleDayClick = (dateKey: string) => {
    setSelectedDate(dateKey);
    onSelectDate?.(dateKey);
  };

  const freezeTooltipTitle = `Streak Freeze (Stok: ${streakFreezes})`;
  const freezeTooltipDesc =
    streakFreezes > 0
      ? "Otomatis melindungi streak harianmu saat lupa mencatat makanan sehari."
      : "Stok habis. Beli di Toko CalPal untuk melindungi streak saat lupa log.";

  const restTooltipTitle = isRestToday
    ? "Rest Day (Aktif Hari Ini)"
    : `Rest Day Pass (Stok: ${restPasses})`;
  const restTooltipDesc = isRestToday
    ? "Streak kamu tetap aman hari ini tanpa perlu mencatat makanan."
    : restPasses > 0
      ? "Aktifkan untuk libur mencatat makanan hari ini tanpa memutus streak."
      : "Stok habis. Beli di Toko CalPal untuk libur log tanpa memutus streak.";

  if (!isHydrated) {
    return (
      <div
        className={cn(
          embedded
            ? "pt-6 space-y-3.5 animate-pulse"
            : "rounded-card border border-border-divider bg-surface p-4 sm:p-5 shadow-xs space-y-3.5 animate-pulse",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-7 w-32 bg-surface-subtle rounded-pill" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-surface-subtle rounded-pill" />
            <div className="h-10 w-10 bg-surface-subtle rounded-pill" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-subtle rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      data-tour="dashboard-calendar"
      className={cn(
        embedded
          ? "pt-6 space-y-3.5"
          : "rounded-card border border-border-divider bg-surface p-4 sm:p-5 shadow-xs space-y-3.5",
        className,
      )}
      aria-label="Tanggal dan Kalender Mingguan Nutrisi"
    >
      {/* Header Row: Title "Tanggal" + Icon (left), Power-ups Freeze & Rest Day icons (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Calendar
            className="h-6 w-6 text-accent-green shrink-0"
            aria-hidden="true"
          />
          <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary font-heading tracking-tight">
            Tanggal
          </h3>
        </div>

        {/* Right side: Icon-only Power-up buttons with desktop hover tooltip & mobile modal */}
        <div className="flex items-center gap-2">
          {/* Freeze Power-up */}
          <div className="group relative">
            <Link
              href="/pet-customization/shop"
              onClick={(e) => {
                if (!isDesktop) {
                  e.preventDefault();
                  setActivePowerupModal("freeze");
                }
              }}
              aria-label={freezeTooltipTitle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              <Snowflake className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            </Link>

            {/* Desktop Hover/Focus Tooltip */}
            <div
              role="tooltip"
              className="pointer-events-none invisible absolute bottom-full right-0 z-40 mb-2 hidden w-60 rounded-2xl border border-border-divider bg-surface p-3 text-left opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 sm:block"
            >
              <p className="text-xs font-extrabold text-sky-700">
                {freezeTooltipTitle}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-neutral-10">
                {freezeTooltipDesc}
              </p>
            </div>
          </div>

          {/* Rest Day Power-up */}
          <div className="group relative">
            {isRestToday ? (
              <button
                type="button"
                onClick={() => {
                  if (!isDesktop) {
                    setActivePowerupModal("rest");
                  }
                }}
                aria-label={restTooltipTitle}
                className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-indigo-100 border border-indigo-300 text-indigo-700 transition-colors cursor-default sm:cursor-help"
              >
                <Moon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              </button>
            ) : restPasses > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (!isDesktop) {
                    setActivePowerupModal("rest");
                    return;
                  }
                  void handleActivateRestDay();
                }}
                disabled={isActivatingRest}
                aria-label={restTooltipTitle}
                className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {isActivatingRest ? (
                  <Loader2
                    className="h-4.5 w-4.5 animate-spin shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Moon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                )}
              </button>
            ) : (
              <Link
                href="/pet-customization/shop"
                onClick={(e) => {
                  if (!isDesktop) {
                    e.preventDefault();
                    setActivePowerupModal("rest");
                  }
                }}
                aria-label={restTooltipTitle}
                className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-surface border border-border-default text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
              >
                <Moon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              </Link>
            )}

            {/* Desktop Hover/Focus Tooltip */}
            <div
              role="tooltip"
              className="pointer-events-none invisible absolute bottom-full right-0 z-40 mb-2 hidden w-60 rounded-2xl border border-border-divider bg-surface p-3 text-left opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 sm:block"
            >
              <p className="text-xs font-extrabold text-indigo-700">
                {restTooltipTitle}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-neutral-10">
                {restTooltipDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Horizontal Strip */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {weekDays.map((day) => {
          const summary = getDailySummary(day.dateKey);
          const isSelected = selectedDate === day.dateKey;
          const isCellFuture = day.isFuture;
          const status = summary.status;
          const isFreezeDay = day.dateKey === lastFreezeUsedDate;
          const isRestDay = day.dateKey === lastRestDayDate;
          const dayTooltip = isCellFuture
            ? "Belum tersedia"
            : isFreezeDay
              ? "Dilindungi Streak Freeze"
              : isRestDay
                ? "Rest Day"
                : summary.hasLogs
                  ? `${summary.consumed.calories} / ${summary.target.calories} kcal (${summary.percentage}%)`
                  : "Belum dicatat";

          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => !isCellFuture && handleDayClick(day.dateKey)}
              disabled={isCellFuture}
              aria-pressed={isSelected}
              title={dayTooltip}
              className={cn(
                "group flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl text-center transition-all duration-150 select-none",
                // Current / past / future styling
                isCellFuture
                  ? "opacity-40 cursor-not-allowed border border-border-divider/50 bg-surface-subtle/50"
                  : isSelected
                    ? "cursor-pointer bg-accent-orange border-0 hover:scale-[1.02] active:translate-y-[2px]"
                    : "cursor-pointer border border-border-divider bg-surface hover:border-accent-green/50 hover:scale-[1.02] active:translate-y-[2px]",
                // Today styling if not selected
                day.isToday &&
                  !isSelected &&
                  "ring-1.5 ring-accent-green/60 border-accent-green/80",
              )}
            >
              {/* Day Name (Sen, Sel, ...) */}
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-bold font-heading uppercase tracking-wider",
                  isSelected
                    ? "text-[#1e293b]"
                    : day.isToday
                      ? "text-accent-green"
                      : "text-text-muted",
                )}
              >
                {day.dayShortName}
              </span>

              {/* Day Number */}
              <span
                className={cn(
                  "my-1 text-xs sm:text-sm font-extrabold font-sans",
                  isSelected
                    ? "text-[#1e293b]"
                    : day.isToday
                      ? "flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-pill bg-accent-green text-text-inverse shadow-xs"
                      : "text-foreground",
                )}
              >
                {day.dayNumber}
              </span>

              {/* Status Indicator Dot, Freeze, Rest Day, or Checkmark */}
              <div className="h-3.5 flex items-center justify-center">
                {!isCellFuture ? (
                  day.dateKey === lastFreezeUsedDate ? (
                    <span
                      className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-sky-100 text-sky-600"
                      title="Dilindungi Streak Freeze"
                    >
                      <Snowflake className="h-2.5 w-2.5" />
                    </span>
                  ) : day.dateKey === lastRestDayDate ? (
                    <span
                      className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-600"
                      title="Hari Istirahat (Rest Day)"
                    >
                      <Moon className="h-2.5 w-2.5" />
                    </span>
                  ) : status === "hit" ? (
                    <span className="flex items-center justify-center w-3 h-3 rounded-full bg-[#5B8E55] text-white">
                      <Check className="h-2 w-2 stroke-[3]" />
                    </span>
                  ) : status === "under" ? (
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isSelected ? "bg-white/90" : "bg-[#F59E0B]",
                      )}
                      title="Di bawah target"
                    />
                  ) : status === "over" ? (
                    <span
                      className="w-2 h-2 rounded-full bg-[#F43F5E]"
                      title="Melebihi target"
                    />
                  ) : (
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-[#1e293b]/45" : "bg-neutral-7/40",
                      )}
                      title="Belum dicatat"
                    />
                  )
                ) : (
                  <span className="w-1 h-1 rounded-full bg-neutral-7/20" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile Power-up Confirmation Modal */}
      {activePowerupModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="powerup-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isActivatingRest) {
              setActivePowerupModal(null);
            }
          }}
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-border-divider bg-surface p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setActivePowerupModal(null)}
              disabled={isActivatingRest}
              aria-label="Tutup modal power-up"
              className="absolute right-4 top-4 rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className={cn(
                "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
                activePowerupModal === "freeze"
                  ? "bg-sky-50 text-sky-600 border border-sky-200"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200",
              )}
            >
              {activePowerupModal === "freeze" ? (
                <Snowflake className="h-7 w-7" aria-hidden="true" />
              ) : (
                <Moon className="h-7 w-7" aria-hidden="true" />
              )}
            </div>

            <div className="space-y-1.5">
              <h4
                id="powerup-modal-title"
                className="text-lg font-extrabold text-text-primary font-heading"
              >
                {activePowerupModal === "freeze"
                  ? freezeTooltipTitle
                  : restTooltipTitle}
              </h4>
              <p className="text-xs leading-relaxed text-neutral-10">
                {activePowerupModal === "freeze"
                  ? freezeTooltipDesc
                  : isRestToday
                    ? restTooltipDesc
                    : restPasses > 0
                      ? "Gunakan 1 Rest Day Pass sekarang? Streak harianmu akan tetap aman hari ini tanpa perlu mencatat makanan."
                      : restTooltipDesc}
              </p>
            </div>

            {activePowerupModal === "freeze" ? (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActivePowerupModal(null)}
                  className="min-h-11 w-full rounded-button border border-border-default bg-surface py-2.5 px-4 text-xs font-bold text-neutral-10 hover:bg-surface-subtle cursor-pointer"
                >
                  Tutup
                </button>
                <Link
                  href="/pet-customization/shop"
                  onClick={() => setActivePowerupModal(null)}
                  className="min-h-11 w-full inline-flex items-center justify-center rounded-button bg-accent-green-light py-2.5 px-4 text-xs font-extrabold text-[#244710] hover:bg-[#a9ce46]"
                >
                  Buka Toko
                </Link>
              </div>
            ) : isRestToday ? (
              <button
                type="button"
                onClick={() => setActivePowerupModal(null)}
                className="min-h-11 w-full rounded-button bg-accent-green-light py-2.5 px-4 text-xs font-extrabold text-[#244710] hover:bg-[#a9ce46] cursor-pointer"
              >
                Mengerti
              </button>
            ) : restPasses > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActivePowerupModal(null)}
                  disabled={isActivatingRest}
                  className="min-h-11 w-full rounded-button border border-border-default bg-surface py-2.5 px-4 text-xs font-bold text-neutral-10 hover:bg-surface-subtle disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await handleActivateRestDay();
                    if (ok) {
                      setActivePowerupModal(null);
                    }
                  }}
                  disabled={isActivatingRest}
                  className="min-h-11 w-full inline-flex items-center justify-center gap-1.5 rounded-button bg-accent-green-light py-2.5 px-4 text-xs font-extrabold text-[#244710] hover:bg-[#a9ce46] disabled:opacity-50 cursor-pointer"
                >
                  {isActivatingRest && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  )}
                  <span>Gunakan</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActivePowerupModal(null)}
                  className="min-h-11 w-full rounded-button border border-border-default bg-surface py-2.5 px-4 text-xs font-bold text-neutral-10 hover:bg-surface-subtle cursor-pointer"
                >
                  Tutup
                </button>
                <Link
                  href="/pet-customization/shop"
                  onClick={() => setActivePowerupModal(null)}
                  className="min-h-11 w-full inline-flex items-center justify-center rounded-button bg-accent-green-light py-2.5 px-4 text-xs font-extrabold text-[#244710] hover:bg-[#a9ce46]"
                >
                  Beli di Toko
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
