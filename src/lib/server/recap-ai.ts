import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from "@/db";
import {
  foodLogs,
  foods,
  dailyNutritionSummaries,
  profiles,
  pets,
} from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface RecapSlideData {
  slideType:
    | "intro"
    | "nutrition_stats"
    | "food_spotlight"
    | "pet_milestone"
    | "letter_from_calpal";
  title: string;
  subtitle: string;
  highlightStat: string;
  commentary: string;
  petMood: "proud" | "dancing" | "curious" | "sleepy" | "eating";
}

export interface RecapStoryData {
  archetypeTitle: string;
  grade: "S" | "A" | "B" | "C" | "D";
  headline: string;
  slides: RecapSlideData[];
  actionableTipNextWeek: string;
  rawStats?: {
    totalCalories: number;
    averageCalories: number;
    targetTee: number;
    daysLogged: number;
    daysMeetingDepkes: number;
    depkesPercentage: number;
    topFood: string;
    topFoods: string[];
    topMacro: string;
    expEarned: number;
    coinsGained: number;
    petLevel: number;
    streakDays: number;
    goalPath: string;
    petName: string;
    petSpecies: string;
  };
}

export interface AggregatedRecapMetrics {
  totalCalories: number;
  averageCalories: number;
  targetTee: number;
  daysLogged: number;
  daysMeetingDepkes: number;
  depkesPercentage: number;
  topFood: string;
  topFoods: string[];
  topMacro: string;
  expEarned: number;
  coinsGained: number;
  petLevel: number;
  streakDays: number;
  goalPath: string;
  petName: string;
  petSpecies: string;
  cycleType: "weekly" | "monthly";
  cycleNumber: number;
}

export const recapStorySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    archetypeTitle: {
      type: Type.STRING,
      description:
        "Short 2-3 word title in Indonesian, e.g., 'Fokus Protein', 'Gizi Seimbang', 'Disiplin Defisit'",
    },
    grade: { type: Type.STRING, enum: ["S", "A", "B", "C", "D"] },
    headline: {
      type: Type.STRING,
      description: "Short, direct summary phrase (max 5 words)",
    },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          slideType: {
            type: Type.STRING,
            enum: [
              "intro",
              "nutrition_stats",
              "food_spotlight",
              "pet_milestone",
              "letter_from_calpal",
            ],
          },
          title: { type: Type.STRING, description: "Max 3 words" },
          subtitle: { type: Type.STRING, description: "Max 4 words" },
          highlightStat: {
            type: Type.STRING,
            description:
              "Short metric, e.g., '6/7 Hari', '+450 XP', 'Ayam Bakar'",
          },
          commentary: {
            type: Type.STRING,
            description: "1 short, direct sentence (max 10 words, Indonesian, no fluff)",
          },
          petMood: {
            type: Type.STRING,
            enum: ["proud", "dancing", "curious", "sleepy", "eating"],
          },
        },
        required: [
          "slideType",
          "title",
          "subtitle",
          "highlightStat",
          "commentary",
          "petMood",
        ],
      },
    },
    actionableTipNextWeek: {
      type: Type.STRING,
      description:
        "1 short actionable tip (max 8 words)",
    },
  },
  required: [
    "archetypeTitle",
    "grade",
    "headline",
    "slides",
    "actionableTipNextWeek",
  ],
};

/**
 * Aggregates real metrics from the PostgreSQL database across meal_logs/food_logs,
 * daily_nutrition_summaries, user profile, and pet tables for a specified date window.
 */
