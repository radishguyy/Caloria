"use client";

import React from "react";
import {
  AvatarRenderer,
  AvatarRendererProps,
  AvatarSize,
} from "./avatar-renderer";
import { ACCESSORY_SVG_LAYERS } from "@/lib/character-assets/accessory-layers";
import { cn } from "@/lib/utils";

export type CharacterSvgProps = AvatarRendererProps;

/**
 * Backward-compatible wrapper around AvatarRenderer.
 */
export function CharacterSvg(props: CharacterSvgProps) {
  return <AvatarRenderer {...props} />;
}

export { AvatarRenderer };
export type { AvatarSize };

/**
 * Renders a standalone SVG thumbnail for an accessory or cosmetic item.
 */
export function AccessorySvgPreview({
  itemId,
  className,
}: {
  itemId: string;
  className?: string;
}) {
  const layer = ACCESSORY_SVG_LAYERS[itemId];

  if (layer) {
    const combined = layer.backMarkup
      ? `${layer.backMarkup}\n${layer.frontMarkup}`
      : layer.frontMarkup;
    return (
      <svg
        viewBox={layer.previewViewBox}
        className={cn("w-14 h-14 select-none overflow-visible", className)}
        role="img"
        aria-label={itemId}
      >
        <g dangerouslySetInnerHTML={{ __html: combined }} />
      </svg>
    );
  }

  // Fallback SVG icons for "*-none", "skin-*", and "room-*" slots
  if (itemId.endsWith("-none") || itemId === "skin-default" || itemId === "room-default") {
    return (
      <svg
        viewBox="0 0 64 64"
        className={cn("w-12 h-12 select-none", className)}
        aria-label={itemId}
      >
        <circle
          cx="32"
          cy="32"
          r="22"
          fill="#F1F5F9"
          stroke="#475569"
          strokeWidth="3.2"
          strokeDasharray="5 4"
        />
        <path
          d="M 23 23 L 41 41 M 41 23 L 23 41"
          stroke="#64748B"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("w-12 h-12 select-none", className)}
      aria-label={itemId}
    >
      <circle cx="32" cy="32" r="22" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2.5" />
      <text
        x="32"
        y="36"
        fontSize="18"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ✨
      </text>
    </svg>
  );
}
