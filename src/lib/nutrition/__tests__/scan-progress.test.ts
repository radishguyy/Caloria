import assert from "node:assert/strict";
import { getScanWaitState, SCAN_PROGRESS_STEPS } from "../scan-progress";

console.log("\n=== SUITE: Scan Waiting Progress State ===");

assert.equal(SCAN_PROGRESS_STEPS.length, 3);
assert.deepEqual(
  SCAN_PROGRESS_STEPS.map((s) => s.id),
  ["compressing", "scanning", "analyzing"]
);

// 1. Compressing stage highlights step 1
{
  const state = getScanWaitState("compressing", 250);
  assert.equal(state.activeStepIndex, 0);
  assert.equal(state.steps[0].status, "active");
  assert.equal(state.steps[1].status, "pending");
  assert.equal(state.steps[2].status, "pending");
  assert.ok(state.progressPercent > 0 && state.progressPercent < 35);
  assert.equal(state.elapsedLabel, "0 dtk");
  console.log("  ✓ compressing stage activates step 1 cleanly");
}

// 2. Scanning stage evolves microcopy & monotonically grows progress during Gemini API wait
{
  const early = getScanWaitState("scanning", 1200);
  const mid = getScanWaitState("scanning", 4200);
  const late = getScanWaitState("scanning", 8100);

  assert.equal(early.activeStepIndex, 1);
  assert.equal(early.steps[0].status, "done");
  assert.equal(early.steps[1].status, "active");
  assert.equal(early.steps[2].status, "pending");

  assert.notEqual(early.detail, mid.detail);
  assert.notEqual(mid.detail, late.detail);
  assert.ok(mid.progressPercent > early.progressPercent);
  assert.ok(late.progressPercent > mid.progressPercent);
  assert.ok(late.progressPercent < 90, "Must never pretend 100% before response arrives");
  assert.equal(late.elapsedLabel, "8 dtk");
  console.log("  ✓ scanning stage advances feedback & progress during long AI calls");
}

// 3. Analyzing stage marks scanning complete and reaches near-completion
{
  const state = getScanWaitState("analyzing", 9500);
  assert.equal(state.activeStepIndex, 2);
  assert.equal(state.steps[0].status, "done");
  assert.equal(state.steps[1].status, "done");
  assert.equal(state.steps[2].status, "active");
  assert.ok(state.progressPercent >= 90 && state.progressPercent < 100);
  console.log("  ✓ analyzing stage marks step 3 active near completion");
}

// 4. Real food mode adapts copy cleanly for plated meals
{
  const comp = getScanWaitState("compressing", 100, "food");
  const scan = getScanWaitState("scanning", 3200, "food");
  const analyze = getScanWaitState("analyzing", 7000, "food");

  assert.match(comp.headline, /Makanan/i);
  assert.match(scan.headline, /Makanan/i);
  assert.match(scan.detail, /komponen|porsi|kalori/i);
  assert.match(analyze.headline, /Estimasi|Gizi/i);
  assert.notEqual(scan.steps[1].label, getScanWaitState("scanning", 3200, "label").steps[1].label);
  console.log("  ✓ food mode uses meal-specific waiting copy and step labels");
}

console.log("\nAll scan progress tests passed! ✅");
