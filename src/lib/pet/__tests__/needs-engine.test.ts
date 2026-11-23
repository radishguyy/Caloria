import assert from "node:assert/strict";
import {
  getCurrentMealSlot,
  evaluateFeedEligibility,
  evaluatePetEligibility,
  evaluateCalpalNeeds,
  extractLoggedMainMealSlots,
  pickVariedFallbackDialogue,
} from "../needs-engine";

console.log("\n=== SUITE: CalPal Daily Needs (Makan 3x, Perhatian 3x, Misi Harian) ===");

// 1. Meal window detection (pagi, siang, malam, dini hari)
console.log("  TEST: Meal windows map correctly to pagi, siang, malam, and dini hari");
{
  const diniHari = new Date(2026, 10, 23, 3, 30);
  const pagi = new Date(2026, 10, 23, 8, 0);
  const siang = new Date(2026, 10, 23, 13, 0);
  const malam = new Date(2026, 10, 23, 19, 30);

  assert.equal(getCurrentMealSlot(diniHari), null);
  assert.equal(getCurrentMealSlot(pagi), "breakfast");
  assert.equal(getCurrentMealSlot(siang), "lunch");
  assert.equal(getCurrentMealSlot(malam), "dinner");
  console.log("  ✓ verified meal window boundaries");
}

// 2. Feeding eligibility: max 3x/day, 1 per meal window
console.log("  TEST: Feeding enforces 1x per meal window and max 3x per day");
{
  const pagi = new Date(2026, 10, 23, 8, 0);
  const siang = new Date(2026, 10, 23, 12, 30);
  const malam = new Date(2026, 10, 23, 19, 0);
  const diniHari = new Date(2026, 10, 23, 2, 0);

  // Outside meal hours
  const resEarly = evaluateFeedEligibility([], diniHari);
  assert.equal(resEarly.canFeed, false);
  assert.equal(resEarly.reason, "OUTSIDE_MEAL_HOURS");

  // Breakfast allowed once
  const resPagi1 = evaluateFeedEligibility([], pagi);
  assert.equal(resPagi1.canFeed, true);
  assert.equal(resPagi1.currentSlot, "breakfast");

  // Breakfast blocked second time
  const resPagi2 = evaluateFeedEligibility(["breakfast"], pagi);
  assert.equal(resPagi2.canFeed, false);
  assert.equal(resPagi2.reason, "SLOT_ALREADY_FED");

  // Lunch allowed after breakfast
  const resSiang = evaluateFeedEligibility(["breakfast"], siang);
  assert.equal(resSiang.canFeed, true);
  assert.equal(resSiang.currentSlot, "lunch");

  // Max 3x reached
  const resMax = evaluateFeedEligibility(["breakfast", "lunch", "dinner"], malam);
  assert.equal(resMax.canFeed, false);
  assert.equal(resMax.reason, "MAX_DAILY_FEEDS_REACHED");
  console.log("  ✓ verified max 3x/day meal-window feeding rules");
}

// 3. Petting eligibility: max 3x/day, gated by main meal logs (breakfast, lunch, dinner)
console.log("  TEST: Petting requires main meal logs (excluding snack) and caps at 3x/day");
{
  const todayKey = "2026-11-23";
  const loggedWithSnackOnly = extractLoggedMainMealSlots(
    [{ mealType: "snack", loggedDate: todayKey }],
    todayKey,
  );
  assert.deepEqual(loggedWithSnackOnly, []);

  // 0 main meals logged -> cannot pet
  const res0 = evaluatePetEligibility(0, loggedWithSnackOnly);
  assert.equal(res0.canPet, false);
  assert.equal(res0.reason, "NEED_MAIN_MEAL_LOG");

  // 1 main meal logged -> can pet 1x, blocked on 2nd
  const logged1 = extractLoggedMainMealSlots(
    [
      { mealType: "breakfast", loggedDate: todayKey },
      { mealType: "breakfast", loggedDate: todayKey }, // duplicate still 1 slot
    ],
    todayKey,
  );
  assert.deepEqual(logged1, ["breakfast"]);
  assert.equal(evaluatePetEligibility(0, logged1).canPet, true);
  assert.equal(evaluatePetEligibility(1, logged1).canPet, false);
  assert.equal(evaluatePetEligibility(1, logged1).reason, "NEED_MAIN_MEAL_LOG");

  // 3 main meals logged -> can pet up to 3x, blocked on 4th
  const logged3 = extractLoggedMainMealSlots(
    [
      { mealType: "breakfast", loggedDate: todayKey },
      { mealType: "lunch", loggedDate: todayKey },
      { mealType: "dinner", loggedDate: todayKey },
    ],
    todayKey,
  );
  assert.equal(evaluatePetEligibility(2, logged3).canPet, true);
  const resMaxPet = evaluatePetEligibility(3, logged3);
  assert.equal(resMaxPet.canPet, false);
  assert.equal(resMaxPet.reason, "MAX_DAILY_PETS_REACHED");
  console.log("  ✓ verified main-meal-gated petting & 3x/day limit");
}

