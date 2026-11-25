import assert from "node:assert/strict";
import {
  computeReticleCropRect,
  createScanClient,
  fitWithinMaxDimension,
  ScanApiError,
} from "../scan-client";
import type { NutritionLabelData } from "@/lib/schemas/nutrition-scan";

console.log("\n=== SUITE: Nutrition Scan Client & Cache ===");

assert.deepEqual(fitWithinMaxDimension(1920, 1080, 960), { width: 960, height: 540 });
assert.deepEqual(fitWithinMaxDimension(720, 1440, 960), { width: 480, height: 960 });
assert.deepEqual(fitWithinMaxDimension(640, 480, 960), { width: 640, height: 480 });
console.log("  ✓ fitWithinMaxDimension preserves aspect ratio within max bound");

// Reticle crop mapping under object-cover on portrait mobile viewport
{
  // Video is 1280x720 (16:9 landscape), displayed in 390x700 (tall mobile) with object-cover
  // Scale = max(390/1280, 700/720) = 700/720 = 0.9722; renderedW = 1244.44, offsetX = 427.22
  const crop = computeReticleCropRect({
    videoWidth: 1280,
    videoHeight: 720,
    videoRect: { left: 0, top: 0, width: 390, height: 700 },
    reticleRect: { left: 30, top: 220, width: 330, height: 247.5 },
    paddingRatio: 0,
  });
  assert.ok(crop.sx > 400 && crop.sx < 500, `Expected centered sx, got ${crop.sx}`);
  assert.ok(crop.sy > 200 && crop.sy < 260, `Expected centered sy, got ${crop.sy}`);
  assert.ok(crop.sw > 300 && crop.sw < 380, `Expected mapped sw, got ${crop.sw}`);
  assert.ok(crop.sx + crop.sw <= 1280 && crop.sy + crop.sh <= 720);
  console.log("  ✓ computeReticleCropRect maps object-cover reticle box to raw video pixels");
}

async function run() {
  const sampleData: NutritionLabelData = {
    scanMode: "label",
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
    isReadableNutritionLabel: true,
    detectedItems: [],
    hiddenCalorieNotes: [],
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

  // 2b. Mode-separated cache & FormData mode field
  {
    const seenModes: string[] = [];
    const dualClient = createScanClient({
      hashFn: async () => "same-image-hash",
      fetchFn: async (_url, init) => {
        const fd = init?.body as FormData;
        const mode = String(fd.get("mode") ?? "");
        seenModes.push(mode);
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              ...sampleData,
              foodName: mode === "food" ? "Nasi Goreng" : "Susu Cokelat",
              scanMode: mode === "food" ? "food" : "label",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const asLabel = await dualClient.scanBlob(blobA, { mode: "label" });
    const asFood = await dualClient.scanBlob(blobA, { mode: "food" });
    const asFoodCached = await dualClient.scanBlob(blobA, { mode: "food" });

    assert.deepEqual(seenModes, ["label", "food"]);
    assert.equal(asLabel.foodName, "Susu Cokelat");
    assert.equal(asFood.foodName, "Nasi Goreng");
    assert.equal(asFoodCached.foodName, "Nasi Goreng");
    console.log("  ✓ cache isolates label vs food mode for the same image");
  }

  // 3. Server error surfaces structured ScanApiError with code and suggestedMode
  const failingClient = createScanClient({
    hashFn: async () => "err-hash",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          success: false,
          code: "WRONG_MODE",
          suggestedMode: "food",
          error: "Foto ini terlihat seperti makanan langsung.",
        }),
        { status: 422 }
      ),
  });

  await assert.rejects(
    () => failingClient.scanBlob(blobA, { mode: "label" }),
    (err: unknown) => {
      assert.ok(err instanceof ScanApiError);
      assert.equal(err.code, "WRONG_MODE");
      assert.equal(err.suggestedMode, "food");
      assert.match(err.message, /makanan langsung/i);
      return true;
    }
  );
  console.log("  ✓ non-OK response rejects with structured ScanApiError");

  // 4. Client timeout aborts hanging fetch and surfaces clear Indonesian guidance
  {
    let fetchAborted = false;
    const slowClient = createScanClient({
      hashFn: async () => "slow-hash",
      timeoutMs: 40,
      fetchFn: async (_url, init) =>
        new Promise((resolve, reject) => {
          const t = setTimeout(
            () => resolve(new Response(JSON.stringify({ success: true, data: sampleData }), { status: 200 })),
            250
          );
          init?.signal?.addEventListener("abort", () => {
            clearTimeout(t);
            fetchAborted = true;
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    });

    await assert.rejects(
      () => slowClient.scanBlob(blobA),
      /terlalu lama|habis/i
    );
    assert.equal(fetchAborted, true, "Client timeout must abort underlying fetch");
    console.log("  ✓ client timeout aborts hanging scan request cleanly");
  }

  console.log("\nAll scan client tests passed! ✅");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
