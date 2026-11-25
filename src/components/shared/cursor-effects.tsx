"use client";

import { useEffect, useRef, useState } from "react";

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  rotate: number;
}

const BURST_COLORS = ["#1F1F1F", "#F6241E", "#69C91E"];
const BURST_VECTORS = [
  { dx: -16, dy: -18, rotate: -25 },
  { dx: 16, dy: -16, rotate: 28 },
  { dx: -14, dy: 14, rotate: -140 },
  { dx: 15, dy: 15, rotate: 135 },
];

export function CursorEffects() {
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const baseId = ++idRef.current * 10;
      const batch: BurstParticle[] = BURST_VECTORS.map((vec, idx) => ({
        id: baseId + idx,
        x: e.clientX,
        y: e.clientY,
        dx: vec.dx,
        dy: vec.dy,
        color: BURST_COLORS[idx % BURST_COLORS.length],
        rotate: vec.rotate,
      }));

      setParticles((prev) => [...prev.slice(-16), ...batch]);

      window.setTimeout(() => {
        const batchIds = new Set(batch.map((b) => b.id));
        setParticles((prev) => prev.filter((p) => !batchIds.has(p.id)));
      }, 380);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="cursor-burst-dot"
          style={
            {
              left: `${p.x}px`,
              top: `${p.y}px`,
              backgroundColor: p.color,
              "--burst-dx": `${p.dx}px`,
              "--burst-dy": `${p.dy}px`,
              "--burst-rot": `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
