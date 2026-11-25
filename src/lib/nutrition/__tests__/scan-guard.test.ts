import assert from "node:assert/strict";
import {
  MAX_SCAN_IMAGE_BYTES,
  validateScanFile,
  checkScanRateLimit,
  resetScanRateLimitStore,
} from "../scan-guard";

console.log("\n=== SUITE: Nutrition Scan Security Guards ===");

// 1. File validation
assert.deepEqual(
  validateScanFile({ size: 250_000, type: "image/jpeg" }),
  { ok: true }
);
assert.deepEqual(
  validateScanFile({ size: 250_000, type: "image/webp" }),
  { ok: true }
);

{
  const empty = validateScanFile({ size: 0, type: "image/jpeg" });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.status, 400);

  const badType = validateScanFile({ size: 1000, type: "application/pdf" });
  assert.equal(badType.ok, false);
  if (!badType.ok) assert.equal(badType.status, 400);

  const tooBig = validateScanFile({
    size: MAX_SCAN_IMAGE_BYTES + 1,
    type: "image/png",
  });
  assert.equal(tooBig.ok, false);
  if (!tooBig.ok) assert.equal(tooBig.status, 413);
  console.log("  ✓ validateScanFile enforces MIME image/* and 4 MB ceiling");
}

// 2. Rate limiting
{
  resetScanRateLimitStore();
  const baseTime = 1_700_000_000_000;
  for (let i = 0; i < 15; i++) {
    const res = checkScanRateLimit("user-1", baseTime + i * 100);
    assert.equal(res.allowed, true, `Request ${i + 1} should be allowed`);
  }

  const blocked = checkScanRateLimit("user-1", baseTime + 2_000);
  assert.equal(blocked.allowed, false, "16th request inside 60s must be blocked");
  assert.ok(blocked.retryAfterSec > 0);

  const otherUser = checkScanRateLimit("user-2", baseTime + 2_000);
  assert.equal(otherUser.allowed, true, "Other user has independent quota");

  const afterWindow = checkScanRateLimit("user-1", baseTime + 61_000);
  assert.equal(afterWindow.allowed, true, "Quota resets after 60s window");
  console.log("  ✓ checkScanRateLimit caps burst at 15 req/min per identity");
}

console.log("\nAll scan guard tests passed! ✅");
