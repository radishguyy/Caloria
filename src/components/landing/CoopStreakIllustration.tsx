"use client";

import { motion } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { Flame, Sparkles, MessageCircle } from "lucide-react";
import type { CharacterId } from "@/lib/character-assets/types";

interface CalpalWithPhoneProps {
  characterId: CharacterId;
  screenColor?: string;
  phoneColor?: string;
  expression?: "happy" | "eating" | "idle";
  flip?: boolean;
}

/**
 * Calpal yang sedang memegang smartphone dengan tampilan layar aplikasi Caloria
 */
function CalpalWithPhone({
  characterId,
  screenColor = "#5B8E55",
  phoneColor = "#1E293B",
  expression = "happy",
  flip = false,
}: CalpalWithPhoneProps) {
  return (
    <div className={`relative w-36 h-44 sm:w-44 sm:h-52 ${flip ? "-scale-x-100" : ""}`}>
      {/* Karakter Calpal */}
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
        animate={{ y: [0, -3, 0], rotate: flip ? [-8, -5, -8] : [8, 5, 8] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        className={`absolute bottom-4 ${
          flip ? "left-1 sm:left-3" : "right-1 sm:right-3"
        } z-20 w-11 h-18 sm:w-13 sm:h-22 rounded-[9px] p-1 shadow-lg border-2 border-white`}
        style={{ backgroundColor: phoneColor }}
      >
        {/* Layar HP */}
        <div className="w-full h-full rounded-[6px] bg-[#FAF8F5] p-1 flex flex-col justify-between overflow-hidden">
          {/* Status bar mini */}
          <div className="flex items-center justify-between px-0.5">
            <div className="w-2 h-0.5 rounded-full bg-slate-400" />
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
          </div>

          {/* Isi layar: grafik makanan & streak api */}
          <div className="space-y-0.5 my-auto text-center">
            <div
              className="mx-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shadow-2xs"
              style={{ backgroundColor: screenColor }}
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="text-[7px] font-extrabold tracking-tight text-slate-700 leading-none">
              7 HARI!
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#5B8E55] w-4/5 rounded-full" />
            </div>
          </div>

          {/* Home indicator */}
          <div className="w-3 h-0.5 mx-auto rounded-full bg-slate-300" />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Ilustrasi 2 Calpal sedang mabar mencatat nutrisi & menjaga streak bersama
 */
export function CoopStreakIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] aspect-[4/3] flex items-center justify-center select-none">
      {/* Background Glow */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#FCF8E3] via-[#5B8E55]/10 to-[#FF9233]/15 blur-xl" />
      <div className="absolute inset-8 rounded-full border-2 border-dashed border-[#1E293B]/10 -z-0" />

      {/* Floating Badge: Streak Co-op */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        className="absolute -top-3 sm:-top-5 z-30 inline-flex items-center gap-2 rounded-full border-2 border-[#1E293B]/10 bg-white px-4 py-1.5 shadow-[0_4px_0_rgba(30,41,59,0.08)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF9233] text-white shadow-2xs">
          <Flame className="h-4 w-4 fill-white" />
        </span>
        <div className="text-left leading-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E293B]/40">
            Co-op Streak
          </p>
          <p className="text-xs font-extrabold text-[#1E293B]">
            7 Hari Bareng Sahabat 🔥
          </p>
        </div>
      </motion.div>

      {/* Floating Chat Bubble: "Udah log makan siang?" */}
      <motion.div
        animate={{ y: [3, -3, 3] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 0.4 }}
        className="absolute bottom-2 sm:bottom-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-[#5B8E55] px-3.5 py-1 text-xs font-bold text-white shadow-[0_3px_0_#3f6b3a]"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>Senggol: &quot;Udah makan belum?&quot;</span>
      </motion.div>

      {/* Calpal 1 (Kiri - Flameling memegang HP) */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        className="relative z-10 -mr-6 sm:-mr-8"
      >
        <CalpalWithPhone
          characterId="flameling"
          screenColor="#FF9233"
          expression="happy"
        />
      </motion.div>

      {/* Sparkle Icon di Tengah Sambungan */}
      <motion.div
        animate={{ scale: [1, 1.25, 1], rotate: [0, 180, 360] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="relative z-20 -my-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#FCF8E3] text-[#FF9233] shadow-md"
      >
        <Sparkles className="h-5 w-5 fill-[#FF9233]" />
      </motion.div>

      {/* Calpal 2 (Kanan - Droplet memegang HP menghadap kiri) */}
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.2 }}
        className="relative z-10 -ml-6 sm:-ml-8"
      >
        <CalpalWithPhone
          characterId="droplet"
          screenColor="#5B8E55"
          expression="happy"
        />
      </motion.div>
    </div>
  );
}

