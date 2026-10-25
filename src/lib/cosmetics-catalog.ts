/**
 * Pet Cosmetic Items & Wardrobe Catalog
 *
 * Categories:
 * - head: Hats, caps, berets, bows, clips, headbands, headphones
 * - glasses: Round, rectangular, star glasses, shades
 * - body: Hoodies, scarves, backpacks, aprons, capes, jerseys
 * - held: Held food & drink objects (mini burger, apple, carrot, rice bowl, milk carton, water bottle)
 * - skin: Color variants, auras
 * - room: Habitat / background themes
 *
 * Integrated with the Modular SVG Character & Accessory Asset Library
 * (`src/lib/character-assets/catalog.ts`).
 */

import { ACCESSORY_CATALOG } from "@/lib/character-assets/catalog";
import {
  AccessoryAnchorId,
  AccessoryTheme,
  CharacterId,
} from "@/lib/character-assets/types";

export type CosmeticCategory =
  | "head"
  | "body"
  | "glasses"
  | "held"
  | "skin"
  | "room";

export interface CosmeticItem {
  id: string;
  name: string;
  nameEn?: string;
  category: CosmeticCategory;
  theme?: AccessoryTheme;
  priceCoins: number;
  description: string;
  previewEmoji: string;
  colorAccent: string;
  svgPath?: string;
  anchor?: AccessoryAnchorId;
  scale?: number;
  layerOrder?: number;
  compatibleCharacters?: "all" | CharacterId[];
  isDefaultFree?: boolean;
}

const DEFAULT_NONE_ITEMS: CosmeticItem[] = [
  {
    id: "head-none",
    name: "Tanpa Topi",
    nameEn: "No Hat",
    category: "head",
    priceCoins: 0,
    description: "Tampilan alami tanpa penutup kepala.",
    previewEmoji: "🥚",
    colorAccent: "#6b7280",
    isDefaultFree: true,
  },
  {
    id: "glasses-none",
    name: "Tanpa Kacamata",
    nameEn: "No Glasses",
    category: "glasses",
    priceCoins: 0,
    description: "Mata berbinar alami tanpa kacamata.",
    previewEmoji: "👀",
    colorAccent: "#6b7280",
    isDefaultFree: true,
  },
  {
    id: "body-none",
    name: "Tanpa Kostum",
    nameEn: "No Outfit",
    category: "body",
    priceCoins: 0,
    description: "Bentuk murni sang virtual pet.",
    previewEmoji: "✨",
    colorAccent: "#6b7280",
    isDefaultFree: true,
  },
  {
    id: "held-none",
    name: "Tanpa Bawaan",
    nameEn: "Empty Hand",
    category: "held",
    priceCoins: 0,
    description: "Tangan bebas tanpa memegang makanan atau minuman.",
    previewEmoji: "🐾",
    colorAccent: "#6b7280",
    isDefaultFree: true,
  },
];

const SKIN_AND_ROOM_ITEMS: CosmeticItem[] = [
  // Skins
  {
    id: "skin-default",
    name: "Skin Original Karakter",
    category: "skin",
    priceCoins: 0,
    description: "Warna bawaan atau warna kustom pilihanmu tanpa efek aura tambahan.",
    previewEmoji: "🔥",
    colorAccent: "#f97316",
    isDefaultFree: true,
  },
  {
    id: "skin-neon-glow",
    name: "Aura Neon Cyber",
    category: "skin",
    priceCoins: 200,
    description: "Pendaran neon futuristik yang bersinar di sekeliling pet.",
    previewEmoji: "⚡",
    colorAccent: "#06b6d4",
  },
  {
    id: "skin-galactic-violet",
    name: "Galactic Violet Cosmic",
    category: "skin",
    priceCoins: 220,
    description: "Pancaran kosmik ungu bintang dari galaksi nan jauh.",
    previewEmoji: "🌌",
    colorAccent: "#a855f7",
  },

  // Room / Environment
  {
    id: "room-default",
    name: "Ruangan Santai Minimalis",
    category: "room",
    priceCoins: 0,
    description: "Ruang istirahat hangat dan bersih.",
    previewEmoji: "🏠",
    colorAccent: "#f59e0b",
    isDefaultFree: true,
  },
  {
    id: "room-tropical-garden",
    name: "Taman Tropis Segar",
    category: "room",
    priceCoins: 120,
    description: "Dikelilingi tanaman hijau segar dan angin sepoi-sepoi.",
    previewEmoji: "🌴",
    colorAccent: "#22c55e",
  },
  {
    id: "room-zen-dojo",
    name: "Dojo Meditasi Sehat",
    category: "room",
    priceCoins: 140,
    description: "Suasana tenang untuk kedisiplinan dan relaksasi pikiran.",
    previewEmoji: "⛩️",
    colorAccent: "#8b5cf6",
  },
];

const MAPPED_SVG_ACCESSORIES: CosmeticItem[] = ACCESSORY_CATALOG.map((acc) => ({
  id: acc.id,
  name: acc.name,
  nameEn: acc.nameEn,
  category: acc.category as CosmeticCategory,
  theme: acc.theme,
  priceCoins: acc.priceCoins,
  description: acc.description,
  previewEmoji: acc.previewEmoji,
  colorAccent: acc.colorAccent,
  svgPath: acc.svgPath,
  anchor: acc.anchor,
  scale: acc.scale,
  layerOrder: acc.layerOrder,
  compatibleCharacters: acc.compatibleCharacters,
  isDefaultFree: acc.isDefaultFree,
}));

export const COSMETICS_CATALOG: CosmeticItem[] = [
  ...DEFAULT_NONE_ITEMS,
  ...MAPPED_SVG_ACCESSORIES,
  ...SKIN_AND_ROOM_ITEMS,
];
