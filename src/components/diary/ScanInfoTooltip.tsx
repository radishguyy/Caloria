"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScanInfoTooltipProps {
  label: string;
  content: string;
  align?: "left" | "right" | "center";
  tone?: "dark" | "light";
  buttonText?: string;
  className?: string;
}

/**
 * Tap- and keyboard-friendly info popover so secondary details stay tucked away
 * while keeping primary AR Scanner and Review screens bold, short, and legible.
 */
export function ScanInfoTooltip({
  label,
  content,
  align = "right",
  tone = "light",
  buttonText,
  className,
}: ScanInfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex items-center", className)}
    >
      <button
        type="button"
        aria-label={buttonText ? `${buttonText}: ${label}` : label}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "min-h-11 min-w-11 px-2.5 rounded-navigation inline-flex items-center justify-center gap-1.5 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none",
          tone === "dark"
            ? "bg-white/15 hover:bg-white/25 text-white focus-visible:ring-accent-green-light"
            : "border border-border-default bg-surface hover:bg-accent-green-light/40 text-text-primary focus-visible:ring-accent-green",
        )}
      >
        <Info className="h-4 w-4 shrink-0" />
        {buttonText && <span>{buttonText}</span>}
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={label}
          className={cn(
            "absolute top-full mt-2 z-40 w-64 sm:w-72 rounded-2xl p-3.5 text-sm font-semibold leading-relaxed shadow-lg",
            tone === "dark"
              ? "bg-[#182920] text-white border border-white/15"
              : "bg-surface text-neutral-10 border border-border-divider",
            align === "right" && "right-0",
            align === "left" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2",
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}