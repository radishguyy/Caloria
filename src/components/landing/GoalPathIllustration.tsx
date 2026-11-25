"use client";

import { motion } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { Dumbbell, Scale, TrendingDown } from "lucide-react";

export function GoalPathIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] rounded-2xl border border-border-divider bg-surface-subtle p-5 sm:p-6 flex items-end justify-center select-none">
      <div className="flex items-end justify-center gap-2 sm:gap-4 w-full pt-4">
        {/* Turun Berat Badan */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{
            repeat: Infinity,
            duration: 3.6,
            ease: "easeInOut",
            delay: 0.3,
          }}
          className="flex flex-col items-center min-w-0"
        >
          <div className="w-22 h-28 sm:w-26 sm:h-32">
            <AvatarRenderer
              characterId="bloomie"
              animationState="happy"
              equipped={{
                head: "acc-leafy-headband",
                held: "acc-water-bottle",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Calpal Turun Berat Badan"
            />
          </div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-xl border border-border-divider bg-surface px-2.5 py-1 text-[11px] font-bold text-text-primary">
            <TrendingDown className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Defisit</span>
          </span>
        </motion.div>

        {/* Jaga Berat Badan (Center) */}
        <motion.div
          animate={{ y: [-3, 2, -3] }}
          transition={{
            repeat: Infinity,
            duration: 3.0,
            ease: "easeInOut",
            delay: 0.1,
          }}
          className="flex flex-col items-center -mt-4 sm:-mt-6 min-w-0"
        >
          <div className="w-26 h-34 sm:w-32 sm:h-40">
            <AvatarRenderer
              characterId="sunny"
              animationState="happy"
              equipped={{
                head: "head-golden-crown",
                held: "acc-apple",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Calpal Jaga Berat Badan"
            />
          </div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-xl bg-accent-green px-3 py-1 text-[11px] font-bold text-text-inverse">
            <Scale className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Seimbang</span>
          </span>
        </motion.div>

        {/* Naik Massa Otot */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
          className="flex flex-col items-center min-w-0"
        >
          <div className="w-22 h-28 sm:w-26 sm:h-32">
            <AvatarRenderer
              characterId="kuma"
              equipped={{
                head: "acc-beanie",
                held: "acc-rice-bowl",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Calpal Naik Massa Otot"
            />
          </div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-xl border border-border-divider bg-surface px-2.5 py-1 text-[11px] font-bold text-accent-orange">
            <Dumbbell className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Surplus</span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}
