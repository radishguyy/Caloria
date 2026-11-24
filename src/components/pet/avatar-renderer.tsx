"use client";

import React, { useId, useMemo } from "react";
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
import { sanitizeCharacterId, normalizeColorTokens } from "@/lib/character-assets/config-schema";

export type AvatarSize = 32 | 48 | 64 | 128 | 256 | "xs" | "sm" | "md" | "lg" | "xl" | "interactive" | "full";

export interface AvatarRendererProps {
  characterId: CharacterId | string;
  colors?: Partial<CharacterColorPalette> & {
    body?: string;
    accent?: string;
  };
  earsVariant?: CharacterId;
  tailVariant?: CharacterId;
  faceVariant?: CharacterId;
  animationState?: PetAnimationState;
  moodStatus?: "happy" | "neutral" | "complaining";
  equipped?: {
    head?: string | null;
    glasses?: string | null;
    body?: string | null;
    held?: string | null;
    skin?: string | null;
    room?: string | null;
  };
  /** List of accessory IDs to equip (conceptual schema format) */
  accessoryIds?: string[];
  size?: AvatarSize;
  showShadow?: boolean;
  showRoomBackdrop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  32: "w-8 h-10",
  48: "w-12 h-15",
  64: "w-16 h-20",
  128: "w-32 h-40",
  256: "w-64 h-80",
  xs: "w-8 h-10",
  sm: "w-12 h-15",
  md: "w-16 h-20",
  lg: "w-32 h-40",
  xl: "w-64 h-80",
  interactive: "w-72 h-90 max-w-full",
  full: "w-full h-full",
};

/**
 * Reusable, Data-Driven Modular SVG Avatar Renderer.
 *
 * Assembles chibi anthropomorphic characters from genuine modular SVG components:
 * - Proper z-index layer ordering (Room -> Shadow -> Back Acc -> Tail -> Ears -> Body -> Body Acc -> Head -> Face -> Glasses -> Hat -> Held Object)
 * - Dynamic recoloring through CSS custom properties
 * - Anchor and character-specific accessory transforms
 * - Anatomical variants (ears, tail, face)
 * - Scoped unique IDs per instance to prevent SVG collisions
 * - Graceful fallbacks for missing assets and invalid IDs
 */
