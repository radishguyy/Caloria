import assert from "node:assert/strict";
import {
  calculateWeeklyProgression,
  evaluateMissionAutoStatus,
  PATH_STAGES,
  getDynamicQuestTargets,
  type GoalPath,
} from "../quest-engine";

console.log("\n=== SUITE: Quest Progression & Auto-Mission Completion ===");

// 1. Path Stages & Locking
console.log("  TEST: Path Stages contain only levels for the specific goal path");
{
  assert.equal(PATH_STAGES.gain_muscle.some((s) => s.level === 4), false, "Bulking path should not have Level 4");
  assert.equal(PATH_STAGES.gain_muscle.some((s) => s.level === 5), true, "Bulking path has Level 5");
  assert.equal(PATH_STAGES.maintain_weight.length, 2, "Maintenance path has only Levels 1 & 2");
  console.log("  ✓ verified distinct stages per GoalPath");
}

// 2. Start Date & 75% Weekly Progression
console.log("  TEST: Brand new user (0 days elapsed) is locked to Level 1");
{
  const res = calculateWeeklyProgression({
    startDate: "2026-10-29",
    todayDateStr: "2026-10-29",
    goalPath: "lose_weight",
    logs: [],
    targetCalories: 2000,
  });

  assert.equal(res.totalDaysElapsed, 0);
  assert.equal(res.currentCalendarWeek, 1);
  assert.equal(res.dayInCurrentWeek, 1);
  assert.equal(res.activeStage.level, 1);
  assert.equal(res.activeStage.week, 1);
  assert.equal(res.unlockedStages.length, 1);
  assert.equal(res.unlockedStages[0].level, 1);
  console.log("  ✓ verified new user starts on Level 1 Day 1 with future levels locked");
}

console.log("  TEST: 1 week elapsed with >= 75% compliance unlocks Level 2");
{
  // User started 7 days ago on 2026-10-22
  const logs = [
    { loggedDate: "2026-10-22", calories: 1900, proteinG: 100, carbsG: 200, fatG: 50 },
    { loggedDate: "2026-10-23", calories: 1950, proteinG: 100, carbsG: 200, fatG: 50 },
    { loggedDate: "2026-10-24", calories: 1850, proteinG: 100, carbsG: 200, fatG: 50 },
    { loggedDate: "2026-10-25", calories: 1900, proteinG: 100, carbsG: 200, fatG: 50 },
    { loggedDate: "2026-10-26", calories: 2000, proteinG: 100, carbsG: 200, fatG: 50 },
    { loggedDate: "2026-10-27", calories: 1900, proteinG: 100, carbsG: 200, fatG: 50 },
    // 6 out of 7 days met => 85.7% >= 75%
  ];

  const res = calculateWeeklyProgression({
    startDate: "2026-10-22",
    todayDateStr: "2026-10-29", // 7 days later
    goalPath: "lose_weight",
    logs,
    targetCalories: 2000,
  });

  assert.equal(res.totalDaysElapsed, 7);
  assert.equal(res.currentCalendarWeek, 2);
  assert.equal(res.activeStage.level, 2);
  assert.equal(res.activeStage.week, 1);
  assert.equal(res.isRepeating, false);
  assert.equal(res.unlockedStages.length, 2);
  console.log("  ✓ verified user advancing to Level 2 Week 1 after >= 75% weekly compliance");
}

console.log("  TEST: 1 week elapsed with < 75% compliance forces repeat of Level 1");
{
  // User started 7 days ago on 2026-10-22, but only logged 2 compliant days
  const logs = [
    { loggedDate: "2026-10-22", calories: 1900, proteinG: 100, carbsG: 200, fatG: 50 },
    { loggedDate: "2026-10-23", calories: 1950, proteinG: 100, carbsG: 200, fatG: 50 },
    // Only 2 of 7 days met => 28.5% < 75%
  ];

  const res = calculateWeeklyProgression({
    startDate: "2026-10-22",
    todayDateStr: "2026-10-29",
    goalPath: "lose_weight",
    logs,
    targetCalories: 2000,
  });

  assert.equal(res.totalDaysElapsed, 7);
  assert.equal(res.activeStage.level, 1); // Still on level 1!
  assert.equal(res.isRepeating, true); // Marked as repeating
  assert.equal(res.repeatCount, 1);
  assert.equal(res.unlockedStages.length, 1); // Level 2 remains locked!
  console.log("  ✓ verified user forced to repeat Level 1 when falling short of 75%");
}

