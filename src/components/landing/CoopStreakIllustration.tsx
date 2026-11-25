"use client";

import { motion } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { Flame, ShieldMinus, MessageCircle } from "lucide-react";
import type { CharacterId } from "@/lib/character-assets/types";

interface CalpalWithPhoneProps {
  characterId: CharacterId;
  accentBgClass?: string;
  expression?: "happy" | "eating" | "idle";
  flip?: boolean;
}

function CalpalWithPhone({
  characterId,
  accentBgClass = "bg-accent-green",
  expression = "happy",
  flip = false,
}: CalpalWithPhoneProps) {
  return (
    <div
      className={`relative w-32 h-40 sm:w-40 sm:h-48 ${
        flip ? "-scale-x-100" : ""
      }`}
    >
      <div className="w-full h-full">
        <AvatarRenderer
          characterId={characterId}
          animationState={expression}
          showRoomBackdrop={false}
          showShadow={false}
        />
      </div>

      {/* Handphone di tangan Calpal */}
      <motion.div
        animate={{ y: [0, -3, 0], rotate: flip ? [-7, -4, -7] : [7, 4, 7] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        className={`absolute bottom-3 ${
          flip ? "left-1 sm:left-3" : "right-1 sm:right-3"
        } z-20 w-10 h-16 sm:w-12 sm:h-20 rounded-xl p-1 bg-neutral-10 border border-border-divider`}
      >
        <div className="w-full h-full rounded-lg bg-surface p-1 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between px-0.5">
            <div className="w-2 h-0.5 rounded-full bg-border-divider" />
            <div className="w-1 h-1 rounded-full bg-accent-green" />
          </div>

          <div className="space-y-1 my-auto text-center">
            <div
              className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center text-text-inverse ${accentBgClass}`}
            >
              <Flame className="w-3 h-3" aria-hidden="true" />
            </div>
            <div className="text-[7px] font-extrabold tracking-tight text-neutral-10 leading-none">
              7 HARI
            </div>
            <div className="w-full h-1 bg-surface-subtle rounded-full overflow-hidden">
              <div className="h-full bg-accent-green w-4/5 rounded-full" />
            </div>
          </div>

          <div className="w-3 h-0.5 mx-auto rounded-full bg-border-divider" />
        </div>
      </motion.div>
    </div>
  );
}

export function CoopStreakIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] rounded-2xl border border-border-divider bg-surface-subtle px-4 py-6 sm:px-6 sm:py-7 flex flex-col items-center justify-between gap-4 select-none">
      {/* Top Status */}
      <div className="inline-flex items-center gap-2 rounded-xl border border-border-divider bg-surface px-3.5 py-2">
        <Flame
          className="h-4 w-4 text-accent-orange shrink-0"
          aria-hidden="true"
        />
        <span className="text-xs font-extrabold text-neutral-10">
          Streak Co-op 7 Hari
        </span>
      </div>

      {/* Duo Calpal */}
      <div className="relative flex items-center justify-center w-full">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
          className="relative z-10 -mr-4 sm:-mr-6"
        >
          <CalpalWithPhone
            characterId="flameling"
            accentBgClass="bg-accent-orange"
            expression="happy"
          />
        </motion.div>

        {/* Power-Up Shield */}
        <div className="relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-divider bg-surface text-text-primary">
          <ShieldMinus className="h-5 w-5" aria-hidden="true" />
        </div>

        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{
            repeat: Infinity,
            duration: 3.8,
            ease: "easeInOut",
            delay: 0.2,
          }}
          className="relative z-10 -ml-4 sm:-ml-6"
        >
          <CalpalWithPhone
            characterId="droplet"
            accentBgClass="bg-accent-green"
            expression="happy"
          />
        </motion.div>
      </div>

      {/* Senggol Teman Bubble */}
      <div className="inline-flex items-center gap-1.5 rounded-xl bg-accent-green px-3.5 py-1.5 text-xs font-bold text-text-inverse">
        <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Senggol: Sudah catat makan?</span>
      </div>
    </div>
  );
}
