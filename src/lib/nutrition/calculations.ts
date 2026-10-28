/**
 * Clinical Nutrition Math & Algorithm Engine
 *
 * Implements evidence-based Indonesian clinical nutrition benchmarks:
 * 1. Ideal Body Weight (BBI - Broca Modified): (TB_cm - 100) * 0.9
 * 2. Body Mass Index (IMT / BMI) with Asia-Pacific WHO (2000) classification
 * 3. Basal Metabolic Rate (BMR - Harris-Benedict)
 * 4. Total Energy Expenditure (TEE = BMR * 1.3)
 * 5. Baseline Macronutrient Distribution (15% Protein, 25% Fat, 60% Carbs)
 * 6. Depkes RI (1999) Intake Compliance Evaluator
 */

export type BiologicalGender = "male" | "female";

export type WhoAsiaPacificBmiCategory =
  | "Underweight"
  | "Normal"
  | "Overweight"
  | "Obese I"
  | "Obese II";

export interface ImtEvaluation {
  imt: number;
  category: WhoAsiaPacificBmiCategory;
  labelId: string;
  colorHex: string;
}

export interface BaselineMacroTargets {
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
}

export type DepkesComplianceCode =
  | "lebih"
  | "baik"
  | "defisit_ringan"
  | "defisit_sedang"
  | "defisit_berat";

export interface DepkesComplianceResult {
  code: DepkesComplianceCode;
  label: "Asupan Lebih" | "Asupan Baik" | "Defisit Ringan" | "Defisit Sedang" | "Defisit Berat";
  badgeText: string;
  guidanceText: string;
  ratioPercent: number;
  colorHex: string;
}

export interface BiometricInput {
  gender: BiologicalGender;
  age: number;
  weightKg: number;
  heightCm: number;
}

export interface ClinicalNutritionBenchmarks {
  bbiKg: number;
  imt: ImtEvaluation;
  bmrKcal: number;
  teeKcal: number;
  baselineMacros: BaselineMacroTargets;
}

/**
 * Helper to round numbers to 2 decimal places accurately
 */
export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * 1. Ideal Body Weight (Berat Badan Ideal - BBI)
 * Formula: BBI (kg) = (TB_cm - 100) * 0.9
 */
export function calculateBBI(heightCm: number): number {
  if (heightCm <= 100) return roundTo2(Math.max(0, heightCm * 0.4));
  return roundTo2((heightCm - 100) * 0.9);
}

/**
 * 2. Body Mass Index (Indeks Massa Tubuh - IMT / BMI)
 * Formula: IMT = BB_kg / (TB_m)^2
 * Classification: WHO Asia-Pacific (2000)
 */
export function calculateIMT(weightKg: number, heightCm: number): ImtEvaluation {
  if (weightKg <= 0 || heightCm <= 0) {
    return {
      imt: 0,
      category: "Normal",
      labelId: "Normal",
      colorHex: "#5B8E55",
    };
  }

  const heightM = heightCm / 100;
  const rawImt = weightKg / (heightM * heightM);
  const imt = roundTo2(rawImt);

  if (imt < 18.5) {
    return {
      imt,
      category: "Underweight",
      labelId: "Berat badan kurang",
      colorHex: "#38BDF8",
    };
  }
  if (imt < 23.0) {
    return {
      imt,
      category: "Normal",
      labelId: "Normal",
      colorHex: "#5B8E55",
    };
  }
  if (imt < 25.0) {
    return {
      imt,
      category: "Overweight",
      labelId: "Overweight",
      colorHex: "#F59E0B",
    };
  }
  if (imt < 30.0) {
    return {
      imt,
      category: "Obese I",
      labelId: "Gemuk / Obese I",
      colorHex: "#FF9233",
    };
  }
  return {
    imt,
    category: "Obese II",
    labelId: "Sangat Gemuk / Obese II",
    colorHex: "#F43F5E",
  };
}

/**
 * 3. Basal Metabolic Rate (BMR - Harris-Benedict)
 * Laki-laki: BMR = 66 + (13.7 * BB_kg) + (5 * TB_cm) - (6.8 * usia)
 * Perempuan: BMR = 655 + (9.6 * BB_kg) + (1.8 * TB_cm) - (4.7 * usia)
 */
export function calculateHarrisBenedictBMR(
  gender: BiologicalGender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;

  if (gender === "male") {
    const bmr = 66 + 13.7 * weightKg + 5 * heightCm - 6.8 * age;
    return roundTo2(bmr);
  } else {
    const bmr = 655 + 9.6 * weightKg + 1.8 * heightCm - 4.7 * age;
    return roundTo2(bmr);
  }
}

/**
 * 4. Total Energy Expenditure (TEE)
 * Formula: TEE = BMR * 1.3
 */
