import {
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
import {
  normalizeColorTokens,
  sanitizeCharacterId,
} from "@/lib/character-assets/config-schema";

export interface PetSvgComposeInput {
  name: string;
  species: string;
  level: number;
  stage: string;
  moodStatus?: string | null;
  customColors?: Record<string, string> | null;
  equipped?: {
    head?: string | null;
    glasses?: string | null;
    body?: string | null;
    held?: string | null;
    skin?: string | null;
    room?: string | null;
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Replaces CSS custom properties like `var(--char-primary, #FF6B5B)` with explicit hex colors
 * so standalone SVG renderers (OpenSea, MetaMask, browsers, wallets) display accurate colors.
 */
function resolveCssColorVars(
  svgFragment: string,
  palette: CharacterColorPalette,
): string {
  const tokenMap: Record<string, string> = {
    "--char-primary": palette.primary,
    "--char-secondary": palette.secondary,
    "--char-belly": palette.belly,
    "--char-inner-ear": palette.innerEar,
    "--char-blush": palette.blush,
    "--char-eye": palette.eye,
    "--char-nose": palette.nose,
    "--char-outline": palette.outline || "#231F20",
  };

  return svgFragment.replace(
    /var\(\s*(--char-[a-z-]+)\s*(?:,\s*([^)]+))?\)/g,
    (_, varName: string, fallback?: string) => {
      return tokenMap[varName] || fallback?.trim() || "#231F20";
    },
  );
}

/**
 * Server-side standalone SVG composer mirroring AvatarRenderer (`src/components/pet/avatar-renderer.tsx`).
 * Produces a 512x512 square NFT image with a soft Caloria badge backdrop and the 128x160 chibi centered.
 */
export function composePetNftSvg(input: PetSvgComposeInput): string {
  const safeCharId: CharacterId = sanitizeCharacterId(input.species);
  const character = getCharacterDefinition(safeCharId);

  const normalizedColors = normalizeColorTokens(
    (input.customColors || {}) as Partial<CharacterColorPalette> & {
      body?: string;
      accent?: string;
    },
  );

  const mergedColors: CharacterColorPalette = {
    ...character.defaultColors,
    ...Object.fromEntries(
      Object.entries(normalizedColors || {}).filter(([, v]) => Boolean(v)),
    ),
  };

  const layers = CHARACTER_SVG_LAYERS[safeCharId] || CHARACTER_SVG_LAYERS.flameling;
  const isComplaining = input.moodStatus === "complaining";

  const faceMarkup = isComplaining
    ? ANIMATION_STATE_FACE_OVERLAYS.complaining || layers.face
    : layers.face;

  const equipped = input.equipped || {};
  const headAcc = getAccessoryDefinition(equipped.head);
  const glassesAcc = getAccessoryDefinition(equipped.glasses);
  const bodyAcc = getAccessoryDefinition(equipped.body);
  const heldAcc = getAccessoryDefinition(equipped.held);

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
  const glassesTransform = glassesAcc
    ? resolveAccessoryTransform(safeCharId, glassesAcc)
    : "";
  const bodyTransform = bodyAcc ? resolveAccessoryTransform(safeCharId, bodyAcc) : "";
  const heldTransform = heldAcc ? resolveAccessoryTransform(safeCharId, heldAcc) : "";

  const roomBackdrop =
    equipped.room === "room-tropical-garden"
      ? `<g opacity="0.85">
          <circle cx="64" cy="84" r="56" fill="#DCFCE7" opacity="0.55" />
          <path d="M 14 134 C 12 114, 24 102, 34 112 C 26 118, 22 126, 20 136 Z" fill="#4ADE80" stroke="${mergedColors.outline}" stroke-width="2.6" />
          <path d="M 114 134 C 116 114, 104 102, 94 112 C 102 118, 106 126, 108 136 Z" fill="#22C55E" stroke="${mergedColors.outline}" stroke-width="2.6" />
        </g>`
      : equipped.room === "room-zen-dojo"
        ? `<g opacity="0.85">
            <circle cx="64" cy="84" r="56" fill="#F3E8FF" opacity="0.55" />
            <circle cx="64" cy="82" r="50" fill="none" stroke="#C084FC" stroke-width="2.4" stroke-dasharray="10 6" />
          </g>`
        : "";

  const skinAura =
    equipped.skin === "skin-neon-glow"
      ? `<g>
          <circle cx="64" cy="82" r="52" fill="none" stroke="#06B6D4" stroke-width="3" stroke-dasharray="6 6" opacity="0.75" />
          <circle cx="20" cy="48" r="3" fill="#22D3EE" />
          <circle cx="108" cy="54" r="2.5" fill="#22D3EE" />
          <circle cx="24" cy="112" r="2.5" fill="#22D3EE" />
        </g>`
      : equipped.skin === "skin-galactic-violet"
        ? `<g>
            <circle cx="64" cy="82" r="52" fill="none" stroke="#A855F7" stroke-width="3" opacity="0.65" />
            <polygon points="20,40 22,45 27,45 23,48 24,53 20,50 16,53 17,48 13,45 18,45" fill="#FDE047" />
            <polygon points="108,44 110,48 114,48 111,51 112,55 108,52 104,55 105,51 102,48 106,48" fill="#FDE047" />
          </g>`
        : "";

  const postureTransform = isComplaining
    ? ` transform="translate(0, 4) scale(0.99, 0.96) translate(0.5, 2)"`
    : "";

  const characterInner = [
    roomBackdrop,
    skinAura,
    `<ellipse cx="64" cy="${isComplaining ? 149 : 146}" rx="${isComplaining ? 33 : 31}" ry="6.5" fill="${mergedColors.outline}" opacity="0.14" />`,
    `<g${postureTransform}>`,
    bodyAccData?.backMarkup
      ? `<g${bodyTransform ? ` transform="${bodyTransform}"` : ""}>${bodyAccData.backMarkup}</g>`
      : "",
    layers.tail ? `<g>${layers.tail}</g>` : "",
    layers.ears ? `<g>${layers.ears}</g>` : "",
    layers.body ? `<g>${layers.body}</g>` : "",
    bodyAccData?.frontMarkup
      ? `<g${bodyTransform ? ` transform="${bodyTransform}"` : ""}>${bodyAccData.frontMarkup}</g>`
      : "",
    layers.head ? `<g>${layers.head}</g>` : "",
    faceMarkup ? `<g>${faceMarkup}</g>` : "",
    glassesAccData?.frontMarkup
      ? `<g${glassesTransform ? ` transform="${glassesTransform}"` : ""}>${glassesAccData.frontMarkup}</g>`
      : "",
    headAccData?.frontMarkup
      ? `<g${headTransform ? ` transform="${headTransform}"` : ""}>${headAccData.frontMarkup}</g>`
      : "",
    heldAccData?.frontMarkup
      ? `<g${heldTransform ? ` transform="${heldTransform}"` : ""}>${heldAccData.frontMarkup}</g>`
      : "",
    `</g>`,
  ].join("");

  const resolvedCharacterInner = resolveCssColorVars(characterInner, mergedColors);
  const safeName = escapeXml(input.name || character.defaultNickname);
  const safeStage = escapeXml(
    (input.stage || "hatchling").replace(/^\w/, (c) => c.toUpperCase()),
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${safeName} CalPal NFT">
  <defs>
    <linearGradient id="calpal-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7FBE8" />
      <stop offset="100%" stop-color="#E7F6D5" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="44" fill="url(#calpal-bg)" />
  <rect x="16" y="16" width="480" height="480" rx="34" fill="none" stroke="#231F20" stroke-width="4" opacity="0.1" />
  <g transform="translate(106, 44) scale(2.35)">
    ${resolvedCharacterInner}
  </g>
  <g transform="translate(32, 434)">
    <rect x="0" y="0" width="448" height="48" rx="18" fill="#FFFFFF" fill-opacity="0.92" stroke="#231F20" stroke-opacity="0.12" stroke-width="2" />
    <text x="20" y="30" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#1F2937">${safeName}</text>
    <text x="428" y="30" text-anchor="end" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#4D7C0F">LVL ${input.level} • ${safeStage}</text>
  </g>
</svg>`;
}