export async function aggregateRecapMetricsFromDb(
  userId: string,
  startDate: Date,
  endDate: Date,
  type: "weekly" | "monthly",
  cycleNumber: number
): Promise<AggregatedRecapMetrics> {
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  // 1. Fetch user profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  const targetTee =
    profile?.targetCaloriesKcal || profile?.tdeeKcal || 2000;
  const goalPath = profile?.goalPath || "lose_weight";
  const streakDays = profile?.currentStreakDays || 0;

  // 2. Fetch pet details
  const [userPet] = await db
    .select()
    .from(pets)
    .where(eq(pets.userId, userId))
    .limit(1);

  const petName = userPet?.name || "Calpal";
  const petSpecies = userPet?.species || "flameling";
  const petLevel = userPet?.level || 1;

  // 3. Fetch daily summaries in the date range
  const summaries = await db
    .select()
    .from(dailyNutritionSummaries)
    .where(
      and(
        eq(dailyNutritionSummaries.userId, userId),
        gte(dailyNutritionSummaries.summaryDate, startStr),
        lte(dailyNutritionSummaries.summaryDate, endStr)
      )
    );

  // 4. Fetch food logs in date range
  const logs = await db
    .select({
      id: foodLogs.id,
      foodId: foodLogs.foodId,
      customFoodName: foodLogs.customFoodName,
      foodCatalogName: foods.name,
      mealTime: foodLogs.mealTime,
      logDate: foodLogs.logDate,
      calculatedCalories: foodLogs.calculatedCalories,
      calculatedProtein: foodLogs.calculatedProtein,
      calculatedCarbs: foodLogs.calculatedCarbs,
      calculatedFat: foodLogs.calculatedFat,
      baseXpEarned: foodLogs.baseXpEarned,
    })
    .from(foodLogs)
    .leftJoin(foods, eq(foodLogs.foodId, foods.id))
    .where(
      and(
        eq(foodLogs.userId, userId),
        gte(foodLogs.logDate, startStr),
        lte(foodLogs.logDate, endStr)
      )
    );

  // 5. Aggregate calculations
  const totalDaysInCycle = type === "monthly" ? 28 : 7;
  const loggedDaysSet = new Set<string>();
  let totalCalories = 0;
  let totalProteinG = 0;
  let totalCarbsG = 0;
  let totalFatG = 0;
  let totalXpEarned = 0;
  let totalCoinsGained = 0;

  const foodCountMap = new Map<string, number>();

  for (const log of logs) {
    if (log.logDate) loggedDaysSet.add(log.logDate);
    totalCalories += Number(log.calculatedCalories || 0);
    totalProteinG += Number(log.calculatedProtein || 0);
    totalCarbsG += Number(log.calculatedCarbs || 0);
    totalFatG += Number(log.calculatedFat || 0);
    totalXpEarned += Number(log.baseXpEarned || 10);

    const foodName =
      log.customFoodName || log.foodCatalogName || "Makanan Sehat";
    foodCountMap.set(foodName, (foodCountMap.get(foodName) || 0) + 1);
  }

  // Count Depkes standard days: 80% to 120% of target calories
  let daysMeetingDepkes = 0;

  if (summaries.length > 0) {
    for (const s of summaries) {
      const cal = Number(s.totalCalories || 0);
      const target = Number(s.targetCalories || targetTee);
      if (cal >= 0.8 * target && cal <= 1.2 * target) {
        daysMeetingDepkes++;
      }
      totalXpEarned +=
        (s.baseXpTotal || 0) +
        (s.multiplierXpBonus || 0) +
        (s.jackpotXpBonus || 0);
      totalCoinsGained += s.coinsRewarded || 0;
    }
  } else {
    // If no summaries, aggregate daily from food logs
    const dailyMap = new Map<string, number>();
    for (const log of logs) {
      if (log.logDate) {
        dailyMap.set(
          log.logDate,
          (dailyMap.get(log.logDate) || 0) + Number(log.calculatedCalories || 0)
        );
      }
    }
    for (const [, cal] of dailyMap.entries()) {
      if (cal >= 0.8 * targetTee && cal <= 1.2 * targetTee) {
        daysMeetingDepkes++;
      }
    }
    totalCoinsGained = loggedDaysSet.size * 15;
  }

  const daysLogged = loggedDaysSet.size;
  const averageCalories =
    daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;
  const depkesPercentage = Math.round(
    (daysMeetingDepkes / (daysLogged || totalDaysInCycle)) * 100
  );

  // Determine top foods
  const sortedFoods = Array.from(foodCountMap.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const topFoods = sortedFoods.slice(0, 3).map((f) => f[0]);
  const topFood = topFoods[0] || "Menu Pilihanmu";

  // Determine highest macro in calories
  const proteinCals = totalProteinG * 4;
  const carbsCals = totalCarbsG * 4;
  const fatCals = totalFatG * 9;

  let topMacro = "Protein";
  if (carbsCals >= proteinCals && carbsCals >= fatCals) {
    topMacro = "Karbohidrat Seimbang";
  } else if (fatCals >= proteinCals && fatCals >= carbsCals) {
    topMacro = "Lemak Sehat";
  } else {
    topMacro = "Protein";
  }

  // Ensure default progression numbers if user has few logs
  const expEarned = Math.max(totalXpEarned, daysLogged * 50);
  const coinsGained = Math.max(totalCoinsGained, daysLogged * 20);

  return {
    totalCalories: Math.round(totalCalories),
    averageCalories,
    targetTee,
    daysLogged,
    daysMeetingDepkes,
    depkesPercentage,
    topFood,
    topFoods,
    topMacro,
    expEarned,
    coinsGained,
    petLevel,
    streakDays,
    goalPath,
    petName,
    petSpecies,
    cycleType: type,
    cycleNumber,
  };
}

/**
 * Deterministic fallback generator strictly adhering to recapStorySchema.
 * Used when Gemini API key is missing or offline.
 */
export function generateDeterministicFallbackRecap(
  metrics: AggregatedRecapMetrics
): RecapStoryData {
  const {
    daysLogged,
    daysMeetingDepkes,
    depkesPercentage,
    averageCalories,
    targetTee,
    topFood,
    topMacro,
    expEarned,
    coinsGained,
    petName,
    petLevel,
    cycleType,
    cycleNumber,
  } = metrics;

  const totalCycleDays = cycleType === "monthly" ? 28 : 7;
  const unitLabel = cycleType === "monthly" ? "Bulan" : "Pekan";

  let grade: "S" | "A" | "B" | "C" | "D" = "B";
  let archetypeTitle = "Gizi Seimbang";
  let headline = `Ringkasan ${unitLabel} ${cycleNumber}`;
  let tip = "Tambahkan porsi sayur di makan siang.";

  if (depkesPercentage >= 85 && daysLogged >= (totalCycleDays * 0.8)) {
    grade = "S";
    archetypeTitle =
      topMacro === "Protein" ? "Fokus Protein" : "Gizi Optimal";
    headline = `Target ${unitLabel} ${cycleNumber} Tercapai`;
    tip = "Pertahankan ritme makan dan porsi protein ini.";
  } else if (depkesPercentage >= 70 && daysLogged >= (totalCycleDays * 0.6)) {
    grade = "A";
    archetypeTitle =
      topMacro === "Protein" ? "Disiplin Protein" : "Kalori Terukur";
    headline = `Progres Stabil di ${unitLabel} ${cycleNumber}`;
    tip = "Jaga asupan air minimal 2 liter sehari.";
  } else if (daysLogged >= (totalCycleDays * 0.4)) {
    grade = "B";
    archetypeTitle = "Rutin Mencatat";
    headline = `Konsistensi ${unitLabel} ${cycleNumber}`;
    tip = "Catat makan langsung agar tidak terlewat.";
  } else {
    grade = daysLogged > 0 ? "C" : "D";
    archetypeTitle = "Langkah Awal";
    headline = `Awal ${unitLabel} ${cycleNumber}`;
    tip = "Mulai rutin mencatat sarapan setiap pagi.";
  }

  const slides: RecapSlideData[] = [
    {
      slideType: "intro",
      title: `Recap ${unitLabel} ${cycleNumber}`,
      subtitle: `${daysLogged} dari ${totalCycleDays} hari tercatat`,
      highlightStat: `${daysLogged}/${totalCycleDays} Hari`,
      commentary: `Catatan ${unitLabel.toLowerCase()} ini sudah siap, berikut ringkasannya.`,
      petMood: grade === "S" || grade === "A" ? "proud" : "dancing",
    },
    {
      slideType: "nutrition_stats",
      title: "Kepatuhan Kalori",
      subtitle: `Target ${targetTee} kkal / hari`,
      highlightStat: `${daysMeetingDepkes}/${daysLogged || totalCycleDays} Hari Sesuai Target`,
      commentary: `Rata-rata asupanmu ${averageCalories} kkal per hari.`,
      petMood: depkesPercentage >= 70 ? "proud" : "curious",
    },
    {
      slideType: "food_spotlight",
      title: "Menu Terfavorit",
      subtitle: `Dominan ${topMacro}`,
      highlightStat: topFood,
      commentary: `${topFood} menjadi menu yang paling sering kamu catat.`,
      petMood: "eating",
    },
    {
      slideType: "pet_milestone",
      title: `Progres ${petName}`,
      subtitle: `Level ${petLevel}`,
      highlightStat: `+${expEarned} XP`,
      commentary: `Konsistensimu menambah +${expEarned} XP dan +${coinsGained} koin.`,
      petMood: "dancing",
    },
    {
      slideType: "letter_from_calpal",
      title: `Evaluasi ${unitLabel} ${cycleNumber}`,
      subtitle: archetypeTitle,
      highlightStat: `Grade ${grade}`,
      commentary: `Progres bagus pekan ini, terus pertahankan kebiasaan sehatmu.`,
      petMood: "proud",
    },
  ];

  return {
    archetypeTitle,
    grade,
    headline,
    slides,
    actionableTipNextWeek: tip,
    rawStats: {
      ...metrics,
    },
  };
}

/**
 * Generates structured Caloria Wrapped recap using Google Gemini (@google/genai).
 * Returns strict JSON adhering to recapStorySchema.
 */
export async function generateRecapStoryWithAI(
  metrics: AggregatedRecapMetrics
): Promise<RecapStoryData> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return generateDeterministicFallbackRecap(metrics);
  }

  const {
    totalCalories,
    averageCalories,
    targetTee,
    daysLogged,
    daysMeetingDepkes,
    depkesPercentage,
    topFood,
    topFoods,
    topMacro,
    expEarned,
    coinsGained,
    petName,
    petLevel,
    streakDays,
    goalPath,
    cycleType,
    cycleNumber,
  } = metrics;

  const totalCycleDays = cycleType === "monthly" ? 28 : 7;
  const unitLabel = cycleType === "monthly" ? "Bulan" : "Pekan";

  const systemPrompt = `You are ${petName}, the user's companion in Caloria.
Present a concise, to-the-point nutritional recap for the past ${totalCycleDays} days (${unitLabel} ${cycleNumber}).

Strict Writing Rules:
1. Language: Clear, natural, concise Indonesian. No flowery AI fluff, no emojis, no exclamation spam.
2. Brevity:
   - "archetypeTitle": 2-3 words max (e.g., "Fokus Protein", "Gizi Seimbang").
   - "headline": 3-5 words max.
   - Slide "title": 2-3 words max.
   - Slide "subtitle": 3-4 words max.
   - Slide "commentary": 1 short sentence max (8-12 words). Get straight to the point.
   - "actionableTipNextWeek": 1 short practical sentence (max 8 words).
3. Strict 5-Slide Sequence:
   - Slide 1: slideType = "intro"
   - Slide 2: slideType = "nutrition_stats"
   - Slide 3: slideType = "food_spotlight" (top food "${topFood}", macro "${topMacro}")
   - Slide 4: slideType = "pet_milestone" (+${expEarned} XP, +${coinsGained} Koin)
   - Slide 5: slideType = "letter_from_calpal"
4. Grade (S, A, B, C, or D) based on depkesPercentage (${depkesPercentage}%) and days logged (${daysLogged}/${totalCycleDays}).
5. Return ONLY valid JSON matching the schema.`;

  const userPrompt = `Here are the user's database metrics for this ${totalCycleDays}-day cycle:
- Unit: ${unitLabel} ke-${cycleNumber}
- Total Calories Logged: ${totalCalories} kcal
- Average Daily Calories: ${averageCalories} kcal vs Target TEE: ${targetTee} kcal
- Days Logged: ${daysLogged} of ${totalCycleDays} days
- Days Meeting Depkes Standard (80% - 120%): ${daysMeetingDepkes} days (${depkesPercentage}% compliance)
- Top Logged Foods: ${topFoods.join(", ") || topFood}
- Primary Macro Intake: ${topMacro}
- Current Pet Level: ${petLevel}
- EXP Earned: +${expEarned} XP
- Coins Gained: +${coinsGained} Coins
- Current Streak: ${streakDays} days
- User Goal Path: ${goalPath}

Generate the Caloria Wrapped story slides as ${petName}.`;

  const candidateModels = [
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
  ];

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    let rawJson: RecapStoryData | null = null;
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: recapStorySchema,
            temperature: 0.7,
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text) as RecapStoryData;
          if (
            parsed &&
            parsed.archetypeTitle &&
            Array.isArray(parsed.slides) &&
            parsed.slides.length === 5
          ) {
            rawJson = parsed;
            break;
          }
        }
      } catch (err) {
        lastError = err;
        console.warn(`[RecapAI] Gemini model ${modelName} error:`, err);
      }
    }

    if (rawJson) {
      return {
        ...rawJson,
        rawStats: {
          ...metrics,
        },
      };
    }

    if (lastError) {
      console.warn("[RecapAI] Falling back to deterministic generator due to API error");
    }
  } catch (outerErr) {
    console.error("[RecapAI] Unexpected error calling Gemini:", outerErr);
  }

  return generateDeterministicFallbackRecap(metrics);
}
