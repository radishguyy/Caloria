import {
  type BiologicalGender,
  calculateHarrisBenedictBMR,
  calculateTEE,
  calculateBaselineMacros,
  roundTo2,
} from "../nutrition/calculations.ts";

export type GoalPath = "lose_weight" | "gain_muscle" | "maintain_weight";

export interface QuestMainMission {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  type:
    | "log_meals"
    | "calorie_deficit"
    | "calorie_surplus"
    | "macro_compliance"
    | "carb_loading";
  xpReward?: number;
  coinReward?: number;
}

export interface QuestSideMission {
  id: string;
  title: string;
  targetValue: number;
  unit: "minutes" | "ml" | "sessions" | "hours" | "days";
  type:
    | "walking"
    | "water"
    | "workout"
    | "strength_training"
    | "sleep"
    | "body_measurement";
  xpReward?: number;
  coinReward?: number;
}

export interface DailyQuestPlan {
  path: GoalPath;
  level: number;
  week?: number;
  levelTitle: string;
  weekLabel?: string;
  calorieTarget: number; // calculated from TEE + offset
  calorieOffset: number;
  teeBaseline: number;
  macroTargets: {
    proteinGrams: number;
    fatGrams: number;
    carbGrams: number;
    fiberGrams?: number;
    sugarGramsMax?: number;
  };
  mainMissions: QuestMainMission[];
  sideMissions: QuestSideMission[];
}

export interface UserQuestProfileInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: BiologicalGender;
  goalPath: GoalPath;
  currentLevel?: number;
  currentWeek?: number;
}

/**
 * Maps legacy GoalProgramType ('diet' | 'bulking' | 'maintenance') to GoalPath
 */
export function goalTypeToGoalPath(
  goalType?: "diet" | "bulking" | "maintenance" | GoalPath | string
): GoalPath {
  if (goalType === "gain_muscle" || goalType === "bulking") return "gain_muscle";
  if (goalType === "maintain_weight" || goalType === "maintenance")
    return "maintain_weight";
  return "lose_weight";
}

export function goalPathToGoalType(
  goalPath: GoalPath
): "diet" | "bulking" | "maintenance" {
  if (goalPath === "gain_muscle") return "bulking";
  if (goalPath === "maintain_weight") return "maintenance";
  return "diet";
}

export const GOAL_PATH_LABELS: Record<
  GoalPath,
  { title: string; subtitle: string; badge: string }
> = {
  lose_weight: {
    title: "Menurunkan BB",
    subtitle: "Defisit Kalori Bertahap & Serat Optimal",
    badge: "Weight Loss / Cut",
  },
  gain_muscle: {
    title: "Menaikkan Massa Otot",
    subtitle: "Surplus Kalori & Protein Tinggi Berbasis BB",
    badge: "Hypertrophy / Bulk",
  },
  maintain_weight: {
    title: "Menstabilkan BB",
    subtitle: "Keseimbangan Gizi Harian 95–105% TEE",
    badge: "Healthy Maintain",
  },
};

/**
 * Generates dynamic calorie targets, macro splits, Main Missions, and Side Missions
 * based on user biometrics, active GoalPath, current RPG level, and active week.
 */
