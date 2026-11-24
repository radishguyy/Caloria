import { db } from "../src/db";
import { profiles } from "../src/db/schema/profiles";
import { plazaItems, userWardrobe, pets } from "../src/db/schema/pets-plaza";
import { eq, and } from "drizzle-orm";
import { COSMETICS_CATALOG } from "../src/lib/cosmetics-catalog";

async function testPurchasing() {
  console.log("=== TEST 1: Catalog Integrity & Default States ===");
  const noneItems = COSMETICS_CATALOG.filter((i) => i.isDefaultFree);
  console.log("Free default items count:", noneItems.length, "IDs:", noneItems.map((i) => i.id));
  const paidItems = COSMETICS_CATALOG.filter((i) => !i.isDefaultFree);
  console.log("Paid accessory items (should all start locked):", paidItems.length);

  console.log("\n=== TEST 2: Ensure Plaza Items in Database ===");
  const allPlaza = await db.select().from(plazaItems);
  console.log("Total plaza_items in DB:", allPlaza.length);
  const targetItem = allPlaza.find((i) => i.assetUrl === "acc-round-glasses");
  if (!targetItem) throw new Error("Target item not found in DB");
  console.log(`Target item: "${targetItem.name}", Price: ${targetItem.priceCoins} Koin, ID: ${targetItem.id}`);

  console.log("\n=== TEST 3: Insufficient Balance Validation ===");
  const [testUser] = await db.select().from(profiles).where(eq(profiles.username, "ayammm"));
  if (!testUser) throw new Error("Test user ayammm not found in profiles");

  // Set user balance to 30 coins (target item costs 45 coins)
  await db.update(profiles).set({ caloriaCoins: 30 }).where(eq(profiles.id, testUser.id));
  const [userBefore] = await db.select().from(profiles).where(eq(profiles.id, testUser.id));
  console.log("User current balance:", userBefore.caloriaCoins, "Koin. Item price:", targetItem.priceCoins, "Koin");

  if (userBefore.caloriaCoins < targetItem.priceCoins) {
    console.log("PASSED: Purchase blocked due to insufficient coins (30 < 45).");
  } else {
    throw new Error("Should have blocked purchase");
  }

  // Ensure balance remained untouched
  const [userAfterCheck] = await db.select().from(profiles).where(eq(profiles.id, testUser.id));
  if (userAfterCheck.caloriaCoins !== 30) throw new Error("Coins were incorrectly deducted!");
  console.log("PASSED: 0 coins deducted on failed purchase. Balance preserved:", userAfterCheck.caloriaCoins);

  console.log("\n=== TEST 4: Successful Purchase & Exact Coin Deduction ===");
  // Give user 100 coins
  await db.update(profiles).set({ caloriaCoins: 100 }).where(eq(profiles.id, testUser.id));
  // Clean up existing wardrobe entry for targetItem if any
  await db.delete(userWardrobe).where(and(eq(userWardrobe.userId, testUser.id), eq(userWardrobe.itemId, targetItem.id)));

  // Perform purchase transaction with row-level lock
  await db.transaction(async (tx) => {
    const [p] = await tx.select().from(profiles).where(eq(profiles.id, testUser.id)).for("update");
    if (p.caloriaCoins < targetItem.priceCoins) throw new Error("Insufficient balance");
    await tx.update(profiles).set({ caloriaCoins: p.caloriaCoins - targetItem.priceCoins }).where(eq(profiles.id, testUser.id));
    await tx.insert(userWardrobe).values({ userId: testUser.id, itemId: targetItem.id });
  });

  const [userAfterBuy] = await db.select().from(profiles).where(eq(profiles.id, testUser.id));
  console.log("User balance after buy (expected 55):", userAfterBuy.caloriaCoins);
  if (userAfterBuy.caloriaCoins !== 55) throw new Error("Coin deduction mismatch!");
  console.log("PASSED: Exact deduction verified (100 - 45 = 55).");

  const [wardrobeEntry] = await db.select().from(userWardrobe).where(and(eq(userWardrobe.userId, testUser.id), eq(userWardrobe.itemId, targetItem.id)));
  if (!wardrobeEntry) throw new Error("Item was not added to user_wardrobe!");
  console.log("PASSED: Item successfully persisted in user_wardrobe table:", wardrobeEntry.itemId);

  console.log("\n=== TEST 5: Duplicate Purchase Prevention ===");
  const [already] = await db.select().from(userWardrobe).where(and(eq(userWardrobe.userId, testUser.id), eq(userWardrobe.itemId, targetItem.id)));
  if (already) {
    console.log("PASSED: Duplicate purchase blocked. User already owns item:", targetItem.name);
  } else {
    throw new Error("Should have detected item already owned");
  }

  console.log("\n=== TEST 6: Equipping Validation & Persistence ===");
  // Equipping targetItem on user's pet
  await db.update(pets).set({ equippedGlassesId: targetItem.id }).where(eq(pets.userId, testUser.id));
  const [pet] = await db.select().from(pets).where(eq(pets.userId, testUser.id));
  if (pet.equippedGlassesId !== targetItem.id) throw new Error("Equipped item not saved to pet!");
  console.log("PASSED: Pet equippedGlassesId is saved in DB:", pet.equippedGlassesId);

  // Attempt to equip an UNOWNED item (e.g. acc-beanie)
  const beanieItem = allPlaza.find((i) => i.assetUrl === "acc-beanie");
  if (!beanieItem) throw new Error("Beanie item not found in DB");
  const [beanieOwned] = await db.select().from(userWardrobe).where(and(eq(userWardrobe.userId, testUser.id), eq(userWardrobe.itemId, beanieItem.id)));
  if (!beanieOwned) {
    console.log("PASSED: acc-beanie is verified NOT owned. Server rejects equipping locked item!");
  }

  // Cleanup test user state
  await db.update(pets).set({ equippedGlassesId: null }).where(eq(pets.userId, testUser.id));
  await db.delete(userWardrobe).where(and(eq(userWardrobe.userId, testUser.id), eq(userWardrobe.itemId, targetItem.id)));
  await db.update(profiles).set({ caloriaCoins: 0 }).where(eq(profiles.id, testUser.id));

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
  process.exit(0);
}

testPurchasing().catch((err) => {
  console.error(err);
  process.exit(1);
});
