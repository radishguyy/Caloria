"use client";

import React, { useId } from "react";
import {
  CHARACTER_VIEWBOX,
  CharacterColorPalette,
  CharacterId,
} from "@/lib/character-assets/types";
import {
  getAccessoryDefinition,
  getCharacterDefinition,
  isAccessoryCompatible,
  resolveAccessoryTransform,
} from "@/lib/character-assets/catalog";
import {
  ANIMATION_STATE_FACE_OVERLAYS,
  CHARACTER_SVG_LAYERS,
} from "@/lib/character-assets/character-layers";
import { ACCESSORY_SVG_LAYERS } from "@/lib/character-assets/accessory-layers";
import { PetAnimationState } from "@/types";
import { cn } from "@/lib/utils";

export interface CharacterSvgProps {
  characterId: CharacterId | string;
  colors?: Partial<CharacterColorPalette>;
  earsVariant?: CharacterId;
  tailVariant?: CharacterId;
  faceVariant?: CharacterId;
  animationState?: PetAnimationState;
  equipped?: {
    head?: string | null;
    glasses?: string | null;
    body?: string | null;
    held?: string | null;
    skin?: string | null;
    room?: string | null;
  };
  showShadow?: boolean;
  showRoomBackdrop?: boolean;
  className?: string;
}

