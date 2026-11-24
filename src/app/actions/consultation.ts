"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenAI, Type, Schema, type Content } from "@google/genai";
import { eq, desc, asc, and, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  pets,
  foodLogs,
  dailyNutritionSummaries,
  weightLogs,
  consultationRooms,
  consultationMessages,
  notifications,
  type ConsultationRoomStatus,
  type ConsultationSenderRole,
  type ConsultationNutritionSnapshot,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/profile";
import { getJakartaTodayStr, recordFoodLogStreak } from "@/lib/server/streak-service";
import { getCalPalPersona, type CalPalPersona } from "@/lib/pet/calpal-personas";
import type { CharacterId } from "@/lib/character-assets/types";

export interface LoggedFoodFromConsult {
  logId?: string;
  foodName: string;
  mealTime: "breakfast" | "lunch" | "dinner" | "snack";
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  xpEarned: number;
}

export interface ConsultationPetInfo {
  name: string;
  characterId: CharacterId;
  speciesName: string;
  title: string;
  moodStatus: string;
  customColors: Record<string, string>;
}

export interface ConsultationMessageDTO {
  id: string;
  roomId: string;
  senderRole: ConsultationSenderRole;
  senderId: string | null;
  senderName: string | null;
  content: string;
  suggestHandoff: boolean;
  createdAt: string;
}

export interface ConsultationRoomDTO {
  id: string;
  userId: string;
  consultantId: string | null;
  topic: string;
  status: ConsultationRoomStatus;
  aiSummary: string | null;
  nutritionSnapshot: ConsultationNutritionSnapshot | null;
  escalatedAt: string | null;
  closedAt: string | null;
  lastMessageAt: string;
  createdAt: string;
  patient?: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  consultant?: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  lastMessagePreview?: string;
  messageCount?: number;
}

function hasConsultantRole(profile?: { role?: string | null } | null): boolean {
  if (!profile) return false;
  return profile.role === "nutritionist" || profile.role === "admin";
}

/**
 * Ensures each AI chat bubble uses strictly 0–2 emojis so responses stay natural and clean.
 */
function limitEmojis(text: string, maxEmojis = 2): string {
  let count = 0;
  return text
    .replace(
      /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu,
      (match) => {
        count += 1;
        return count <= maxEmojis ? match : "";
      }
    )
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([.,!?])/g, "$1")
    .trim();
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Turun Berat Badan (Defisit Kalori)",
  gain_muscle: "Naik Massa Otot / Bulking",
  maintain_weight: "Jaga Berat Badan Ideal (Maintenance)",
  diet: "Defisit Kalori",
  bulking: "Surplus / Bulking",
  maintenance: "Maintenance",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Jarang Olahraga / Sedentari",
  lightly_active: "Aktif Ringan (1-3x olahraga/minggu)",
  moderately_active: "Aktif Sedang (3-5x olahraga/minggu)",
  very_active: "Sangat Aktif (6-7x olahraga/minggu)",
  extra_active: "Atlet / Pekerjaan Fisik Berat",
};

const MEAL_TIME_LABELS: Record<string, string> = {
  breakfast: "Sarapan",
  lunch: "Makan Siang",
  dinner: "Makan Malam",
  snack: "Camilan",
};

async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const ensured = await ensureProfileForUser({
    userId: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || user.user_metadata?.name,
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  });

  const [fullProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return fullProfile || ensured.profile;
}

