import type { CharacterColorPalette, CharacterId } from "@/lib/character-assets/types";
import { DEFAULT_CHARACTER_COMPOSITIONS } from "@/lib/character-assets/catalog";
import type { PetAnimationState } from "@/types";

/**
 * Curated Calpal variants for the public landing page showcase.
 * Deterministic (no randomness) so server and client renders always match.
 */

export type ShowcaseTag = "expression" | "color" | "headgear" | "body" | "held";

export interface CalpalVariant {
  key: string;
  label: string;
  characterId: CharacterId;
  colors?: Partial<CharacterColorPalette>;
  animationState?: PetAnimationState;
  equipped: {
    head?: string | null;
    glasses?: string | null;
    body?: string | null;
    held?: string | null;
  };
  tags: ShowcaseTag[];
}

function preset(
  characterId: CharacterId,
  label: string,
  tags: ShowcaseTag[],
  overrides: Partial<Omit<CalpalVariant, "key" | "label" | "characterId" | "tags">> = {}
): CalpalVariant {
  const base = DEFAULT_CHARACTER_COMPOSITIONS[characterId].equippedAccessories;
  return {
    key: `${characterId}-${label.toLowerCase().replace(/\s+/g, "-")}`,
    label,
    characterId,
    tags,
    ...overrides,
    equipped: { ...base, ...overrides.equipped },
  };
}

export const CALPAL_SHOWCASE_VARIANTS: CalpalVariant[] = [
  preset("flameling", "Si Apel Ceria", ["headgear", "held"]),
  preset("bloomie", "Camilan Kebun", ["headgear", "held"]),
  preset("droplet", "Pramuka Air", ["headgear", "held"]),
  preset("sunny", "Koki Cilik", ["headgear", "body", "held"]),
  preset("mochi", "Bintang Mochi", ["headgear", "held"]),
  preset("kuma", "Petualang Kuma", ["headgear", "body", "held"]),
  preset("nyx", "Kutu Buku Nyx", ["headgear", "body"]),
  preset("bambi", "Bambi Beret", ["headgear", "held"]),
  preset("pippin", "Pippin Daun", ["headgear", "body", "held"]),
  preset("ziggy", "Ziggy Segar", ["headgear", "held"]),
  preset("clover", "Clover Beri", ["headgear", "held"]),
  preset("biscuit", "Pesta Buah", ["headgear", "held"]),

  // Expressions (Ekspresi)
  preset("flameling", "Bahagia", ["expression"], {
    animationState: "happy",
    equipped: { head: null, held: null },
  }),
  preset("mochi", "Lagi Makan", ["expression", "held"], {
    animationState: "eating",
    equipped: { head: null, glasses: null, held: "acc-rice-bowl" },
  }),
  preset("kuma", "Tidur Pulas", ["expression"], {
    animationState: "sleeping",
    equipped: { head: "acc-beanie", body: null, held: null },
  }),
  preset("bloomie", "Sedih / Lapar", ["expression"], {
    animationState: "sad",
    equipped: { head: null, held: null },
  }),

  // Color palettes (Warna)
  preset("droplet", "Merah Muda Sakura", ["color"], {
    colors: { primary: "#F9A8D4", secondary: "#F472B6", belly: "#FFF1F7" },
    equipped: { head: "acc-bow", glasses: null, held: null },
  }),
  preset("sunny", "Hijau Matcha", ["color"], {
    colors: { primary: "#86C06C", secondary: "#5B8E55", belly: "#F4FBEF" },
    equipped: { head: null, body: null, held: "acc-water-bottle" },
  }),
  preset("nyx", "Ungu Lavender", ["color"], {
    colors: { primary: "#C4B5FD", secondary: "#8B5CF6", belly: "#F5F3FF" },
    equipped: { head: null, glasses: "glasses-cool-shades", body: null },
  }),
  preset("biscuit", "Oranye Manis", ["color"], {
    colors: { primary: "#FFB066", secondary: "#FF9233", belly: "#FFF6EC" },
    equipped: { head: null, glasses: null, held: "acc-orange-slice" },
  }),

  // Outfits & Gear (Aksesori & Baju)
  preset("pippin", "Raja Pippin", ["headgear", "body"], {
    equipped: { head: "head-golden-crown", glasses: null, body: "body-hero-cape", held: null },
  }),
  preset("ziggy", "Kostum Olahraga", ["body", "held"], {
    equipped: { head: "acc-baseball-cap", glasses: null, body: "body-sport-jersey", held: "acc-water-bottle" },
  }),
  preset("clover", "Penjelajah Hutan", ["headgear", "body"], {
    equipped: { head: "head-explorer-hat", glasses: "glasses-nerd-specs", body: "acc-backpack", held: null },
  }),
  preset("bambi", "Koki Utama", ["headgear", "body", "held"], {
    equipped: { head: "acc-chef-hat", body: "body-chef-apron", held: "acc-carrot" },
  }),
];

/** Characters arranged around the hero, Duolingo-style cluster. */
export const HERO_CLUSTER: CalpalVariant[] = [
  CALPAL_SHOWCASE_VARIANTS[0],
  CALPAL_SHOWCASE_VARIANTS[1],
  CALPAL_SHOWCASE_VARIANTS[3],
  CALPAL_SHOWCASE_VARIANTS[4],
  CALPAL_SHOWCASE_VARIANTS[6],
];
