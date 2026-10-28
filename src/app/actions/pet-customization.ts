"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema/profiles";
import { plazaItems, userWardrobe, pets } from "@/db/schema/pets-plaza";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import {
  COSMETICS_CATALOG,
  DEFAULT_FREE_ITEM_IDS,
  type PetCustomizationStateResult,
  type PurchaseResult,
} from "@/lib/cosmetics-catalog";
import { ensurePlazaItemsSeeded } from "@/lib/plaza-sync";

/**
 * Fetches the user's pet customization state from PostgreSQL database:
 * - Current coins balance in profiles table
 * - Owned items from user_wardrobe table
 * - Equipped items from pets table
 */
export async function getPetCustomizationStateAction(): Promise<PetCustomizationStateResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: true,
        authenticated: false,
        coins: null,
        ownedItemIds: DEFAULT_FREE_ITEM_IDS,
        equipped: null,
      };
    }

    await ensurePlazaItemsSeeded();

    const [profile] = await db
      .select({
        id: profiles.id,
        caloriaCoins: profiles.caloriaCoins,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return {
        success: true,
        authenticated: true,
        coins: 0,
        ownedItemIds: DEFAULT_FREE_ITEM_IDS,
        equipped: null,
      };
    }

    const wardrobeRows = await db
      .select({
        assetUrl: plazaItems.assetUrl,
      })
      .from(userWardrobe)
      .innerJoin(plazaItems, eq(userWardrobe.itemId, plazaItems.id))
      .where(eq(userWardrobe.userId, user.id));

    const ownedItemIds = Array.from(
      new Set([
        ...DEFAULT_FREE_ITEM_IDS,
        ...wardrobeRows.map((r) => r.assetUrl),
      ]),
    );

    const [petRow] = await db
      .select({
        equippedHatId: pets.equippedHatId,
        equippedGlassesId: pets.equippedGlassesId,
        equippedOutfitId: pets.equippedOutfitId,
        equippedAccessoryId: pets.equippedAccessoryId,
        equippedRoomId: pets.equippedRoomId,
      })
      .from(pets)
      .where(eq(pets.userId, user.id))
      .limit(1);

    let equipped = null;
    if (petRow) {
      const allPlazaItems = await db.select().from(plazaItems);
      const plazaMap = new Map(allPlazaItems.map((p) => [p.id, p.assetUrl]));

      equipped = {
        head: petRow.equippedHatId
          ? plazaMap.get(petRow.equippedHatId) || "head-none"
          : "head-none",
        glasses: petRow.equippedGlassesId
          ? plazaMap.get(petRow.equippedGlassesId) || "glasses-none"
          : "glasses-none",
        body: petRow.equippedOutfitId
          ? plazaMap.get(petRow.equippedOutfitId) || "body-none"
          : "body-none",
        held: petRow.equippedAccessoryId
          ? plazaMap.get(petRow.equippedAccessoryId) || "held-none"
          : "held-none",
        skin: "skin-default",
        room: petRow.equippedRoomId
          ? plazaMap.get(petRow.equippedRoomId) || "room-default"
          : "room-default",
      };
    }

    return {
      success: true,
      authenticated: true,
      coins: profile.caloriaCoins,
      ownedItemIds,
      equipped,
    };
  } catch (err) {
    console.error("[getPetCustomizationStateAction] Error:", err);
    return {
      success: false,
      authenticated: false,
      coins: null,
      ownedItemIds: DEFAULT_FREE_ITEM_IDS,
      equipped: null,
    };
  }
}

/**
 * Purchases an accessory item with strict balance validation, race condition prevention,
 * and persistent storage in PostgreSQL user_wardrobe table.
 */