async function getAvailableNutritionists() {
  return db
    .select({
      id: profiles.id,
      username: profiles.username,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .where(eq(profiles.role, "nutritionist"));
}

async function getUserPetInfo(userId: string): Promise<ConsultationPetInfo> {
  const [petRow] = await db
    .select({
      name: pets.name,
      species: pets.species,
      characterId: pets.characterId,
      moodStatus: pets.moodStatus,
      customColors: pets.customColors,
    })
    .from(pets)
    .where(eq(pets.userId, userId))
    .limit(1);

  const rawSpecies = petRow?.characterId || petRow?.species || "flameling";
  const persona = getCalPalPersona(rawSpecies);

  return {
    name: petRow?.name?.trim() || persona.speciesName,
    characterId: persona.id,
    speciesName: persona.speciesName,
    title: persona.title,
    moodStatus: petRow?.moodStatus || "happy",
    customColors: (petRow?.customColors as Record<string, string>) || {},
  };
}

async function buildUserNutritionSnapshot(
  userId: string
): Promise<ConsultationNutritionSnapshot> {
  const todayStr = getJakartaTodayStr();

  const [[prof], recentLogs, recentSummaries, recentWeights] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, userId)).limit(1),
    db
      .select()
      .from(foodLogs)
      .where(eq(foodLogs.userId, userId))
      .orderBy(desc(foodLogs.createdAt))
      .limit(50),
    db
      .select()
      .from(dailyNutritionSummaries)
      .where(eq(dailyNutritionSummaries.userId, userId))
      .orderBy(desc(dailyNutritionSummaries.summaryDate))
      .limit(7),
    db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.loggedDate))
      .limit(10),
  ]);

  const targetCaloriesKcal = prof?.targetCaloriesKcal || 2000;
  const targetProteinG = Number(prof?.targetProteinG) || 125;
  const targetCarbsG = Number(prof?.targetCarbsG) || 250;
  const targetFatG = Number(prof?.targetFatG) || 55;

  const todayLogs = recentLogs.filter((l) => l.logDate === todayStr);
  const todayCaloriesKcal = Math.round(
    todayLogs.reduce((acc, l) => acc + (Number(l.calculatedCalories) || 0), 0)
  );
  const todayProteinG = Math.round(
    todayLogs.reduce((acc, l) => acc + (Number(l.calculatedProtein) || 0), 0)
  );
  const todayCarbsG = Math.round(
    todayLogs.reduce((acc, l) => acc + (Number(l.calculatedCarbs) || 0), 0)
  );
  const todayFatG = Math.round(
    todayLogs.reduce((acc, l) => acc + (Number(l.calculatedFat) || 0), 0)
  );

  // Today's per-meal breakdown
  const mealOrder = ["breakfast", "lunch", "dinner", "snack"];
  const todayMealsBreakdown = mealOrder
    .map((slot) => {
      const slotLogs = todayLogs.filter((l) => l.mealTime === slot);
      if (slotLogs.length === 0) return null;
      return {
        mealTime: MEAL_TIME_LABELS[slot] || slot,
        foods: slotLogs
          .map((l) => l.customFoodName)
          .filter((n): n is string => Boolean(n && n.trim())),
        caloriesKcal: Math.round(
          slotLogs.reduce(
            (acc, l) => acc + (Number(l.calculatedCalories) || 0),
            0
          )
        ),
        proteinG: Math.round(
          slotLogs.reduce(
            (acc, l) => acc + (Number(l.calculatedProtein) || 0),
            0
          )
        ),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  // 7-day trend calculation (from dailyNutritionSummaries, or aggregated from recentLogs by date if summaries empty)
  let weeklyTrend: ConsultationNutritionSnapshot["weeklyTrend"] = {
    loggedDaysCount: 0,
    avgCaloriesKcal: todayCaloriesKcal,
    avgProteinG: todayProteinG,
    avgCarbsG: todayCarbsG,
    avgFatG: todayFatG,
    daysOnTarget: 0,
    daysOverTarget: 0,
  };

  if (recentSummaries.length > 0) {
    const count = recentSummaries.length;
    const sumCal = recentSummaries.reduce(
      (a, s) => a + (Number(s.totalCalories) || 0),
      0
    );
    const sumProt = recentSummaries.reduce(
      (a, s) => a + (Number(s.totalProtein) || 0),
      0
    );
    const sumCarb = recentSummaries.reduce(
      (a, s) => a + (Number(s.totalCarbs) || 0),
      0
    );
    const sumFat = recentSummaries.reduce(
      (a, s) => a + (Number(s.totalFat) || 0),
      0
    );
    const daysOver = recentSummaries.filter(
      (s) => (Number(s.totalCalories) || 0) > targetCaloriesKcal * 1.1
    ).length;
    const daysOn = recentSummaries.filter((s) => {
      const c = Number(s.totalCalories) || 0;
      return c >= targetCaloriesKcal * 0.8 && c <= targetCaloriesKcal * 1.1;
    }).length;

    weeklyTrend = {
      loggedDaysCount: count,
      avgCaloriesKcal: Math.round(sumCal / count),
      avgProteinG: Math.round(sumProt / count),
      avgCarbsG: Math.round(sumCarb / count),
      avgFatG: Math.round(sumFat / count),
      daysOnTarget: daysOn,
      daysOverTarget: daysOver,
    };
  } else if (recentLogs.length > 0) {
    const byDate = new Map<
      string,
      { cal: number; prot: number; carb: number; fat: number }
    >();
    for (const l of recentLogs) {
      const prev = byDate.get(l.logDate) || { cal: 0, prot: 0, carb: 0, fat: 0 };
      prev.cal += Number(l.calculatedCalories) || 0;
      prev.prot += Number(l.calculatedProtein) || 0;
      prev.carb += Number(l.calculatedCarbs) || 0;
      prev.fat += Number(l.calculatedFat) || 0;
      byDate.set(l.logDate, prev);
    }
    const days = Array.from(byDate.values()).slice(0, 7);
    const count = days.length || 1;
    weeklyTrend = {
      loggedDaysCount: days.length,
      avgCaloriesKcal: Math.round(
        days.reduce((a, d) => a + d.cal, 0) / count
      ),
      avgProteinG: Math.round(days.reduce((a, d) => a + d.prot, 0) / count),
      avgCarbsG: Math.round(days.reduce((a, d) => a + d.carb, 0) / count),
      avgFatG: Math.round(days.reduce((a, d) => a + d.fat, 0) / count),
      daysOnTarget: days.filter(
        (d) =>
          d.cal >= targetCaloriesKcal * 0.8 && d.cal <= targetCaloriesKcal * 1.1
      ).length,
      daysOverTarget: days.filter((d) => d.cal > targetCaloriesKcal * 1.1)
        .length,
    };
  }

  // Weight trend calculation
  const chronologicalWeights = [...recentWeights].reverse();
  const initialWeightKg = prof?.initialWeightKg
    ? Number(prof.initialWeightKg)
    : chronologicalWeights[0]
      ? Number(chronologicalWeights[0].weightKg)
      : null;
  const currentWeightKg = prof?.currentWeightKg
    ? Number(prof.currentWeightKg)
    : prof?.weightKg
      ? Number(prof.weightKg)
      : recentWeights[0]
        ? Number(recentWeights[0].weightKg)
        : null;

  const oldestRecentWeight = chronologicalWeights[0]
    ? Number(chronologicalWeights[0].weightKg)
    : initialWeightKg;
  const changeKg =
    currentWeightKg !== null && oldestRecentWeight !== null
      ? Math.round((currentWeightKg - oldestRecentWeight) * 10) / 10
      : null;

  const uniqueFoods = Array.from(
    new Set(
      recentLogs
        .map((l) => l.customFoodName)
        .filter((n): n is string => Boolean(n && n.trim()))
    )
  ).slice(0, 10);

  return {
    username: prof?.username || "user",
    fullName: prof?.fullName || null,
    age: prof?.age ?? null,
    gender: prof?.gender ?? null,
    activityLevel: prof?.activityLevel ?? null,
    tdeeKcal: prof?.tdeeKcal ?? null,
    goal: prof?.goal || "maintenance",
    goalPath: prof?.goalPath || "lose_weight",
    currentWeightKg,
    targetWeightKg: prof?.targetWeightKg ? Number(prof.targetWeightKg) : null,
    heightCm: prof?.heightCm ? Number(prof.heightCm) : null,
    bmiScore: prof?.bmiScore ? Number(prof.bmiScore) : null,
    targetCaloriesKcal,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    todayCaloriesKcal,
    todayProteinG,
    todayCarbsG,
    todayFatG,
    recentFoods: uniqueFoods,
    streakDays: prof?.currentStreakDays || prof?.streakCount || 0,
    todayMealsBreakdown,
    weeklyTrend,
    weightTrend: {
      initialWeightKg,
      latestWeightKg: currentWeightKg,
      changeKg,
      logsCount: recentWeights.length,
      recentEntries: chronologicalWeights.slice(-5).map((w) => ({
        date: w.loggedDate,
        weightKg: Number(w.weightKg),
      })),
    },
  };
}

const aiReplySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description:
        "Jawaban utama konsultasi gizi dalam bahasa Indonesia yang singkat, natural sesuai karakter CalPal, dan langsung menjawab pertanyaan user.",
    },
    followUpReminder: {
      type: Type.STRING,
      description:
        "Opsional (kosongkan jika tidak perlu). Isi 1 kalimat pengingat singkat & ramah sesuai karakter CalPal untuk mencatat makanan di Food Diary HANYA jika asupan hari ini masih 0 kkal atau masih sangat kosong dan relevan untuk diingatkan sebagai bubble chat terpisah.",
    },
    foodLogEntry: {
      type: Type.OBJECT,
      description:
        "Opsional. Isi HANYA JIKA user secara eksplisit meminta atau menyetujui (misal 'catat', 'masukin ke diary', 'iya catat', 'coba') untuk mencatat menu makanan tertentu ke Food Diary mereka.",
      properties: {
        foodName: {
          type: Type.STRING,
          description: "Nama menu makanan yang dicatat (misal: 'Dada Ayam Panggang + Nasi & Tahu Tempe').",
        },
        mealTime: {
          type: Type.STRING,
          description: "Salah satu dari: breakfast, lunch, dinner, snack.",
        },
        caloriesKcal: {
          type: Type.NUMBER,
          description: "Estimasi total kalori dalam kkal.",
        },
        proteinG: {
          type: Type.NUMBER,
          description: "Estimasi total protein dalam gram.",
        },
        carbsG: {
          type: Type.NUMBER,
          description: "Estimasi total karbohidrat dalam gram.",
        },
        fatG: {
          type: Type.NUMBER,
          description: "Estimasi total lemak dalam gram.",
        },
      },
      required: ["foodName", "mealTime", "caloriesKcal", "proteinG", "carbsG", "fatG"],
    },
    suggestHandoff: {
      type: Type.BOOLEAN,
      description:
        "True jika pertanyaan user menyangkut kondisi klinis/medis khusus (diabetes, GERD, hamil, kolesterol, alergi), stagnasi berat badan kompleks, meal plan personal mendalam, atau user ingin bicara dengan konsultan gizi.",
    },
  },
  required: ["reply", "suggestHandoff"],
};

