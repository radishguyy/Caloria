import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from "@/db";
import {
  foodLogs,
  foods,
  dailyNutritionSummaries,
  profiles,
  pets,
} from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

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
        "Fun RPG eating archetype in Indonesian, e.g., 'Ksatria Protein Tinggi', 'Penjelajah Sayur', 'Pejuang Defisit Konsisten'",
    },
    grade: { type: Type.STRING, enum: ["S", "A", "B", "C", "D"] },
    headline: {
      type: Type.STRING,
      description: "Punchy, celebratory phrase for slide 1",
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
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          highlightStat: {
            type: Type.STRING,
            description:
              "e.g., '6/7 Hari Asupan Baik', '+450 Pet EXP', 'Ayam Bakar'",
          },
          commentary: {
            type: Type.STRING,
            description: "2-3 playful sentences in Calpal's voice (Indonesian)",
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
        "One simple practical nutritional habit to focus on next",
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
    totalCalories,
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
  let archetypeTitle = "Penjelajah Nutrisi Seimbang";
  let headline = `Pencapaian Hebat di ${unitLabel} ke-${cycleNumber}!`;
  let tip = "Coba tambahkan satu porsi sayuran hijau di setiap makan siang!";

  if (depkesPercentage >= 85 && daysLogged >= (totalCycleDays * 0.8)) {
    grade = "S";
    archetypeTitle =
      topMacro === "Protein"
        ? "Ksatria Protein Tinggi Legendaris"
        : "Master Gizi Seimbang Paripurna";
    headline = `Luar Biasa! Performa Emas di ${unitLabel} ke-${cycleNumber}! ⭐`;
    tip = "Ritme gizi kamu sudah sempurna! Terus pertahankan konsistensi ini.";
  } else if (depkesPercentage >= 70 && daysLogged >= (totalCycleDays * 0.6)) {
    grade = "A";
    archetypeTitle =
      topMacro === "Protein"
        ? "Pejuang Protein Disiplin"
        : "Penjelajah Kalori Terarah";
    headline = `Mantap Sekali! Standar Depkes Berhasil Terlampaui! 🚀`;
    tip = "Jaga hidrasi minimal 2 liter sehari untuk menjaga metabolisme optimal.";
  } else if (daysLogged >= (totalCycleDays * 0.4)) {
    grade = "B";
    archetypeTitle = "Pencari Konsistensi Tangguh";
    headline = `Pondasi Kuat! Kita Siap Melesat Lebih Jauh! 💪`;
    tip = "Catat makanan tepat setelah selesai makan agar tidak ada menu yang terlewat.";
  } else {
    grade = daysLogged > 0 ? "C" : "D";
    archetypeTitle = "Petualang Pemula Penuh Harapan";
    headline = `Langkah Awal Bersama Calpal! 🌱`;
    tip = "Awali hari dengan sarapan padat nutrisi untuk membakar energimu!";
  }

  const slides: RecapSlideData[] = [
    {
      slideType: "intro",
      title: `Recap ${unitLabel} ke-${cycleNumber} Kamu!`,
      subtitle: archetypeTitle,
      highlightStat: `${daysLogged}/${totalCycleDays} Hari Tercatat`,
      commentary: `Halo sahabatku! Aku ${petName}. Selama ${unitLabel.toLowerCase()} ini, kita sudah bersama-sama merekam perjalanan nutrisi dan kebiasaan makanmu!`,
      petMood: grade === "S" || grade === "A" ? "proud" : "dancing",
    },
    {
      slideType: "nutrition_stats",
      title: "Rapor Angka & Standar Depkes",
      subtitle: "Kepatuhan Zona Asupan Baik (80% - 120%)",
      highlightStat: `${daysMeetingDepkes}/${daysLogged || totalCycleDays} Hari Depkes (${depkesPercentage}%)`,
      commentary: `Rata-rata asupan harianmu sebesar ${averageCalories} kkal (target ideal ${targetTee} kkal). Kita berhasil menjaga stabilitas energi tubuh dengan konsisten!`,
      petMood: depkesPercentage >= 70 ? "proud" : "curious",
    },
    {
      slideType: "food_spotlight",
      title: "Menu Favorit Paling Sering Disantap",
      subtitle: `Primadona Makronutrien: ${topMacro}`,
      highlightStat: topFood,
      commentary: `Wah, aroma lezat! Makanan "${topFood}" paling sering kamu nikmati di siklus ini. Pilihan yang nikmat untuk menopang energimu!`,
      petMood: "eating",
    },
    {
      slideType: "pet_milestone",
      title: "Pet Growth & Gamifikasi",
      subtitle: `${petName} Level ${petLevel}`,
      highlightStat: `+${expEarned} EXP • +${coinsGained} Koin`,
      commentary: `Lihat seberapa bahagianya aku! Berkat kedisiplinanmu, aku mengumpulkan banyak EXP dan Caloria Coins untuk bergaya di Plaza!`,
      petMood: "dancing",
    },
    {
      slideType: "letter_from_calpal",
      title: `Surat Hangat dari ${petName}`,
      subtitle: `Evaluasi Siklus: Grade ${grade}`,
      highlightStat: `Grade ${grade}`,
      commentary: `Terima kasih sudah terus berjuang bersamaku sahabat! Tidak ada usaha yang sia-sia. Bersiaplah untuk tantangan baru berikutnya!`,
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

  const systemPrompt = `You are ${petName}, the user's adorable and loyal virtual pet companion (Calpal) in Caloria.
You are presenting "Caloria Wrapped" — an interactive, celebratory story recap of the user's nutritional and gamified journey over the past ${totalCycleDays} days (${unitLabel} ke-${cycleNumber}).

Persona & Tone Rules:
1. Language: Conversational, warm, playful Indonesian (Bahasa Indonesia santai, suportif, berjiwa RPG companion).
2. Persona: You love food, praise the user's consistency, and frame any shortfall as an exciting quest to conquer together.
3. Strict 5-Slide Sequence: The "slides" array MUST contain EXACTLY 5 objects in this precise order:
   - Slide 1: slideType = "intro" (Introduce the wrapped recap and celebrate the user's archetype).
   - Slide 2: slideType = "nutrition_stats" (Highlight total calories, Depkes 80%-120% compliance days, and average calories).
   - Slide 3: slideType = "food_spotlight" (Spotlight the user's #1 favorite food "${topFood}" and top macro "${topMacro}").
   - Slide 4: slideType = "pet_milestone" (Celebrate EXP gained (+${expEarned}), coins collected (+${coinsGained}), and pet growth).
   - Slide 5: slideType = "letter_from_calpal" (Personal heartfelt letter from ${petName}, grade reflection, and looking forward to next week).
4. Assign an honest yet uplifting grade (S, A, B, C, or D) based on depkesPercentage (${depkesPercentage}%) and days logged (${daysLogged}/${totalCycleDays}).
5. Return ONLY a valid JSON object matching the provided schema.`;

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
