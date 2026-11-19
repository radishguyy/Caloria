import assert from "node:assert/strict";
import { NutritionLabelSchema } from "../nutrition-scan";

console.log("\n=== SUITE: NutritionLabelSchema ===");

// 1. Legacy payload without new optional fields still parses cleanly
{
  const parsed = NutritionLabelSchema.parse({
    foodName: "Susu UHT",
    servingSize: 250,
    servingUnit: "ml",
    servingsPerContainer: 1,
    caloriesKcal: 150,
    proteinG: 7,
    carbsG: 12,
    fatG: 8,
    fiberG: 0,
    sugarG: 10,
  });

  assert.equal(parsed.foodName, "Susu UHT");
  assert.equal(parsed.saturatedFatG, undefined);
  assert.equal(parsed.sodiumMg, undefined);
  console.log("  ✓ legacy nutrition scan payload remains valid");
}

// 2. Extended payload preserves saturatedFatG, sodiumMg, and productCategory
{
  const parsed = NutritionLabelSchema.parse({
    foodName: "Teh Botol",
    servingSize: 350,
    servingUnit: "ml",
    servingsPerContainer: 1,
    caloriesKcal: 140,
    proteinG: 0,
    carbsG: 35,
    fatG: 0,
    fiberG: 0,
    sugarG: 32,
    saturatedFatG: 0,
    sodiumMg: 25,
    productCategory: "beverage",
    confidenceScore: 0.94,
  });

  assert.equal(parsed.saturatedFatG, 0);
  assert.equal(parsed.sodiumMg, 25);
  assert.equal(parsed.productCategory, "beverage");
  console.log("  ✓ extended payload retains saturatedFatG, sodiumMg, productCategory");
}

// 3. Unknown category falls back gracefully instead of failing whole scan
{
  const parsed = NutritionLabelSchema.parse({
    foodName: "Kue Tradisional",
    servingSize: 50,
    servingUnit: "g",
    servingsPerContainer: null,
    caloriesKcal: 180,
    saturatedFatG: null,
    sodiumMg: null,
    productCategory: "traditional_cake",
  });

  assert.equal(parsed.saturatedFatG, null);
  assert.equal(parsed.sodiumMg, null);
  assert.equal(parsed.productCategory, "other");
  console.log("  ✓ unrecognized productCategory safely falls back to 'other'");
}

console.log("\nAll NutritionLabelSchema tests passed! ✅");