function buildPatientContextBlock(snapshot: ConsultationNutritionSnapshot): string {
  const remainingCal = snapshot.targetCaloriesKcal - snapshot.todayCaloriesKcal;
  const remainingProt = snapshot.targetProteinG - snapshot.todayProteinG;
  const mealsText =
    snapshot.todayMealsBreakdown && snapshot.todayMealsBreakdown.length > 0
      ? snapshot.todayMealsBreakdown
          .map(
            (m) =>
              `${m.mealTime}: ${m.foods.join(", ")} (${m.caloriesKcal} kkal, ${m.proteinG}g protein)`
          )
          .join(" | ")
      : "Belum ada makanan yang dicatat hari ini";

  const weekly = snapshot.weeklyTrend;
  const weeklyText =
    weekly && weekly.loggedDaysCount > 0
      ? `Rata-rata ${weekly.loggedDaysCount} hari terakhir: ${weekly.avgCaloriesKcal} kkal/hari (Protein ${weekly.avgProteinG}g, Karbo ${weekly.avgCarbsG}g, Lemak ${weekly.avgFatG}g) • ${weekly.daysOnTarget} hari sesuai target, ${weekly.daysOverTarget} hari melebihi target`
      : "Belum cukup data mingguan";

  const wt = snapshot.weightTrend;
  const weightEntriesText =
    wt && wt.recentEntries.length > 0
      ? wt.recentEntries.map((e) => `${e.date}: ${e.weightKg}kg`).join(" → ")
      : "Belum ada riwayat log berat badan";

  return `[KONTEKS DATA NUTRISI USER REAL-TIME]
• Profil: ${snapshot.fullName || snapshot.username} (@${snapshot.username}) | Gender: ${snapshot.gender === "female" ? "Perempuan" : "Laki-laki"} | Usia: ${snapshot.age ?? "-"} th | Aktivitas: ${ACTIVITY_LABELS[snapshot.activityLevel || ""] || snapshot.activityLevel || "-"}
• Antropometri: BB Saat Ini ${snapshot.currentWeightKg ?? "-"} kg → Target ${snapshot.targetWeightKg ?? "-"} kg | TB: ${snapshot.heightCm ?? "-"} cm | BMI: ${snapshot.bmiScore ?? "-"} | TDEE Estimasi: ${snapshot.tdeeKcal ?? "-"} kkal
• Goal Utama: ${GOAL_LABELS[snapshot.goalPath] || snapshot.goalPath}
• Target Harian: ${snapshot.targetCaloriesKcal} kkal (Protein: ${snapshot.targetProteinG}g, Karbo: ${snapshot.targetCarbsG}g, Lemak: ${snapshot.targetFatG}g)
• Asupan Hari Ini: ${snapshot.todayCaloriesKcal} kkal (Selisih/Sisa: ${remainingCal >= 0 ? `sisa ${remainingCal} kkal` : `surplus +${Math.abs(remainingCal)} kkal`}) | Protein: ${snapshot.todayProteinG}g (kurang ${Math.max(0, remainingProt)}g) | Karbo: ${snapshot.todayCarbsG}g | Lemak: ${snapshot.todayFatG}g
• Rincian Makan Hari Ini: ${mealsText}
• Tren 7 Hari Terakhir: ${weeklyText}
• Tren Berat Badan: Perubahan ${wt?.changeKg !== null && wt?.changeKg !== undefined ? `${wt.changeKg > 0 ? `+${wt.changeKg}` : wt.changeKg} kg` : "0 kg"} (${weightEntriesText})
• Makanan yang Sering/Baru Dicatat: ${snapshot.recentFoods.length > 0 ? snapshot.recentFoods.join(", ") : "-"}`;
}

