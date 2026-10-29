"use client";

import { motion } from "framer-motion";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import {
  CALPAL_SHOWCASE_VARIANTS,
  type CalpalVariant,
} from "@/lib/landing/calpal-variants";

interface MarqueeRowProps {
  items: CalpalVariant[];
  direction?: "left" | "right";
  speedSeconds?: number;
}

function MarqueeRow({
  items,
  direction = "left",
  speedSeconds = 35,
}: MarqueeRowProps) {
  // Duplikasi item 2x untuk looping tak terbatas (infinite seamless loop)
  const duplicatedItems = [...items, ...items];

  const animateProps =
    direction === "left"
      ? { x: ["0%", "-50%"] }
      : { x: ["-50%", "0%"] };

  return (
    <div className="relative w-full overflow-hidden flex py-2 select-none">
      <motion.div
        aria-hidden="true"
        animate={animateProps}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: speedSeconds,
        }}
        className="flex shrink-0 gap-4 pr-4 will-change-transform"
      >
        {duplicatedItems.map((v, idx) => (
          <div
            key={`${v.key}-${idx}`}
            className="group shrink-0 w-32 sm:w-36 flex flex-col items-center rounded-2xl border-2 border-[#1E293B]/10 bg-white p-2.5 shadow-2xs transition-all duration-200 hover:shadow-md hover:border-[#5B8E55]/40 hover:-translate-y-1"
          >
            <div className="aspect-[4/5] w-full rounded-xl bg-[#FAF8F5] p-1.5 flex items-center justify-center">
              <AvatarRenderer
                characterId={v.characterId}
                colors={v.colors}
                animationState={v.animationState}
                equipped={v.equipped}
                showRoomBackdrop={false}
                title={`Calpal ${v.label}`}
              />
            </div>
            <span className="mt-2 truncate text-[11px] sm:text-xs font-bold text-[#1E293B]/75 group-hover:text-[#5B8E55] transition-colors">
              {v.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Showcase Calpal minimalis: Dua baris slider otomatis yang bergerak dengan arah berlawanan.
 * Dilengkapi efek gradient mask lembut di sisi kiri dan kanan.
 */
export function CalpalShowcase() {
  // Bagi varian menjadi dua baris seimbang
  const total = CALPAL_SHOWCASE_VARIANTS.length;
  const half = Math.ceil(total / 2);
  const rowTop = CALPAL_SHOWCASE_VARIANTS.slice(0, half);
  const rowBottom = CALPAL_SHOWCASE_VARIANTS.slice(half);

  return (
    <div className="relative w-full space-y-4">
      {/* Efek Fade / Gradient Mask Kiri & Kanan */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 sm:w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 sm:w-24 bg-gradient-to-l from-white to-transparent" />

      {/* Baris 1: Geser ke Kiri */}
      <MarqueeRow items={rowTop} direction="left" speedSeconds={40} />

      {/* Baris 2: Geser ke Kanan */}
      <MarqueeRow items={rowBottom} direction="right" speedSeconds={42} />

      {/* Tagline Ringkas di Bawah Slider */}
      <p className="text-center text-xs sm:text-sm font-medium text-[#1E293B]/50 pt-2">
        12 karakter unik · 32 aksesori · ribuan kombinasi kustomisasi di Wardrobe!
      </p>
    </div>
  );
}
