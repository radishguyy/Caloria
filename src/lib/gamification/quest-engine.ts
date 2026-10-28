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