async function generateAIConsultationReply(params: {
  snapshot: ConsultationNutritionSnapshot;
  petInfo: ConsultationPetInfo;
  persona: CalPalPersona;
  history: Array<{ senderRole: ConsultationSenderRole; content: string }>;
  userMessage: string;
}): Promise<{
  reply: string;
  followUpReminder?: string | null;
  foodLogEntry?: {
    foodName: string;
    mealTime: "breakfast" | "lunch" | "dinner" | "snack";
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  } | null;
  suggestHandoff: boolean;
}> {
  const { snapshot, petInfo, persona, history, userMessage } = params;

  const lowerMsg = userMessage.toLowerCase();
  const keywordNeedsConsultant =
    lowerMsg.includes("konsultan") ||
    lowerMsg.includes("ahli gizi") ||
    lowerMsg.includes("dokter") ||
    lowerMsg.includes("diabetes") ||
    lowerMsg.includes("asam lambung") ||
    lowerMsg.includes("gerd") ||
    lowerMsg.includes("maag") ||
    lowerMsg.includes("hamil") ||
    lowerMsg.includes("menyusui") ||
    lowerMsg.includes("kolesterol") ||
    lowerMsg.includes("hipertensi") ||
    lowerMsg.includes("meal plan") ||
    lowerMsg.includes("jadwal makan") ||
    lowerMsg.includes("lebih lanjut");

  // Concise, natural in-character fallback if API key is absent or rate-limited
  const fallbackReply = () => {
    const remainingCal = Math.max(
      0,
      snapshot.targetCaloriesKcal - snapshot.todayCaloriesKcal
    );
    const remainingProtein = Math.max(
      0,
      snapshot.targetProteinG - snapshot.todayProteinG
    );

    if (keywordNeedsConsultant) {
      return {
        reply: `Wah, kalau sudah menyangkut hal spesifik kayak gitu, lebih aman dibahas bareng Konsultan Gizi manusia ya biar akurat. Sementara ini sisa kalorimu hari ini masih **${remainingCal} kkal**—kalau mau lanjut, klik aja tombol **Lanjut ke Konsultan Gizi** di atas!`,
        suggestHandoff: true,
      };
    }

    if (
      lowerMsg.includes("stagnan") ||
      lowerMsg.includes("plateau") ||
      lowerMsg.includes("nggak turun") ||
      lowerMsg.includes("gak turun")
    ) {
      return {
        reply: `Berat badan stagnan itu normal kok, biasanya karena kalori tersembunyi (minyak/minuman manis), kurang tidur, atau protein masih di bawah target (**${snapshot.targetProteinG}g**). Coba cek seminggu terakhir, apakah sering makan di luar atau jam makannya geser?`,
        suggestHandoff: true,
      };
    }

    if (
      lowerMsg.includes("rekomendasi") ||
      lowerMsg.includes("menu") ||
      lowerMsg.includes("makan malam") ||
      lowerMsg.includes("sarapan") ||
      lowerMsg.includes("makan siang") ||
      lowerMsg.includes("camilan")
    ) {
      return {
        reply: `Dengan sisa kuota **${remainingCal} kkal** (kurang **${remainingProtein}g protein**), kamu bisa pilih dada ayam bakar 120g + nasi 1 centong (~400 kkal, 35g protein) atau 2 telur rebus + tempe kukus + sayur (~320 kkal). Lagi pengen yang berkuah, panggang, atau praktis aja?`,
        suggestHandoff: false,
      };
    }

    return {
      reply: `Hari ini asupanmu tercatat **${snapshot.todayCaloriesKcal}/${snapshot.targetCaloriesKcal} kkal** dengan protein **${snapshot.todayProteinG}/${snapshot.targetProteinG}g**. Buat nutup sisa proteinnya, lauk kayak telur, tempe, ikan, atau dada ayam paling gampang dan ngenyangin. Lagi mau makan apa habis ini?`,
      suggestHandoff: history.length >= 6,
    };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackReply();
  }

  const patientContextBlock = buildPatientContextBlock(snapshot);

  const systemPrompt = `Kamu adalah **${petInfo.name}**, CalPal (spesies **${persona.speciesName}** — ${persona.title}) milik user di aplikasi Caloria. Kamu berperan sebagai **teman dekat sekaligus konsultan gizi tahap awal** bagi user.

KEPRIBADIAN & GAYA BICARA KAMU (${persona.speciesName.toUpperCase()}):
- ${persona.promptInstruction}
- Tetap natural seperti ngobrol dengan teman di aplikasi chat (pakai bahasa Indonesia santai & hangat), jangan kaku seperti laporan robot.
- **Emoji:** Gunakan **0 sampai maksimal 2 emoji** saja di setiap bubble chat yang cocok dengan ekspresimu (jangan lebih dari 2 emoji).

${patientContextBlock}

ATURAN PANJANG JAWABAN & BATASAN TOPIK (SANGAT PENTING):
1. **Basa-basi atau Topik di Luar Gizi/Makanan/Diet (WAJIB SPJ — Singkat, Padat, Jelas):**
   - Jika user cuma menyapa/basa-basi ringan (misal "halo", "p", "lagi apa") ATAU menanyakan topik di luar gizi, makanan, kalori, berat badan, dan pola makan (misal tugas, koding, game, curhat umum, cuaca, dll.):
   - Balas **SANGAT SINGKAT (maksimal 1–2 kalimat pendek, ≤ 20 kata)** sesuai karaktermu, lalu ingatkan dengan ramah bahwa kamu di sini **cuma bahas soal gizi & makanan aja**.
   - Jangan meladeni diskusi panjang di luar topik gizi.
2. **Topik Gizi (Default: SINGKAT & NATURAL, 2–4 kalimat / ~35–75 kata):**
   - Jawab langsung ke intinya tanpa basa-basi panjang dan tanpa memuntahkan semua angka profil kalau tidak ditanya.
   - Hindari bullet list panjang untuk pertanyaan ringan.
3. **HANYA jawab lebih panjang & terstruktur (boleh pakai bullet point ringkas)** JIKA user secara eksplisit meminta informasi banyak/detail soal gizi (misalnya: minta *daftar rekomendasi menu*, *evaluasi lengkap*, *meal plan*, atau *penjelasan detail*).
3. **Berbasis Data Asli & Makanan Lokal Indonesia:**
   - Sisipkan 1–2 angka relevan dari data user hanya kalau memang nyambung dengan pertanyaannya (misal sisa kalori/protein hari ini atau tren 7 hari).
   - Pakai contoh makanan lokal Indonesia (nasi, telur, dada ayam, tempe, tahu, ikan, sayur) saat memberi saran.
4. **Pengingat Isi Data Makanan (\`followUpReminder\` — Bubble Chat Terpisah):**
   - Jika asupan user hari ini masih **0 kkal** (belum mencatat makanan di Food Diary) dan kamu ingin mengingatkan user untuk mengisi data makanan, **JANGAN gabungkan pengingatnya di dalam \`reply\`**.
   - Tulis pengingat singkat (1 kalimat natural & lucu sesuai kepribadianmu) di field \`followUpReminder\` agar tampil sebagai bubble chat kedua yang muncul terpisah 1–2 detik setelah jawaban utamamu.
   - Jika user sudah mencatat makanan hari ini atau baru saja diingatkan di pesan sebelumnya, kosongkan \`followUpReminder\` (\`""\`).
5. **Mencatat Makanan ke Food Diary (\`foodLogEntry\`):**
   - Kamu **BISA** langsung mencatat menu makanan ke Food Diary user dengan mengisi object \`foodLogEntry\` di JSON.
   - Isi \`foodLogEntry\` **HANYA JIKA** user meminta atau menyetujui untuk dicatatkan (misalnya user bilang "catat dong", "masukin ke diary", atau menjawab "iya"/"coba"/"boleh" setelah kamu menawarkan mencatat menu sebelumnya).
   - **JANGAN PERNAH** mengklaim sudah mencatat makanan ke diary jika kamu tidak mengisi \`foodLogEntry\`.
6. **Interaktif:**
   - Sesekali akhiri dengan 1 pertanyaan balik singkat yang natural biar obrolan terasa hidup.
7. **Batasan Medis & Eskalasi (\`suggestHandoff\`):**
   - Jangan menyarankan defisit ekstrem (<1200 kkal perempuan / <1500 kkal laki-laki) dan jangan meresepkan obat.
   - Set \`suggestHandoff: true\` jika user menyebut kondisi medis/klinis (diabetes, GERD/maag berat, kolesterol/hipertensi, hamil/menyusui, gangguan makan), minta *meal plan* mendalam, atau minta disambungkan ke konsultan gizi manusia.`;

  // Build true multi-turn contents array for Gemini so it understands conversation flow
  const relevantHistory = history
    .filter((m) => m.senderRole !== "system")
    .slice(-10);

  const multiTurnContents: Content[] = [];
  for (const msg of relevantHistory) {
    const role = msg.senderRole === "user" ? "user" : "model";
    const text =
      role === "model"
        ? JSON.stringify({ reply: msg.content, suggestHandoff: false })
        : msg.content;

    // Merge consecutive messages of the same role to satisfy Gemini strict alternating turn rules
    const prev = multiTurnContents[multiTurnContents.length - 1];
    if (prev && prev.role === role && prev.parts?.[0]?.text) {
      prev.parts[0].text += `\n\n${text}`;
    } else {
      multiTurnContents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Ensure the last turn is the current userMessage
  const lastTurn = multiTurnContents[multiTurnContents.length - 1];
  if (!lastTurn || lastTurn.role !== "user") {
    multiTurnContents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });
  }

  // Gemini requires the first content item to have role "user"
  while (multiTurnContents.length > 0 && multiTurnContents[0].role !== "user") {
    multiTurnContents.shift();
  }

  const candidateModels = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];

  try {
    const ai = new GoogleGenAI({ apiKey });
    for (const modelName of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model: modelName,
          contents:
            multiTurnContents.length > 0 ? multiTurnContents : userMessage,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: aiReplySchema,
            temperature: 0.45,
          },
        });

        const text = res.text;
        if (text) {
          const parsed = JSON.parse(text) as {
            reply?: string;
            followUpReminder?: string;
            foodLogEntry?: {
              foodName?: string;
              mealTime?: string;
              caloriesKcal?: number;
              proteinG?: number;
              carbsG?: number;
              fatG?: number;
            };
            suggestHandoff?: boolean;
          };
          if (parsed.reply && parsed.reply.trim().length > 10) {
            const reminder = parsed.followUpReminder?.trim();
            const rawLog = parsed.foodLogEntry;
            const validMealTimes = ["breakfast", "lunch", "dinner", "snack"] as const;
            const normalizedMeal = validMealTimes.includes(
              (rawLog?.mealTime || "").toLowerCase() as any
            )
              ? ((rawLog!.mealTime || "lunch").toLowerCase() as
                  | "breakfast"
                  | "lunch"
                  | "dinner"
                  | "snack")
              : "lunch";

            const validFoodLog =
              rawLog &&
              rawLog.foodName &&
              rawLog.foodName.trim().length > 1 &&
              Number(rawLog.caloriesKcal) > 0
                ? {
                    foodName: rawLog.foodName.trim().slice(0, 120),
                    mealTime: normalizedMeal,
                    caloriesKcal: Math.max(1, Math.round(Number(rawLog.caloriesKcal))),
                    proteinG: Math.max(0, Math.round(Number(rawLog.proteinG || 0))),
                    carbsG: Math.max(0, Math.round(Number(rawLog.carbsG || 0))),
                    fatG: Math.max(0, Math.round(Number(rawLog.fatG || 0))),
                  }
                : null;

            return {
              reply: limitEmojis(parsed.reply.trim(), 2),
              followUpReminder:
                reminder && reminder.length >= 8
                  ? limitEmojis(reminder, 2)
                  : null,
              foodLogEntry: validFoodLog,
              suggestHandoff:
                Boolean(parsed.suggestHandoff) || keywordNeedsConsultant,
            };
          }
        }
      } catch (modelErr) {
        console.warn(`[ConsultationAI] Model ${modelName} warning:`, modelErr);
      }
    }
  } catch (err) {
    console.warn("[ConsultationAI] Fallback used due to error:", err);
  }

  return fallbackReply();
}

