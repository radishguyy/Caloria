"use client";

import { motion } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { Sparkles, ScanLine, FileText, CheckCircle2 } from "lucide-react";

/**
 * Ilustrasi AI Caloria:
 * Menampilkan Calpal memindai label makanan dengan laser AI Vision & menghasilkan kartu recap Wrapped otomatis
 */
export function AiFeaturesIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] aspect-[4/3] flex items-center justify-center select-none">
      {/* Background Soft Glow */}
      <div className="absolute inset-4 rounded-[36px] bg-gradient-to-tr from-[#5B8E55]/10 via-[#FCF8E3] to-[#38BDF8]/15 border-2 border-[#1E293B]/10 shadow-sm" />
      <div className="absolute -top-3 -left-3 w-20 h-20 rounded-full bg-[#5B8E55]/15 blur-lg pointer-events-none" />
      <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-full bg-[#38BDF8]/15 blur-lg pointer-events-none" />

      {/* ── Badge 1 (Kiri Atas): AI Vision Scan Label ── */}
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 rounded-2xl border-2 border-[#1E293B]/10 bg-white px-3 py-1.5 shadow-[0_3px_0_rgba(30,41,59,0.06)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[#5B8E55] text-white">
          <ScanLine className="h-3.5 w-3.5" />
        </span>
        <div className="leading-tight">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#5B8E55]">
            AI Vision Scanner
          </p>
          <p className="text-xs font-extrabold text-[#1E293B]">Scan Label Instan</p>
        </div>
      </motion.div>

      {/* ── Badge 2 (Kanan Bawah): AI Weekly Recap Story ── */}
      <motion.div
        animate={{ y: [3, -3, 3] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.3 }}
        className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-2 rounded-2xl border-2 border-[#1E293B]/10 bg-white px-3 py-1.5 shadow-[0_3px_0_rgba(30,41,59,0.06)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[#38BDF8] text-white">
          <FileText className="h-3.5 w-3.5" />
        </span>
        <div className="leading-tight">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#0284C7]">
            Caloria Wrapped
          </p>
          <p className="text-xs font-extrabold text-[#1E293B]">Recap AI Mingguan</p>
        </div>
      </motion.div>

      {/* ── Komposisi Visual Calpal & Mockup Scanner ── */}
      <div className="relative z-10 flex items-center justify-center gap-4 sm:gap-6 w-full px-6">
        {/* Calpal Peneliti AI (Nyx memakai kacamata & kupluk) */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
          className="relative flex flex-col items-center shrink-0"
        >
          <div className="w-28 h-36 sm:w-34 sm:h-44 drop-shadow-md">
            <AvatarRenderer
              characterId="nyx"
              animationState="happy"
              equipped={{
                head: "acc-beanie",
                glasses: "glasses-cool-shades",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Calpal AI Expert"
            />
          </div>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white border border-[#1E293B]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#5B8E55] shadow-2xs">
            <Sparkles className="h-3 w-3 fill-[#5B8E55]" /> Gemini AI
          </span>
        </motion.div>

        {/* Card Mockup: Label Makanan + Sinar Laser Scan */}
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.2 }}
          className="relative w-36 sm:w-44 rounded-2xl border-2 border-[#1E293B]/15 bg-white p-3 shadow-md"
        >
          {/* Garis Sinar Scan Animasi */}
          <motion.div
            animate={{ top: ["10%", "85%", "10%"] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#5B8E55] to-transparent shadow-[0_0_8px_#5B8E55] z-10"
          />

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between border-b pb-1 border-[#1E293B]/10">
              <span className="text-[10px] font-bold text-[#1E293B]/70">Informasi Nilai Gizi</span>
              <CheckCircle2 className="h-3 w-3 text-[#5B8E55]" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-[#1E293B]/60">Energi Total</span>
                <span className="text-[#FF9233]">240 kkal</span>
              </div>
              <div className="flex justify-between text-[9px] text-[#1E293B]/60 font-medium">
                <span>Protein</span>
                <span className="font-bold text-[#5B8E55]">18 g</span>
              </div>
              <div className="flex justify-between text-[9px] text-[#1E293B]/60 font-medium">
                <span>Karbohidrat</span>
                <span className="font-bold text-[#1E293B]">26 g</span>
              </div>
              <div className="flex justify-between text-[9px] text-[#1E293B]/60 font-medium">
                <span>Lemak</span>
                <span className="font-bold text-[#1E293B]">6 g</span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-dashed border-[#1E293B]/10 text-center">
              <span className="text-[9px] font-bold text-[#5B8E55] bg-[#5B8E55]/10 px-2 py-0.5 rounded-full inline-block">
                ✓ Otomatis Tersimpan
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