// 3. Automated Mission Completion Driven by Food Logs & Calories (Not To-Do Checklist)
console.log("  TEST: Missions evaluated automatically from calories & food logs");
{
  const plan = getDynamicQuestTargets({
    weightKg: 70,
    heightCm: 170,
    age: 25,
    gender: "male",
    goalPath: "lose_weight",
    currentLevel: 2,
    currentWeek: 1,
  });

  const deficitMission = plan.mainMissions.find((m) => m.type === "calorie_deficit")!;
  assert.ok(deficitMission, "Should have calorie_deficit main mission");

  // Case A: 0 logs (no meals logged today)
  const statusEmpty = evaluateMissionAutoStatus(deficitMission, {
    consumedCalories: 0,
    consumedProtein: 0,
    consumedCarbs: 0,
    consumedFat: 0,
    targetCalories: plan.calorieTarget,
    dayLogsCount: 0,
  });
  assert.equal(statusEmpty.isCompleted, false, "Mission cannot be completed without logs");
  assert.equal(statusEmpty.progressPercent, 0);

  // Case B: Food logged within compliant deficit target
  const statusCompliant = evaluateMissionAutoStatus(deficitMission, {
    consumedCalories: plan.calorieTarget * 0.95,
    consumedProtein: 100,
    consumedCarbs: 200,
    consumedFat: 50,
    targetCalories: plan.calorieTarget,
    dayLogsCount: 3,
  });
  assert.equal(statusCompliant.isCompleted, true, "Mission must be completed when calories match target");
  assert.ok(statusCompliant.progressLabel.includes("kkal"));

  // Case C: Calorie surplus mission
  const bulkingPlan = getDynamicQuestTargets({
    weightKg: 70,
    heightCm: 170,
    age: 25,
    gender: "male",
    goalPath: "gain_muscle",
    currentLevel: 2,
    currentWeek: 1,
  });
  const surplusMission = bulkingPlan.mainMissions.find((m) => m.type === "calorie_surplus")!;
  const statusSurplus = evaluateMissionAutoStatus(surplusMission, {
    consumedCalories: bulkingPlan.calorieTarget * 0.98,
    consumedProtein: 150,
    consumedCarbs: 350,
    consumedFat: 70,
    targetCalories: bulkingPlan.calorieTarget,
    dayLogsCount: 4,
  });
  assert.equal(statusSurplus.isCompleted, true, "Surplus mission completed when target calories logged");

  // Case D: Water side mission
  const waterMission = plan.sideMissions.find((m) => m.type === "water")!;
  const waterStatusUnder = evaluateMissionAutoStatus(waterMission, {
    consumedCalories: 1000,
    consumedProtein: 50,
    consumedCarbs: 100,
    consumedFat: 30,
    targetCalories: 2000,
    dayLogsCount: 2,
    waterLoggedMl: 1000,
  });
  assert.equal(waterStatusUnder.isCompleted, false, "Water under 1500 ml is not complete");

  const waterStatusDone = evaluateMissionAutoStatus(waterMission, {
    consumedCalories: 1000,
    consumedProtein: 50,
    consumedCarbs: 100,
    consumedFat: 30,
    targetCalories: 2000,
    dayLogsCount: 2,
    waterLoggedMl: 1750,
  });
  assert.equal(waterStatusDone.isCompleted, true, "Water >= 1500 ml is completed");

  console.log("  ✓ verified task completion strictly depends on calories/macros consumed");
}

console.log("\n=== ALL QUEST PROGRESSION TESTS PASSED! ===\n");