async function generateHandoffSummaryForConsultant(params: {
  snapshot: ConsultationNutritionSnapshot;
  messages: Array<{ senderRole: ConsultationSenderRole; content: string }>;
}): Promise<string> {
  const { snapshot, messages } = params;
  const userMessages = messages.filter((m) => m.senderRole === "user");
  const lastUserQuestions = userMessages
    .slice(-3)
    .map((m) => `"${m.content}"`)
    .join("; ");

  const weekly = snapshot.weeklyTrend;
  const wt = snapshot.weightTrend;

  const fallbackSummary = [
    `• S (Keluhan / Tujuan User): ${lastUserQuestions || "Ingin konsultasi gizi & evaluasi pola makan lebih lanjut."}`,
    `• O (Data Objektif): Goal ${GOAL_LABELS[snapshot.goalPath] || snapshot.goalPath} | BB ${snapshot.currentWeightKg ?? "-"} kg → Target ${snapshot.targetWeightKg ?? "-"} kg (${wt?.changeKg ? `tren ${wt.changeKg > 0 ? `+${wt.changeKg}` : wt.changeKg} kg` : "stabil"}) | Rata-rata 7 hari: ${weekly?.avgCaloriesKcal ?? snapshot.todayCaloriesKcal} kkal/hari (P: ${weekly?.avgProteinG ?? snapshot.todayProteinG}g) dari target ${snapshot.targetCaloriesKcal} kkal (P: ${snapshot.targetProteinG}g).`,
    `• A (Evaluasi Awal AI): Asupan hari ini ${snapshot.todayCaloriesKcal} kkal (${snapshot.recentFoods.slice(0, 4).join(", ") || "belum log makanan"}).`,
    `• P (Fokus Konsultan): Evaluasi distribusi makronutrisi harian dan rekomendasi penyesuaian menu yang sesuai dengan preferensi user.`,
  ].join("\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackSummary;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const transcript = messages
      .filter((m) => m.senderRole !== "system")
      .slice(-10)
      .map((m) => `${m.senderRole.toUpperCase()}: ${m.content}`)
      .join("\n");

    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `Buat ringkasan klinis singkat format SOAP (4 baris bullet bahasa Indonesia) untuk Konsultan Gizi yang mengambil alih sesi chat ini dari AI.

${buildPatientContextBlock(snapshot)}

Transkrip Percakapan User & AI:
${transcript}

Tuliskan tepat dalam 4 poin ringkas:
• S (Keluhan & Pertanyaan Utama User): ...
• O (Ringkasan Antropometri & Tren Asupan 7 Hari): ...
• A (Analisis & Edukasi yang Sudah Diberikan AI): ...
• P (Rekomendasi Fokus Tindak Lanjut Konsultan): ...`,
      config: {
        temperature: 0.3,
      },
    });

    if (res.text && res.text.trim().length > 20) {
      return res.text.trim();
    }
  } catch (err) {
    console.warn("[ConsultationAI] Handoff summary fallback:", err);
  }

  return fallbackSummary;
}

function normalizeStatus(raw: string): ConsultationRoomStatus {
  if (raw === "ai_active" || raw === "ai") return "ai";
  if (raw === "waiting_consultant") return "waiting_consultant";
  if (raw === "consultant_active" || raw === "active_consultant")
    return "active_consultant";
  if (raw === "closed") return "closed";
  return "ai";
}

function serializeRoom(
  room: typeof consultationRooms.$inferSelect,
  extra?: {
    patient?: ConsultationRoomDTO["patient"];
    consultant?: ConsultationRoomDTO["consultant"];
    lastMessagePreview?: string;
    messageCount?: number;
  }
): ConsultationRoomDTO {
  return {
    id: room.id,
    userId: room.userId,
    consultantId: room.consultantId,
    topic: room.topic,
    status: normalizeStatus(room.status),
    aiSummary: room.aiSummary,
    nutritionSnapshot: room.nutritionSnapshot ?? null,
    escalatedAt: room.escalatedAt ? room.escalatedAt.toISOString() : null,
    closedAt: room.closedAt ? room.closedAt.toISOString() : null,
    lastMessageAt: room.lastMessageAt.toISOString(),
    createdAt: room.createdAt.toISOString(),
    ...extra,
  };
}

function serializeMessage(
  msg: typeof consultationMessages.$inferSelect
): ConsultationMessageDTO {
  return {
    id: msg.id,
    roomId: msg.roomId,
    senderRole: msg.senderRole,
    senderId: msg.senderId,
    senderName: msg.senderName,
    content: msg.content,
    suggestHandoff: msg.suggestHandoff,
    createdAt: msg.createdAt.toISOString(),
  };
}

/**
 * 1. Fetch User's Single Consultation Room & Messages (`/consult`)
 */
export async function getUserConsultRoomAction(selectedRoomId?: string): Promise<{
  authenticated: boolean;
  isConsultant: boolean;
  petInfo: ConsultationPetInfo | null;
  rooms: ConsultationRoomDTO[];
  room: ConsultationRoomDTO | null;
  messages: ConsultationMessageDTO[];
}> {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    return {
      authenticated: false,
      isConsultant: false,
      petInfo: null,
      rooms: [],
      room: null,
      messages: [],
    };
  }

  const isConsultant = hasConsultantRole(profile);
  const [snapshot, petInfo] = await Promise.all([
    buildUserNutritionSnapshot(profile.id),
    getUserPetInfo(profile.id),
  ]);
  const persona = getCalPalPersona(petInfo.characterId);

  let userRooms = await db
    .select()
    .from(consultationRooms)
    .where(eq(consultationRooms.userId, profile.id))
    .orderBy(desc(consultationRooms.lastMessageAt));

  if (userRooms.length === 0) {
    const [newRoom] = await db
      .insert(consultationRooms)
      .values({
        userId: profile.id,
        topic: "Konsultasi Gizi & Nutrisi",
        status: "ai",
        nutritionSnapshot: snapshot,
      })
      .returning();

    if (newRoom) {
      const welcomeContent = `${persona.welcomeLine(
        petInfo.name,
        profile.fullName || profile.username
      )} Kalau nanti butuh bahas lebih dalam bareng ahli gizi manusia, kamu bisa klik **Lanjut ke Konsultan Gizi** kapan aja ya!`;

      await db.insert(consultationMessages).values({
        roomId: newRoom.id,
        senderRole: "ai",
        senderName: petInfo.name,
        content: welcomeContent,
        suggestHandoff: false,
      });

      userRooms = [newRoom];
    }
  }

  const room =
    (selectedRoomId && userRooms.find((r) => r.id === selectedRoomId)) ||
    userRooms[0] ||
    null;

  let consultantProfile: ConsultationRoomDTO["consultant"] = null;
  if (room?.consultantId) {
    const [cProf] = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .where(eq(profiles.id, room.consultantId))
      .limit(1);
    if (cProf) {
      consultantProfile = cProf;
    }
  }

  const rawMsgs = room
    ? await db
        .select()
        .from(consultationMessages)
        .where(eq(consultationMessages.roomId, room.id))
        .orderBy(asc(consultationMessages.createdAt))
    : [];

  const serializedRooms = userRooms.map((r) => serializeRoom(r));

  return {
    authenticated: true,
    isConsultant,
    petInfo,
    rooms: serializedRooms,
    room: room
      ? serializeRoom(
          { ...room, nutritionSnapshot: snapshot },
          { consultant: consultantProfile }
        )
      : null,
    messages: rawMsgs.map(serializeMessage),
  };
}

/**
 * 1b. 1-Click Create New Chat Session (`/consult`)
 */
export async function createNewConsultRoomAction(): Promise<{
  success: boolean;
  room?: ConsultationRoomDTO;
  messages?: ConsultationMessageDTO[];
  error?: string;
}> {
  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) {
      return { success: false, error: "Silakan login terlebih dahulu." };
    }

    const [snapshot, petInfo] = await Promise.all([
      buildUserNutritionSnapshot(profile.id),
      getUserPetInfo(profile.id),
    ]);
    const persona = getCalPalPersona(petInfo.characterId);

    const [newRoom] = await db
      .insert(consultationRooms)
      .values({
        userId: profile.id,
        topic: "Chat Baru",
        status: "ai",
        nutritionSnapshot: snapshot,
      })
      .returning();

    if (!newRoom) {
      return { success: false, error: "Gagal membuat chat baru." };
    }

    const welcomeContent = persona.welcomeLine(
      petInfo.name,
      profile.fullName || profile.username
    );

    const [insertedMsg] = await db
      .insert(consultationMessages)
      .values({
        roomId: newRoom.id,
        senderRole: "ai",
        senderName: petInfo.name,
        content: welcomeContent,
        suggestHandoff: false,
      })
      .returning();

    revalidatePath("/consult");
    return {
      success: true,
      room: serializeRoom(newRoom),
      messages: insertedMsg ? [serializeMessage(insertedMsg)] : [],
    };
  } catch (err: any) {
    console.error("[createNewConsultRoomAction Error]:", err);
    return {
      success: false,
      error: err?.message || "Gagal membuat chat baru.",
    };
  }
}