export function getDynamicQuestTargets(
  profile: UserQuestProfileInput
): DailyQuestPlan {
  const weightKg = profile.weightKg > 0 ? profile.weightKg : 70;
  const heightCm = profile.heightCm > 0 ? profile.heightCm : 170;
  const age = profile.age > 0 ? profile.age : 24;
  const gender = profile.gender || "male";
  const path = profile.goalPath || "lose_weight";
  const level = Math.max(1, profile.currentLevel || 1);
  const week = Math.max(1, profile.currentWeek || 1);

  const bmr = calculateHarrisBenedictBMR(gender, weightKg, heightCm, age);
  const tee = calculateTEE(bmr);

  // =========================================================================
  // PATH 1: MENURUNKAN BB (lose_weight)
  // =========================================================================
  if (path === "lose_weight") {
    // Level 1: Catat Asupan (Baseline TEE, 15% P / 25% F / 60% C)
    if (level === 1) {
      const baseMacros = calculateBaselineMacros(tee);
      return {
        path,
        level: 1,
        week: 1,
        levelTitle: "Level 1: Catat Asupan",
        weekLabel: "Adaptasi Kebiasaan",
        calorieTarget: roundTo2(tee),
        calorieOffset: 0,
        teeBaseline: tee,
        macroTargets: {
          proteinGrams: baseMacros.proteinGrams,
          fatGrams: baseMacros.fatGrams,
          carbGrams: baseMacros.carbGrams,
        },
        mainMissions: [
          {
            id: "lw-l1-main-log",
            title: "Catat Semua Makan & Minum 3 Hari Berturut-turut",
            description:
              "Bangun kebiasaan mencatat asupan harian dengan komposisi baseline 15% Protein, 25% Lemak, dan 60% Karbohidrat dari TEE.",
            targetValue: 3,
            unit: "hari",
            type: "log_meals",
            xpReward: 50,
            coinReward: 25,
          },
          {
            id: "lw-l1-main-macro",
            title: "Penuhi Baseline Makronutrisi TEE",
            description: `Target harian: ${Math.round(tee)} kkal (${baseMacros.proteinGrams}g Protein, ${baseMacros.fatGrams}g Lemak, ${baseMacros.carbGrams}g Karbohidrat).`,
            targetValue: Math.round(tee),
            unit: "kkal",
            type: "macro_compliance",
            xpReward: 40,
            coinReward: 20,
          },
        ],
        sideMissions: [
          {
            id: "lw-l1-side-walk",
            title: "Jalan Kaki 15 Menit",
            targetValue: 15,
            unit: "minutes",
            type: "walking",
            xpReward: 25,
            coinReward: 10,
          },
          {
            id: "lw-l1-side-water",
            title: "Minum Air Putih Min. 1500 ml",
            targetValue: 1500,
            unit: "ml",
            type: "water",
            xpReward: 25,
            coinReward: 10,
          },
        ],
      };
    }

    // Level 2: Defisit Bertahap (Minggu 1 - 4)
    if (level === 2) {
      const clampedWeek = Math.min(4, Math.max(1, week));
      const deficitMap: Record<number, number> = {
        1: -100,
        2: -200,
        3: -300,
        4: -400,
      };
      const fiberMap: Record<number, number> = {
        1: 20,
        2: 25,
        3: 30,
        4: 35,
      };
      const sugarMap: Record<number, number | undefined> = {
        1: undefined,
        2: undefined,
        3: 50,
        4: 50,
      };

      const offset = deficitMap[clampedWeek];
      const calTarget = roundTo2(Math.max(1000, tee + offset));
      // Level 2 Macro Split: 60% Karbo, 20% Protein, 20% Lemak
      const proteinGrams = roundTo2((0.2 * calTarget) / 4);
      const fatGrams = roundTo2((0.2 * calTarget) / 9);
      const carbGrams = roundTo2((0.6 * calTarget) / 4);
      const fiberGrams = fiberMap[clampedWeek];
      const sugarGramsMax = sugarMap[clampedWeek];

      return {
        path,
        level: 2,
        week: clampedWeek,
        levelTitle: "Level 2: Defisit Bertahap",
        weekLabel: `Minggu ${clampedWeek}`,
        calorieTarget: calTarget,
        calorieOffset: offset,
        teeBaseline: tee,
        macroTargets: {
          proteinGrams,
          fatGrams,
          carbGrams,
          fiberGrams,
          sugarGramsMax,
        },
        mainMissions: [
          {
            id: `lw-l2-w${clampedWeek}-deficit`,
            title: `Defisit Kalori ${offset} kkal & Serat ${fiberGrams}g`,
            description:
              sugarGramsMax !== undefined
                ? `Jaga asupan sekitar ${Math.round(calTarget)} kkal (60% Karbo, 20% Protein, 20% Lemak), Serat min. ${fiberGrams}g, dan Gula pasir maks. ${sugarGramsMax}g.`
                : `Jaga asupan sekitar ${Math.round(calTarget)} kkal (60% Karbo, 20% Protein, 20% Lemak) dan Serat harian minimal ${fiberGrams}g.`,
            targetValue: Math.round(calTarget),
            unit: "kkal",
            type: "calorie_deficit",
            xpReward: 60,
            coinReward: 30,
          },
          {
            id: `lw-l2-w${clampedWeek}-macro`,
            title: `Komposisi Makro Seimbang (Serat ${fiberGrams}g${sugarGramsMax ? `, Gula ≤${sugarGramsMax}g` : ""})`,
            description: `Capai ${proteinGrams}g Protein, ${carbGrams}g Karbohidrat, dan batasi Lemak ${fatGrams}g.`,
            targetValue: fiberGrams,
            unit: "g serat",
            type: "macro_compliance",
            xpReward: 45,
            coinReward: 20,
          },
        ],
        sideMissions: [
          {
            id: `lw-l2-w${clampedWeek}-workout`,
            title: "Olahraga 20–30 Menit / Hari",
            targetValue: 25,
            unit: "minutes",
            type: "workout",
            xpReward: 35,
            coinReward: 15,
          },
          {
            id: `lw-l2-w${clampedWeek}-water`,
            title: "Minum Air Putih Min. 1500 ml",
            targetValue: 1500,
            unit: "ml",
            type: "water",
            xpReward: 25,
            coinReward: 10,
          },
        ],
      };
    }

    // Level 3: Minggu 5+ (Defisit -500 kkal, Serat 35-40g, Gula maks 50g)
    if (level === 3) {
      const offset = -500;
      const calTarget = roundTo2(Math.max(1000, tee + offset));
      const proteinGrams = roundTo2((0.2 * calTarget) / 4);
      const fatGrams = roundTo2((0.2 * calTarget) / 9);
      const carbGrams = roundTo2((0.6 * calTarget) / 4);

      return {
        path,
        level: 3,
        week: Math.max(5, week),
        levelTitle: "Level 3: Defisit Optimal",
        weekLabel: `Minggu ${Math.max(5, week)}+`,
        calorieTarget: calTarget,
        calorieOffset: offset,
        teeBaseline: tee,
        macroTargets: {
          proteinGrams,
          fatGrams,
          carbGrams,
          fiberGrams: 38,
          sugarGramsMax: 50,
        },
        mainMissions: [
          {
            id: "lw-l3-deficit",
            title: "Defisit -500 kkal, Serat 35–40g, Gula Maks. 50g",
            description: `Target harian ${Math.round(calTarget)} kkal dengan serat tinggi (35–40g) dan batas gula pasir maksimal 50g.`,
            targetValue: Math.round(calTarget),
            unit: "kkal",
            type: "calorie_deficit",
            xpReward: 75,
            coinReward: 35,
          },
        ],
        sideMissions: [
          {
            id: "lw-l3-workout",
            title: "Olahraga 150–200 Menit / Minggu",
            targetValue: 150,
            unit: "minutes",
            type: "workout",
            xpReward: 40,
            coinReward: 20,
          },
          {
            id: "lw-l3-sleep",
            title: "Tidur Berkualitas 7–9 Jam",
            targetValue: 8,
            unit: "hours",
            type: "sleep",
            xpReward: 30,
            coinReward: 15,
          },
          {
            id: "lw-l3-water",
            title: "Minum Air Putih Min. 1500 ml",
            targetValue: 1500,
            unit: "ml",
            type: "water",
            xpReward: 25,
            coinReward: 10,
          },
        ],
      };
    }

    // Level 4+: Maintenance Kalori (Pertahankan TEE)
    const baseMacros = calculateBaselineMacros(tee);
    return {
      path,
      level: 4,
      week,
      levelTitle: "Level 4: Maintenance Kalori",
      weekLabel: "Fase Pemeliharaan BB",
      calorieTarget: roundTo2(tee),
      calorieOffset: 0,
      teeBaseline: tee,
      macroTargets: {
        proteinGrams: baseMacros.proteinGrams,
        fatGrams: baseMacros.fatGrams,
        carbGrams: baseMacros.carbGrams,
        fiberGrams: 35,
        sugarGramsMax: 50,
      },
      mainMissions: [
        {
          id: "lw-l4-maintain",
          title: "Maintenance Kalori (Pertahankan TEE)",
          description: `Pertahankan asupan energi seimbang sebesar ${Math.round(tee)} kkal agar berat badan ideal tetap stabil.`,
          targetValue: Math.round(tee),
          unit: "kkal",
          type: "macro_compliance",
          xpReward: 80,
          coinReward: 40,
        },
      ],
      sideMissions: [
        {
          id: "lw-l4-workout",
          title: "Olahraga 150 Menit / Minggu",
          targetValue: 150,
          unit: "minutes",
          type: "workout",
          xpReward: 40,
          coinReward: 20,
        },
        {
          id: "lw-l4-sleep",
          title: "Tidur 7–9 Jam / Malam",
          targetValue: 8,
          unit: "hours",
          type: "sleep",
          xpReward: 30,
          coinReward: 15,
        },
        {
          id: "lw-l4-water",
          title: "Minum Air Putih Min. 1500 ml",
          targetValue: 1500,
          unit: "ml",
          type: "water",
          xpReward: 25,
          coinReward: 10,
        },
      ],
    };
  }

  // =========================================================================
  // PATH 2: MENAIKKAN MASSA OTOT (gain_muscle)
  // =========================================================================
  if (path === "gain_muscle") {
    // Level 1: Catat Asupan (15% Protein, 25% Fat, 60% Carb)
    if (level === 1) {
      const baseMacros = calculateBaselineMacros(tee);
      return {
        path,
        level: 1,
        week: 1,
        levelTitle: "Level 1: Catat Asupan",
        weekLabel: "Fondasi Hypertrophy",
        calorieTarget: roundTo2(tee),
        calorieOffset: 0,
        teeBaseline: tee,
        macroTargets: {
          proteinGrams: baseMacros.proteinGrams,
          fatGrams: baseMacros.fatGrams,
          carbGrams: baseMacros.carbGrams,
        },
        mainMissions: [
          {
            id: "gm-l1-log",
            title: "Catat Makan & Minum 3 Hari Berturut-turut",
            description:
              "Catat seluruh makanan & minuman dengan komposisi 15% Protein, 25% Lemak, dan 60% Karbohidrat dari TEE.",
            targetValue: 3,
            unit: "hari",
            type: "log_meals",
            xpReward: 50,
            coinReward: 25,
          },
        ],
        sideMissions: [
          {
            id: "gm-l1-walk",
            title: "Jalan Kaki 15 Menit",
            targetValue: 15,
            unit: "minutes",
            type: "walking",
            xpReward: 25,
            coinReward: 10,
          },
          {
            id: "gm-l1-water",
            title: "Minum Air Putih Min. 1500 ml",
            targetValue: 1500,
            unit: "ml",
            type: "water",
            xpReward: 25,
            coinReward: 10,
          },
        ],
      };
    }

    // Level 2: Cukupi Kalori & Protein (Minggu 1 - 8)
    if (level === 2) {
      const clampedWeek = Math.min(8, Math.max(1, week));
      const isWeek5To8 = clampedWeek >= 5;

      const surplusMap: Record<number, number> = {
        1: 100,
        2: 200,
        3: 300,
        4: 400,
      };
      const proteinMultiplierMap: Record<number, number> = {
        1: 1.7,
        2: 1.8,
        3: 1.9,
        4: 2.0,
      };

      const offset = isWeek5To8 ? 500 : surplusMap[clampedWeek];
      const proteinMult = isWeek5To8 ? 2.1 : proteinMultiplierMap[clampedWeek];
      const calTarget = roundTo2(tee + offset);
      const proteinGrams = roundTo2(proteinMult * weightKg);
      const fatGrams = roundTo2((0.25 * calTarget) / 9);
      const remainingKcalForCarbs = Math.max(
        0,
        calTarget - proteinGrams * 4 - fatGrams * 9
      );
      const carbGrams = roundTo2(remainingKcalForCarbs / 4);

      const sessionsTarget = isWeek5To8 ? 3 : 2;
      const weekLabel = isWeek5To8 ? `Minggu ${clampedWeek} (Fase 5–8)` : `Minggu ${clampedWeek}`;

      return {
        path,
        level: 2,
        week: clampedWeek,
        levelTitle: "Level 2: Cukupi Kalori & Protein",
        weekLabel,
        calorieTarget: calTarget,
        calorieOffset: offset,
        teeBaseline: tee,
        macroTargets: {
          proteinGrams,
          fatGrams,
          carbGrams,
        },
        mainMissions: [
          {
            id: `gm-l2-w${clampedWeek}-surplus`,
            title: `Surplus +${offset} kkal & Protein ${proteinMult}g × BB (${proteinGrams}g)`,
            description: `Capai target energi ${Math.round(calTarget)} kkal dan asupan protein tinggi ${proteinGrams}g/hari untuk sintesis otot.`,
            targetValue: Math.round(calTarget),
            unit: "kkal",
            type: "calorie_surplus",
            xpReward: 65,
            coinReward: 30,
          },
          {
            id: `gm-l2-w${clampedWeek}-protein`,
            title: `Target Protein Harian: ${proteinGrams}g (${proteinMult}g/kg BB)`,
            description: `Pastikan sumber protein berkualitas tercukupi setiap waktu makan.`,
            targetValue: Math.round(proteinGrams),
            unit: "g protein",
            type: "macro_compliance",
            xpReward: 50,
            coinReward: 25,
          },
        ],
        sideMissions: [
          {
            id: `gm-l2-w${clampedWeek}-strength`,
            title: isWeek5To8
              ? "Latihan Beban 3x / Minggu"
              : "Latihan Beban Ringan 2x / Minggu",
            targetValue: sessionsTarget,
            unit: "sessions",
            type: "strength_training",
            xpReward: 40,
            coinReward: 20,
          },
          {
            id: `gm-l2-w${clampedWeek}-water`,
            title: "Minum Air Putih Min. 1500 ml",
            targetValue: 1500,
            unit: "ml",
            type: "water",
            xpReward: 25,
            coinReward: 10,
          },
        ],
      };
    }

    // Level 3: Nutrisi Khusus Latihan (Minggu 8+)
    if (level === 3) {
      const offset = 500;
      const calTarget = roundTo2(tee + offset);
      const proteinGrams = roundTo2(2.2 * weightKg);
      const fatGrams = roundTo2((0.25 * calTarget) / 9);
      const remainingKcalForCarbs = Math.max(
        0,
        calTarget - proteinGrams * 4 - fatGrams * 9
      );
      const carbGrams = roundTo2(remainingKcalForCarbs / 4);

      return {
        path,
        level: 3,
        week: Math.max(8, week),
        levelTitle: "Level 3: Nutrisi Khusus Latihan",
        weekLabel: `Minggu ${Math.max(8, week)}+`,
        calorieTarget: calTarget,
        calorieOffset: offset,
        teeBaseline: tee,
        macroTargets: {
          proteinGrams,
          fatGrams,
          carbGrams,
        },
        mainMissions: [
          {
            id: "gm-l3-surplus",
            title: `Surplus +500 kkal & Protein 2.2g × BB (${proteinGrams}g)`,
            description: `Capai total energi ${Math.round(calTarget)} kkal dan ${proteinGrams}g protein harian.`,
            targetValue: Math.round(calTarget),
            unit: "kkal",
            type: "calorie_surplus",
            xpReward: 75,
            coinReward: 35,
          },
          {
            id: "gm-l3-carbload",
            title: "Karbo Loading 3–4 Jam Sebelum Latihan (50–60g)",
            description:
              "Konsumsi 50–60g karbohidrat kompleks 3–4 jam sebelum sesi latihan beban untuk cadangan glikogen optimal.",
            targetValue: 55,
            unit: "g karbo",
            type: "carb_loading",
            xpReward: 60,
            coinReward: 25,
          },
        ],
        sideMissions: [
          {
            id: "gm-l3-strength",
            title: "Latihan Beban 3–4x / Minggu",
            targetValue: 4,
            unit: "sessions",
            type: "strength_training",
            xpReward: 45,
            coinReward: 20,
          },
          {
            id: "gm-l3-sleep",
            title: "Tidur Pemulihan Otot 7–9 Jam",
            targetValue: 8,
            unit: "hours",
            type: "sleep",
            xpReward: 30,
            coinReward: 15,
          },
          {
            id: "gm-l3-water",
            title: "Minum Air Putih Min. 1500 ml",
            targetValue: 1500,
            unit: "ml",
            type: "water",
            xpReward: 25,
            coinReward: 10,
          },
        ],
      };
    }

    // Level 4 & Level 5: Pertahankan Asupan Kalori & Protein + Evaluasi Lingkar Tubuh
    const offset = 500;
    const calTarget = roundTo2(tee + offset);
    const proteinGrams = roundTo2(2.2 * weightKg);
    const fatGrams = roundTo2((0.25 * calTarget) / 9);
    const remainingKcalForCarbs = Math.max(
      0,
      calTarget - proteinGrams * 4 - fatGrams * 9
    );
    const carbGrams = roundTo2(remainingKcalForCarbs / 4);

    return {
      path,
      level: level >= 5 ? 5 : 4,
      week,
      levelTitle: `Level ${level >= 5 ? 5 : 4}: Konsistensi Massa Otot`,
      weekLabel: "Pemeliharaan Hypertrophy",
      calorieTarget: calTarget,
      calorieOffset: offset,
      teeBaseline: tee,
      macroTargets: {
        proteinGrams,
        fatGrams,
        carbGrams,
      },
      mainMissions: [
        {
          id: "gm-l5-maintain",
          title: `Pertahankan Asupan Kalori (${Math.round(calTarget)} kkal) & Protein (${proteinGrams}g)`,
          description:
            "Pertahankan konsistensi surplus kalori bersih dan kebutuhan protein harian untuk menjaga perkembangan massa otot.",
          targetValue: Math.round(calTarget),
          unit: "kkal",
          type: "macro_compliance",
          xpReward: 85,
          coinReward: 40,
        },
      ],
      sideMissions: [
        {
          id: "gm-l5-strength",
          title: "Latihan Beban 3–4x / Minggu",
          targetValue: 4,
          unit: "sessions",
          type: "strength_training",
          xpReward: 45,
          coinReward: 20,
        },
        {
          id: "gm-l5-sleep",
          title: "Tidur Berkualitas 7–9 Jam",
          targetValue: 8,
          unit: "hours",
          type: "sleep",
          xpReward: 30,
          coinReward: 15,
        },
        {
          id: "gm-l5-water",
          title: "Minum Air Putih Min. 1500 ml",
          targetValue: 1500,
          unit: "ml",
          type: "water",
          xpReward: 25,
          coinReward: 10,
        },
        {
          id: "gm-l5-measure",
          title: "Ukur BB & Lingkar Tubuh Berkala",
          targetValue: 1,
          unit: "sessions",
          type: "body_measurement",
          xpReward: 35,
          coinReward: 15,
        },
      ],
    };
  }

  // =========================================================================
  // PATH 3: MENSTABILKAN BB (maintain_weight)
  // =========================================================================
  const baseMacros = calculateBaselineMacros(tee);

  if (level === 1) {
    return {
      path: "maintain_weight",
      level: 1,
      week: 1,
      levelTitle: "Level 1: Keseimbangan Harian",
      weekLabel: "95–105% Kebutuhan TEE",
      calorieTarget: roundTo2(tee),
      calorieOffset: 0,
      teeBaseline: tee,
      macroTargets: {
        proteinGrams: baseMacros.proteinGrams,
        fatGrams: baseMacros.fatGrams,
        carbGrams: baseMacros.carbGrams,
        fiberGrams: 32,
        sugarGramsMax: 50,
      },
      mainMissions: [
        {
          id: "mw-l1-main-balance",
          title: "Catat Asupan Harian (95–105% Kebutuhan TEE)",
          description: `Pertahankan energi harian sekitar ${Math.round(tee)} kkal (60% Karbo, 25% Lemak, 15% Protein), Serat 30–35g, dan Gula maks. 50g (5 sdm).`,
          targetValue: Math.round(tee),
          unit: "kkal",
          type: "macro_compliance",
          xpReward: 55,
          coinReward: 25,
        },
      ],
      sideMissions: [],
    };
  }

  // Level 2+: Pertahankan Target Intake Level 1 + Air 1500 ml (8 gelas)
  return {
    path: "maintain_weight",
    level: Math.max(2, level),
    week,
    levelTitle: "Level 2: Hidrasi & Stabilitas Gizi",
    weekLabel: "Gaya Hidup Sehat Aktif",
    calorieTarget: roundTo2(tee),
    calorieOffset: 0,
    teeBaseline: tee,
    macroTargets: {
      proteinGrams: baseMacros.proteinGrams,
      fatGrams: baseMacros.fatGrams,
      carbGrams: baseMacros.carbGrams,
      fiberGrams: 32,
      sugarGramsMax: 50,
    },
    mainMissions: [
      {
        id: "mw-l2-main-balance",
        title: "Pertahankan Target Intake Harian (95–105% TEE)",
        description: `Jaga kestabilan asupan ${Math.round(tee)} kkal dengan komposisi 60% Karbohidrat, 25% Lemak, 15% Protein, Serat 30–35g, Gula ≤50g.`,
        targetValue: Math.round(tee),
        unit: "kkal",
        type: "macro_compliance",
        xpReward: 65,
        coinReward: 30,
      },
    ],
    sideMissions: [
      {
        id: "mw-l2-side-water",
        title: "Capai Minum 8 Gelas / 1500 ml Air per Hari",
        targetValue: 1500,
        unit: "ml",
        type: "water",
        xpReward: 30,
        coinReward: 15,
      },
    ],
  };
}