export function CharacterSvg({
  characterId,
  colors,
  earsVariant,
  tailVariant,
  faceVariant,
  animationState = "idle",
  equipped,
  showShadow = true,
  showRoomBackdrop = true,
  className,
}: CharacterSvgProps) {
  const instanceId = useId().replace(/:/g, "");
  const character = getCharacterDefinition(characterId);
  const charId = character.id;

  const mergedColors: CharacterColorPalette = {
    ...character.defaultColors,
    ...Object.fromEntries(
      Object.entries(colors || {}).filter(([, v]) => Boolean(v))
    ),
  };

  const activeEarsId: CharacterId = earsVariant || charId;
  const activeTailId: CharacterId = tailVariant || charId;
  const activeFaceId: CharacterId = faceVariant || charId;

  const earsMarkup =
    (CHARACTER_SVG_LAYERS[activeEarsId] || CHARACTER_SVG_LAYERS[charId]).ears;
  const tailMarkup =
    (CHARACTER_SVG_LAYERS[activeTailId] || CHARACTER_SVG_LAYERS[charId]).tail;
  const bodyMarkup = CHARACTER_SVG_LAYERS[charId].body;
  const headMarkup = CHARACTER_SVG_LAYERS[charId].head;

  const faceMarkup =
    animationState === "sleeping" ||
    animationState === "eating" ||
    animationState === "happy"
      ? ANIMATION_STATE_FACE_OVERLAYS[animationState]
      : (CHARACTER_SVG_LAYERS[activeFaceId] || CHARACTER_SVG_LAYERS[charId]).face;

  // Resolve equipped accessory definitions & transforms
  const headAcc = getAccessoryDefinition(equipped?.head);
  const glassesAcc = getAccessoryDefinition(equipped?.glasses);
  const bodyAcc = getAccessoryDefinition(equipped?.body);
  const heldAcc = getAccessoryDefinition(equipped?.held);

  const headAccData =
    headAcc && isAccessoryCompatible(charId, headAcc.id)
      ? ACCESSORY_SVG_LAYERS[headAcc.id]
      : undefined;
  const glassesAccData =
    glassesAcc && isAccessoryCompatible(charId, glassesAcc.id)
      ? ACCESSORY_SVG_LAYERS[glassesAcc.id]
      : undefined;
  const bodyAccData =
    bodyAcc && isAccessoryCompatible(charId, bodyAcc.id)
      ? ACCESSORY_SVG_LAYERS[bodyAcc.id]
      : undefined;
  const heldAccData =
    heldAcc && isAccessoryCompatible(charId, heldAcc.id)
      ? ACCESSORY_SVG_LAYERS[heldAcc.id]
      : undefined;

  const headTransform = headAcc ? resolveAccessoryTransform(charId, headAcc) : "";
  const glassesTransform = glassesAcc
    ? resolveAccessoryTransform(charId, glassesAcc)
    : "";
  const bodyTransform = bodyAcc ? resolveAccessoryTransform(charId, bodyAcc) : "";
  const heldTransform = heldAcc ? resolveAccessoryTransform(charId, heldAcc) : "";

  const cssVariables = {
    "--char-primary": mergedColors.primary,
    "--char-secondary": mergedColors.secondary,
    "--char-belly": mergedColors.belly,
    "--char-inner-ear": mergedColors.innerEar,
    "--char-blush": mergedColors.blush,
    "--char-eye": mergedColors.eye,
    "--char-nose": mergedColors.nose,
    "--char-outline": mergedColors.outline,
  } as React.CSSProperties;

  return (
    <svg
      id={`caloria-char-${charId}-${instanceId}`}
      viewBox={CHARACTER_VIEWBOX}
      style={cssVariables}
      className={cn("w-full h-full select-none overflow-visible", className)}
      role="img"
      aria-label={`${character.name} (${character.speciesLabel})`}
    >
      {/* Layer 0: Optional Room / Habitat Backdrop */}
      {showRoomBackdrop && equipped?.room === "room-tropical-garden" && (
        <g data-layer="room-tropical-garden" opacity="0.85">
          <circle cx="64" cy="84" r="56" fill="#DCFCE7" opacity="0.45" />
          <path
            d="M 14 134 C 12 114, 24 102, 34 112 C 26 118, 22 126, 20 136 Z"
            fill="#4ADE80"
            stroke="#231F20"
            strokeWidth="2.6"
          />
          <path
            d="M 114 134 C 116 114, 104 102, 94 112 C 102 118, 106 126, 108 136 Z"
            fill="#22C55E"
            stroke="#231F20"
            strokeWidth="2.6"
          />
        </g>
      )}
      {showRoomBackdrop && equipped?.room === "room-zen-dojo" && (
        <g data-layer="room-zen-dojo" opacity="0.85">
          <circle cx="64" cy="84" r="56" fill="#F3E8FF" opacity="0.45" />
          <circle
            cx="64"
            cy="82"
            r="50"
            fill="none"
            stroke="#C084FC"
            strokeWidth="2.4"
            strokeDasharray="10 6"
          />
        </g>
      )}

      {/* Optional Skin Aura Layer */}
      {equipped?.skin === "skin-neon-glow" && (
        <g data-layer="skin-neon-glow">
          <circle
            cx="64"
            cy="82"
            r="52"
            fill="none"
            stroke="#06B6D4"
            strokeWidth="3"
            strokeDasharray="6 6"
            opacity="0.7"
          />
          <circle cx="20" cy="48" r="3" fill="#22D3EE" />
          <circle cx="108" cy="54" r="2.5" fill="#22D3EE" />
          <circle cx="24" cy="112" r="2.5" fill="#22D3EE" />
        </g>
      )}
      {equipped?.skin === "skin-galactic-violet" && (
        <g data-layer="skin-galactic-violet">
          <circle
            cx="64"
            cy="82"
            r="52"
            fill="none"
            stroke="#A855F7"
            strokeWidth="3"
            opacity="0.6"
          />
          <polygon
            points="20,40 22,45 27,45 23,48 24,53 20,50 16,53 17,48 13,45 18,45"
            fill="#FDE047"
          />
          <polygon
            points="108,44 110,48 114,48 111,51 112,55 108,52 104,55 105,51 102,48 106,48"
            fill="#FDE047"
          />
        </g>
      )}

      {/* Layer 5: Ground Shadow */}
      {showShadow && (
        <ellipse
          cx="64"
          cy="146"
          rx="31"
          ry="6.5"
          fill="#231F20"
          opacity="0.14"
        />
      )}

      {/* Layer 15: Rear Accessory Layer (Backpack Pack, Hero Cape) */}
      {bodyAccData?.backMarkup && (
        <g
          data-layer="back-accessory"
          transform={bodyTransform || undefined}
          dangerouslySetInnerHTML={{ __html: bodyAccData.backMarkup }}
        />
      )}

      {/* Layer 20: Character Tail */}
      <g
        data-layer="character-tail"
        dangerouslySetInnerHTML={{ __html: tailMarkup }}
      />

      {/* Layer 30: Character Ears & Rear Details */}
      <g
        data-layer="character-ears"
        dangerouslySetInnerHTML={{ __html: earsMarkup }}
      />

      {/* Layer 40: Character Body & Limbs */}
      <g
        data-layer="character-body"
        dangerouslySetInnerHTML={{ __html: bodyMarkup }}
      />

      {/* Layer 50-55: Body / Neck Foreground Accessory (Hoodie, Scarf, Straps, Apron, Jersey) */}
      {bodyAccData?.frontMarkup && (
        <g
          data-layer="body-accessory"
          transform={bodyTransform || undefined}
          dangerouslySetInnerHTML={{ __html: bodyAccData.frontMarkup }}
        />
      )}

      {/* Layer 60: Character Oversized Head */}
      <g
        data-layer="character-head"
        dangerouslySetInnerHTML={{ __html: headMarkup }}
      />

      {/* Layer 70: Character Face (Eyes, Eyebrows, Nose, Mouth, Blush) */}
      <g
        data-layer="character-face"
        dangerouslySetInnerHTML={{ __html: faceMarkup }}
      />

      {/* Layer 80: Eye Accessories (Glasses) */}
      {glassesAccData?.frontMarkup && (
        <g
          data-layer="eye-accessory"
          transform={glassesTransform || undefined}
          dangerouslySetInnerHTML={{ __html: glassesAccData.frontMarkup }}
        />
      )}

      {/* Layer 90-92: Head Accessories (Hats, Clips, Headbands, Headphones) */}
      {headAccData?.frontMarkup && (
        <g
          data-layer="head-accessory"
          transform={headTransform || undefined}
          dangerouslySetInnerHTML={{ __html: headAccData.frontMarkup }}
        />
      )}

      {/* Layer 100: Held Objects (Food & Drinks) */}
      {heldAccData?.frontMarkup && (
        <g
          data-layer="held-accessory"
          transform={heldTransform || undefined}
          dangerouslySetInnerHTML={{ __html: heldAccData.frontMarkup }}
        />
      )}
    </svg>
  );
}

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

  if (itemId === "skin-neon-glow") {
    return (
      <svg viewBox="0 0 64 64" className={cn("w-12 h-12", className)}>
        <circle cx="32" cy="32" r="22" fill="#CFFAFE" stroke="#06B6D4" strokeWidth="3.6" />
        <polygon
          points="34,14 20,34 31,34 28,50 44,29 33,29"
          fill="#22D3EE"
          stroke="#231F20"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (itemId === "skin-galactic-violet") {
    return (
      <svg viewBox="0 0 64 64" className={cn("w-12 h-12", className)}>
        <circle cx="32" cy="32" r="22" fill="#F3E8FF" stroke="#9333EA" strokeWidth="3.6" />
        <polygon
          points="32,14 36,25 48,25 38,32 42,44 32,37 22,44 26,32 16,25 28,25"
          fill="#C084FC"
          stroke="#231F20"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (itemId === "room-tropical-garden") {
    return (
      <svg viewBox="0 0 64 64" className={cn("w-12 h-12", className)}>
        <rect x="10" y="12" width="44" height="40" rx="10" fill="#DCFCE7" stroke="#231F20" strokeWidth="3.2" />
        <path
          d="M 32 44 L 32 24 M 32 26 C 22 18, 16 24, 24 31 M 32 26 C 42 18, 48 24, 40 31"
          stroke="#16A34A"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={cn("w-12 h-12", className)}>
      <rect x="10" y="12" width="44" height="40" rx="10" fill="#EDE9FE" stroke="#231F20" strokeWidth="3.2" />
      <path d="M 18 24 L 46 24 M 22 24 L 22 44 M 42 24 L 42 44" stroke="#7C3AED" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

