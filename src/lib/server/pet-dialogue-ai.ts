import { GoogleGenAI, Type, Schema } from "@google/genai";
import {
  type CalpalMoodCategory,
  type MainMealSlot,
  getMealSlotConfig,
  pickVariedFallbackDialogue,
} from "@/lib/pet/needs-engine";

export interface PetDialogueContext {
  petName: string;
  petSpecies: string;
  moodCategory: CalpalMoodCategory;
  currentSlot: MainMealSlot | null;
  fedSlotsToday: MainMealSlot[];
  missedMealSlots: MainMealSlot[];
  loggedMainMealsToday: MainMealSlot[];
  petCountToday: number;
  hoursSinceFed: number;
  hoursSincePetted: number;
  completedDailyMissionsCount: number;
  totalDailyMissionsCount: number;
  previousMessage?: string;
}

export interface PetDialogueResult {
  message: string;
  source: "ai" | "fallback";
  moodCategory: CalpalMoodCategory;
}

const dialogueSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description:
        "1 short, expressive sentence in casual Indonesian (max 18 words) spoken by the virtual pet CalPal.",
    },
  },
  required: ["message"],
};

const SLOT_LABELS: Record<MainMealSlot, string> = {
  breakfast: "Sarapan (Pagi)",
  lunch: "Makan Siang",
  dinner: "Makan Malam",
};

/**
 * Generates varied, contextual Indonesian dialogue/omelan for CalPal using Gemini AI,
 * with a deterministic varied fallback pool if GEMINI_API_KEY is missing or the API fails.
 */
export async function generatePetDialogueWithAI(
  ctx: PetDialogueContext,
): Promise<PetDialogueResult> {
  const missingMainMeals = (["breakfast", "lunch", "dinner"] as MainMealSlot[]).filter(
    (s) => !ctx.loggedMainMealsToday.includes(s),
  );
  const hasUnlockedPet = ctx.petCountToday < ctx.loggedMainMealsToday.length;

  const fallback = () => ({
    message: pickVariedFallbackDialogue({
      moodCategory: ctx.moodCategory,
      currentSlot: ctx.currentSlot,
      missedMealSlots: ctx.missedMealSlots,
      hoursSinceFed: ctx.hoursSinceFed,
      hasUnlockedPet,
      seed: Math.floor(Math.random() * 1000),
    }),
    source: "fallback" as const,
    moodCategory: ctx.moodCategory,
  });

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return fallback();
  }

  const slotText = ctx.currentSlot
    ? getMealSlotConfig(ctx.currentSlot).label
    : "Dini Hari (di luar jam makan)";

  const missingMealsText =
    missingMainMeals.length > 0
      ? missingMainMeals.map((s) => SLOT_LABELS[s]).join(", ")
      : "Semua sudah dicatat";

  const missedFeedText =
    ctx.missedMealSlots.length > 0
      ? ctx.missedMealSlots.map((s) => SLOT_LABELS[s]).join(", ")
      : "Tidak ada";

  let moodInstruction = "";
  switch (ctx.moodCategory) {
    case "ecstatic":
      moodInstruction =
        "Kamu SANGAT SENANG dan bangga karena pemilikmu sudah memenuhi misi harian / kebutuhan makan & perhatianmu! Ucapkan pujian manis yang bikin semangat.";
      break;
    case "needs_food":
      moodInstruction =
        "Kamu sedang LAPAR dan ngomel gemas karena belum dikasih makan di jam makan (pagi/siang/malam). Buat omelan yang bervariatif, lucu, sedikit dramatis tapi tetap menggemaskan.";
      break;
    case "needs_attention":
      moodInstruction = hasUnlockedPet
        ? "Kamu sudah lama tidak dielus dan kangen perhatian! Ngomel manja agar pemilikmu mengelusmu sekarang."
        : "Kamu sudah lama tidak dielus dan pengen dimanja, TAPI pemilikmu belum mengisi data makanan utama (pagi/siang/malam). Ngomel manja dan ingatkan seperti 'ayo data makanan kalau kamu sayang aku' dengan variasi kreatif!";
      break;
    case "needs_both":
      moodInstruction =
        "Kamu lapar BELUM MAKAN dan juga sudah lama TIDAK DIELUS! Ngomel gemas dobel, ingatkan pemilikmu untuk catat makanan utama lalu beri makan & elus kamu kalau sayang kamu.";
      break;
    default:
      moodInstruction =
        "Kamu sedang ceria, kenyang, dan bersemangat menemani pemilikmu menjaga pola makan sehat hari ini.";
      break;
  }

  const systemPrompt = `Kamu adalah ${ctx.petName} (spesies ${ctx.petSpecies}), virtual pet CalPal di aplikasi pencatat nutrisi Caloria.
Tugasmu menulis SATU kalimat pendek (maksimal 18 kata) dalam bahasa Indonesia santai, ekspresif, menggemaskan, dan terasa personal.

Aturan:
1. Maksimal 1 kalimat pendek (8-18 kata), boleh pakai 1-2 emoji yang cocok.
2. ${moodInstruction}
3. JANGAN mengulang kalimat sebelumnya${ctx.previousMessage ? `: "${ctx.previousMessage}"` : ""}.
4. Kembalikan hanya JSON valid sesuai schema.`;

  const userPrompt = `Konteks saat ini:
- Waktu makan sekarang: ${slotText}
- Makan CalPal hari ini: ${ctx.fedSlotsToday.length}/3 (terlewat/belum: ${missedFeedText})
- Terakhir makan: ${ctx.hoursSinceFed} jam lalu
- Elus/Perhatian hari ini: ${ctx.petCountToday}/3 (terakhir dielus: ${ctx.hoursSincePetted} jam lalu)
- Makanan utama yang belum dicatat user: ${missingMealsText}
- Misi harian selesai: ${ctx.completedDailyMissionsCount}/${ctx.totalDailyMissionsCount}
- Mood: ${ctx.moodCategory}

Buat 1 kalimat dialog CalPal yang segar dan bervariatif sekarang.`;

  const candidateModels = [
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ];

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: dialogueSchema,
            temperature: 0.95,
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text) as { message?: string };
          const cleaned = parsed?.message?.trim();
          if (cleaned && cleaned.length >= 6 && cleaned.length <= 180) {
            return {
              message: cleaned,
              source: "ai",
              moodCategory: ctx.moodCategory,
            };
          }
        }
      } catch (err) {
        console.warn(`[PetDialogueAI] Model ${modelName} error:`, err);
      }
    }
  } catch (err) {
    console.error("[PetDialogueAI] Unexpected error:", err);
  }

  return fallback();
}
