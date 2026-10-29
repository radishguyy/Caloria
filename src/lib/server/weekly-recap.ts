import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from "@/db";
import {
  foodLogs,
  dailyNutritionSummaries,
  profiles,
  pets,
  weeklyRecaps,
} from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export interface WeeklyRecapAggregationInput {
  userId?: string;
  userName?: string;
  weekNumber: number;
  startDate?: string;
  endDate?: string;
  daysLogged: number;
  averageCalories: number;
  targetTee: number;
  macroComplianceDistribution: {
    baikPercent: number; // 80% - 120%
    lebihPercent: number; // > 120%
    defisitPercent: number; // < 80%
  };
  passedLevel: boolean;
  complianceRate: number; // 0 - 100
  goalPath?: string;
  petStatus: {
    name?: string;
    level?: number;
    currentXp?: number;
    expGained?: number;
    currentMood?: "proud" | "energetic" | "hungry" | "determined";
  };
}

export interface WeeklyRecapContent {
  weekTitle: string;
  grade: "S" | "A" | "B" | "C" | "D";
  summaryParagraph: string;
  strengths: string[];
  improvements: string[];
  calpalMoodReaction: "proud" | "energetic" | "hungry" | "determined";
  motivationQuote: string;
  stats?: {
    daysLogged: number;
    averageCalories: number;
    targetTee: number;
    passedLevel: boolean;
    complianceRate: number;
  };
}

export const weeklyRecapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    weekTitle: {
      type: Type.STRING,
      description:
        "Punchy, encouraging title (e.g., 'Minggu Adaptasi yang Luar Biasa!')",
    },
    grade: {
      type: Type.STRING,
      enum: ["S", "A", "B", "C", "D"],
      description: "Overall weekly nutritional letter grade",
    },
    summaryParagraph: {
      type: Type.STRING,
      description:
        "2-3 sentences summarizing nutritional performance in Indonesian, speaking as the user's pet/Calpal",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 concrete positive habits noticed this week",
    },
    improvements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "1-2 gentle, actionable nutritional adjustments for next week",
    },
    calpalMoodReaction: {
      type: Type.STRING,
      enum: ["proud", "energetic", "hungry", "determined"],
      description: "Mood state of the pet based on compliance",
    },
    motivationQuote: {
      type: Type.STRING,
      description: "Short motivational sign-off",
    },
  },
  required: [
    "weekTitle",
    "grade",
    "summaryParagraph",
    "strengths",
    "improvements",
    "calpalMoodReaction",
    "motivationQuote",
  ],
};

const RECAP_SYSTEM_PROMPT = `You are Calpal, the user's faithful virtual pet companion in Caloria.
Analyze the user's 7-day nutritional logs, macro compliance (Depkes standards), and quest outcomes, delivering encouraging, gamified feedback written in Calpal's voice.

Rules & Tone:
1. Language: Relaxed, conversational Indonesian (Bahasa Indonesia santai, suportif, tanpa istilah medis yang rumit).
2. Tone: Playful RPG companion—praise consistency, frame deficits or missed goals as learning curves rather than failures.
3. Grade Scale:
   - S: >= 90% compliance, 6-7 days logged. Outstanding!
   - A: >= 75% compliance, >= 5 days logged. Target passed (>=75%).
   - B: 60-74% compliance. Solid effort, repeats level to build habit.
   - C: 40-59% compliance. Needs re-engagement.
   - D: < 40% compliance.
4. Mood Reaction:
   - "proud" or "energetic" if passedLevel is true (compliance >= 75%).
   - "determined" or "hungry" if passedLevel is false (< 75%).
5. Return strictly the JSON object matching the provided schema.`;

/**
 * Fallback generator when Gemini API key is missing or service is offline.
 * Produces guaranteed valid structured JSON adhering strictly to `weeklyRecapSchema`.
 */
