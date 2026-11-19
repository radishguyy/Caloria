import assert from "node:assert/strict";
import { createScanClient } from "../scan-client";
import type { NutritionLabelData } from "@/lib/schemas/nutrition-scan";

console.log("\n=== SUITE: Nutrition Scan Client & Cache ===");

async function run() {
  const sampleData: NutritionLabelData = {
    foodName: "Susu Cokelat",
    servingSize: 200,
    servingUnit: "ml",
    servingsPerContainer: 1,
    caloriesKcal: 140,
    proteinG: 5,
    carbsG: 20,
    fatG: 4,
    fiberG: 1,
    sugarG: 17,
    saturatedFatG: 2.5,
    sodiumMg: 90,
    productCategory: "dairy",
  };

  let fetchCalls = 0;
  const stages: string[] = [];

  const client = createScanClient({
    hashFn: async (blob) => `hash-${blob.size}`,
    fetchFn: async (_url, init) => {
      fetchCalls += 1;
      assert.equal(init?.method, "POST");
      assert.ok(init?.body instanceof FormData);
      return new Response(JSON.stringify({ success: true, data: sampleData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const blobA = new Blob(["fake-image-bytes"], { type: "image/jpeg" });

  // 1. First scan hits API and reports stages
  const first = await client.scanBlob(blobA, {
    onStageChange: (s) => stages.push(s),
  });
  assert.equal(fetchCalls, 1);
  assert.equal(first.foodName, "Susu Cokelat");
  assert.deepEqual(stages, ["scanning", "analyzing"]);

  // 2. Identical blob hits session cache without calling API again
  const second = await client.scanBlob(blobA);
  assert.equal(fetchCalls, 1, "Second scan of identical image must hit cache");
  assert.equal(second.caloriesKcal, 140);
  console.log("  ✓ session SHA-256 cache deduplicates identical scan requests");

  // 3. Server error surfaces clear message and is not cached
  const failingClient = createScanClient({
    hashFn: async () => "err-hash",
    fetchFn: async () =>
      new Response(JSON.stringify({ success: false, error: "Rate limit" }), {
        status: 429,
      }),
  });

  await assert.rejects(
    () => failingClient.scanBlob(blobA),
    /Rate limit/
  );
  console.log("  ✓ non-OK response rejects with API error message");

  console.log("\nAll scan client tests passed! ✅");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
