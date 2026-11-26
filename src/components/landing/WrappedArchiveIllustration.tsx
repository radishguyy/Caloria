"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCircle2,
  Download,
  Moon,
  RotateCcw,
  Snowflake,
  Sparkles,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";

const DAY_HEADERS = ["S", "S", "R", "K", "J", "S", "M"] as const;

type DayStatus = "met" | "freeze" | "rest" | "selected" | "Plain";

interface ArchiveDayCell {
  day: number;
  status: DayStatus;
}

const ARCHIVE_DAYS: ArchiveDayCell[] = [
  { day: 14, status: "met" },
  { day: 15, status: "met" },
  { day: 16, status: "freeze" },
  { day: 17, status: "met" },
  { day: 18, status: "met" },
  { day: 19, status: "rest" },
  { day: 20, status: "met" },
  { day: 21, status: "met" },
  { day: 22, status: "met" },
  { day: 23, status: "met" },
  { day: 24, status: "selected" },
  { day: 25, status: "met" },
  { day: 26, status: "Plain" },
  { day: 27, status: "Plain" },
];

export function WrappedArchiveIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[480px] rounded-2xl border border-border-divider bg-surface p-4 sm:p-5 select-none">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
        {/* Left: Story Caloria Wrapped Preview */}
        <div className="sm:col-span-5 rounded-2xl border border-border-divider bg-accent-green/10 p-3.5 flex flex-col justify-between gap-3">
          {/* 5-Slide Progress Bar */}
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-1" aria-hidden="true">
              <div className="h-1 rounded-full bg-accent-green" />
              <div className="h-1 rounded-full bg-accent-green" />
              <div className="h-1 rounded-full bg-border-divider overflow-hidden">
                <motion.div
                  animate={{ width: ["15%", "100%", "15%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4.5,
                    ease: "easeInOut",
                  }}
                  className="h-full rounded-full bg-accent-green"
                />
              </div>
              <div className="h-1 rounded-full bg-border-divider" />
              <div className="h-1 rounded-full bg-border-divider" />
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-text-primary">
                <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>Wrapped #4</span>
              </span>
              <span className="text-[10px] font-bold text-text-muted tabular-nums">
                3/5
              </span>
            </div>
          </div>

          {/* Floating Calpal & Story Highlight */}
          <div className="flex flex-col items-center text-center my-auto py-1">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3.4,
                ease: "easeInOut",
              }}
              className="w-24 h-28 sm:w-26 sm:h-32"
            >
              <AvatarRenderer
                characterId="ziggy"
                animationState="happy"
                equipped={{
                  head: "acc-baseball-cap",
                  body: "body-sport-jersey",
                  held: "acc-water-bottle",
                }}
                showRoomBackdrop={false}
                showShadow={false}
                title="Calpal Rekap Mingguan"
              />
            </motion.div>

            <p className="mt-1 font-heading text-base font-extrabold leading-tight text-text-primary">
              6 / 7 Hari Patuh
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-neutral-10">
              Rata-rata 112g protein/hari
            </p>
          </div>

          {/* Story Footer Actions */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-border-divider/70">
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-[10px] font-bold text-neutral-10 border border-border-divider">
              <RotateCcw className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              <span>Putar</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-accent-green px-2 py-1 text-[10px] font-bold text-text-inverse">
              <Download className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              <span>Unduh</span>
            </span>
          </div>
        </div>

        {/* Right: Mini Kalender Arsip & Detail Harian */}
        <div className="sm:col-span-7 flex flex-col justify-between gap-3">
          <div className="rounded-2xl border border-border-divider bg-surface p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar
                  className="h-3.5 w-3.5 text-text-primary shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs font-extrabold text-neutral-10 truncate">
                  Arsip Oktober
                </span>
              </div>
              <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-[10px] font-extrabold text-text-primary tabular-nums">
                92% Patuh
              </span>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_HEADERS.map((d, idx) => (
                <span
                  key={`${d}-${idx}`}
                  className="text-[10px] font-bold text-text-muted"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* 2-Week Compact Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {ARCHIVE_DAYS.map((cell) => {
                if (cell.status === "selected") {
                  return (
                    <div
                      key={cell.day}
                      className="aspect-square rounded-lg bg-accent-orange text-text-inverse flex flex-col items-center justify-center text-[10px] font-extrabold tabular-nums"
                    >
                      <span>{cell.day}</span>
                    </div>
                  );
                }

                if (cell.status === "met") {
                  return (
                    <div
                      key={cell.day}
                      className="aspect-square rounded-lg bg-accent-green/15 text-text-primary flex flex-col items-center justify-center text-[10px] font-bold tabular-nums"
                    >
                      <span>{cell.day}</span>
                      <Check
                        className="h-2.5 w-2.5 stroke-[3]"
                        aria-hidden="true"
                      />
                    </div>
                  );
                }

                if (cell.status === "freeze") {
                  return (
                    <div
                      key={cell.day}
                      className="aspect-square rounded-lg bg-accent-yellow/55 text-neutral-10 flex flex-col items-center justify-center text-[10px] font-bold tabular-nums"
                    >
                      <span>{cell.day}</span>
                      <Snowflake className="h-2.5 w-2.5" aria-hidden="true" />
                    </div>
                  );
                }

                if (cell.status === "rest") {
                  return (
                    <div
                      key={cell.day}
                      className="aspect-square rounded-lg bg-accent-orange/15 text-accent-orange flex flex-col items-center justify-center text-[10px] font-bold tabular-nums"
                    >
                      <span>{cell.day}</span>
                      <Moon className="h-2.5 w-2.5" aria-hidden="true" />
                    </div>
                  );
                }

                return (
                  <div
                    key={cell.day}
                    className="aspect-square rounded-lg border border-border-divider/70 bg-surface text-text-muted flex items-center justify-center text-[10px] font-semibold tabular-nums"
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>

            {/* Compact Status Legend */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[10px] font-semibold text-text-muted">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent-green" />
                <span>Patuh</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent-yellow" />
                <span>Freeze</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent-orange" />
                <span>Jeda</span>
              </span>
            </div>
          </div>

          {/* Selected Date Meal Detail */}
          <div className="rounded-xl border border-border-divider bg-accent-yellow/30 px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-neutral-10 truncate">
                Kam, 24 Okt • 1.940 kcal
              </p>
              <p className="text-[10px] font-medium text-neutral-10/85 truncate">
                Sarapan, Makan Siang & Malam tercatat
              </p>
            </div>
            <CheckCircle2
              className="h-4 w-4 text-text-primary shrink-0"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
