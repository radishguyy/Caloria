"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar as CalendarIcon,
  Check,
  Award,
  Snowflake,
  Moon,
} from "lucide-react";
import {
  getDaysInMonth,
  formatDateKey,
  formatDateDisplay,
  isToday,
  isFuture,
  INDONESIAN_DAYS_SHORT,
  addMonths,
  subMonths,
} from "@/lib/date-utils";
import { useFoodStore } from "@/store/use-food-store";
import { useSocialStore } from "@/store/use-social-store";
import { DailyNutritionSummary, DailyComplianceStatus } from "@/types";
import { fetchUserArchiveSummariesAction } from "@/app/actions/diary";
import { cn } from "@/lib/utils";

interface ArchiveCalendarSummary {
  totalCalories?: number;
  calorieTarget?: number;
  isCalorieTargetMet?: boolean;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  isMacroBalanced?: boolean;
  baseXpTotal?: number;
}

interface CalendarGridProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  currentMonthDate: Date;
  onChangeMonth: (date: Date) => void;
}

export function CalendarGrid({
  selectedDate,
  onSelectDate,
  currentMonthDate,
  onChangeMonth,
}: CalendarGridProps) {
  const { getDailySummary } = useFoodStore();
  const { lastFreezeUsedDate, lastRestDayDate } = useSocialStore();
  const [statusFilter, setStatusFilter] =
    useState<DailyComplianceStatus | null>(null);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const now = new Date();
  const isViewingCurrentOrFutureMonth =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth());

  const toggleStatusFilter = (targetStatus: DailyComplianceStatus) => {
    setStatusFilter((prev) => (prev === targetStatus ? null : targetStatus));
  };

  const days = useMemo(() => {
    return getDaysInMonth(year, month);
  }, [year, month]);

  const [serverSummaries, setServerSummaries] = useState<
    Record<string, ArchiveCalendarSummary>
  >({});

  useEffect(() => {
    let isCancelled = false;
    if (days.length === 0) return;
    const start = days[0].dateKey;
    const end = days[days.length - 1].dateKey;

    fetchUserArchiveSummariesAction(start, end)
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          setServerSummaries(
            res.data as Record<string, ArchiveCalendarSummary>,
          );
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn(
            "[CalendarGrid] fetchUserArchiveSummariesAction failed:",
            err,
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [days]);

  // Precompute daily summaries for each day cell (combining local store + persistent server records)
  const summariesMap = useMemo(() => {
    const map = new Map<string, DailyNutritionSummary>();
    for (const cell of days) {
      const local = getDailySummary(cell.dateKey);
      if (local && local.hasLogs) {
        map.set(cell.dateKey, local);
      } else if (serverSummaries[cell.dateKey]) {
        const s = serverSummaries[cell.dateKey];
        const cal = s.totalCalories || 0;
        const target = s.calorieTarget || 2000;
        const pct = target > 0 ? Math.round((cal / target) * 100) : 0;
        const status: DailyComplianceStatus = s.isCalorieTargetMet
          ? "hit"
          : cal < target * 0.85
            ? "under"
            : "over";

        map.set(cell.dateKey, {
          date: cell.dateKey,
          consumed: {
            calories: cal,
            protein: s.totalProtein || 0,
            carbs: s.totalCarbs || 0,
            fat: s.totalFat || 0,
            fiber: 0,
            sugar: 0,
          },
          target: {
            calories: target,
            protein: s.proteinTarget || 125,
            carbs: s.carbsTarget || 250,
            fat: s.fatTarget || 55,
          },
          percentage: pct,
          status,
          macroStatus: {
            protein: s.isMacroBalanced ? "hit" : "under",
            carbs: s.isMacroBalanced ? "hit" : "under",
            fat: s.isMacroBalanced ? "hit" : "under",
          },
          xpEarned: s.baseXpTotal || 0,
          coinsEarned: 10,
          hasLogs: cal > 0,
          logs: [],
        });
      } else {
        map.set(cell.dateKey, local);
      }
    }
    return map;
  }, [days, getDailySummary, serverSummaries]);

  const handlePrevMonth = () => {
    onChangeMonth(subMonths(currentMonthDate, 1));
  };

  const handleNextMonth = () => {
    onChangeMonth(addMonths(currentMonthDate, 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    onChangeMonth(today);
    onSelectDate(formatDateKey(today));
  };

  // Month stats calculation
  const monthStats = useMemo(() => {
    let daysLogged = 0;
    let daysHit = 0;
    let totalCalories = 0;
    let totalXp = 0;

    for (const cell of days) {
      if (!cell.isCurrentMonth || cell.isFuture) continue;
      const s = summariesMap.get(cell.dateKey);
      if (s && s.hasLogs) {
        daysLogged++;
        totalCalories += s.consumed.calories;
        totalXp += s.xpEarned;
        if (s.status === "hit") {
          daysHit++;
        }
      }
    }

    const complianceRate =
      daysLogged > 0 ? Math.round((daysHit / daysLogged) * 100) : 0;

    return {
      daysLogged,
      daysHit,
      complianceRate,
      avgCalories: daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0,
      totalXp,
    };
  }, [days, summariesMap]);

  return (
    <div
      data-tour="diary-archive-calendar"
      className="rounded-card border border-border-divider bg-surface p-4 sm:p-6 shadow-xs space-y-4"
    >
      {/* Month Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-divider">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-navigation bg-accent-green/15 text-text-primary">
            <CalendarIcon className="h-5 w-5 text-accent-green" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary font-heading tracking-tight">
              {formatDateDisplay(currentMonthDate, "monthYear")}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="min-h-10 px-3.5 py-2 rounded-navigation border border-border-default bg-surface-subtle hover:bg-accent-green-light text-text-primary text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Lompat ke Hari Ini"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-green" />
            <span>Hari Ini</span>
          </button>

          <div className="flex items-center gap-1 bg-surface-subtle border border-border-divider rounded-navigation p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan Sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-[10px] hover:bg-surface text-text-muted hover:text-text-primary transition-colors active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isViewingCurrentOrFutureMonth}
              aria-label="Bulan Berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-[10px] hover:bg-surface text-text-muted hover:text-text-primary transition-colors active:scale-95 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers (Senin start) */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {INDONESIAN_DAYS_SHORT.map((day, idx) => {
          const isWeekend = idx >= 5;
          return (
            <div
              key={day}
              className={cn(
                "py-1.5 text-sm sm:text-base font-bold uppercase tracking-wider rounded-input font-heading",
                isWeekend ? "text-accent-orange-dark/80" : "text-text-muted",
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid 7 columns */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((cell) => {
          const summary = summariesMap.get(cell.dateKey);
          const isSelected = selectedDate === cell.dateKey;
          const isCellToday = isToday(cell.dateKey);
          const isCellFuture = isFuture(cell.dateKey);
          const hasLogs = summary?.hasLogs ?? false;
          const status = summary?.status ?? "empty";
          const isFreezeDay = cell.dateKey === lastFreezeUsedDate;
          const isRestDay = cell.dateKey === lastRestDayDate;
          const calorieBarWidth = Math.min(100, summary?.percentage ?? 0);
          const isDimmedByFilter =
            statusFilter !== null &&
            cell.isCurrentMonth &&
            !isCellFuture &&
            status !== statusFilter;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => !isCellFuture && onSelectDate(cell.dateKey)}
              disabled={isCellFuture}
              aria-pressed={isSelected}
              aria-label={`${formatDateDisplay(cell.dateKey, "full")}${
                hasLogs
                  ? `, ${summary?.consumed.calories} kalori`
                  : ", Belum dicatat"
              }`}
              className={cn(
                "relative group flex flex-col justify-between p-1.5 sm:p-2 min-h-[64px] sm:min-h-[82px] rounded-2xl border text-left transition-all duration-150 select-none",
                // Current vs outside month
                cell.isCurrentMonth
                  ? "bg-surface text-foreground"
                  : "bg-surface-subtle/50 text-text-muted/60 opacity-60",
                // Future vs selectable
                isCellFuture &&
                  "opacity-40 cursor-not-allowed bg-surface-subtle/40",
                !isCellFuture &&
                  "hover:border-accent-green/50 hover:scale-[1.02] active:translate-y-[2px] cursor-pointer",
                // Dimmed when legend filter is active
                isDimmedByFilter && "opacity-25",
                // Selected state: pale yellow bg + vibrant orange border
                isSelected
                  ? "border-2 border-[#FF9233] bg-[#FCF8E3] shadow-xs ring-2 ring-[#FF9233]/25 z-10"
                  : "border-border-divider",
                // Today indicator subtle outline if not selected
                isCellToday &&
                  !isSelected &&
                  "ring-2 ring-accent-green/50 border-accent-green",
              )}
            >
              {/* Top Row: Day Number + Today / XP / Protection Badge */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    "text-xs sm:text-sm font-bold font-sans",
                    isCellToday
                      ? "flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-pill bg-accent-green text-text-inverse shadow-xs"
                      : isSelected
                        ? "text-accent-orange-dark font-extrabold"
                        : "text-foreground",
                  )}
                >
                  {cell.dayNumber}
                </span>

                <div className="flex items-center gap-0.5">
                  {!isCellFuture && isFreezeDay && (
                    <span
                      className="flex items-center justify-center w-4 h-4 rounded-full bg-sky-100 text-sky-600"
                      title="Dilindungi Streak Freeze"
                    >
                      <Snowflake className="h-2.5 w-2.5" />
                    </span>
                  )}
                  {!isCellFuture && !isFreezeDay && isRestDay && (
                    <span
                      className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-600"
                      title="Hari Istirahat (Rest Day)"
                    >
                      <Moon className="h-2.5 w-2.5" />
                    </span>
                  )}
                  {/* Coin / XP mini badge if logged & earned XP */}
                  {hasLogs && (summary?.xpEarned ?? 0) > 0 && !isCellFuture && (
                    <span
                      className="hidden sm:inline-flex items-center text-xs font-bold text-accent-orange leading-none"
                      title={`+${summary?.xpEarned} XP diperoleh`}
                    >
                      ★
                    </span>
                  )}
                </div>
              </div>

              {/* Middle: Calorie count preview + thin progress bar (mobile & desktop) */}
              <div className="my-0.5 sm:my-1 min-h-[14px] w-full space-y-1">
                {hasLogs ? (
                  <>
                    <span className="hidden sm:block text-[11px] font-extrabold text-text-primary tracking-tight truncate">
                      {summary?.consumed.calories}{" "}
                      <span className="text-[9px] font-normal text-text-muted">
                        kcal
                      </span>
                    </span>
                    <div className="h-1 w-full rounded-full bg-border-divider/60 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          status === "hit" && "bg-[#5B8E55]",
                          status === "under" && "bg-[#F59E0B]",
                          status === "over" && "bg-[#F43F5E]",
                        )}
                        style={{ width: `${calorieBarWidth}%` }}
                      />
                    </div>
                  </>
                ) : !isCellFuture && cell.isCurrentMonth ? (
                  <span className="hidden sm:block text-[10px] text-text-muted/60">
                    —
                  </span>
                ) : null}
              </div>

              {/* Bottom Row: Compliance status indicator dot & macro mini dots */}
              <div className="flex items-center justify-between w-full pt-0.5">
                {/* Status Dot */}
                {!isCellFuture && cell.isCurrentMonth ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-block w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-transform",
                        status === "hit" &&
                          "bg-[#5B8E55] ring-2 ring-[#5B8E55]/30",
                        status === "under" && "bg-[#F59E0B]",
                        status === "over" && "bg-[#F43F5E]",
                        status === "empty" && "bg-neutral-7/40",
                      )}
                      title={
                        status === "hit"
                          ? "Target Kalori Tercapai"
                          : status === "under"
                            ? "Di Bawah Target Kalori"
                            : status === "over"
                              ? "Melebihi Target Kalori"
                              : "Belum Ada Catatan"
                      }
                    />

                    {/* Macro mini 3 dots indicator for Hit/Logged days */}
                    {hasLogs && (
                      <div className="hidden md:flex items-center gap-1">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            summary?.macroStatus.protein === "hit"
                              ? "bg-[#10B981]"
                              : "bg-[#10B981]/40",
                          )}
                          title="Protein"
                        />
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            summary?.macroStatus.carbs === "hit"
                              ? "bg-[#38BDF8]"
                              : "bg-[#38BDF8]/40",
                          )}
                          title="Karbohidrat"
                        />
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            summary?.macroStatus.fat === "hit"
                              ? "bg-[#F43F5E]"
                              : "bg-[#F43F5E]/40",
                          )}
                          title="Lemak"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}

                {/* Checkmark icon for Hit */}
                {status === "hit" && !isCellFuture && (
                  <span className="text-[#5B8E55]">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend & Month Summary Card */}
      <div className="pt-3 border-t border-border-divider space-y-3">
        {/* Interactive Color Legend (click to filter) */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-2 text-[11px] text-text-primary font-semibold">
          {(
            [
              {
                key: "hit" as const,
                label: "Target Tercapai",
                dotClass: "bg-[#5B8E55] ring-2 ring-[#5B8E55]/30",
              },
              {
                key: "under" as const,
                label: "Di Bawah Target",
                dotClass: "bg-[#F59E0B]",
              },
              {
                key: "over" as const,
                label: "Melebihi Target",
                dotClass: "bg-[#F43F5E]",
              },
              {
                key: "empty" as const,
                label: "Kosong",
                dotClass: "bg-neutral-7/40",
              },
            ] as const
          ).map((item) => {
            const isActive = statusFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleStatusFilter(item.key)}
                aria-pressed={isActive}
                title={`Sorot hari dengan status: ${item.label}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 border transition-colors cursor-pointer",
                  isActive
                    ? "bg-accent-green/15 border-accent-green text-text-primary"
                    : "border-transparent hover:bg-surface-subtle",
                )}
              >
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full inline-block",
                    item.dotClass,
                  )}
                />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="flex items-center gap-1 px-1">
            <span className="text-accent-orange font-bold">★</span>
            <span>XP / Hadiah Pet</span>
          </div>
        </div>

        {/* Month Quick Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-2.5 rounded-navigation bg-surface-subtle border border-border-divider/70">
            <span className="text-[10px] text-text-primary uppercase font-bold tracking-wider">
              Hari Tercatat
            </span>
            <p className="text-base font-extrabold text-text-primary font-heading mt-0.5">
              {monthStats.daysLogged}{" "}
              <span className="text-xs font-semibold text-text-primary">
                Hari
              </span>
            </p>
          </div>

          <div className="p-2.5 rounded-navigation bg-surface-subtle border border-border-divider/70">
            <span className="text-[10px] text-text-primary uppercase font-bold tracking-wider">
              Target Dipenuhi
            </span>
            <p className="text-base font-extrabold text-text-primary font-heading mt-0.5">
              {monthStats.daysHit}{" "}
              <span className="text-xs font-semibold text-text-primary">
                Hari
              </span>
              {monthStats.daysLogged > 0 && (
                <span className="ml-1 text-xs font-bold text-[#5B8E55]">
                  ({monthStats.complianceRate}%)
                </span>
              )}
            </p>
          </div>

          <div className="p-2.5 rounded-navigation bg-surface-subtle border border-border-divider/70">
            <span className="text-[10px] text-text-primary uppercase font-bold tracking-wider">
              Rata-rata Kalori
            </span>
            <p className="text-base font-extrabold text-text-primary font-heading mt-0.5">
              {monthStats.avgCalories}{" "}
              <span className="text-xs font-semibold text-text-primary">
                kcal
              </span>
            </p>
          </div>

          <div className="p-2.5 rounded-navigation bg-surface-subtle border border-border-divider/70">
            <span className="text-[10px] text-text-primary uppercase font-bold tracking-wider">
              Total XP Bulan Ini
            </span>
            <p className="text-base font-extrabold text-text-primary font-heading mt-0.5 flex items-center gap-1">
              <Award className="h-4 w-4 text-accent-green" />
              <span>+{monthStats.totalXp} XP</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
