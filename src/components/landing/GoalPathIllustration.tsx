"use client";

import { motion } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { Dumbbell, Sparkles, Scale, Check } from "lucide-react";

/**
 * Ilustrasi interaktif untuk Section 3 (Bulking, Diet, Maintenance):
 * Menampilkan trio Calpal yang merepresentasikan 3 tujuan nutrisi dengan visual yang kaya,
 * kartu mini target, dan ornamen yang serasi dengan desain profile/landing page.
 */
export function GoalPathIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] aspect-[4/3] flex items-center justify-center select-none">
      {/* Background Soft Circles */}
      <div className="absolute inset-4 rounded-[36px] bg-gradient-to-br from-[#FCF8E3] via-[#FAF8F5] to-[#5B8E55]/10 border-2 border-[#1E293B]/10 shadow-sm" />
      <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-[#FF9233]/15 blur-lg pointer-events-none" />
      <div className="absolute -bottom-3 -left-3 w-24 h-24 rounded-full bg-[#5B8E55]/15 blur-lg pointer-events-none" />

      {/* ── Badge Kiri Atas: Bulking High-Protein ── */}
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 rounded-2xl border-2 border-[#1E293B]/10 bg-white px-3 py-1.5 shadow-[0_3px_0_rgba(30,41,59,0.06)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[#FF9233] text-white">
          <Dumbbell className="h-3.5 w-3.5" />
        </span>
        <div className="leading-tight">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#FF9233]">
            Bulking
          </p>
          <p className="text-xs font-extrabold text-[#1E293B]">+350 kkal / hari</p>
        </div>
      </motion.div>

      {/* ── Badge Kanan Bawah: Defisit Terukur ── */}
      <motion.div
        animate={{ y: [3, -3, 3] }}
        transition={{ repeat: Infinity, duration: 3.6, ease: "easeInOut", delay: 0.3 }}
        className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-2 rounded-2xl border-2 border-[#1E293B]/10 bg-white px-3 py-1.5 shadow-[0_3px_0_rgba(30,41,59,0.06)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[#5B8E55] text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <div className="leading-tight">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#5B8E55]">
            Defisit Sehat
          </p>
          <p className="text-xs font-extrabold text-[#1E293B]">Depkes 80–120%</p>
        </div>
      </motion.div>

      {/* ── Trio Calpal ── */}
      <div className="relative z-10 flex items-end justify-center gap-1 sm:gap-3 w-full px-4 pt-6">
        {/* Calpal 1 (Kiri): Kuma (Bulking / Makan Nasi Mangkok) */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
          className="flex flex-col items-center"
        >
          <div className="w-24 h-30 sm:w-28 sm:h-36 drop-shadow-sm">
            <AvatarRenderer
              characterId="kuma"
              equipped={{
                head: "acc-beanie",
                held: "acc-rice-bowl",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Kuma Bulking"
            />
          </div>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white border border-[#1E293B]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#FF9233] shadow-2xs">
            <Dumbbell className="h-2.5 w-2.5" /> Surplus
          </span>
        </motion.div>

        {/* Calpal 2 (Tengah - Utama): Sunny / Flameling Sport (Stabil / Maintenance) */}
        <motion.div
          animate={{ y: [-4, 2, -4] }}
          transition={{ repeat: Infinity, duration: 3.0, ease: "easeInOut", delay: 0.2 }}
          className="flex flex-col items-center -mt-6 sm:-mt-8 z-10"
        >
          <div className="w-28 h-36 sm:w-34 sm:h-44 drop-shadow-md">
            <AvatarRenderer
              characterId="sunny"
              animationState="happy"
              equipped={{
                head: "head-golden-crown",
                held: "acc-apple",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Sunny Maintenance"
            />
          </div>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#5B8E55] px-3 py-0.5 text-[10px] sm:text-xs font-bold text-white shadow-2xs">
            <Scale className="h-3 w-3" /> Stabil & Bugar
          </span>
        </motion.div>

        {/* Calpal 3 (Kanan): Bloomie / Ziggy (Cutting / Diet Segar Minum Air & Wortel) */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="w-24 h-30 sm:w-28 sm:h-36 drop-shadow-sm">
            <AvatarRenderer
              characterId="bloomie"
              animationState="happy"
              equipped={{
                head: "acc-leafy-headband",
                held: "acc-water-bottle",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Bloomie Diet Sehat"
            />
          </div>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white border border-[#1E293B]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#0284C7] shadow-2xs">
            <Sparkles className="h-2.5 w-2.5" /> Defisit
          </span>
        </motion.div>
      </div>
    </div>
  );
}