// 4. Attention neglect & varied omelan
console.log("  TEST: Neglecting petting triggers attention complaining & varied dialogue");
{
  const now = new Date(2026, 10, 23, 14, 0);
  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

  const evalRes = evaluateCalpalNeeds({
    fedSlotsToday: ["breakfast", "lunch"],
    petCountToday: 0,
    needsResetDate: "2026-11-23",
    lastFedAt: now,
    lastPettedAt: eightHoursAgo,
    loggedMainMealsToday: [],
    completedDailyMissionsCount: 0,
    totalDailyMissionsCount: 3,
    now,
  });

  assert.equal(evalRes.isAttentionComplaining, true);
  assert.equal(evalRes.moodCategory, "needs_attention");
  assert.equal(evalRes.isComplaining, true);

  // Varied dialogue produces different strings across seeds
  const d1 = pickVariedFallbackDialogue({
    moodCategory: "needs_attention",
    currentSlot: "lunch",
    missedMealSlots: [],
    hoursSinceFed: 0,
    hasUnlockedPet: false,
    seed: 1,
  });
  const d2 = pickVariedFallbackDialogue({
    moodCategory: "needs_attention",
    currentSlot: "lunch",
    missedMealSlots: [],
    hoursSinceFed: 0,
    hasUnlockedPet: false,
    seed: 2,
  });
  assert.notEqual(d1, d2, "Omelan dialogue should vary across seeds");
  console.log("  ✓ verified attention neglect complaining and varied omelan");
}

// 5. Ecstatic / Senang state when daily missions or all daily needs are fulfilled
console.log("  TEST: CalPal becomes ecstatic when daily missions or daily needs are fulfilled");
{
  const now = new Date(2026, 10, 23, 18, 30);

  // Case A: All daily missions fulfilled (and not hungry)
  const missionDone = evaluateCalpalNeeds({
    fedSlotsToday: ["breakfast", "lunch", "dinner"],
    petCountToday: 1,
    needsResetDate: "2026-11-23",
    lastFedAt: now,
    lastPettedAt: now,
    loggedMainMealsToday: ["breakfast", "lunch"],
    completedDailyMissionsCount: 3,
    totalDailyMissionsCount: 3,
    now,
  });
  assert.equal(missionDone.isDailyMissionsFulfilled, true);
  assert.equal(missionDone.isEcstatic, true);
  assert.equal(missionDone.moodCategory, "ecstatic");

  // Case B: All daily needs fulfilled (3x makan + 3x elus)
  const needsDone = evaluateCalpalNeeds({
    fedSlotsToday: ["breakfast", "lunch", "dinner"],
    petCountToday: 3,
    needsResetDate: "2026-11-23",
    lastFedAt: now,
    lastPettedAt: now,
    loggedMainMealsToday: ["breakfast", "lunch", "dinner"],
    completedDailyMissionsCount: 1,
    totalDailyMissionsCount: 3,
    now,
  });
  assert.equal(needsDone.isDailyNeedsFulfilled, true);
  assert.equal(needsDone.isEcstatic, true);
  assert.equal(needsDone.moodCategory, "ecstatic");
  console.log("  ✓ verified ecstatic happy state on mission & daily needs completion");
}

console.log("\nAll CalPal daily needs tests passed successfully! ✅\n");
