import { db } from "@/db";
import { plazaItems } from "@/db/schema/pets-plaza";
import {
  COSMETICS_CATALOG,
  CATEGORY_MAP,
  type PetCustomizationStateResult,
  type PurchaseResult,
} from "@/lib/cosmetics-catalog";

export type { PetCustomizationStateResult, PurchaseResult };

/**
 * Internal database helper to ensure all cosmetic accessories from COSMETICS_CATALOG exist in `plaza_items`.
 * This is a server utility and not a Server Action.
 */
export async function ensurePlazaItemsSeeded(): Promise<void> {
  try {
    const existing = await db
      .select({ assetUrl: plazaItems.assetUrl })
      .from(plazaItems);
    const existingKeys = new Set(existing.map((i) => i.assetUrl));

    const itemsToInsert = COSMETICS_CATALOG.filter(
      (item) => !item.isDefaultFree && !existingKeys.has(item.id),
    ).map((item) => ({
      name: item.name,
      category: CATEGORY_MAP[item.category] || "accessory",
      description: item.description,
      priceCoins: item.priceCoins,
      assetUrl: item.id,
      isAvailable: true,
      isEventItem: false,
    }));

    if (itemsToInsert.length > 0) {
      await db.insert(plazaItems).values(itemsToInsert);
    }
  } catch (err) {
    console.error("[ensurePlazaItemsSeeded] Error seeding plaza items:", err);
  }
}
