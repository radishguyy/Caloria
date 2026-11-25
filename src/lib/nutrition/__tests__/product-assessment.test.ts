import assert from "node:assert/strict";
import {
  assessProduct,
  formatNutritionistSummary,
  NUTRITION_THRESHOLDS,
  servingToBaseUnits,
} from "../product-assessment";

console.log("\n=== SUITE: Product Nutrition Assessment Engine ===");

// 1. Unit conversion
assert.deepEqual(servingToBaseUnits(250, "mL"), { amount: 250, isVolume: true });
assert.deepEqual(servingToBaseUnits(85, "gram"), { amount: 85, isVolume: false });
assert.equal(servingToBaseUnits(3, "keping"), null);
assert.equal(servingToBaseUnits(0, "g"), null);
console.log("  ✓ servingToBaseUnits handles g/ml/non-mass units");

// 2. Sugary beverage -> poor or moderate with high sugar warning + beverage alternatives
{
  const res = assessProduct({
    servingSize: 250,
    servingUnit: "ml",
    caloriesKcal: 130,
    proteinG: 0,
    carbsG: 32,
    fatG: 0,
    fiberG: 0,
    sugarG: 28,
    saturatedFatG: 0,
    sodiumMg: 45,
    category: "beverage",
  });

  assert.ok(res.isBeverage, "Should detect beverage");
  assert.equal(res.basis, "per100");
  assert.notEqual(res.verdict, "good", "High-sugar drink must not be good");
  const sugarWarning = res.warnings.find((w) => w.nutrient === "sugar");
  assert.ok(sugarWarning && sugarWarning.level === "high", "Sugar should be high");
  assert.equal(sugarWarning?.dailyLimitPct, 56);
  assert.ok(!sugarWarning?.message.includes("—"), "Warning message must avoid em dash");
  assert.ok(res.suggestions.some((s) => /air putih|teh|infused/i.test(s)));
  assert.equal(res.calpalReaction.expression, "idle");
  assert.ok(res.calpalReaction.bubbleText.length > 0);
  console.log("  ✓ sugary beverage triggers high sugar warning and drink alternatives");
}

// 3. Instant noodle with high sodium + high saturated fat -> poor
{
  const res = assessProduct({
    servingSize: 85,
    servingUnit: "g",
    caloriesKcal: 380,
    proteinG: 8,
    carbsG: 54,
    fatG: 14,
    fiberG: 2,
    sugarG: 3,
    saturatedFatG: 6,
    sodiumMg: 1100,
    category: "instant_noodle",
  });

  assert.equal(res.verdict, "poor");
  assert.equal(res.warnings[0]?.level, "high");
  assert.ok(res.warnings.some((w) => w.nutrient === "sodium" && w.level === "high"));
  assert.ok(res.warnings.some((w) => w.nutrient === "saturatedFat" && w.level === "high"));
  assert.ok(res.suggestions.some((s) => /setengah bumbu|sayur/i.test(s)));
  assert.equal(res.calpalReaction.moodStatus, "complaining");
  console.log("  ✓ instant noodle triggers poor verdict, sorted warnings, and noodle tips");
}

// 4. Balanced high-protein / fiber snack (e.g. 100g edamame/protein yogurt) -> good, 0 warnings
{
  const res = assessProduct(
    {
      servingSize: 100,
      servingUnit: "g",
      caloriesKcal: 130,
      proteinG: 9,
      carbsG: 16,
      fatG: 1.2,
      fiberG: 4,
      sugarG: 1.5,
      saturatedFatG: 0.3,
      sodiumMg: 35,
      category: "snack",
    },
    { goalType: "bulking", remainingCalories: 600 }
  );

  assert.equal(res.verdict, "good");
  assert.equal(res.warnings.length, 0);
  assert.ok(res.positives.includes("Sumber serat"));
  assert.ok(res.positives.includes("Sumber protein yang baik"));
  assert.ok(res.positives.includes("Cocok untuk misi bulking kamu"));
  assert.equal(res.calpalReaction.expression, "happy");
  assert.equal(res.calpalReaction.moodStatus, "happy");
  console.log("  ✓ balanced snack returns good verdict, positives, and happy Calpal");
}

// 4b. High-fiber dry snack (40g, 130 kcal) -> still good verdict, informs calorie density
{
  const res = assessProduct({
    servingSize: 40,
    servingUnit: "g",
    caloriesKcal: 130,
    proteinG: 9,
    carbsG: 16,
    fatG: 1.2,
    fiberG: 4,
    sugarG: 1.5,
    saturatedFatG: 0.3,
    sodiumMg: 35,
    category: "snack",
  });

  assert.equal(res.verdict, "good");
  assert.ok(res.positives.includes("Tinggi serat"));
  assert.ok(res.warnings.some((w) => w.nutrient === "calories" && w.level === "medium"));
  console.log("  ✓ dry high-fiber snack stays good while noting calorie density");
}

// 5. Missing sodium/saturatedFat + non-mass unit ('keping') -> no NaN, missing tracked
{
  const res = assessProduct({
    servingSize: 3,
    servingUnit: "keping",
    caloriesKcal: 150,
    proteinG: 2,
    carbsG: 22,
    fatG: 6,
    fiberG: 1,
    sugarG: 9,
    saturatedFatG: null,
    sodiumMg: null,
  });

  assert.equal(res.basis, "perServing");
  assert.deepEqual(res.missing.sort(), ["saturatedFat", "sodium"]);
  assert.ok(res.warnings.every((w) => w.per100 === null && Number.isFinite(w.perServing)));
  console.log("  ✓ missing nutrients and non-mass unit handled safely");
}

// 6. Personal calorie budget note for diet goal
{
  const res = assessProduct(
    {
      servingSize: 50,
      servingUnit: "g",
      caloriesKcal: 250,
      proteinG: 3,
      carbsG: 35,
      fatG: 11,
      fiberG: 1,
      sugarG: 14,
    },
    { goalType: "diet", remainingCalories: 400, servingsConsumed: 1 }
  );

  assert.ok(res.personalNote?.includes("250 kkal"));
  assert.ok(res.personalNote?.includes("63%"));
  assert.ok(res.suggestions.some((s) => /setengah porsi/i.test(s)));
  assert.equal(res.thresholdsVersion, NUTRITION_THRESHOLDS.version);
  assert.ok(res.actionFeedback.length > 0 && res.actionFeedback.length <= 70);
  assert.ok(res.warnings.every((w) => w.shortLabel.length > 0 && !w.shortLabel.includes("(")));
  console.log("  ✓ diet remaining calorie note, short warning labels, and direct actionFeedback work");
}

// 7. Nutritionist consultation summary helper for "Tanyakan Ahli Gizi"
{
  const input = {
    servingSize: 250,
    servingUnit: "ml",
    caloriesKcal: 130,
    proteinG: 0,
    carbsG: 32,
    fatG: 0,
    fiberG: 0,
    sugarG: 28,
    saturatedFatG: 0,
    sodiumMg: 45,
    category: "beverage" as const,
  };
  const assessment = assessProduct(input);
  const text = formatNutritionistSummary("Teh Manis Botol", input, assessment);
  assert.ok(text.includes("Teh Manis Botol"));
  assert.ok(text.includes("130 kkal"));
  assert.ok(text.includes("Gula"));
  assert.ok(/ahli gizi|estimasi AI/i.test(text));
  console.log("  ✓ formatNutritionistSummary produces clean copy-ready consultation text");
}

console.log("\nAll product assessment tests passed! ✅");