export function AvatarRenderer({
  characterId,
  colors,
  earsVariant,
  tailVariant,
  faceVariant,
  animationState = "idle",
  moodStatus,
  equipped,
  accessoryIds,
  size = "full",
  showShadow = true,
  showRoomBackdrop = true,
  className,
  style,
  title,
}: AvatarRendererProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // Safe fallback to "flameling" if characterId is invalid
  const safeCharId = sanitizeCharacterId(characterId);
  const character = getCharacterDefinition(safeCharId);

  // Normalize color tokens (support "body" & "accent" conceptual keys)
  const normalizedColors = useMemo(() => normalizeColorTokens(colors), [colors]);

  const mergedColors: CharacterColorPalette = useMemo(() => {
    return {
      ...character.defaultColors,
      ...Object.fromEntries(
        Object.entries(normalizedColors || {}).filter(([, v]) => Boolean(v))
      ),
    };
  }, [character.defaultColors, normalizedColors]);

  // Resolve anatomical variants
  const activeEarsId: CharacterId = sanitizeCharacterId(earsVariant || safeCharId);
  const activeTailId: CharacterId = sanitizeCharacterId(tailVariant || safeCharId);
  const activeFaceId: CharacterId = sanitizeCharacterId(faceVariant || safeCharId);

  const layers = CHARACTER_SVG_LAYERS as Record<CharacterId, typeof CHARACTER_SVG_LAYERS[CharacterId]>;
  const fallbackLayers = CHARACTER_SVG_LAYERS.flameling;

  const earsMarkup =
    (layers[activeEarsId] || layers[safeCharId] || fallbackLayers)?.ears || "";
  const tailMarkup =
    (layers[activeTailId] || layers[safeCharId] || fallbackLayers)?.tail || "";
  const bodyMarkup = (layers[safeCharId] || fallbackLayers)?.body || "";
  const headMarkup = (layers[safeCharId] || fallbackLayers)?.head || "";

  // Expression overlay or standard face
  const faceMarkup = useMemo(() => {
    if (
      animationState === "sleeping" ||
      animationState === "eating" ||
      animationState === "happy" ||
      animationState === "complaining"
    ) {
      return ANIMATION_STATE_FACE_OVERLAYS[animationState] || "";
    }
    if (moodStatus === "complaining") {
      return ANIMATION_STATE_FACE_OVERLAYS.complaining || "";
    }
    return (
      (layers[activeFaceId] || layers[safeCharId] || fallbackLayers)?.face || ""
    );
  }, [animationState, moodStatus, activeFaceId, safeCharId, layers, fallbackLayers]);

  // Merge equipped slot object with optional accessoryIds list
  const effectiveEquipped = useMemo(() => {
    const base = {
      head: equipped?.head || null,
      glasses: equipped?.glasses || null,
      body: equipped?.body || null,
      held: equipped?.held || null,
      skin: equipped?.skin || null,
      room: equipped?.room || null,
    };

    if (accessoryIds && accessoryIds.length > 0) {
      for (const id of accessoryIds) {
        const def = getAccessoryDefinition(id);
        if (def) {
          if (def.category === "head") base.head = def.id;
          else if (def.category === "glasses") base.glasses = def.id;
          else if (def.category === "body") base.body = def.id;
          else if (def.category === "held") base.held = def.id;
          else if (def.category === "skin") base.skin = def.id;
          else if (def.category === "room") base.room = def.id;
        }
      }
    }

    return base;
  }, [equipped, accessoryIds]);

  // Resolve accessory definitions, transforms, and SVG layer artwork
  const headAcc = getAccessoryDefinition(effectiveEquipped.head);
  const glassesAcc = getAccessoryDefinition(effectiveEquipped.glasses);
  const bodyAcc = getAccessoryDefinition(effectiveEquipped.body);
  const heldAcc = getAccessoryDefinition(effectiveEquipped.held);

  const headAccData =
    headAcc && isAccessoryCompatible(safeCharId, headAcc.id)
      ? ACCESSORY_SVG_LAYERS[headAcc.id]
      : undefined;

  const glassesAccData =
    glassesAcc && isAccessoryCompatible(safeCharId, glassesAcc.id)
      ? ACCESSORY_SVG_LAYERS[glassesAcc.id]
      : undefined;

  const bodyAccData =
    bodyAcc && isAccessoryCompatible(safeCharId, bodyAcc.id)
      ? ACCESSORY_SVG_LAYERS[bodyAcc.id]
      : undefined;

  const heldAccData =
    heldAcc && isAccessoryCompatible(safeCharId, heldAcc.id)
      ? ACCESSORY_SVG_LAYERS[heldAcc.id]
      : undefined;

  const headTransform = headAcc ? resolveAccessoryTransform(safeCharId, headAcc) : "";
  const glassesTransform = glassesAcc ? resolveAccessoryTransform(safeCharId, glassesAcc) : "";
  const bodyTransform = bodyAcc ? resolveAccessoryTransform(safeCharId, bodyAcc) : "";
  const heldTransform = heldAcc ? resolveAccessoryTransform(safeCharId, heldAcc) : "";

  // CSS custom properties applied directly to the root SVG for instant dynamic recoloring
  const cssVariables = {
    "--char-primary": mergedColors.primary,
    "--char-secondary": mergedColors.secondary,
    "--char-belly": mergedColors.belly,
    "--char-inner-ear": mergedColors.innerEar,
    "--char-blush": mergedColors.blush,
    "--char-eye": mergedColors.eye,
    "--char-nose": mergedColors.nose,
    "--char-outline": mergedColors.outline || "#231F20",
    ...style,
  } as React.CSSProperties;

  const sizeClass = SIZE_CLASSES[String(size)] || SIZE_CLASSES.full;

  const isComplaining =
    moodStatus === "complaining" || animationState === "complaining";

  return (
    <svg
      id={`caloria-avatar-${safeCharId}-${instanceId}`}
      viewBox={CHARACTER_VIEWBOX}
      style={cssVariables}
      className={cn("select-none overflow-visible", sizeClass, className)}
      role="img"
      aria-label={title || `${character.name} (${character.speciesLabel})`}
    >
      <title>{title || `${character.name} — ${character.speciesLabel}`}</title>

      {/* Layer 0: Optional Habitat / Room Backdrop */}
      {showRoomBackdrop && effectiveEquipped.room === "room-tropical-garden" && (
        <g data-layer="room-tropical-garden" opacity="0.85">
          <circle cx="64" cy="84" r="56" fill="#DCFCE7" opacity="0.45" />
          <path
            d="M 14 134 C 12 114, 24 102, 34 112 C 26 118, 22 126, 20 136 Z"
            fill="#4ADE80"
            stroke="var(--char-outline, #231F20)"
            strokeWidth="2.6"
          />
          <path
            d="M 114 134 C 116 114, 104 102, 94 112 C 102 118, 106 126, 108 136 Z"
            fill="#22C55E"
            stroke="var(--char-outline, #231F20)"
            strokeWidth="2.6"
          />
        </g>
      )}

      {showRoomBackdrop && effectiveEquipped.room === "room-zen-dojo" && (
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

      {/* Optional Skin Aura Effect */}
      {effectiveEquipped.skin === "skin-neon-glow" && (
        <g data-layer="skin-neon-glow">
          <circle
            cx="64"
            cy="82"
            r="52"
            fill="none"
            stroke="#06B6D4"
            strokeWidth="3"
            strokeDasharray="6 6"
            opacity="0.75"
          />
          <circle cx="20" cy="48" r="3" fill="#22D3EE" />
          <circle cx="108" cy="54" r="2.5" fill="#22D3EE" />
          <circle cx="24" cy="112" r="2.5" fill="#22D3EE" />
        </g>
      )}

      {effectiveEquipped.skin === "skin-galactic-violet" && (
        <g data-layer="skin-galactic-violet">
          <circle
            cx="64"
            cy="82"
            r="52"
            fill="none"
            stroke="#A855F7"
            strokeWidth="3"
            opacity="0.65"
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
          cy={isComplaining ? 149 : 146}
          rx={isComplaining ? 33 : 31}
          ry={6.5}
          fill="var(--char-outline, #231F20)"
          opacity="0.14"
        />
      )}

      {/* Character Group with Dynamic Sluggish Posture when Hungry/Complaining */}
      <g
        data-posture={isComplaining ? "sluggish" : "energetic"}
        transform={
          isComplaining
            ? "translate(0, 4) scale(0.99, 0.96) translate(0.5, 2)"
            : undefined
        }
      >
        {/* Layer 15: Rear Accessory Layer (Backpack Pack, Hero Cape) */}
        {bodyAccData?.backMarkup && (
          <g
            data-layer="back-accessory"
            transform={bodyTransform || undefined}
            dangerouslySetInnerHTML={{ __html: bodyAccData.backMarkup }}
          />
        )}

        {/* Layer 20: Character Tail */}
        {tailMarkup && (
          <g
            data-layer="character-tail"
            dangerouslySetInnerHTML={{ __html: tailMarkup }}
          />
        )}

        {/* Layer 30: Character Ears & Rear Anatomy */}
        {earsMarkup && (
          <g
            data-layer="character-ears"
            dangerouslySetInnerHTML={{ __html: earsMarkup }}
          />
        )}

        {/* Layer 40: Character Body & Limbs */}
        {bodyMarkup && (
          <g
            data-layer="character-body"
            dangerouslySetInnerHTML={{ __html: bodyMarkup }}
          />
        )}

        {/* Layer 50-55: Body / Neck Foreground Accessory (Hoodie, Scarf, Apron, Jersey) */}
        {bodyAccData?.frontMarkup && (
          <g
            data-layer="body-accessory"
            transform={bodyTransform || undefined}
            dangerouslySetInnerHTML={{ __html: bodyAccData.frontMarkup }}
          />
        )}

        {/* Layer 60: Character Oversized Head */}
        {headMarkup && (
          <g
            data-layer="character-head"
            dangerouslySetInnerHTML={{ __html: headMarkup }}
          />
        )}

        {/* Layer 70: Character Face (Eyes, Eyebrows, Nose, Mouth, Blush) */}
        {faceMarkup && (
          <g
            data-layer="character-face"
            dangerouslySetInnerHTML={{ __html: faceMarkup }}
          />
        )}

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

        {/* Layer 100: Held Objects (Food & Drink Items) */}
        {heldAccData?.frontMarkup && (
          <g
            data-layer="held-accessory"
            transform={heldTransform || undefined}
            dangerouslySetInnerHTML={{ __html: heldAccData.frontMarkup }}
          />
        )}
      </g>
    </svg>
  );
}