export function generateDeterministicFallbackRecap(
  input: WeeklyRecapAggregationInput
): WeeklyRecapContent {
  const {
    complianceRate,
    daysLogged,
    passedLevel,
    averageCalories,
    targetTee,
    petStatus,
  } = input;
  const petName = petStatus.name || "Calpal";

  let grade: "S" | "A" | "B" | "C" | "D" = "C";
  let mood: "proud" | "energetic" | "hungry" | "determined" = "hungry";
  let title = "Minggu Refleksi Nutrisi Bersama Calpal";
  let summary = `Halo teman! Aku ${petName}. Minggu ini kita mencatat makanan selama ${daysLogged} hari dengan rata-rata ${Math.round(
    averageCalories
  )} kkal. Terus tingkatkan konsistensi ya!`;
  let strengths: string[] = [
    `Mencatat makanan aktif selama ${daysLogged} hari di pekan ini`,
    "Tetap memiliki semangat untuk memantau asupan harian",
  ];
  let improvements: string[] = [
    "Usahakan mencatat makanan setiap hari tanpa terlewat",
    `Dekatkan asupan kalori ke target harianmu (${targetTee} kkal)`,
  ];
  let quote = "Setiap langkah kecil membawamu lebih dekat ke tubuh impianmu! 🚀";

  if (complianceRate >= 90 && daysLogged >= 6) {
    grade = "S";
    mood = "proud";
    title = "Performa Legendaris! Minggu Sempurna ⭐";
    summary = `Luar biasa banget! Aku ${petName} bangga banget sama kedisiplinanmu pekan ini! Kamu berhasil memenuhi target nutrisi Depkes dengan kepatuhan ${complianceRate}% dan aktif 7 hari penuh.`;
    strengths = [
      `Kepatuhan target nutrisi luar biasa tinggi (${complianceRate}%)`,
      `Konsistensi pencatatan makanan sempurna (${daysLogged} dari 7 hari)`,
    ];
    improvements = [
      "Pertahankan ritme hebat ini untuk pekan berikutnya!",
      "Eksplorasi variasi menu bergizi seimbang agar tidak bosan",
    ];
    quote = "Kamu adalah master nutrisi sejati! Pet-mu melompat kegirangan! 🏆✨";
  } else if (complianceRate >= 75 && daysLogged >= 5) {
    grade = "A";
    mood = "energetic";
    title = "Target Terlampaui! Siap Naik Level 🚀";
    summary = `Keren sekali! Aku ${petName} merasa penuh energi! Kepatuhanmu mencapai ${complianceRate}%, berhasil melampaui batas minimum 75% untuk naik ke level selanjutnya.`;
    strengths = [
      `Berhasil melampaui standar kelulusan level (target >= 75%)`,
      `Rata-rata kalori (${Math.round(averageCalories)} kkal) mendekati target ideal`,
    ];
    improvements = [
      "Jaga keseimbangan makronutrien karbohidrat, protein, dan lemak",
      "Pastikan asupan hidrasi harian tetap tercukupi",
    ];
    quote = "Langkahmu semakin mantap! Level berikutnya sudah menunggumu! 🔥";
  } else if (complianceRate >= 60) {
    grade = "B";
    mood = "determined";
    title = "Pondasi Bagus! Ayo Kencangkan Lagi 💪";
    summary = `Semangat terus ya! Aku ${petName} melihat usahamu yang pantang menyerah. Dengan kepatuhan ${complianceRate}%, kita cuma butuh sedikit dorongan ekstra untuk lolos level berikutnya.`;
    strengths = [
      `Aktif mencatat makanan ${daysLogged} hari dalam sepekan`,
      "Menunjukkan komitmen awal yang sangat berharga",
    ];
    improvements = [
      "Fokuskan asupan pada makanan bergizi seimbang sesuai panduan Depkes",
      "Hindari jeda pencatatan agar target 75% tercapai di pekan ini",
    ];
    quote = "Gagal sekali bukan akhir, tapi kesempatan untuk membangun otot disiplin! 🛡️";
  } else {
    grade = complianceRate >= 40 ? "C" : "D";
    mood = "hungry";
    title = "Waktunya Menata Ulang Ritme Pekan Depan 🌱";
    summary = `Perutku ${petName} agak keroncongan nih! Pekan ini asupanmu baru tercatat ${daysLogged} hari dengan kepatuhan ${complianceRate}%. Yuk kita atur ulang strategi biar pekan depan lebih seru!`;
    strengths = [
      "Masih menyempatkan diri untuk mengecek progres nutrisi",
      "Memiliki data awal untuk diperbaiki di pekan berikutnya",
    ];
    improvements = [
      "Pasang alarm atau pengingat untuk mencatat makanan setelah makan",
      "Pilih makanan sederhana namun padat gizi untuk memenuhi kalori harian",
    ];
    quote = "Mulai lagi dengan satu piring sehat hari ini. Aku selalu menemanimu! 🐾";
  }

  return {
    weekTitle: title,
    grade,
    summaryParagraph: summary,
    strengths: strengths.slice(0, 2),
    improvements: improvements.slice(0, 2),
    calpalMoodReaction: mood,
    motivationQuote: quote,
    stats: {
      daysLogged,
      averageCalories: Math.round(averageCalories),
      targetTee,
      passedLevel,
      complianceRate,
    },
  };
}