export function calculateTEE(bmrKcal: number, activityMultiplier = 1.3): number {
  if (bmrKcal <= 0) return 0;
  return roundTo2(bmrKcal * activityMultiplier);
}

/**
 * 5. Baseline Macronutrient Targets from TEE
 * Protein (g) = (15% * TEE) / 4
 * Lemak (g) = (25% * TEE) / 9
 * Karbohidrat (g) = (60% * TEE) / 4
 */
export function calculateBaselineMacros(teeKcal: number): BaselineMacroTargets {
  if (teeKcal <= 0) {
    return { proteinGrams: 0, fatGrams: 0, carbGrams: 0 };
  }

  return {
    proteinGrams: roundTo2((0.15 * teeKcal) / 4),
    fatGrams: roundTo2((0.25 * teeKcal) / 9),
    carbGrams: roundTo2((0.6 * teeKcal) / 4),
  };
}

/**
 * Complete Clinical Benchmark Bundle for a User Profile
 */
export function calculateClinicalBenchmarks(
  input: BiometricInput
): ClinicalNutritionBenchmarks {
  const bbiKg = calculateBBI(input.heightCm);
  const imt = calculateIMT(input.weightKg, input.heightCm);
  const bmrKcal = calculateHarrisBenedictBMR(
    input.gender,
    input.weightKg,
    input.heightCm,
    input.age
  );
  const teeKcal = calculateTEE(bmrKcal);
  const baselineMacros = calculateBaselineMacros(teeKcal);

  return {
    bbiKg,
    imt,
    bmrKcal,
    teeKcal,
    baselineMacros,
  };
}

/**
 * B. Depkes (1999) Intake Compliance Evaluator
 * ratio = (asupan harian / target) * 100%
 * - > 120%: Asupan Lebih (Amber / Warning)
 * - 80% - 120%: Asupan Baik (Fresh Green #5B8E55 / Target Hit)
 * - 70% - 79.9%: Defisit Ringan (Blue #38BDF8)
 * - 60% - 69.9%: Defisit Sedang (Orange #FF9233)
 * - < 60%: Defisit Berat (Rose #F43F5E)
 */
export function evaluateDepkesIntake(
  currentIntake: number,
  targetIntake: number
): DepkesComplianceResult {
  if (targetIntake <= 0) {
    return {
      code: "defisit_berat",
      label: "Defisit Berat",
      badgeText: "⚠️ Asupan Kurang dari 60% - Pet lemas!",
      guidanceText: "Target kalori belum diatur.",
      ratioPercent: 0,
      colorHex: "#F43F5E",
    };
  }

  const rawRatio = (Math.max(0, currentIntake) / targetIntake) * 100;
  const ratioPercent = roundTo2(rawRatio);

  if (ratioPercent > 120) {
    return {
      code: "lebih",
      label: "Asupan Lebih",
      badgeText: "⚠️ Asupan Lebih (Depkes >120%)",
      guidanceText:
        "Asupanmu melampaui 120% target harian. Kurangi porsi ekstra agar keseimbangan energi terjaga!",
      ratioPercent,
      colorHex: "#F59E0B",
    };
  }

  if (ratioPercent >= 80) {
    return {
      code: "baik",
      label: "Asupan Baik",
      badgeText: "✨ Asupan Baik (Depkes)",
      guidanceText:
        "Asupan harianmu berada di rentang ideal Depkes (80%–120%). Pet-mu sangat bugar dan bahagia!",
      ratioPercent,
      colorHex: "#5B8E55",
    };
  }

  if (ratioPercent >= 70) {
    return {
      code: "defisit_ringan",
      label: "Defisit Ringan",
      badgeText: "💧 Defisit Ringan (70–79.9%)",
      guidanceText:
        "Sedikit lagi mencapai zona Asupan Baik (80%). Tambahkan camilan sehat atau porsi protein!",
      ratioPercent,
      colorHex: "#38BDF8",
    };
  }

  if (ratioPercent >= 60) {
    return {
      code: "defisit_sedang",
      label: "Defisit Sedang",
      badgeText: "⚡ Defisit Sedang (60–69.9%)",
      guidanceText:
        "Asupanmu masih di kisaran 60–69.9%. Yuk lengkapi waktu makan berikutnya agar energi tidak drop!",
      ratioPercent,
      colorHex: "#FF9233",
    };
  }

  return {
    code: "defisit_berat",
    label: "Defisit Berat",
    badgeText: "⚠️ Asupan Kurang dari 60% - Pet lemas!",
    guidanceText:
      "Asupan harianmu masih di bawah 60% kebutuhan. Jangan biarkan perut kosong dan Pet-mu kelaparan ya!",
    ratioPercent,
    colorHex: "#F43F5E",
  };
}