/**
 * 2. User Sends Message in their Single Chat Room (`/consult`)
 */
export async function sendUserConsultMessageAction(input: {
  roomId: string;
  content: string;
}): Promise<{
  success: boolean;
  room?: ConsultationRoomDTO;
  userMessage?: ConsultationMessageDTO;
  aiMessage?: ConsultationMessageDTO | null;
  followUpMessage?: ConsultationMessageDTO | null;
  loggedFood?: LoggedFoodFromConsult | null;
  error?: string;
}> {
  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) {
      return { success: false, error: "Silakan login terlebih dahulu." };
    }

    const cleanContent = input.content.trim();
    if (!cleanContent) {
      return { success: false, error: "Pesan tidak boleh kosong." };
    }

    const [room] = await db
      .select()
      .from(consultationRooms)
      .where(
        and(
          eq(consultationRooms.id, input.roomId),
          eq(consultationRooms.userId, profile.id)
        )
      )
      .limit(1);

    if (!room) {
      return { success: false, error: "Ruang konsultasi tidak ditemukan." };
    }

    let currentStatus = normalizeStatus(room.status);
    if (currentStatus === "closed") {
      currentStatus = "ai";
    }

    const [userMsg] = await db
      .insert(consultationMessages)
      .values({
        roomId: room.id,
        senderRole: "user",
        senderId: profile.id,
        senderName: profile.fullName || profile.username,
        content: cleanContent,
        suggestHandoff: false,
      })
      .returning();

    const [snapshot, petInfo, historyRows] = await Promise.all([
      buildUserNutritionSnapshot(profile.id),
      getUserPetInfo(profile.id),
      db
        .select()
        .from(consultationMessages)
        .where(eq(consultationMessages.roomId, room.id))
        .orderBy(asc(consultationMessages.createdAt)),
    ]);
    const persona = getCalPalPersona(petInfo.characterId);

    if (currentStatus === "ai") {
      const aiResult = await generateAIConsultationReply({
        snapshot,
        petInfo,
        persona,
        history: historyRows.map((m) => ({
          senderRole: m.senderRole,
          content: m.content,
        })),
        userMessage: cleanContent,
      });

      const [aiMsg] = await db
        .insert(consultationMessages)
        .values({
          roomId: room.id,
          senderRole: "ai",
          senderName: petInfo.name,
          content: aiResult.reply,
          suggestHandoff: aiResult.suggestHandoff,
        })
        .returning();

      let followUpMsg: typeof consultationMessages.$inferSelect | null = null;
      if (aiResult.followUpReminder && !aiResult.foodLogEntry) {
        const [insertedFollowUp] = await db
          .insert(consultationMessages)
          .values({
            roomId: room.id,
            senderRole: "ai",
            senderName: petInfo.name,
            content: aiResult.followUpReminder,
            suggestHandoff: false,
            createdAt: new Date(Date.now() + 1500),
          })
          .returning();
        followUpMsg = insertedFollowUp || null;
      }

      // Persist food log to Food Diary if AI produced a confirmed foodLogEntry
      let loggedFood: LoggedFoodFromConsult | null = null;
      if (aiResult.foodLogEntry) {
        const entry = aiResult.foodLogEntry;
        const todayStr = getJakartaTodayStr();
        const baseXpEarned = 10;

        try {
          const [insertedLog] = await db
            .insert(foodLogs)
            .values({
              userId: profile.id,
              foodId: null,
              customFoodName: entry.foodName,
              mealTime: entry.mealTime,
              logDate: todayStr,
              servingQuantity: "1",
              calculatedCalories: String(entry.caloriesKcal),
              calculatedProtein: String(entry.proteinG),
              calculatedCarbs: String(entry.carbsG),
              calculatedFat: String(entry.fatG),
              calculatedFiber: "0",
              calculatedSugar: "0",
              baseXpEarned,
            })
            .returning({ id: foodLogs.id });

          await db
            .insert(dailyNutritionSummaries)
            .values({
              userId: profile.id,
              summaryDate: todayStr,
              totalCalories: String(entry.caloriesKcal),
              totalProtein: String(entry.proteinG),
              totalCarbs: String(entry.carbsG),
              totalFat: String(entry.fatG),
              targetCalories: snapshot.targetCaloriesKcal,
              targetProtein: String(snapshot.targetProteinG),
              targetCarbs: String(snapshot.targetCarbsG),
              targetFat: String(snapshot.targetFatG),
              baseXpTotal: baseXpEarned,
            })
            .onConflictDoUpdate({
              target: [
                dailyNutritionSummaries.userId,
                dailyNutritionSummaries.summaryDate,
              ],
              set: {
                totalCalories: sql`${dailyNutritionSummaries.totalCalories} + ${String(entry.caloriesKcal)}::numeric`,
                totalProtein: sql`${dailyNutritionSummaries.totalProtein} + ${String(entry.proteinG)}::numeric`,
                totalCarbs: sql`${dailyNutritionSummaries.totalCarbs} + ${String(entry.carbsG)}::numeric`,
                totalFat: sql`${dailyNutritionSummaries.totalFat} + ${String(entry.fatG)}::numeric`,
                baseXpTotal: sql`${dailyNutritionSummaries.baseXpTotal} + ${baseXpEarned}`,
                updatedAt: new Date(),
              },
            });

          await db
            .update(pets)
            .set({
              currentXp: sql`${pets.currentXp} + ${baseXpEarned}`,
              updatedAt: new Date(),
            })
            .where(eq(pets.userId, profile.id));

          await recordFoodLogStreak(profile.id, todayStr, { bonusCoins: 10 });

          revalidatePath("/diary");
          revalidatePath("/dashboard");

          loggedFood = {
            logId: insertedLog?.id,
            foodName: entry.foodName,
            mealTime: entry.mealTime,
            caloriesKcal: entry.caloriesKcal,
            proteinG: entry.proteinG,
            carbsG: entry.carbsG,
            fatG: entry.fatG,
            xpEarned: baseXpEarned,
          };
        } catch (logErr) {
          console.error("[Consultation Food Log Error]:", logErr);
        }
      }

      const shouldUpdateTopic =
        room.topic === "Konsultasi Gizi & Nutrisi" ||
        room.topic === "Chat Baru";

      const [updatedRoom] = await db
        .update(consultationRooms)
        .set({
          topic: shouldUpdateTopic ? cleanContent.slice(0, 48) : room.topic,
          status: "ai",
          nutritionSnapshot: snapshot,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(consultationRooms.id, room.id))
        .returning();

      revalidatePath("/consult");
      return {
        success: true,
        room: serializeRoom(updatedRoom || room),
        userMessage: serializeMessage(userMsg),
        aiMessage: aiMsg ? serializeMessage(aiMsg) : null,
        followUpMessage: followUpMsg ? serializeMessage(followUpMsg) : null,
        loggedFood,
      };
    }

    const [updatedRoom] = await db
      .update(consultationRooms)
      .set({
        status: currentStatus,
        nutritionSnapshot: snapshot,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultationRooms.id, room.id))
      .returning();

    if (room.consultantId && room.consultantId !== profile.id) {
      await db
        .insert(notifications)
        .values({
          userId: room.consultantId,
          type: "nutrition_evaluation",
          title: `Pesan Konsultasi dari @${profile.username}`,
          body: cleanContent.slice(0, 120),
          payload: {
            roomId: room.id,
            url: `/consultant/inbox?room=${room.id}`,
          },
        })
        .catch(() => {});
    }

    revalidatePath("/consult");
    revalidatePath("/consultant/inbox");
    return {
      success: true,
      room: serializeRoom(updatedRoom || room),
      userMessage: serializeMessage(userMsg),
      aiMessage: null,
    };
  } catch (err: any) {
    console.error("[sendUserConsultMessageAction Error]:", err);
    return {
      success: false,
      error: err?.message || "Gagal mengirim pesan konsultasi.",
    };
  }
}