// =========================================================================
// QUEST STAGES & WEEKLY PROGRESSION ENGINE (75% COMPLIANCE RULE)
// =========================================================================

export interface QuestStage {
  stageIndex: number;
  level: number;
  week: number;
  label: string;
  title: string;
}

export const PATH_STAGES: Record<GoalPath, QuestStage[]> = {
  lose_weight: [
    { stageIndex: 0, level: 1, week: 1, label: "Lv.1", title: "Level 1: Catat Asupan & Baseline TEE" },
    { stageIndex: 1, level: 2, week: 1, label: "Lv.2 Mg.1", title: "Level 2: Defisit -100 kkal (Minggu 1)" },
    { stageIndex: 2, level: 2, week: 2, label: "Lv.2 Mg.2", title: "Level 2: Defisit -200 kkal (Minggu 2)" },
    { stageIndex: 3, level: 2, week: 3, label: "Lv.2 Mg.3", title: "Level 2: Defisit -300 kkal (Minggu 3)" },
    { stageIndex: 4, level: 2, week: 4, label: "Lv.2 Mg.4", title: "Level 2: Defisit -400 kkal (Minggu 4)" },
    { stageIndex: 5, level: 3, week: 5, label: "Lv.3", title: "Level 3: Defisit Penuh -500 kkal" },
    { stageIndex: 6, level: 4, week: 6, label: "Lv.4", title: "Level 4: Maintenance TEE Seimbang" },
  ],
  gain_muscle: [
    { stageIndex: 0, level: 1, week: 1, label: "Lv.1", title: "Level 1: Catat Asupan & Baseline TEE" },
    { stageIndex: 1, level: 2, week: 1, label: "Lv.2 Mg.1", title: "Level 2: Surplus +100 kkal (Minggu 1)" },
    { stageIndex: 2, level: 2, week: 2, label: "Lv.2 Mg.2", title: "Level 2: Surplus +200 kkal (Minggu 2)" },
    { stageIndex: 3, level: 2, week: 3, label: "Lv.2 Mg.3", title: "Level 2: Surplus +300 kkal (Minggu 3)" },
    { stageIndex: 4, level: 2, week: 4, label: "Lv.2 Mg.4", title: "Level 2: Surplus +400 kkal (Minggu 4)" },
    { stageIndex: 5, level: 2, week: 5, label: "Lv.2 Mg.5", title: "Level 2: Surplus +500 kkal (Minggu 5–8)" },
    { stageIndex: 6, level: 3, week: 8, label: "Lv.3", title: "Level 3: Surplus Tinggi & Karbo Loading" },
    { stageIndex: 7, level: 5, week: 9, label: "Lv.5", title: "Level 5: Maintenance Otot" },
  ],
  maintain_weight: [
    { stageIndex: 0, level: 1, week: 1, label: "Lv.1", title: "Level 1: Keseimbangan Asupan TEE" },
    { stageIndex: 1, level: 2, week: 2, label: "Lv.2", title: "Level 2: Hidrasi & Stabilitas Gizi" },
  ],
};

