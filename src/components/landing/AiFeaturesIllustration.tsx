"use client";

import { motion } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { CheckCircle2, MessageSquare, BarChart3 } from "lucide-react";

export function AiFeaturesIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] rounded-2xl border border-border-divider bg-surface-subtle p-4 sm:p-6 select-none">
      <div className="grid grid-cols-12 items-center gap-3 sm:gap-4">
        {/* Calpal & Konsultasi Gizi bubble */}
        <div className="col-span-5 min-w-0 flex flex-col items-center space-y-2">
          <div className="w-full rounded-xl border border-border-divider bg-surface px-2.5 py-2 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-primary">
              <MessageSquare className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">Konsultasi Gizi</span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium text-neutral-10 leading-snug">
              Asupan proteinmu hari ini sudah optimal.
            </p>
          </div>

          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
            className="w-22 h-28 sm:w-28 sm:h-36"
          >
            <AvatarRenderer
              characterId="nyx"
              animationState="happy"
              equipped={{
                head: "acc-beanie",
                glasses: "glasses-cool-shades",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Asisten Gizi Calpal"
            />
          </motion.div>
        </div>

        {/* Scan Label Gizi & Rekap Mingguan */}
        <div className="col-span-7 min-w-0 space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-border-divider bg-surface p-3 sm:p-3.5">
            <motion.div
              animate={{ top: ["20%", "78%", "20%"] }}
              transition={{
                repeat: Infinity,
                duration: 2.6,
                ease: "easeInOut",
              }}
              className="absolute left-2 right-2 h-1.5 rounded-full bg-accent-green/20 z-0 pointer-events-none"
            />

            <div className="relative z-10 space-y-2 text-left">
              <div className="flex items-center justify-between border-b border-border-divider pb-1.5">
                <span className="text-[11px] font-bold text-neutral-10 truncate">
                  Informasi Nilai Gizi
                </span>
                <CheckCircle2
                  className="h-3.5 w-3.5 text-text-primary shrink-0"
                  aria-hidden="true"
                />
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span className="text-neutral-10">Energi</span>
                  <span className="text-accent-orange tabular-nums">
                    240 kcal
                  </span>
                </div>
                <div className="flex justify-between text-text-muted font-medium">
                  <span>Protein</span>
                  <span className="font-bold text-text-primary tabular-nums">
                    18 g
                  </span>
                </div>
                <div className="flex justify-between text-text-muted font-medium">
                  <span>Karbo</span>
                  <span className="font-bold text-neutral-10 tabular-nums">
                    26 g
                  </span>
                </div>
                <div className="flex justify-between text-text-muted font-medium">
                  <span>Lemak</span>
                  <span className="font-bold text-neutral-10 tabular-nums">
                    6 g
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border-divider bg-surface px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <BarChart3
                className="h-4 w-4 text-text-primary shrink-0"
                aria-hidden="true"
              />
              <span className="text-[11px] font-bold text-neutral-10 truncate">
                Rekap Mingguan
              </span>
            </div>
            <span className="text-[11px] font-extrabold text-text-primary tabular-nums shrink-0">
              92%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