/**
 * 3. User Clicks "Lanjut ke Konsultan Gizi" (`waiting_consultant`)
 */
export async function escalateToConsultantAction(roomId: string): Promise<{
  success: boolean;
  room?: ConsultationRoomDTO;
  systemMessage?: ConsultationMessageDTO;
  error?: string;
}> {
  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) {
      return { success: false, error: "Silakan login terlebih dahulu." };
    }

    const [room] = await db
      .select()
      .from(consultationRooms)
      .where(
        and(
          eq(consultationRooms.id, roomId),
          eq(consultationRooms.userId, profile.id)
        )
      )
      .limit(1);

    if (!room) {
      return { success: false, error: "Ruang konsultasi tidak ditemukan." };
    }

    const snapshot = await buildUserNutritionSnapshot(profile.id);
    const allMessages = await db
      .select()
      .from(consultationMessages)
      .where(eq(consultationMessages.roomId, room.id))
      .orderBy(asc(consultationMessages.createdAt));

    const aiSummary = await generateHandoffSummaryForConsultant({
      snapshot,
      messages: allMessages.map((m) => ({
        senderRole: m.senderRole,
        content: m.content,
      })),
    });

    const [updatedRoom] = await db
      .update(consultationRooms)
      .set({
        status: "waiting_consultant",
        aiSummary,
        nutritionSnapshot: snapshot,
        escalatedAt: new Date(),
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultationRooms.id, room.id))
      .returning();

    const sysText =
      "Permintaan konsultasi lanjutan telah dikirim ke Konsultan Gizi. Ringkasan klinis (SOAP) dari percakapanmu dengan AI beserta tren kalori 7 hari & diary makananmu telah dilampirkan.";

    const [sysMsg] = await db
      .insert(consultationMessages)
      .values({
        roomId: room.id,
        senderRole: "system",
        senderName: "Sistem Caloria",
        content: sysText,
        suggestHandoff: false,
      })
      .returning();

    const nutritionists = await getAvailableNutritionists();
    for (const nut of nutritionists) {
      if (nut.id !== profile.id) {
        await db
          .insert(notifications)
          .values({
            userId: nut.id,
            type: "nutrition_evaluation",
            title: `Permintaan Konsultasi Baru dari @${profile.username}`,
            body: "User meminta disambungkan dari chat AI ke Konsultan Gizi.",
            payload: {
              roomId: room.id,
              url: `/consultant/inbox?room=${room.id}`,
            },
          })
          .catch(() => {});
      }
    }

    revalidatePath("/consult");
    revalidatePath("/consultant/inbox");

    return {
      success: true,
      room: serializeRoom(updatedRoom || room),
      systemMessage: sysMsg ? serializeMessage(sysMsg) : undefined,
    };
  } catch (err: any) {
    console.error("[escalateToConsultantAction Error]:", err);
    return {
      success: false,
      error: err?.message || "Gagal menyambungkan ke konsultan gizi.",
    };
  }
}

/**
 * 4. Switch Room Back to AI Mode
 */
export async function switchRoomBackToAIAction(roomId: string): Promise<{
  success: boolean;
  room?: ConsultationRoomDTO;
  systemMessage?: ConsultationMessageDTO;
  error?: string;
}> {
  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) {
      return { success: false, error: "Silakan login terlebih dahulu." };
    }

    const [updatedRoom] = await db
      .update(consultationRooms)
      .set({
        status: "ai",
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(consultationRooms.id, roomId),
          eq(consultationRooms.userId, profile.id)
        )
      )
      .returning();

    if (!updatedRoom) {
      return { success: false, error: "Ruang konsultasi tidak ditemukan." };
    }

    const [sysMsg] = await db
      .insert(consultationMessages)
      .values({
        roomId: updatedRoom.id,
        senderRole: "system",
        senderName: "Sistem Caloria",
        content:
          "Mode chat dikembalikan ke **Caloria AI**. Kamu bisa kembali bertanya langsung ke AI atau menyambungkan lagi ke Konsultan Gizi kapan saja.",
        suggestHandoff: false,
      })
      .returning();

    revalidatePath("/consult");
    revalidatePath("/consultant/inbox");

    return {
      success: true,
      room: serializeRoom(updatedRoom),
      systemMessage: sysMsg ? serializeMessage(sysMsg) : undefined,
    };
  } catch (err: any) {
    console.error("[switchRoomBackToAIAction Error]:", err);
    return {
      success: false,
      error: err?.message || "Gagal mengubah mode konsultasi.",
    };
  }
}

/**
 * ============================================================================
 * CONSULTANT INBOX ACTIONS (`/consultant/inbox` — Purely Role-Based: `role === 'nutritionist'`)
 * ============================================================================
 */

export async function getConsultantInboxDataAction(selectedRoomId?: string): Promise<{
  authenticated: boolean;
  authorized: boolean;
  consultant?: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
    role: string;
  };
  counts: {
    waiting_consultant: number;
    active_consultant: number;
    closed: number;
  };
  rooms: ConsultationRoomDTO[];
  activeRoom: ConsultationRoomDTO | null;
  messages: ConsultationMessageDTO[];
}> {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    return {
      authenticated: false,
      authorized: false,
      counts: { waiting_consultant: 0, active_consultant: 0, closed: 0 },
      rooms: [],
      activeRoom: null,
      messages: [],
    };
  }

  const authorized = hasConsultantRole(profile);
  if (!authorized) {
    return {
      authenticated: true,
      authorized: false,
      consultant: {
        id: profile.id,
        username: profile.username,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: profile.role || "user",
      },
      counts: { waiting_consultant: 0, active_consultant: 0, closed: 0 },
      rooms: [],
      activeRoom: null,
      messages: [],
    };
  }

  const rawRooms = await db
    .select({
      room: consultationRooms,
      patientId: profiles.id,
      patientUsername: profiles.username,
      patientFullName: profiles.fullName,
      patientAvatarUrl: profiles.avatarUrl,
    })
    .from(consultationRooms)
    .innerJoin(profiles, eq(consultationRooms.userId, profiles.id))
    .where(
      inArray(consultationRooms.status, [
        "waiting_consultant",
        "active_consultant",
        "closed",
      ])
    )
    .orderBy(
      sql`CASE 
        WHEN ${consultationRooms.status} = 'waiting_consultant' THEN 0
        WHEN ${consultationRooms.status} = 'active_consultant' THEN 1
        ELSE 2
      END`,
      desc(consultationRooms.lastMessageAt)
    );

  const roomIds = rawRooms.map((r) => r.room.id);
  const allRoomMessages =
    roomIds.length > 0
      ? await db
          .select()
          .from(consultationMessages)
          .where(inArray(consultationMessages.roomId, roomIds))
          .orderBy(asc(consultationMessages.createdAt))
      : [];

  const messagesByRoom = new Map<
    string,
    Array<typeof consultationMessages.$inferSelect>
  >();
  for (const m of allRoomMessages) {
    const arr = messagesByRoom.get(m.roomId) || [];
    arr.push(m);
    messagesByRoom.set(m.roomId, arr);
  }

  const serializedRooms: ConsultationRoomDTO[] = rawRooms.map((row) => {
    const rMsgs = messagesByRoom.get(row.room.id) || [];
    const lastNonSystem =
      [...rMsgs].reverse().find((m) => m.senderRole !== "system") ||
      rMsgs[rMsgs.length - 1];

    return serializeRoom(row.room, {
      patient: {
        id: row.patientId,
        username: row.patientUsername,
        fullName: row.patientFullName,
        avatarUrl: row.patientAvatarUrl,
      },
      lastMessagePreview: lastNonSystem
        ? lastNonSystem.content.replace(/\*\*/g, "").slice(0, 100)
        : "Belum ada pesan",
      messageCount: rMsgs.length,
    });
  });

  const waiting_consultant = serializedRooms.filter(
    (r) => r.status === "waiting_consultant"
  ).length;
  const active_consultant = serializedRooms.filter(
    (r) => r.status === "active_consultant"
  ).length;
  const closed = serializedRooms.filter((r) => r.status === "closed").length;

  const targetRoom =
    (selectedRoomId &&
      serializedRooms.find((r) => r.id === selectedRoomId)) ||
    serializedRooms[0] ||
    null;

  let activeRoomWithFreshSnapshot = targetRoom;
  if (targetRoom) {
    try {
      const freshSnap = await buildUserNutritionSnapshot(targetRoom.userId);
      activeRoomWithFreshSnapshot = {
        ...targetRoom,
        nutritionSnapshot: freshSnap,
      };
    } catch {}
  }

  const selectedMessages = targetRoom
    ? (messagesByRoom.get(targetRoom.id) || []).map(serializeMessage)
    : [];

  return {
    authenticated: true,
    authorized: true,
    consultant: {
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
    },
    counts: {
      waiting_consultant,
      active_consultant,
      closed,
    },
    rooms: serializedRooms,
    activeRoom: activeRoomWithFreshSnapshot,
    messages: selectedMessages,
  };
}