export interface MissionAutoStatus {
  isCompleted: boolean;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercent: number;
  progressLabel: string;
  statusText: string;
}

export interface MissionEvaluationContext {
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  consumedFiber?: number;
  consumedSugar?: number;
  targetCalories: number;
  dayLogsCount: number;
  waterLoggedMl?: number;
  consecutiveStreakDays?: number;
}

/**
 * Pure evaluation function: determines whether a quest mission is fulfilled
 * solely based on meals logged, calories and nutrients consumed (not a manual checkbox).
 */
export function evaluateMissionAutoStatus(
  mission: QuestMainMission | QuestSideMission,
  ctx: MissionEvaluationContext
): MissionAutoStatus {
  const {
    consumedCalories,
    consumedProtein,
    consumedCarbs,
    consumedFat,
    consumedFiber = 0,
    targetCalories,
    dayLogsCount,
    waterLoggedMl = 0,
  } = ctx;

  switch (mission.type) {
    case "log_meals": {
      const hasLogged = dayLogsCount > 0;
      return {
        isCompleted: hasLogged,
        currentValue: dayLogsCount,
        targetValue: mission.targetValue || 1,
        unit: mission.unit,
        progressPercent: hasLogged ? 100 : 0,
        progressLabel: hasLogged
          ? `${dayLogsCount} makanan dicatat hari ini`
          : "Belum ada makanan dicatat",
        statusText: hasLogged
          ? "Target pencatatan makan harian terpenuhi!"
          : "Catat menu makananmu di Diary",
      };
    }

    case "calorie_deficit": {
      const target = mission.targetValue || targetCalories;
      const progressPercent = Math.min(
        100,
        Math.round((consumedCalories / Math.max(1, target)) * 100)
      );
      // Compliant deficit: user must have logged meals, intake between 75% and 105% of target
      const isCompliant =
        dayLogsCount > 0 &&
        consumedCalories >= target * 0.75 &&
        consumedCalories <= target * 1.05;

      return {
        isCompleted: isCompliant,
        currentValue: consumedCalories,
        targetValue: target,
        unit: "kkal",
        progressPercent,
        progressLabel:
          dayLogsCount > 0
            ? `${Math.round(consumedCalories)} / ${Math.round(target)} kkal (${progressPercent}%)`
            : `0 / ${Math.round(target)} kkal (Belum catat makan)`,
        statusText:
          dayLogsCount === 0
            ? "Catat makananmu di Diary untuk mencapai target defisit"
            : isCompliant
            ? "Target defisit kalori tercapai!"
            : consumedCalories > target * 1.05
            ? "Melebihi target kalori defisit"
            : "Asupan kalori belum mencukupi batas minimal defisit",
      };
    }

    case "calorie_surplus": {
      const target = mission.targetValue || targetCalories;
      const progressPercent = Math.min(
        100,
        Math.round((consumedCalories / Math.max(1, target)) * 100)
      );
      // Compliant surplus: user must have logged meals, intake >= 90% and <= 115% of target
      const isCompliant =
        dayLogsCount > 0 &&
        consumedCalories >= target * 0.9 &&
        consumedCalories <= target * 1.15;

      return {
        isCompleted: isCompliant,
        currentValue: consumedCalories,
        targetValue: target,
        unit: "kkal",
        progressPercent,
        progressLabel:
          dayLogsCount > 0
            ? `${Math.round(consumedCalories)} / ${Math.round(target)} kkal (${progressPercent}%)`
            : `0 / ${Math.round(target)} kkal (Belum catat makan)`,
        statusText:
          dayLogsCount === 0
            ? "Catat makananmu di Diary untuk mencapai target surplus"
            : isCompliant
            ? "Target surplus kalori tercapai!"
            : consumedCalories < target * 0.9
            ? "Asupan kalori masih kurang untuk surplus"
            : "Asupan kalori melebihi batas surplus bersih",
      };
    }

    case "macro_compliance": {
      const target = mission.targetValue;
      const unit = mission.unit;

      if (unit.includes("protein") || mission.id.includes("protein")) {
        const progressPercent = Math.min(
          100,
          Math.round((consumedProtein / Math.max(1, target)) * 100)
        );
        const isCompliant = dayLogsCount > 0 && consumedProtein >= target * 0.85;
        return {
          isCompleted: isCompliant,
          currentValue: consumedProtein,
          targetValue: target,
          unit: "g",
          progressPercent,
          progressLabel:
            dayLogsCount > 0
              ? `${Math.round(consumedProtein)} / ${Math.round(target)}g protein (${progressPercent}%)`
              : `0 / ${Math.round(target)}g protein`,
          statusText:
            dayLogsCount === 0
              ? "Catat makananmu untuk memenuhi target protein"
              : isCompliant
              ? "Target protein harian tercapai!"
              : "Asupan protein masih di bawah target",
        };
      }

      if (unit.includes("serat") || mission.id.includes("serat")) {
        const progressPercent = Math.min(
          100,
          Math.round((consumedFiber / Math.max(1, target)) * 100)
        );
        const isCompliant = dayLogsCount > 0 && consumedFiber >= target * 0.8;
        return {
          isCompleted: isCompliant,
          currentValue: consumedFiber,
          targetValue: target,
          unit: "g",
          progressPercent,
          progressLabel:
            dayLogsCount > 0
              ? `${Math.round(consumedFiber)} / ${Math.round(target)}g serat (${progressPercent}%)`
              : `0 / ${Math.round(target)}g serat`,
          statusText:
            dayLogsCount === 0
              ? "Catat makananmu untuk memenuhi target serat"
              : isCompliant
              ? "Target serat harian tercapai!"
              : "Perbanyak konsumsi sayur & buah",
        };
      }

      // Maintenance calories compliance
      const progressPercent = Math.min(
        100,
        Math.round((consumedCalories / Math.max(1, target)) * 100)
      );
      const isCompliant =
        dayLogsCount > 0 &&
        consumedCalories >= target * 0.85 &&
        consumedCalories <= target * 1.15;
      return {
        isCompleted: isCompliant,
        currentValue: consumedCalories,
        targetValue: target,
        unit: "kkal",
        progressPercent,
        progressLabel:
          dayLogsCount > 0
            ? `${Math.round(consumedCalories)} / ${Math.round(target)} kkal (${progressPercent}%)`
            : `0 / ${Math.round(target)} kkal`,
        statusText:
          dayLogsCount === 0
            ? "Catat makananmu untuk menjaga keseimbangan TEE"
            : isCompliant
            ? "Keseimbangan energi harian seimbang!"
            : "Jaga asupan dalam rentang 85–115% TEE",
      };
    }

    case "carb_loading": {
      const target = mission.targetValue;
      const progressPercent = Math.min(
        100,
        Math.round((consumedCarbs / Math.max(1, target)) * 100)
      );
      const isCompliant = dayLogsCount > 0 && consumedCarbs >= target;
      return {
        isCompleted: isCompliant,
        currentValue: consumedCarbs,
        targetValue: target,
        unit: "g",
        progressPercent,
        progressLabel:
          dayLogsCount > 0
            ? `${Math.round(consumedCarbs)} / ${Math.round(target)}g karbo (${progressPercent}%)`
            : `0 / ${Math.round(target)}g karbo`,
        statusText: isCompliant
          ? "Target karbohidrat loading terpenuhi!"
          : "Konsumsi karbohidrat kompleks sebelum latihan",
      };
    }

    case "water": {
      const target = mission.targetValue || 1500;
      const progressPercent = Math.min(
        100,
        Math.round((waterLoggedMl / Math.max(1, target)) * 100)
      );
      const isCompliant = waterLoggedMl >= target;
      return {
        isCompleted: isCompliant,
        currentValue: waterLoggedMl,
        targetValue: target,
        unit: "ml",
        progressPercent,
        progressLabel: `${waterLoggedMl} / ${target} ml (${Math.round(waterLoggedMl / 250)} gelas)`,
        statusText: isCompliant
          ? "Target hidrasi 8 gelas terpenuhi!"
          : "Minum air putih minimal 1500 ml hari ini",
      };
    }

    default: {
      return {
        isCompleted: false,
        currentValue: 0,
        targetValue: mission.targetValue,
        unit: mission.unit,
        progressPercent: 0,
        progressLabel: `Target: ${mission.targetValue} ${mission.unit}`,
        statusText: "Aktivitas harian pendukung kebiasaan sehat",
      };
    }
  }
}

