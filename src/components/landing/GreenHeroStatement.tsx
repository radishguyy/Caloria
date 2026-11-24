"use client";

import { motion } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Section Brand Hero Banner (1:1 Aspect Ratio Full Green)
 * Terinspirasi dari visual Duolingo "Learn anytime, anywhere" dengan elemen melayang:
 * Slogan maksimal 3 kata: "SEHAT LEBIH SERU!"
 * Background hijau Caloria, calpal melayang, dan icon-icon makanan & smartphone melayang ringan.
 */
export function GreenHeroStatement() {
  return (
    <section className="relative w-full bg-[#5B8E55] text-white overflow-hidden py-20 md:py-28 select-none">
      {/* Background Soft Circles / Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#FCF8E3]/10 blur-3xl pointer-events-none" />

      {/* Floating Foods & Chibi Icons (Tergelincir melayang ala Duolingo showcase) */}
      
      {/* 1. Makanan Apel (Kiri Atas) */}
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [-10, 5, -10] }}
        transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
        className="absolute top-10 left-[8%] md:left-[12%] text-3xl sm:text-5xl filter drop-shadow-lg pointer-events-none"
      >
        🍎
      </motion.div>

      {/* 2. Mini Calpal 1 (Flameling - Kiri Tengah) */}
      <motion.div
        animate={{ y: [6, -10, 6], rotate: [8, -4, 8] }}
        transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.3 }}
        className="absolute top-1/3 left-[4%] md:left-[8%] w-18 h-22 sm:w-24 sm:h-30 drop-shadow-xl pointer-events-none"
      >
        <AvatarRenderer
          characterId="flameling"
          animationState="happy"
          showRoomBackdrop={false}
          showShadow={false}
        />
      </motion.div>

      {/* 3. Mini Smartphone Layar Nutrisi (Kiri Bawah) */}
      <motion.div
        animate={{ y: [-6, 6, -6], rotate: [-15, -8, -15] }}
        transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-12 left-[10%] sm:left-[16%] w-14 h-24 sm:w-18 sm:h-30 rounded-2xl border-3 border-white/90 bg-[#1E293B] p-1.5 shadow-2xl pointer-events-none hidden sm:block"
      >
        <div className="w-full h-full rounded-xl bg-white flex flex-col justify-center items-center p-1 space-y-1">
          <div className="w-5 h-5 rounded-full bg-[#5B8E55] flex items-center justify-center text-white text-[10px] font-bold">
            🔥
          </div>
          <div className="w-8 h-1.5 bg-slate-200 rounded-full" />
          <div className="w-6 h-1 bg-[#FF9233] rounded-full" />
        </div>
      </motion.div>

      {/* 4. Makanan Alpukat & Wortel (Kanan Atas) */}
      <motion.div
        animate={{ y: [8, -8, 8], rotate: [12, -6, 12] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.2 }}
        className="absolute top-12 right-[8%] md:right-[14%] text-3xl sm:text-5xl filter drop-shadow-lg pointer-events-none"
      >
        🥑
      </motion.div>

      {/* 5. Mini Calpal 2 (Droplet / Sunny - Kanan Tengah) */}
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [-12, 6, -12] }}
        transition={{ repeat: Infinity, duration: 4.0, ease: "easeInOut", delay: 0.4 }}
        className="absolute top-1/3 right-[4%] md:right-[8%] w-18 h-22 sm:w-24 sm:h-30 drop-shadow-xl pointer-events-none"
      >
        <AvatarRenderer
          characterId="droplet"
          animationState="happy"
          showRoomBackdrop={false}
          showShadow={false}
        />
      </motion.div>

      {/* 6. Mini Smartphone Kanan Bawah */}
      <motion.div
        animate={{ y: [7, -7, 7], rotate: [18, 10, 18] }}
        transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut", delay: 0.6 }}
        className="absolute bottom-10 right-[10%] sm:right-[15%] w-14 h-24 sm:w-18 sm:h-30 rounded-2xl border-3 border-white/90 bg-[#1E293B] p-1.5 shadow-2xl pointer-events-none hidden sm:block"
      >
        <div className="w-full h-full rounded-xl bg-[#FAF8F5] flex flex-col justify-center items-center p-1 space-y-1">
          <span className="text-sm">🥗</span>
          <div className="text-[7px] font-extrabold text-[#5B8E55] leading-none">TARGET PAS</div>
          <div className="w-8 h-1 bg-[#5B8E55] rounded-full" />
        </div>
      </motion.div>

      {/* ── Center Content: Rasio 1:1 Clean Box Ala Duolingo ── */}
      <div className="container mx-auto px-6 max-w-4xl flex items-center justify-center">
        <div className="relative aspect-square max-w-[440px] sm:max-w-[480px] w-full rounded-[40px] sm:rounded-[52px] border-4 border-white/20 bg-white/10 backdrop-blur-md p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl">
          {/* Calpal Center Melayang */}
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
            className="w-28 h-36 sm:w-36 sm:h-44 drop-shadow-2xl"
          >
            <AvatarRenderer
              characterId="sunny"
              animationState="happy"
              equipped={{
                head: "head-golden-crown",
                held: "acc-mini-burger",
              }}
              showRoomBackdrop={false}
              showShadow={false}
            />
          </motion.div>

          {/* Slogan Max 3 Kata: "SEHAT LEBIH SERU!" */}
          <div className="mt-4 space-y-2">
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase drop-shadow-sm leading-tight">
              Sehat Lebih Seru!
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium max-w-xs mx-auto">
              Diet tanpa beban, capai target tubuh bersama Calpal setiap hari.
            </p>
          </div>

          {/* Tombol Aksi Bersih Taktil */}
          <div className="mt-6">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-extrabold text-[#5B8E55] shadow-[0_5px_0_#3f6b3a] transition-all hover:bg-[#FAF8F5] active:translate-y-[2px] active:shadow-none cursor-pointer"
            >
              <span>Mulai Sekarang</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

