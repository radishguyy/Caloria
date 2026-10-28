import assert from "node:assert/strict";
import {
  calculateBBI,
  calculateIMT,
  calculateHarrisBenedictBMR,
  calculateTEE,
  calculateBaselineMacros,
  calculateClinicalBenchmarks,
  evaluateDepkesIntake,
} from "../calculations.ts";
import { getDynamicQuestTargets } from "../../gamification/quest-engine.ts";

// Lightweight test runner compatible with Jest/Vitest globals and direct execution
const describeBlock =
  typeof (globalThis as any).describe === "function"
    ? (globalThis as any).describe
    : (name: string, fn: () => void) => {
        console.log(`\n=== SUITE: ${name} ===`);
        fn();
      };

const itBlock =
  typeof (globalThis as any).it === "function"
    ? (globalThis as any).it
    : (name: string, fn: () => void) => {
        fn();
        console.log(`  ✓ ${name}`);
      };

const expectVal =
  typeof (globalThis as any).expect === "function"
    ? (globalThis as any).expect
    : (actual: unknown) => ({
        toBe(expected: unknown) {
          assert.strictEqual(actual, expected);
        },
        toEqual(expected: unknown) {
          assert.deepStrictEqual(actual, expected);
        },
        toBeCloseTo(expected: number, precision = 2) {
          const factor = Math.pow(10, precision);
          assert.strictEqual(
            Math.round((actual as number) * factor),
            Math.round(expected * factor)
          );
        },
      });

describeBlock("Clinical Nutrition Engine - Calculations & Depkes Compliance", () => {
  itBlock(
    "matches Pak Andi (Pria, 20 tahun, BB 76 kg, TB 183 cm) clinical benchmark exactly",
    () => {
      const pakAndi = {
        gender: "male" as const,
        age: 20,
        weightKg: 76,
        heightCm: 183,
      };

      const bbi = calculateBBI(pakAndi.heightCm);
      const imt = calculateIMT(pakAndi.weightKg, pakAndi.heightCm);
      const bmr = calculateHarrisBenedictBMR(
        pakAndi.gender,
        pakAndi.weightKg,
        pakAndi.heightCm,
        pakAndi.age
      );
      const tee = calculateTEE(bmr);
      const macros = calculateBaselineMacros(tee);

      expectVal(bbi).toBe(74.7);
      expectVal(imt.imt).toBe(22.69);
      expectVal(imt.category).toBe("Normal");
      expectVal(bmr).toBe(1886.2);
      expectVal(tee).toBe(2452.06);
      expectVal(macros.proteinGrams).toBe(91.95);
      expectVal(macros.fatGrams).toBe(68.11);
      expectVal(macros.carbGrams).toBe(367.81);

      const bundle = calculateClinicalBenchmarks(pakAndi);
      expectVal(bundle.bbiKg).toBe(74.7);
      expectVal(bundle.bmrKcal).toBe(1886.2);
      expectVal(bundle.teeKcal).toBe(2452.06);
    }
  );

  itBlock("calculates Female Harris-Benedict BMR accurately", () => {
    // Perempuan: 655 + (9.6 * 55) + (1.8 * 160) - (4.7 * 25) = 655 + 528 + 288 - 117.5 = 1353.5
    const bmrFemale = calculateHarrisBenedictBMR("female", 55, 160, 25);
    expectVal(bmrFemale).toBe(1353.5);
    expectVal(calculateTEE(bmrFemale)).toBe(1759.55);
  });

  itBlock("categorizes IMT across all 5 WHO Asia-Pacific (2000) thresholds", () => {
    // Height 170 cm -> 2.89 m^2
    expectVal(calculateIMT(50, 170).category).toBe("Underweight"); // 17.30
    expectVal(calculateIMT(62, 170).category).toBe("Normal"); // 21.45
    expectVal(calculateIMT(68, 170).category).toBe("Overweight"); // 23.53
    expectVal(calculateIMT(78, 170).category).toBe("Obese I"); // 26.99
    expectVal(calculateIMT(90, 170).category).toBe("Obese II"); // 31.14
  });

  itBlock("evaluates Depkes (1999) intake compliance across all 5 bands", () => {
    const target = 2000;

    // > 120% -> Asupan Lebih
    const lebih = evaluateDepkesIntake(2500, target);
    expectVal(lebih.code).toBe("lebih");
    expectVal(lebih.label).toBe("Asupan Lebih");

    // 80% - 120% -> Asupan Baik
    const baik = evaluateDepkesIntake(2000, target);
    expectVal(baik.code).toBe("baik");
    expectVal(baik.label).toBe("Asupan Baik");

    // 70% - 79.9% -> Defisit Ringan
    const ringan = evaluateDepkesIntake(1500, target); // 75%
    expectVal(ringan.code).toBe("defisit_ringan");
    expectVal(ringan.label).toBe("Defisit Ringan");

    // 60% - 69.9% -> Defisit Sedang
    const sedang = evaluateDepkesIntake(1300, target); // 65%
    expectVal(sedang.code).toBe("defisit_sedang");
    expectVal(sedang.label).toBe("Defisit Sedang");

    // < 60% -> Defisit Berat
    const berat = evaluateDepkesIntake(1000, target); // 50%
    expectVal(berat.code).toBe("defisit_berat");
    expectVal(berat.label).toBe("Defisit Berat");
  });

  itBlock("generates accurate RPG Quest plans across all 3 GoalPaths", () => {
    const baseUser = {
      gender: "male" as const,
      age: 20,
      weightKg: 76,
      heightCm: 183,
    };

    // Lose Weight Level 2 Week 3 (-300 kcal, Fiber 30g, Sugar max 50g)
    const lwPlan = getDynamicQuestTargets({
      ...baseUser,
      goalPath: "lose_weight",
      currentLevel: 2,
      currentWeek: 3,
    });
    expectVal(lwPlan.calorieTarget).toBe(2152.06);
    expectVal(lwPlan.macroTargets.fiberGrams).toBe(30);
    expectVal(lwPlan.macroTargets.sugarGramsMax).toBe(50);

    // Gain Muscle Level 2 Week 2 (+200 kcal, Protein 1.8 * 76 = 136.8g)
    const gmPlan = getDynamicQuestTargets({
      ...baseUser,
      goalPath: "gain_muscle",
      currentLevel: 2,
      currentWeek: 2,
    });
    expectVal(gmPlan.calorieTarget).toBe(2652.06);
    expectVal(gmPlan.macroTargets.proteinGrams).toBe(136.8);

    // Maintain Weight Level 1 (0 offset, no side missions)
    const mwPlan = getDynamicQuestTargets({
      ...baseUser,
      goalPath: "maintain_weight",
      currentLevel: 1,
      currentWeek: 1,
    });
    expectVal(mwPlan.calorieTarget).toBe(2452.06);
    expectVal(mwPlan.sideMissions.length).toBe(0);
  });
});