export interface WeeklyProgressionResult {
  activePath: GoalPath;
  unlockedStages: QuestStage[];
  activeStage: QuestStage;
  selectedStage: QuestStage;
  totalDaysElapsed: number;
  currentCalendarWeek: number;
  dayInCurrentWeek: number;
  currentWeekMetDays: number;
  currentWeekComplianceRate: number;
  requiredDaysMet: number;
  isRepeating: boolean;
  repeatCount: number;
  canAdvance: boolean;
  advanceRequirementNotice: string;
}

export interface LogDateItem {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  loggedDate: string;
}

/**
 * Calculates level unlock and progression status based on registration / start date
 * and the strict 75% weekly target requirement.
 */
export function calculateWeeklyProgression(params: {
  startDate: string;
  goalPath: GoalPath;
  logs: LogDateItem[];
  selectedLevel?: number;
  selectedWeek?: number;
  todayDateStr?: string;
  targetCalories?: number;
}): WeeklyProgressionResult {
  const {
    startDate,
    goalPath,
    logs,
    selectedLevel,
    selectedWeek,
    todayDateStr = new Date().toISOString().split("T")[0],
    targetCalories = 2000,
  } = params;

  const stages = PATH_STAGES[goalPath] || PATH_STAGES.lose_weight;

  // Calculate elapsed calendar days from startDate to todayDateStr
  const parseYmd = (s: string) => {
    const parts = s.split("-").map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  };

  const startD = parseYmd(startDate || todayDateStr);
  const todayD = parseYmd(todayDateStr);
  const diffMs = todayD.getTime() - startD.getTime();
  const totalDaysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const completedWeeksCount = Math.floor(totalDaysElapsed / 7);
  const currentCalendarWeek = completedWeeksCount + 1;
  const dayInCurrentWeek = (totalDaysElapsed % 7) + 1;

  // Group logs by loggedDate
  const logsByDate = new Map<string, LogDateItem[]>();
  for (const log of logs) {
    const d = log.loggedDate;
    if (!logsByDate.has(d)) logsByDate.set(d, []);
    logsByDate.get(d)!.push(log);
  }

  const checkDayCompliant = (dateStr: string): boolean => {
    const dayLogs = logsByDate.get(dateStr) || [];
    if (dayLogs.length === 0) return false;
    const totalCal = dayLogs.reduce((acc, l) => acc + l.calories, 0);
    // At least 70% of target and not grossly over (under 120%)
    return totalCal >= targetCalories * 0.7 && totalCal <= targetCalories * 1.2;
  };

  const formatDateYmd = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Simulate historical weeks to determine active stage
  let stageIndex = 0;
  let isRepeating = false;
  let repeatCount = 0;

  for (let w = 0; w < completedWeeksCount; w++) {
    let metDays = 0;
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayDate = new Date(startD);
      dayDate.setDate(dayDate.getDate() + w * 7 + dayOffset);
      const dateKey = formatDateYmd(dayDate);
      if (checkDayCompliant(dateKey)) {
        metDays++;
      }
    }

    // 75% rule: 7 * 0.75 = 5.25 => at least 5.25 days (i.e. >= 6 days or ratio >= 0.75)
    const ratio = metDays / 7;
    if (ratio >= 0.75) {
      stageIndex = Math.min(stages.length - 1, stageIndex + 1);
      isRepeating = false;
      repeatCount = 0;
    } else {
      // Repeat the level!
      isRepeating = true;
      repeatCount++;
    }
  }

  // Current in-progress week evaluation
  let currentWeekMetDays = 0;
  for (let dayOffset = 0; dayOffset < dayInCurrentWeek; dayOffset++) {
    const dayDate = new Date(startD);
    dayDate.setDate(dayDate.getDate() + completedWeeksCount * 7 + dayOffset);
    const dateKey = formatDateYmd(dayDate);
    if (checkDayCompliant(dateKey)) {
      currentWeekMetDays++;
    }
  }

  const currentWeekComplianceRate = Math.round(
    (currentWeekMetDays / Math.max(1, dayInCurrentWeek)) * 100
  );
  const requiredDaysMet = Math.ceil(7 * 0.75); // 6 days

  // Unlocked stages: from 0 up to stageIndex
  const unlockedStages = stages.slice(0, stageIndex + 1);
  const activeStage = stages[stageIndex];

  // Resolve selected stage: user can only view unlocked stages
  let selectedStage = activeStage;
  if (selectedLevel !== undefined) {
    const candidate = unlockedStages.find(
      (s) =>
        s.level === selectedLevel &&
        (selectedWeek === undefined || s.week === selectedWeek)
    );
    if (candidate) {
      selectedStage = candidate;
    }
  }

  const canAdvance =
    dayInCurrentWeek >= 7 && currentWeekMetDays / 7 >= 0.75;

  const advanceRequirementNotice =
    `Level terkunci hanya dapat dibuka berdasarkan waktu (minimal 1 minggu per level) dan ` +
    `kepatuhan target harian minimal 75% (${requiredDaysMet} dari 7 hari) tercapai. ` +
    `Jika di bawah 75%, kamu harus mengulang level di minggu berikutnya.`;

  return {
    activePath: goalPath,
    unlockedStages,
    activeStage,
    selectedStage,
    totalDaysElapsed,
    currentCalendarWeek,
    dayInCurrentWeek,
    currentWeekMetDays,
    currentWeekComplianceRate,
    requiredDaysMet,
    isRepeating,
    repeatCount,
    canAdvance,
    advanceRequirementNotice,
  };
}
