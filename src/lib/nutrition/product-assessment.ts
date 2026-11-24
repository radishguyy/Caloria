/**
 * Product Assessment Engine (AR Scanner draft)
 *
 * Deterministic evaluation of a scanned packaged product without training an ML model:
 * Vision API reads the nutrition table, and this module evaluates the product locally.
 *
 * DRAFT THRESHOLDS: must be reviewed by Hima (ahli gizi) before release.
 */

import type { GoalProgramType } from "@/types";

export const PRODUCT_CATEGORIES = [
  "beverage",
  "dairy",
  "snack",
  "confectionery",
  "instant_noodle",
  "cereal_bread",
  "ready_meal",
  "sauce_condiment",
  "other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type FlaggedNutrient = "sugar" | "fat" | "saturatedFat" | "sodium" | "calories";
export type NutrientLevel = "low" | "medium" | "high";
export type ProductVerdict = "good" | "moderate" | "poor";

export interface ProductNutritionInput {
  servingSize: number | null;
  servingUnit: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  saturatedFatG?: number | null;
  sodiumMg?: number | null;
  category?: ProductCategory | null;
}

export interface PersonalContext {
  goalType?: GoalProgramType;
  /** Calories left for today before this product. null = unknown. */
  remainingCalories?: number | null;
  servingsConsumed?: number;
}

export interface NutrientFlag {
  nutrient: FlaggedNutrient;
  level: NutrientLevel;
  /** Value per 100 g/ml, null when the serving unit cannot be converted. */
  per100: number | null;
  perServing: number;
  /** % of the daily limit consumed by ONE serving, null when no limit. */
  dailyLimitPct: number | null;
  label: string;
  /** Short scannable badge label without parenthetical breakdown (for main UI). */
  shortLabel: string;
  /** Detailed explanation including per-100g & daily limit % (for tooltip). */
  message: string;
}

export interface CalpalReaction {
  expression: "happy" | "idle";
  moodStatus: "happy" | "neutral" | "complaining";
  bubbleText: string;
}

export interface ProductAssessment {
  verdict: ProductVerdict;
  headline: string;
  /** Direct, scannable action telling the user what to do next. */
  actionFeedback: string;
  summary: string;
  /** Only medium/high flags, sorted high → medium. */
  warnings: NutrientFlag[];
  positives: string[];
  suggestions: string[];
  /** Personal note relative to today's calorie budget, if known. */
  personalNote: string | null;
  /** Nutrients the label did not provide (assessment is less complete). */
  missing: FlaggedNutrient[];
  basis: "per100" | "perServing";
  isBeverage: boolean;
  thresholdsVersion: string;
  calpalReaction: CalpalReaction;
}

/** Draft thresholds (review with Hima before release). */
export const NUTRITION_THRESHOLDS = {
  version: "draft-2026-11",
  /**
   * Per 100 g (food), adapted from UK FSA front-of-pack traffic light criteria.
   * Sodium = salt / 2.5 (salt 1.5 g -> 600 mg, 0.3 g -> 120 mg).
   */
  food: {
    sugar: { medium: 5, high: 22.5 },
    fat: { medium: 3, high: 17.5 },
    saturatedFat: { medium: 1.5, high: 5 },
    sodium: { medium: 120, high: 600 },
    /** Energy density (kcal/100 g), common cut-off outside FSA. */
    calories: { medium: 275, high: 400 },
  },
  /** Per 100 ml (drinks), FSA drink criteria (half of food). */
  beverage: {
    sugar: { medium: 2.5, high: 11.25 },
    fat: { medium: 1.5, high: 8.75 },
    saturatedFat: { medium: 0.75, high: 2.5 },
    sodium: { medium: 60, high: 300 },
    calories: { medium: 40, high: 70 },
  },
  /** Daily limits per Permenkes No. 30/2013 (GGL) and label reference 2150 kcal. */
  dailyLimit: {
    sugar: 50,
    sodium: 2000,
    fat: 67,
    saturatedFat: 20,
    calories: 2150,
  },
  /** Fallback when per-100 cannot be computed: % of daily limit per serving. */
  perServingPct: { medium: 15, high: 30 },
  positives: {
    fiberSourcePer100: 3,
    fiberHighPer100: 6,
    proteinEnergyPct: 20,
    proteinMinPerServing: 5,
  },
  /** Personal note: product uses more than X% of today's remaining calories. */
  personalBudgetWarnPct: 35,
} as const;

const NUTRIENT_LABEL: Record<FlaggedNutrient, string> = {
  sugar: "Gula",
  fat: "Lemak",
  saturatedFat: "Lemak jenuh",
  sodium: "Natrium (garam)",
  calories: "Kalori",
};

const NUTRIENT_UNIT: Record<FlaggedNutrient, string> = {
  sugar: "g",
  fat: "g",
  saturatedFat: "g",
  sodium: "mg",
  calories: "kkal",
};

const HEADLINE: Record<ProductVerdict, string> = {
  good: "Pilihan oke!",
  moderate: "Boleh, asal dibatasi",
  poor: "Sebaiknya jangan sering-sering",
};

const NUTRIENT_TIP: Record<Exclude<FlaggedNutrient, "calories">, string> = {
  sugar: "Cari versi tanpa gula tambahan, atau ganti dengan buah utuh.",
  fat: "Pilih versi panggang/rendah lemak daripada yang digoreng.",
  saturatedFat: "Batasi produk bersantan, krimer, atau gorengan dalam sehari.",
  sodium: "Imbangi dengan air putih dan pilih versi rendah garam/natrium.",
};

const CATEGORY_ALTERNATIVES: Partial<Record<ProductCategory, Partial<Record<FlaggedNutrient, string>>>> = {
  beverage: {
    sugar: "Alternatif: air putih, infused water, teh/kopi tanpa gula, atau susu tawar.",
    calories: "Alternatif: minuman zero sugar atau air kelapa murni porsi kecil.",
  },
  dairy: {
    sugar: "Alternatif: susu UHT plain atau yoghurt plain + potongan buah.",
    saturatedFat: "Alternatif: susu rendah lemak (low fat / skim).",
  },
  snack: {
    sodium: "Alternatif: kacang panggang tanpa garam, edamame, atau jagung rebus.",
    fat: "Alternatif: buah potong, roti gandum, atau popcorn tanpa mentega.",
    calories: "Alternatif: buah, yoghurt plain, atau telur rebus.",
  },
  confectionery: {
    sugar: "Alternatif: buah segar, kurma 1–2 butir, atau dark chocolate ≥70% porsi kecil.",
    calories: "Alternatif: buah beku atau yoghurt plain dengan madu sedikit.",
  },
  instant_noodle: {
    sodium: "Tips: pakai setengah bumbu, tambah sayur & telur, jangan habiskan kuahnya.",
    fat: "Alternatif: mie/bihun rebus non-instan atau nasi + lauk rumahan.",
  },
  cereal_bread: {
    sugar: "Alternatif: oat polos atau roti gandum utuh dengan topping buah.",
  },
  ready_meal: {
    sodium: "Tips: tambah sayur segar dan kurangi saus/kuah kemasannya.",
    fat: "Alternatif: lauk dikukus/dipanggang dengan nasi porsi sedang.",
  },
  sauce_condiment: {
    sodium: "Tips: pakai 1 sdt saja, atau ganti dengan perasan jeruk/bawang/rempah.",
    sugar: "Tips: kecap/saus manis cukup sedikit; perkuat rasa dengan rempah.",
  },
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const safe = (n: number | null | undefined) =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;

/** Convert a serving size to grams/ml. Returns null for non-mass units (pcs, keping…). */
export function servingToBaseUnits(
  servingSize: number | null,
  servingUnit: string
): { amount: number; isVolume: boolean } | null {
  if (!servingSize || servingSize <= 0) return null;
  const unit = servingUnit.trim().toLowerCase().replace(/\.$/, "");
  if (/^(g|gr|gram|grams|gm)$/.test(unit)) return { amount: servingSize, isVolume: false };
  if (/^(kg|kilogram)$/.test(unit)) return { amount: servingSize * 1000, isVolume: false };
  if (/^(ml|mililiter|milliliter|cc)$/.test(unit)) return { amount: servingSize, isVolume: true };
  if (/^(l|liter|litre)$/.test(unit)) return { amount: servingSize * 1000, isVolume: true };
  return null;
}

function levelFrom(value: number, t: { medium: number; high: number }): NutrientLevel {
  if (value > t.high) return "high";
  if (value > t.medium) return "medium";
  return "low";
}

function pctLevel(pct: number): NutrientLevel {
  const t = NUTRITION_THRESHOLDS.perServingPct;
  if (pct >= t.high) return "high";
  if (pct >= t.medium) return "medium";
  return "low";
}

function joinId(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} dan ${items[items.length - 1]}`;
}

export function assessProduct(
  input: ProductNutritionInput,
  ctx: PersonalContext = {}
): ProductAssessment {
  const T = NUTRITION_THRESHOLDS;
  const base = servingToBaseUnits(input.servingSize, input.servingUnit);
  const isBeverage = input.category === "beverage" || base?.isVolume === true;
  const table = isBeverage ? T.beverage : T.food;
  const factor = base ? 100 / base.amount : null;
  const basis: ProductAssessment["basis"] = factor ? "per100" : "perServing";

  const perServing: Record<FlaggedNutrient, number | null> = {
    sugar: safe(input.sugarG),
    fat: safe(input.fatG),
    saturatedFat: input.saturatedFatG == null ? null : safe(input.saturatedFatG),
    sodium: input.sodiumMg == null ? null : safe(input.sodiumMg),
    calories: safe(input.caloriesKcal),
  };

  const missing: FlaggedNutrient[] = [];
  const flags: NutrientFlag[] = [];

  (Object.keys(perServing) as FlaggedNutrient[]).forEach((nutrient) => {
    const value = perServing[nutrient];
    if (value === null) {
      missing.push(nutrient);
      return;
    }
    const limit = T.dailyLimit[nutrient];
    const dailyLimitPct = limit ? Math.round((value / limit) * 100) : null;
    const per100 = factor ? round1(value * factor) : null;

    let level: NutrientLevel;
    if (per100 !== null) {
      level = levelFrom(per100, table[nutrient]);
      // A single serving that eats ≥ 30% of a daily limit is "high" regardless.
      if (dailyLimitPct !== null && dailyLimitPct >= T.perServingPct.high) level = "high";
    } else {
      level = dailyLimitPct !== null ? pctLevel(dailyLimitPct) : "low";
    }

    const unit = NUTRIENT_UNIT[nutrient];
    const label = NUTRIENT_LABEL[nutrient];
    const amountText =
      per100 !== null
        ? `${per100} ${unit}/100 ${isBeverage ? "ml" : "g"}`
        : `${round1(value)} ${unit}/sajian`;
    const pctText =
      dailyLimitPct !== null && nutrient !== "calories"
        ? `, ${dailyLimitPct}% batas harian/sajian`
        : "";
    const levelText = level === "high" ? "tinggi" : level === "medium" ? "sedang" : "rendah";

    flags.push({
      nutrient,
      level,
      per100,
      perServing: round1(value),
      dailyLimitPct,
      label,
      shortLabel:
        nutrient === "calories"
          ? level === "high"
            ? "Kalori padat"
            : "Kalori cukup padat"
          : `${label} ${levelText}`,
      message:
        nutrient === "calories"
          ? `${level === "high" ? "Padat kalori" : "Cukup padat kalori"} (${amountText})`
          : `${label} ${levelText} (${amountText}${pctText})`,
    });
  });

  // Calories alone should not make a product "poor"; they only inform.
  const scored = flags.filter((f) => f.nutrient !== "calories");
  const highs = scored.filter((f) => f.level === "high").length;
  const mediums = scored.filter((f) => f.level === "medium").length;

  let verdict: ProductVerdict = "good";
  if (highs >= 2 || (highs >= 1 && mediums >= 2)) verdict = "poor";
  else if (highs >= 1 || mediums >= 2) verdict = "moderate";

  const warnings = flags
    .filter((f) => f.level !== "low")
    .sort((a, b) => (a.level === b.level ? 0 : a.level === "high" ? -1 : 1));

  // Positive highlights
  const positives: string[] = [];
  const fiberPer100 = factor ? safe(input.fiberG) * factor : null;
  if (fiberPer100 !== null && fiberPer100 >= T.positives.fiberHighPer100) {
    positives.push("Tinggi serat");
  } else if (fiberPer100 !== null && fiberPer100 >= T.positives.fiberSourcePer100) {
    positives.push("Sumber serat");
  }
  const kcal = safe(input.caloriesKcal);
  const protein = safe(input.proteinG);
  if (
    kcal > 0 &&
    protein >= T.positives.proteinMinPerServing &&
    ((protein * 4) / kcal) * 100 >= T.positives.proteinEnergyPct
  ) {
    positives.push("Sumber protein yang baik");
  }
  const sugarFlag = flags.find((f) => f.nutrient === "sugar");
  if (sugarFlag?.level === "low" && sugarFlag.per100 !== null) positives.push("Rendah gula");
  const sodiumFlag = flags.find((f) => f.nutrient === "sodium");
  if (sodiumFlag?.level === "low" && sodiumFlag.per100 !== null) positives.push("Rendah garam");

  // Alternative suggestions
  const suggestions: string[] = [];
  const category = input.category ?? "other";
  for (const w of warnings) {
    const alt = CATEGORY_ALTERNATIVES[category]?.[w.nutrient];
    if (alt) suggestions.push(alt);
    else if (w.nutrient !== "calories") suggestions.push(NUTRIENT_TIP[w.nutrient]);
  }

  // Personal budget context
  const servings = Math.max(0.25, ctx.servingsConsumed ?? 1);
  const totalKcal = Math.round(kcal * servings);
  let personalNote: string | null = null;
  if (typeof ctx.remainingCalories === "number") {
    if (ctx.remainingCalories <= 0) {
      personalNote = `Target kalori hari ini sudah tercapai. Produk ini menambah ${totalKcal} kkal.`;
      if (ctx.goalType === "diet") suggestions.unshift("Kalau masih lapar, pilih sayur atau buah dulu ya.");
    } else {
      const pct = Math.round((totalKcal / ctx.remainingCalories) * 100);
      personalNote = `${totalKcal} kkal = ${pct}% sisa kalori kamu hari ini.`;
      if (pct >= T.personalBudgetWarnPct && ctx.goalType === "diet") {
        suggestions.unshift("Cukup makan setengah porsi, sisanya simpan untuk nanti.");
      }
    }
  }
  if (ctx.goalType === "bulking" && positives.includes("Sumber protein yang baik")) {
    positives.push("Cocok untuk misi bulking kamu");
  }

  // Summary sentence
  const highLabels = warnings
    .filter((w) => w.level === "high" && w.nutrient !== "calories")
    .map((w) => w.label.toLowerCase());
  const mediumLabels = warnings
    .filter((w) => w.level === "medium" && w.nutrient !== "calories")
    .map((w) => w.label.toLowerCase());

  let summary: string;
  if (verdict === "good") {
    summary = positives.length
      ? `${joinId(positives.slice(0, 2))}. Gula, lemak, dan garamnya masih wajar.`
      : "Gula, lemak, dan garamnya masih dalam batas wajar.";
  } else if (highLabels.length) {
    summary = `Tinggi ${joinId(highLabels)}${mediumLabels.length ? `, ${joinId(mediumLabels)} sedang` : ""}.`;
  } else {
    summary = `Kandungan ${joinId(mediumLabels)} cukup tinggi.`;
  }

  const calpalReaction: CalpalReaction =
    verdict === "good"
      ? {
          expression: "happy",
          moodStatus: "happy",
          bubbleText: "Mantap, gizinya oke!",
        }
      : verdict === "moderate"
      ? {
          expression: "idle",
          moodStatus: "neutral",
          bubbleText: "Boleh, tapi atur porsinya ya!",
        }
      : {
          expression: "idle",
          moodStatus: "complaining",
          bubbleText: "Waduh, hati-hati kandungannya!",
        };

  let actionFeedback: string;
  if (verdict === "good") {
    if (typeof ctx.remainingCalories === "number" && ctx.remainingCalories <= 0) {
      actionFeedback = "Gizinya baik, tapi simpan untuk besok ya.";
    } else if (
      ctx.goalType === "bulking" &&
      positives.includes("Sumber protein yang baik")
    ) {
      actionFeedback = "Cocok! Bagus untuk target protein harianmu.";
    } else {
      actionFeedback = "Aman dikonsumsi 1 porsi sekarang.";
    }
  } else if (verdict === "moderate") {
    const budgetPct =
      typeof ctx.remainingCalories === "number" && ctx.remainingCalories > 0
        ? Math.round((totalKcal / ctx.remainingCalories) * 100)
        : null;
    if (ctx.goalType === "diet" && budgetPct !== null && budgetPct >= T.personalBudgetWarnPct) {
      actionFeedback = "Cukup 1/2 porsi saja, sisanya simpan.";
    } else if (warnings[0]?.nutrient === "sugar") {
      actionFeedback = "Batasi 1 porsi, imbangi air putih.";
    } else {
      actionFeedback = "Boleh dimakan, cukup 1 porsi saja.";
    }
  } else {
    const topHigh = warnings[0]?.nutrient;
    if (topHigh === "sugar") {
      actionFeedback = "Gula tinggi. Pilih versi tanpa/rendah gula.";
    } else if (topHigh === "sodium") {
      actionFeedback = "Garam tinggi. Kurangi porsi atau ganti menu.";
    } else {
      actionFeedback = "Sebaiknya ganti alternatif yang lebih sehat.";
    }
  }

  return {
    verdict,
    headline: HEADLINE[verdict],
    actionFeedback,
    summary,
    warnings,
    positives,
    suggestions: Array.from(new Set(suggestions)).slice(0, 3),
    personalNote,
    missing,
    basis,
    isBeverage,
    thresholdsVersion: T.version,
    calpalReaction,
  };
}

/**
 * Formats a clean, shareable summary for manual consultation with a nutritionist
 * ("Tanyakan Ahli Gizi") alongside an explicit AI-estimation disclaimer.
 */
export function formatNutritionistSummary(
  foodName: string,
  input: ProductNutritionInput,
  assessment: ProductAssessment
): string {
  const servingText = input.servingSize
    ? `${input.servingSize} ${input.servingUnit || "g"}`
    : input.servingUnit || "1 sajian";
  const warningsText =
    assessment.warnings.length > 0
      ? assessment.warnings.map((w) => w.shortLabel).join(", ")
      : "Tidak ada catatan tinggi";

  const lines = [
    `Halo Ahli Gizi, saya ingin menanyakan produk hasil scan di Caloria:`,
    `- Produk: ${foodName || "Produk Kemasan"} (1 sajian = ${servingText})`,
    `- Kalori: ${round1(safe(input.caloriesKcal))} kkal | Protein: ${round1(safe(input.proteinG))} g | Karbo: ${round1(safe(input.carbsG))} g | Lemak: ${round1(safe(input.fatG))} g`,
    `- Gula: ${round1(safe(input.sugarG))} g${input.sodiumMg != null ? ` | Natrium: ${round1(safe(input.sodiumMg))} mg` : ""}`,
    `- Catatan awal AI: ${assessment.headline} (${warningsText})`,
    `Catatan: hasil ini merupakan estimasi AI dari foto label kemasan. Mohon saran apakah sesuai untuk kondisi saya.`,
  ];

  return lines.join("\n");
}
