import { CosmeticCategory } from "@/lib/cosmetics-catalog";

/**
 * Wardrobe categories are decided by where an item sits on the body.
 * The four categories reuse the existing equipment slots 1:1, so each
 * category still equips independently (one item per slot).
 */
export type WardrobeCategoryId = "clothing" | "head" | "accessory" | "food";

export interface WardrobeCategoryDef {
  id: WardrobeCategoryId;
  label: string;
  slot: CosmeticCategory;
}

export const WARDROBE_CATEGORIES: WardrobeCategoryDef[] = [
  { id: "clothing", label: "Pakaian", slot: "body" },
  { id: "head", label: "Kepala", slot: "head" },
  { id: "accessory", label: "Aksesoris", slot: "glasses" },
  { id: "food", label: "Makanan", slot: "held" },
];

/** Single source of truth: cosmetic item id -> wardrobe category. */
export const WARDROBE_ITEM_CATEGORY: Record<string, WardrobeCategoryId> = {
  // Kepala: head-worn items, including head-worn food
  "head-none": "head",
  "acc-beanie": "head",
  "acc-baseball-cap": "head",
  "acc-bucket-hat": "head",
  "acc-beret": "head",
  "acc-bow": "head",
  "acc-headphones": "head",
  "acc-lettuce-leaf-hat": "head",
  "acc-strawberry-hair-clip": "head",
  "acc-orange-slice": "head",
  "acc-chef-hat": "head",
  "acc-leafy-headband": "head",
  "acc-fruit-hat": "head",
  "head-explorer-hat": "head",
  "head-golden-crown": "head",
  "head-red-ribbon": "head",

  // Pakaian: clothes, scarves, capes, body-worn bags
  "body-none": "clothing",
  "acc-scarf": "clothing",
  "acc-backpack": "clothing",
  "acc-hoodie": "clothing",
  "body-chef-apron": "clothing",
  "body-hero-cape": "clothing",
  "body-sport-jersey": "clothing",

  // Aksesoris: face/eye items and other worn accessories
  "glasses-none": "accessory",
  "acc-round-glasses": "accessory",
  "acc-rectangular-glasses": "accessory",
  "acc-star-glasses": "accessory",
  "glasses-cool-shades": "accessory",
  "glasses-nerd-specs": "accessory",

  // Makanan: held food and drinks
  "held-none": "food",
  "acc-mini-burger": "food",
  "acc-apple": "food",
  "acc-carrot": "food",
  "acc-rice-bowl": "food",
  "acc-milk-carton": "food",
  "acc-water-bottle": "food",
};

export function getWardrobeCategory(
  itemId: string | null | undefined
): WardrobeCategoryId | null {
  if (!itemId) return null;
  return WARDROBE_ITEM_CATEGORY[itemId] ?? null;
}
