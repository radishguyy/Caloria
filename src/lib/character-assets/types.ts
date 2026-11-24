/**
 * Caloria Modular SVG Character & Accessory Asset Library — Type Definitions
 *
 * Shared Coordinate System:
 * - Standard canvas: `viewBox="0 0 128 160"` (width: 128, height: 160)
 * - Horizontal center axis: x = 64
 * - Head center: (64, 70), Crown: (64, 36), Eye line: y = 70
 * - Neck join: (64, 98), Torso center: (64, 118), Ground line: y = 146
 *
 * Named Color Tokens (CSS Custom Properties):
 * - `--char-primary`: Main body, head, and outer ear fill
 * - `--char-secondary`: Secondary markings, ear tips, tail tips, stripes
 * - `--char-belly`: Belly patch, inner muzzle, chest tuft fill
 * - `--char-inner-ear`: Inner ear fill
 * - `--char-blush`: Cheek blush fill
 * - `--char-eye`: Eye iris/pupil fill
 * - `--char-nose`: Nose and mouth line/accent fill
 * - `--char-outline`: Thick organic dark outline stroke (default #231F20)
 */

export const CHARACTER_VIEWBOX = "0 0 128 160" as const;
export const CHARACTER_CANVAS_WIDTH = 128 as const;
export const CHARACTER_CANVAS_HEIGHT = 160 as const;

export type CharacterId =
  | "flameling"
  | "bloomie"
  | "droplet"
  | "sunny"
  | "mochi"
  | "kuma"
  | "nyx"
  | "bambi"
  | "pippin"
  | "ziggy"
  | "clover"
  | "biscuit";

export type CharacterLayerType =
  | "ears"
  | "tail"
  | "body"
  | "head"
  | "face";

export type AccessoryAnchorId =
  | "crown"
  | "headSide"
  | "forehead"
  | "eyes"
  | "neck"
  | "torso"
  | "back"
  | "handRight";

export type AccessorySlotCategory =
  | "head"
  | "glasses"
  | "body"
  | "held"
  | "skin"
  | "room";

export type AccessoryTheme = "everyday" | "food" | "special";

/**
 * Explicit z-order for composable SVG layers from back (lowest) to front (highest).
 */
export const CHARACTER_LAYER_ORDER = {
  room: 0,
  shadow: 5,
  backAccessory: 15,
  tail: 20,
  ears: 30,
  body: 40,
  bodyAccessory: 50,
  neckAccessory: 55,
  head: 60,
  face: 70,
  eyeAccessory: 80,
  headAccessory: 90,
  headSideAccessory: 91,
  foreheadAccessory: 92,
  heldObject: 100,
} as const;

export interface AnchorPoint {
  id: AccessoryAnchorId;
  x: number;
  y: number;
  description: string;
}

/**
 * Standard anchor coordinates in the shared `0 0 128 160` coordinate space.
 */
export const CHARACTER_ANCHORS: Record<AccessoryAnchorId, AnchorPoint> = {
  crown: {
    id: "crown",
    x: 64,
    y: 36,
    description: "Top center of the head crown for hats, caps, berets, and toques.",
  },
  headSide: {
    id: "headSide",
    x: 88,
    y: 42,
    description: "Upper-right temple / ear base for bows, hair clips, and fruit slices.",
  },
  forehead: {
    id: "forehead",
    x: 64,
    y: 48,
    description: "Forehead and ear-to-ear arch for headbands and over-ear headphones.",
  },
  eyes: {
    id: "eyes",
    x: 64,
    y: 70,
    description: "Eye bridge center between left (48, 70) and right (80, 70) eyes for glasses.",
  },
  neck: {
    id: "neck",
    x: 64,
    y: 100,
    description: "Neckline junction between head and torso for scarves and collars.",
  },
  torso: {
    id: "torso",
    x: 64,
    y: 118,
    description: "Compact torso center for hoodies, aprons, jerseys, and outfits.",
  },
  back: {
    id: "back",
    x: 64,
    y: 114,
    description: "Upper back behind torso/shoulders for backpacks and capes.",
  },
  handRight: {
    id: "handRight",
    x: 96,
    y: 114,
    description: "Right paw/hand anchor for held food and drink objects.",
  },
};

export interface AnchorTransform {
  dx?: number;
  dy?: number;
  scale?: number;
  rotate?: number;
}

export interface CharacterColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  belly: string;
  innerEar: string;
  blush: string;
  eye: string;
  nose: string;
  outline: string;
}

export interface CharacterLayerPaths {
  ears: string;
  tail: string;
  body: string;
  head: string;
  face: string;
  full: string;
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  defaultNickname: string;
  speciesLabel: string;
  animalTrait: string;
  element: string;
  primaryMacro: "protein" | "carbs" | "fat";
  description: string;
  personality: string;
  defaultColors: CharacterColorPalette;
  componentPaths: CharacterLayerPaths;
  availableFaceVariants: CharacterId[];
  availableEarVariants: CharacterId[];
  availableTailVariants: CharacterId[];
  anchorAdjustments: Partial<Record<AccessoryAnchorId, AnchorTransform>>;
  accessoryOverrides?: Record<string, AnchorTransform>;
}

export interface AccessoryDefinition {
  id: string;
  legacyAliasId?: string;
  name: string;
  nameEn: string;
  category: AccessorySlotCategory;
  theme: AccessoryTheme;
  priceCoins: number;
  description: string;
  svgPath: string;
  anchor: AccessoryAnchorId;
  scale: number;
  layerOrder: number;
  hasBackLayer?: boolean;
  backLayerOrder?: number;
  colorAccent: string;
  previewEmoji: string;
  isDefaultFree?: boolean;
  compatibleCharacters: "all" | CharacterId[];
  characterAdjustments?: Partial<Record<CharacterId, AnchorTransform>>;
}

export interface CharacterCompositionConfig {
  characterId: CharacterId;
  colors: Partial<CharacterColorPalette>;
  earsVariant?: CharacterId;
  tailVariant?: CharacterId;
  faceVariant?: CharacterId;
  equippedAccessories: {
    head?: string | null;
    glasses?: string | null;
    body?: string | null;
    held?: string | null;
    skin?: string | null;
    room?: string | null;
  };
}