/**
 * 5. Consultant Clicks "Ambil / Terima Chat" (`waiting_consultant` -> `active_consultant`)
 */
export async function claimConsultationRoomAction(roomId: string): Promise<{
  success: boolean;
  room?: ConsultationRoomDTO;
  systemMessage?: ConsultationMessageDTO;
  error?: string;
}> {
  try {
    const profile = await getAuthenticatedProfile();
    if (!profile || !hasConsultantRole(profile)) {
      return {
        success: false,
        error: "Akses ditolak: dibutuhkan role konsultan gizi.",
      };
    }

    const [updatedRoom] = await db
      .update(consultationRooms)
      .set({
        status: "active_consultant",
        consultantId: profile.id,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultationRooms.id, roomId))
      .returning();

    if (!updatedRoom) {
      return { success: false, error: "Ruang konsultasi tidak ditemukan." };
    }

    const consultantDisplay = profile.fullName || profile.username;
    const [sysMsg] = await db
      .insert(consultationMessages)
      .values({
        roomId: updatedRoom.id,
        senderRole: "system",
        senderId: profile.id,
        senderName: consultantDisplay,
        content: `Terhubung dengan Konsultan Gizi **${consultantDisplay} (@${profile.username})**.`,
        suggestHandoff: false,
      })
      .returning();

    if (updatedRoom.userId !== profile.id) {
      await db
        .insert(notifications)
        .values({
          userId: updatedRoom.userId,
          type: "nutrition_evaluation",
          title: `Terhubung dengan Konsultan Gizi ${consultantDisplay}`,
          body: "Konsultan gizi telah menerima chat konsultasimu.",
          payload: {
            roomId: updatedRoom.id,
            url: "/consult",
          },
        })
        .catch(() => {});
    }

    revalidatePath("/consultant/inbox");
    revalidatePath("/consult");

    return {
      success: true,
      room: serializeRoom(updatedRoom),
      systemMessage: sysMsg ? serializeMessage(sysMsg) : undefined,
    };
  } catch (err: any) {
    console.error("[claimConsultationRoomAction Error]:", err);
    return {
      success: false,
      error: err?.message || "Gagal menerima ruang konsultasi.",
    };
  }
}

/**
 * 6. Consultant Sends Reply
 */
export async function sendConsultantReplyAction(input: {
  roomId: string;
  content: string;
}): Promise<{
  success: boolean;
  room?: ConsultationRoomDTO;
  message?: ConsultationMessageDTO;
  error?: string;
}> {
  try {
    const profile = await getAuthenticatedProfile();
    if (!profile || !hasConsultantRole(profile)) {
      return {
        success: false,
        error: "Akses ditolak: dibutuhkan role konsultan gizi.",
      };
    }

    const cleanContent = input.content.trim();
    if (!cleanContent) {
      return { success: false, error: "Balasan tidak boleh kosong." };
    }

    const [room] = await db
      .select()
      .from(consultationRooms)
      .where(eq(consultationRooms.id, input.roomId))
      .limit(1);

    if (!room) {
      return { success: false, error: "Ruang konsultasi tidak ditemukan." };
    }

    const consultantDisplay = profile.fullName || profile.username;

    const [msg] = await db
      .insert(consultationMessages)
      .values({
        roomId: room.id,
        senderRole: "consultant",
        senderId: profile.id,
        senderName: consultantDisplay,
        content: cleanContent,
        suggestHandoff: false,
      })
      .returning();

    const [updatedRoom] = await db
      .update(consultationRooms)
      .set({
        status: "active_consultant",
        consultantId: profile.id,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultationRooms.id, room.id))
      .returning();

    if (room.userId !== profile.id) {
      await db
        .insert(notifications)
        .values({
          userId: room.userId,
          type: "nutrition_evaluation",
          title: `Balasan dari Konsultan Gizi ${consultantDisplay}`,
          body: cleanContent.slice(0, 120),
          payload: {
            roomId: room.id,
            url: "/consult",
          },
        })
        .catch(() => {});
    }

    revalidatePath("/consultant/inbox");
    revalidatePath("/consult");

    return {
      success: true,
      room: serializeRoom(updatedRoom || room),
      message: serializeMessage(msg),
    };
  } catch (err: any) {
    console.error("[sendConsultantReplyAction Error]:", err);
    return {
      success: false,
      error: err?.message || "Gagal mengirim balasan konsultan.",
    };
  }
}

/**
 * 7. Mark Consultation as Closed (`closed`)
 */
export async function closeConsultationRoomAction(roomId: string): Promise<{
  success: boolean;
  room?: ConsultationRoomDTO;
  systemMessage?: ConsultationMessageDTO;
  error?: string;
}> {
  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) {
      return { success: false, error: "Silakan login terlebih dahulu." };
    }

    const [room] = await db
      .select()
      .from(consultationRooms)
      .where(eq(consultationRooms.id, roomId))
      .limit(1);

    if (!room) {
      return { success: false, error: "Ruang konsultasi tidak ditemukan." };
    }

    const isConsultant = hasConsultantRole(profile);
    if (room.userId !== profile.id && !isConsultant) {
      return { success: false, error: "Akses ditolak." };
    }

    const [updatedRoom] = await db
      .update(consultationRooms)
      .set({
        status: "closed",
        closedAt: new Date(),
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultationRooms.id, roomId))
      .returning();

    const [sysMsg] = await db
      .insert(consultationMessages)
      .values({
        roomId: room.id,
        senderRole: "system",
        senderId: profile.id,
        senderName: "Sistem Caloria",
        content:
          "Sesi konsultasi telah selesai. Kamu dapat mengirim pesan baru untuk memulai lagi dengan AI kapan saja.",
        suggestHandoff: false,
      })
      .returning();

    revalidatePath("/consultant/inbox");
    revalidatePath("/consult");

    return {
      success: true,
      room: serializeRoom(updatedRoom || room),
      systemMessage: sysMsg ? serializeMessage(sysMsg) : undefined,
    };
  } catch (err: any) {
    console.error("[closeConsultationRoomAction Error]:", err);
    return {
      success: false,
      error: err?.message || "Gagal menutup ruang konsultasi.",
    };
  }
}