export async function purchaseAccessoryAction(
  itemId: string,
): Promise<PurchaseResult> {
  if (!itemId || typeof itemId !== "string") {
    return { success: false, message: "ID item tidak valid." };
  }

  const catalogItem = COSMETICS_CATALOG.find((i) => i.id === itemId);
  if (!catalogItem) {
    return {
      success: false,
      message: "Item tidak ditemukan dalam katalog aksesoris.",
    };
  }

  if (catalogItem.isDefaultFree) {
    return { success: false, message: "Item dasar ini sudah tersedia gratis." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Silakan login terlebih dahulu untuk membeli aksesoris.",
      };
    }

    await ensurePlazaItemsSeeded();

    const result = await db.transaction(async (tx) => {
      const [profile] = await tx
        .select({
          id: profiles.id,
          caloriaCoins: profiles.caloriaCoins,
        })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .for("update");

      if (!profile) {
        return { success: false, message: "Profil pengguna tidak ditemukan." };
      }

      const [plazaItem] = await tx
        .select()
        .from(plazaItems)
        .where(eq(plazaItems.assetUrl, itemId))
        .limit(1);

      if (!plazaItem) {
        return {
          success: false,
          message: "Item aksesoris tidak terdaftar di toko.",
        };
      }

      const [alreadyOwned] = await tx
        .select()
        .from(userWardrobe)
        .where(
          and(
            eq(userWardrobe.userId, user.id),
            eq(userWardrobe.itemId, plazaItem.id),
          ),
        )
        .limit(1);

      if (alreadyOwned) {
        return {
          success: false,
          message: "Kamu sudah memiliki aksesoris ini!",
        };
      }

      if (profile.caloriaCoins < plazaItem.priceCoins) {
        return {
          success: false,
          message: `Koin Caloria tidak mencukupi. Butuh ${plazaItem.priceCoins} Koin (Saldo kamu: ${profile.caloriaCoins} Koin).`,
        };
      }

      const newCoins = profile.caloriaCoins - plazaItem.priceCoins;
      await tx
        .update(profiles)
        .set({
          caloriaCoins: newCoins,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, user.id));

      await tx.insert(userWardrobe).values({
        userId: user.id,
        itemId: plazaItem.id,
      });

      return {
        success: true,
        message: `Berhasil membeli ${catalogItem.name}! Item kini tersimpan di Dandani Calpal.`,
        newCoins,
        itemId: catalogItem.id,
      };
    });

    return result;
  } catch (err: any) {
    console.error("[purchaseAccessoryAction] Transaction failed:", err);
    if (err?.code === "23505") {
      return { success: false, message: "Kamu sudah memiliki aksesoris ini!" };
    }
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses pembelian. Silakan coba lagi.",
    };
  }
}

/**
 * Saves equipped accessories to the database `pets` table.
 * Strictly verifies that any equipped item is owned by the user.
 */
export async function savePetEquippedAction(equippedLoadout: {
  head?: string | null;
  glasses?: string | null;
  body?: string | null;
  held?: string | null;
  skin?: string | null;
  room?: string | null;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Silakan login untuk menyimpan tampilan Calpal.",
      };
    }

    await ensurePlazaItemsSeeded();

    const wardrobeRows = await db
      .select({
        itemId: userWardrobe.itemId,
        assetUrl: plazaItems.assetUrl,
      })
      .from(userWardrobe)
      .innerJoin(plazaItems, eq(userWardrobe.itemId, plazaItems.id))
      .where(eq(userWardrobe.userId, user.id));

    const ownedMap = new Map(wardrobeRows.map((r) => [r.assetUrl, r.itemId]));

    const slots = [
      { key: "head", val: equippedLoadout.head },
      { key: "glasses", val: equippedLoadout.glasses },
      { key: "body", val: equippedLoadout.body },
      { key: "held", val: equippedLoadout.held },
      { key: "skin", val: equippedLoadout.skin },
      { key: "room", val: equippedLoadout.room },
    ] as const;

    for (const slot of slots) {
      if (slot.val && !DEFAULT_FREE_ITEM_IDS.includes(slot.val)) {
        if (!ownedMap.has(slot.val)) {
          return {
            success: false,
            message: `Aksesoris (${slot.val}) belum dimiliki. Kamu tidak dapat memasang item yang terkunci.`,
          };
        }
      }
    }

    const headPlazaId =
      equippedLoadout.head && ownedMap.has(equippedLoadout.head)
        ? ownedMap.get(equippedLoadout.head)
        : null;
    const glassesPlazaId =
      equippedLoadout.glasses && ownedMap.has(equippedLoadout.glasses)
        ? ownedMap.get(equippedLoadout.glasses)
        : null;
    const bodyPlazaId =
      equippedLoadout.body && ownedMap.has(equippedLoadout.body)
        ? ownedMap.get(equippedLoadout.body)
        : null;
    const heldPlazaId =
      equippedLoadout.held && ownedMap.has(equippedLoadout.held)
        ? ownedMap.get(equippedLoadout.held)
        : null;
    const roomPlazaId =
      equippedLoadout.room && ownedMap.has(equippedLoadout.room)
        ? ownedMap.get(equippedLoadout.room)
        : null;

    await db
      .update(pets)
      .set({
        equippedHatId: headPlazaId,
        equippedGlassesId: glassesPlazaId,
        equippedOutfitId: bodyPlazaId,
        equippedAccessoryId: heldPlazaId,
        equippedRoomId: roomPlazaId,
        skinColor: equippedLoadout.skin || "default",
        updatedAt: new Date(),
      })
      .where(eq(pets.userId, user.id));

    return {
      success: true,
      message: "Kustomisasi Calpal berhasil disimpan ke profil!",
    };
  } catch (err) {
    console.error("[savePetEquippedAction] Error:", err);
    return {
      success: false,
      message: "Gagal menyimpan aksesoris Calpal ke server.",
    };
  }
}
