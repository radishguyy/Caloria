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
  const duplicatedItems = [...items, ...items];

  const animateProps =
    direction === "left" ? { x: ["0%", "-50%"] } : { x: ["-50%", "0%"] };

  return (
    <div className="relative w-full max-w-full overflow-hidden flex py-1.5 select-none">
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
            className="group shrink-0 w-32 sm:w-36 flex flex-col items-center rounded-2xl border border-border-divider bg-surface p-2.5 transition-colors duration-200 hover:border-accent-green"
          >
            <div className="aspect-[4/5] w-full rounded-xl bg-surface-subtle p-1.5 flex items-center justify-center">
              <AvatarRenderer
                characterId={v.characterId}
                colors={v.colors}
                animationState={v.animationState}
                equipped={v.equipped}
                showRoomBackdrop={false}
                showShadow={false}
                title={`Calpal ${v.label}`}
              />
            </div>
            <span className="mt-2 max-w-full truncate text-[11px] sm:text-xs font-bold text-neutral-10 group-hover:text-text-primary transition-colors">
              {v.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function CalpalShowcase() {
  const total = CALPAL_SHOWCASE_VARIANTS.length;
  const half = Math.ceil(total / 2);
  const rowTop = CALPAL_SHOWCASE_VARIANTS.slice(0, half);
  const rowBottom = CALPAL_SHOWCASE_VARIANTS.slice(half);

  return (
    <div className="relative w-full max-w-full overflow-hidden space-y-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 sm:w-20 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 sm:w-20 bg-gradient-to-l from-canvas to-transparent" />

      <MarqueeRow items={rowTop} direction="left" speedSeconds={40} />
      <MarqueeRow items={rowBottom} direction="right" speedSeconds={42} />
    </div>
  );
}
