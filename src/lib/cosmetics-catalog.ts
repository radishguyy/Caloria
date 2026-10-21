/**
 * Pet Cosmetic Items & Wardrobe Catalog
 * 
 * Categories:
 * - head: Hats, crowns, ribbons
 * - body: Outfits, capes, shirts
 * - glasses: Shades, nerd glasses
 * - skin: Color variants, auras
 * - room: Habitat / background themes
 * 
 * Caloria Coins are used to purchase these cosmetic items.
 * (Note: No Plaza or public pet feeds per product specification)
 */

export type CosmeticCategory = "head" | "body" | "glasses" | "skin" | "room";

export interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  priceCoins: number;
  description: string;
  previewEmoji: string;
  colorAccent: string;
  isDefaultFree?: boolean;
}

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // Head
  {
    id: "head-none",
    name: "Tanpa Topi",
    category: "head",
    priceCoins: 0,
    description: "Tampilan alami tanpa penutup kepala.",
    previewEmoji: "🥚",
    colorAccent: "#6b7280",
    isDefaultFree: true,
  },
  {
    id: "head-explorer-hat",
    name: "Topi Petualang Rimba",
    category: "head",
    priceCoins: 50,
    description: "Topi safari tangguh untuk petualangan membakar kalori.",
    previewEmoji: "🤠",
    colorAccent: "#ca8a04",
  },
  {
    id: "head-golden-crown",
    name: "Mahkota Emas Juara",
    category: "head",
    priceCoins: 150,
    description: "Simbol ketekunan bagi mereka yang disiplin menjaga nutrisi.",
    previewEmoji: "👑",
    colorAccent: "#eab308",
  },
  {
    id: "head-red-ribbon",
    name: "Pita Merah Semangat",
    category: "head",
    priceCoins: 40,
    description: "Pita imut berenergi tinggi penambah keceriaan pet.",
    previewEmoji: "🎀",
    colorAccent: "#ef4444",
  },

  // Glasses
  {
    id: "glasses-none",
    name: "Tanpa Kacamata",
    category: "glasses",
    priceCoins: 0,
    description: "Mata berbinar alami tanpa kacamata.",
    previewEmoji: "👀",
    colorAccent: "#6b7280",
    isDefaultFree: true,
  },
  {
    id: "glasses-cool-shades",
    name: "Kacamata Hitam Sporty",
    category: "glasses",
    priceCoins: 60,
    description: "Kacamata hitam gaya untuk pet yang percaya diri.",
    previewEmoji: "🕶️",
    colorAccent: "#1f2937",
  },
  {
    id: "glasses-nerd-specs",
    name: "Kacamata Cendekiawan",
    category: "glasses",
    priceCoins: 45,
    description: "Kacamata bulat untuk pet yang cerdas menghitung makro.",
    previewEmoji: "👓",
    colorAccent: "#3b82f6",
  },

  // Body Outfits
  {
    id: "body-none",
    name: "Tanpa Kostum",
    category: "body",
    priceCoins: 0,
    description: "Bentuk murni sang virtual pet.",
    previewEmoji: "✨",
    colorAccent: "#6b7280",
    isDefaultFree: true,
  },
  {
    id: "body-chef-apron",
    name: "Celemek Master Chef",
    category: "body",
    priceCoins: 100,
    description: "Kostum koki sehat yang ahli meracik makanan bergizi seimbang.",
    previewEmoji: "👨‍🍳",
    colorAccent: "#f97316",
  },
  {
    id: "body-hero-cape",
    name: "Jubah Pahlawan Sehat",
    category: "body",
    priceCoins: 180,
    description: "Jubah merah berkibar simbol pejuang konsistensi diet.",
    previewEmoji: "🦸",
    colorAccent: "#dc2626",
  },
  {
    id: "body-sport-jersey",
    name: "Jersey Olahraga Atletik",
    category: "body",
    priceCoins: 90,
    description: "Baju olahraga breathable penyemangat latihan fisik.",
    previewEmoji: "🎽",
    colorAccent: "#10b981",
  },

  // Skins
  {
    id: "skin-default",
    name: "Skin Original Elemen",
    category: "skin",
    priceCoins: 0,
    description: "Warna bawaan spesies elemen pet kamu.",
    previewEmoji: "🔥",
    colorAccent: "#f97316",
    isDefaultFree: true,
  },
  {
    id: "skin-neon-glow",
    name: "Aura Neon Cyber",
    category: "skin",
    priceCoins: 200,
    description: "Pendaran neon futuristik yang bersinar di kegelapan.",
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