/**
 * Generates an AI Weekly Nutritional Recap using @google/genai structured outputs.
 * Falls back safely to deterministic clinical generator if API key is not configured or throws.
 */
export async function generateWeeklyRecap(
  input: WeeklyRecapAggregationInput
): Promise<WeeklyRecapContent> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return generateDeterministicFallbackRecap(input);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
    ];

    const promptPayload = {
      user: {
        name: input.userName || "Teman Caloria",
        weekNumber: input.weekNumber,
        goalPath: input.goalPath || "lose_weight",
      },
      nutritionPerformance: {
        daysLogged: input.daysLogged,
        averageCalories: Math.round(input.averageCalories),
        targetTee: input.targetTee,
        complianceRate: input.complianceRate,
        macroComplianceDistribution: input.macroComplianceDistribution,
        passedLevel: input.passedLevel,
      },
      pet: {
        name: input.petStatus.name || "Calpal",
        level: input.petStatus.level || 1,
        expGained: input.petStatus.expGained || 0,
      },
    };

    let rawJsonResult: unknown = null;
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                { text: RECAP_SYSTEM_PROMPT },
                {
                  text: `Here is the user's weekly nutrition & quest data:\n${JSON.stringify(
                    promptPayload,
                    null,
                    2
                  )}`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: weeklyRecapSchema,
            temperature: 0.2,
          },
        });

        if (response.text) {
          rawJsonResult = JSON.parse(response.text);
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[WeeklyRecap] Model ${modelName} failed, retrying next...`, err);
      }
    }

    if (!rawJsonResult) {
      if (lastError) {
        console.error("[WeeklyRecap] All Gemini models failed:", lastError);
      }
      return generateDeterministicFallbackRecap(input);
    }

    const parsed = rawJsonResult as WeeklyRecapContent;
    return {
      ...parsed,
      stats: {
        daysLogged: input.daysLogged,
        averageCalories: Math.round(input.averageCalories),
        targetTee: input.targetTee,
        passedLevel: input.passedLevel,
        complianceRate: input.complianceRate,
      },
    };
  } catch (error) {
    console.error("[WeeklyRecap] Unexpected generation error, using fallback:", error);
    return generateDeterministicFallbackRecap(input);
  }
}

/**
 * Aggregates the last 7 days of nutrition summaries, logs, and pet progression from PostgreSQL.
 */
export async function aggregateWeeklyDataFromDb(
  userId: string,
  weekNumber: number = 1
): Promise<WeeklyRecapAggregationInput> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  const [pet] = await db
    .select()
    .from(pets)
    .where(eq(pets.userId, userId))
    .limit(1);

  const targetTee =
    profile?.targetCaloriesKcal || profile?.tdeeKcal || 2000;
  const goalPath = profile?.goalPath || "lose_weight";

  // Query summaries for the past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const recentSummaries = await db
    .select()
    .from(dailyNutritionSummaries)
    .where(
      and(
        eq(dailyNutritionSummaries.userId, userId),
        gte(dailyNutritionSummaries.summaryDate, sevenDaysAgoStr)
      )
    )
    .orderBy(desc(dailyNutritionSummaries.summaryDate))
    .limit(7);

  const daysLogged = recentSummaries.filter(
    (s) => Number(s.totalCalories) > 0
  ).length;

  const totalCaloriesSum = recentSummaries.reduce(
    (acc, curr) => acc + Number(curr.totalCalories || 0),
    0
  );
  const averageCalories =
    daysLogged > 0 ? totalCaloriesSum / daysLogged : 0;

  // Depkes compliance distribution
  let baikCount = 0;
  let lebihCount = 0;
  let defisitCount = 0;

  for (const s of recentSummaries) {
    const cal = Number(s.totalCalories || 0);
    const target = s.targetCalories || targetTee;
    if (cal <= 0) continue;
    const ratio = (cal / target) * 100;
    if (ratio > 120) {
      lebihCount++;
    } else if (ratio >= 80) {
      baikCount++;
    } else {
      defisitCount++;
    }
  }

  const denominator = Math.max(1, daysLogged);
  const baikPercent = Math.round((baikCount / denominator) * 100);
  const lebihPercent = Math.round((lebihCount / denominator) * 100);
  const defisitPercent = Math.round((defisitCount / denominator) * 100);

  // 75% rule: compliant days / 7
  const compliantDays = recentSummaries.filter(
    (s) =>
      s.isCalorieTargetMet ||
      (Number(s.totalCalories) >= targetTee * 0.75 &&
        Number(s.totalCalories) <= targetTee * 1.1)
  ).length;

  const complianceRate = Math.round((compliantDays / 7) * 100);
  const passedLevel = complianceRate >= 75;

  return {
    userId,
    userName: profile?.fullName || "Calorian",
    weekNumber,
    daysLogged,
    averageCalories,
    targetTee,
    macroComplianceDistribution: {
      baikPercent,
      lebihPercent,
      defisitPercent,
    },
    passedLevel,
    complianceRate,
    goalPath,
    petStatus: {
      name: pet?.name || "Calpal",
      level: pet?.level || 1,
      currentXp: pet?.currentXp || 0,
    },
  };
}

/**
 * Persist generated weekly recap to PostgreSQL database.
 */
export async function persistWeeklyRecap(
  userId: string,
  weekNumber: number,
  content: WeeklyRecapContent
): Promise<void> {
  await db
    .insert(weeklyRecaps)
    .values({
      userId,
      weekNumber,
      grade: content.grade,
      contentJson: content,
    })
    .onConflictDoUpdate({
      target: [weeklyRecaps.userId, weeklyRecaps.weekNumber],
      set: {
        grade: content.grade,
        contentJson: content,
        evaluationDate: sql`NOW()`,
      },
    });
}

/**
 * Retrieve saved weekly recap from PostgreSQL database.
 */
export async function getWeeklyRecapFromDb(
  userId: string,
  weekNumber: number
): Promise<WeeklyRecapContent | null> {
  const [existing] = await db
    .select()
    .from(weeklyRecaps)
    .where(
      and(
        eq(weeklyRecaps.userId, userId),
        eq(weeklyRecaps.weekNumber, weekNumber)
      )
    )
    .limit(1);

  if (!existing || !existing.contentJson) {
    return null;
  }

  return existing.contentJson as WeeklyRecapContent;
}

