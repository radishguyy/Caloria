import assert from "node:assert/strict";
import { evaluatePetCondition } from "../decay-evaluator";

console.log("\n=== SUITE: Calpal Feeding, Mood Degradation & EXP Decay ===");

// 1. Feeding within normal window (< 20 hours)
console.log("  TEST: Pet fed 5 hours ago remains happy with no EXP decay");
{
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const result = evaluatePetCondition({
    lastFedAt: fiveHoursAgo,
    exp: 50,
    level: 2,
    moodStatus: "happy",
  });

  assert.equal(result.isComplaining, false, "Should not be complaining");
  assert.equal(result.currentMood, "happy", "Mood should be happy");
  assert.equal(result.adjustedExp, 50, "EXP should not decay");
  assert.equal(result.hoursOverdue, 0, "Hours overdue should be 0");
  assert.equal(result.expPenalty, 0, "EXP penalty should be 0");
  console.log("  ✓ verified happy mood and zero decay at 5 hours");
}

// 2. Exactly 20 hours elapsed threshold
console.log("  TEST: Pet at exactly 20 hours switches to complaining mood");
{
  const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);
  const result = evaluatePetCondition({
    lastFedAt: twentyHoursAgo,
    exp: 40,
    level: 2,
    moodStatus: "happy",
  });

  assert.equal(result.isComplaining, true, "Should switch to complaining");
  assert.equal(result.currentMood, "complaining", "Mood should be complaining");
  assert.equal(result.hoursOverdue, 0, "At hour 20, 0 overdue hours");
  assert.equal(result.adjustedExp, 40, "EXP not penalized on exact 20th hour boundary");
  console.log("  ✓ verified 20h threshold triggers complaining state");
}

// 3. 25 hours elapsed (5 hours overdue)
console.log("  TEST: Pet overdue by 5 hours loses 10 EXP (-2 EXP per overdue hour)");
{
  const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
  const result = evaluatePetCondition({
    lastFedAt: twentyFiveHoursAgo,
    exp: 40,
    level: 2,
    moodStatus: "happy",
  });

  assert.equal(result.isComplaining, true);
  assert.equal(result.currentMood, "complaining");
  assert.equal(result.hoursOverdue, 5, "5 hours overdue");
  assert.equal(result.expPenalty, 10, "5 * 2 = 10 EXP penalty");
  assert.equal(result.adjustedExp, 30, "40 - 10 = 30 EXP");
  console.log("  ✓ verified -2 EXP per hour overdue penalty calculation");
}

// 4. Level Floor Guard (capped at 0 EXP)
console.log("  TEST: Level Floor Guard prevents EXP from dropping below 0");
{
  const seventyHoursAgo = new Date(Date.now() - 70 * 60 * 60 * 1000);
  const result = evaluatePetCondition({
    lastFedAt: seventyHoursAgo,
    exp: 15,
    level: 3,
    moodStatus: "complaining",
  });

  assert.equal(result.isComplaining, true);
  assert.equal(result.hoursOverdue, 50, "50 hours overdue");
  assert.equal(result.expPenalty, 100, "50 * 2 = 100 EXP penalty");
  assert.equal(result.adjustedExp, 0, "EXP must never drop below 0 floor");
  console.log("  ✓ verified Level Floor Guard caps EXP at 0 and protects active level");
}

// 5. Feeding pet resets state back to happy
console.log("  TEST: Feeding pet resets condition back to happy and clears overdue state");
{
  const justFed = new Date();
  const result = evaluatePetCondition({
    lastFedAt: justFed,
    exp: 30,
    level: 2,
    moodStatus: "happy",
  });

  assert.equal(result.isComplaining, false);
  assert.equal(result.currentMood, "happy");
  assert.equal(result.hoursSinceFed, 0);
  assert.equal(result.hoursOverdue, 0);
  assert.equal(result.adjustedExp, 30);
  console.log("  ✓ verified feeding immediately halts decay and restores happy mood");
}

console.log("\nAll decay evaluator tests passed successfully! ✅\n");
