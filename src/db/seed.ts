import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { foods, accessories, plazaItems, badges } from "./schema";
import { FOOD_CATALOG } from "../lib/food-catalog";
import { COSMETICS_CATALOG, CATEGORY_MAP } from "../lib/cosmetics-catalog";
import { ACHIEVEMENTS_DATA } from "../lib/achievements-data";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined in .env.local");
  }

  console.log("🌱 Starting Caloria Database Seeding...");

  const client = postgres(connectionString, {
    max: 1,
    ssl: connectionString.includes("pooler.supabase.com") ? "require" : undefined,
  });
  const db = drizzle(client);

  try {
    // ========================================================
    // 1. Seed Master Everyday Foods Catalog
    // ========================================================
    console.log(`📦 Seeding ${FOOD_CATALOG.length} verified food catalog items...`);
    let seededFoodsCount = 0;

    for (const item of FOOD_CATALOG) {
      const [existing] = await db
        .select({ id: foods.id })
        .from(foods)
        .where(eq(foods.name, item.name))
        .limit(1);

      if (existing) {
        await db
          .update(foods)
          .set({
            servingSize: String(item.gramsPerUnit || 100),
            servingSizeDefault: "1",
            servingUnit: item.servingUnit,
            calories: String(item.calories),
            caloriesKcal: String(item.calories),
            protein: String(item.proteinG),
            proteinG: String(item.proteinG),
            carbs: String(item.carbsG),
            carbsG: String(item.carbsG),
            fat: String(item.fatG),
            fatG: String(item.fatG),
            fiber: String(item.fiberG || 0),
            fiberG: String(item.fiberG || 0),
            sugar: String(item.sugarG || 0),
            sugarG: String(item.sugarG || 0),
            isVerified: true,
          })
          .where(eq(foods.id, existing.id));
      } else {
        await db.insert(foods).values({
          name: item.name,
          brand: item.brandOrSource || null,
          servingSize: String(item.gramsPerUnit || 100),
          servingSizeDefault: "1",
          servingUnit: item.servingUnit,
          calories: String(item.calories),
          caloriesKcal: String(item.calories),
          protein: String(item.proteinG),
          proteinG: String(item.proteinG),
          carbs: String(item.carbsG),
          carbsG: String(item.carbsG),
          fat: String(item.fatG),
          fatG: String(item.fatG),
          fiber: String(item.fiberG || 0),
          fiberG: String(item.fiberG || 0),
          sugar: String(item.sugarG || 0),
          sugarG: String(item.sugarG || 0),
          isVerified: true,
          createdByUserId: null,
        });
      }
      seededFoodsCount++;
    }
    console.log(`✅ Seeded ${seededFoodsCount} verified foods.`);

    // ========================================================
    // 2. Seed Modular Accessories & Plaza Items Catalog
    // ========================================================
    console.log(`👒 Seeding ${COSMETICS_CATALOG.length} modular accessories & shop items...`);
    let seededAccCount = 0;

    for (const item of COSMETICS_CATALOG) {
      // Seed into accessories table
      await db
        .insert(accessories)
        .values({
          id: item.id,
          name: item.name,
          slot: item.category,
          priceCoins: item.priceCoins,
          assetKey: item.id,
          rarity: item.priceCoins > 150 ? "epic" : item.priceCoins > 50 ? "rare" : "common",
        })
        .onConflictDoUpdate({
          target: [accessories.id],
          set: {
            name: item.name,
            slot: item.category,
            priceCoins: item.priceCoins,
            assetKey: item.id,
            rarity: item.priceCoins > 150 ? "epic" : item.priceCoins > 50 ? "rare" : "common",
          },
        });

      // Seed into plaza_items table for backwards-compatibility
      const plazaCategory = CATEGORY_MAP[item.category] || "accessory";
      const [existingPlaza] = await db
        .select({ id: plazaItems.id })
        .from(plazaItems)
        .where(eq(plazaItems.assetUrl, item.id))
        .limit(1);

      if (existingPlaza) {
        await db
          .update(plazaItems)
          .set({
            name: item.name,
            category: plazaCategory,
            priceCoins: item.priceCoins,
            description: item.description,
            isAvailable: true,
          })
          .where(eq(plazaItems.id, existingPlaza.id));
      } else {
        await db.insert(plazaItems).values({
          name: item.name,
          category: plazaCategory,
          priceCoins: item.priceCoins,
          assetUrl: item.id,
          description: item.description,
          isAvailable: true,
          isEventItem: false,
        });
      }

      seededAccCount++;
    }
    console.log(`✅ Seeded ${seededAccCount} accessories & plaza items.`);

    // ========================================================
    // 3. Seed Achievement Badges
    // ========================================================
    console.log(`🏆 Seeding ${ACHIEVEMENTS_DATA.length} achievement badges...`);
    let seededBadgesCount = 0;

    for (const b of ACHIEVEMENTS_DATA) {
      const [existingBadge] = await db
        .select({ id: badges.id })
        .from(badges)
        .where(eq(badges.code, b.id))
        .limit(1);

      if (existingBadge) {
        await db
          .update(badges)
          .set({
            title: b.name,
            category: b.category,
            description: b.description,
            iconUrl: b.iconEmoji,
            thresholdValue: b.rewardCoins,
          })
          .where(eq(badges.id, existingBadge.id));
      } else {
        await db.insert(badges).values({
          code: b.id,
          title: b.name,
          category: b.category,
          description: b.description,
          iconUrl: b.iconEmoji,
          thresholdValue: b.rewardCoins,
        });
      }
      seededBadgesCount++;
    }
    console.log(`✅ Seeded ${seededBadgesCount} achievement badges.`);

    console.log("✨ Caloria database successfully seeded!");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Seeding failed with error:", err);
  process.exit(1);
});

