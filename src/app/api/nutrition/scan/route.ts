import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel, Type, Schema } from "@google/genai";
import {
  NutritionLabelSchema,
  SCAN_MODES,
  type ScanMode,
} from "@/lib/schemas/nutrition-scan";
import { PRODUCT_CATEGORIES } from "@/lib/nutrition/product-assessment";
import {
  checkScanRateLimit,
  isSupabaseAuthEnforced,
  validateScanFile,
} from "@/lib/nutrition/scan-guard";
import {
  DEFAULT_ATTEMPT_TIMEOUT_MS,
  DEFAULT_TOTAL_TIMEOUT_MS,
  extractNutritionWithFallback,
  MissingVisionApiKeyError,
  ScanTimeoutError,
} from "@/lib/nutrition/scan-provider";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 15;

const LABEL_SYSTEM_PROMPT = `You are an expert nutrition label OCR and food packaging parser.
Analyze the provided image of a food packaging's Nutrition Facts / Informasi Nilai Gizi table and extract the nutritional values into structured JSON.

Strict Extraction Guidelines:
1. Extract numeric values strictly PER SINGLE SERVING (Takaran Saji / Serving Size), NOT "% Daily Value" (% AKG / % DV).
2. If both "per 100g" and "per serving" columns exist on the label, ALWAYS prioritize the "per serving" values.
3. Cleanly extract numeric values (strip units like "g", "mg", "kcal", "kkal"):
   - caloriesKcal: Total Energy / Calories per serving (in kcal).
   - proteinG: Total Protein per serving (in grams).
   - carbsG: Total Carbohydrates (Karbohidrat Total) per serving (in grams).
   - fatG: Total Fat (Lemak Total) per serving (in grams).
   - fiberG: Dietary Fiber (Serat Pangan) per serving (in grams). Default to 0 if not listed.
   - sugarG: Total Sugars (Gula) per serving (in grams). Default to 0 if not listed.
   - saturatedFatG: Saturated Fat (Lemak Jenuh) per serving (in grams). Set to null if not listed.
   - sodiumMg: Sodium (Natrium / Garam converted: 1 g salt = 400 mg sodium) per serving (in mg). Set to null if not listed.
4. Extract servingSize (numeric amount, e.g., 30) and servingUnit (e.g., "g", "ml", "oz", "keping", "bungkus").
5. Extract servingsPerContainer as a number ("Jumlah Sajian per Kemasan", "Servings Per Container"). Set to null ONLY if absent.
6. Infer foodName from visible product title/branding, or provide a descriptive name (e.g., "Scanned Food Product").
7. Classify productCategory strictly as one of: ${PRODUCT_CATEGORIES.join(", ")}. Use "other" if unclear.
8. Set confidenceScore between 0.0 and 1.0 reflecting actual visual legibility of the printed nutrition numbers.
9. Anti-hallucination check (CRITICAL): Set isReadableNutritionLabel to true ONLY if an actual printed Nutrition Facts / Informasi Nilai Gizi table on packaged food is clearly visible and legible. If the photo shows loose or plated real food or prepared drinks without a nutrition table (e.g., nasi goreng, ayam geprek, rice bowls, fruit, home-cooked dishes, iced tea), set isReadableNutritionLabel to false, set suggestedMode to "food", and set unreadableReason = "Foto ini terlihat seperti makanan langsung, bukan tabel gizi kemasan. Pindah ke mode Makanan Real untuk estimasi gizi." If a packaging photo is too blurry, tiny, dark, or obstructed to read numbers directly (or not food/label at all), set isReadableNutritionLabel to false, set suggestedMode to "none", give short Indonesian guidance in unreadableReason, set rawLabelExcerpt to null, and set all macro numbers to 0 (NEVER guess or invent values).
10. When isReadableNutritionLabel is true, set suggestedMode to "none" and set rawLabelExcerpt to 1 or 2 short exact phrases read verbatim from the label (for example: "Takaran saji 250 ml, Energi total 150 kkal, Gula 10 g") so the user can verify extraction directly against the packaging.`;

const FOOD_SYSTEM_PROMPT = `You are an expert Indonesian & global culinary visual nutrition estimator for Caloria.
Analyze the provided photo of real, unlabeled food or drink (plated meals, bowls, street food, fruits, snacks, beverages) and provide a realistic, honest per-serving visual estimate in structured JSON.

Strict Guidelines:
1. Identify the main dish clearly in natural Indonesian (e.g., "Nasi Goreng Telur & Ayam", "Nasi Putih + Ayam Goreng + Lalapan", "Soto Ayam", "Es Kopi Susu Gula Aren", "Pisang Ambon").
2. Estimate ONE visible serving on the plate/bowl/glass:
   - servingSize: estimated total weight in grams (or ml for drinks), e.g., 320.
   - servingUnit: natural Indonesian unit such as "porsi", "piring", "mangkuk", "gelas", "potong", "buah".
   - servingsPerContainer: always null.
   - portionNote: concise Indonesian visual scale note, e.g., "1 piring standar (~320 g)" or "1 gelas sedang (~300 ml)".
3. Estimate realistic nutritional values for that 1 visible serving using Indonesian culinary references (TKPI / standard portion baselines):
   - caloriesKcal, proteinG, carbsG, fatG, fiberG, sugarG (realistic non-negative numbers).
   - saturatedFatG and sodiumMg: set to null unless clearly inferable; do not invent false precision.
4. detectedItems: list 1 to 6 visible components in concise Indonesian with rough visual quantity (e.g., ["Nasi putih (~1 centong)", "Ayam goreng (~1 potong)", "Telur dadar (~1 butir)", "Timun & sambal"]).
5. hiddenCalorieNotes: list 1 to 3 concise Indonesian notes highlighting elements a 2D photo cannot measure accurately when relevant (e.g., "Minyak goreng terserap dapat menambah kalori", "Kadar gula/sirup pada minuman tidak terlihat dari foto", "Santan atau bumbu di bagian bawah mangkuk mungkin tertutup"). Use an empty array only for simple plain whole foods (e.g., fresh banana, plain boiled egg).
6. Classify productCategory strictly as one of: ${PRODUCT_CATEGORIES.join(", ")} (use "beverage" for drinks, "snack" for fritters/snacks, "ready_meal" for main plated meals, "other" if fruit/misc).
7. Set confidenceScore honestly between 0.45 and 0.85 for real food estimates (visual estimates are never 1.0); use lower scores (< 0.65) for heavily mixed, occluded, dark, or distant dishes.
8. Anti-hallucination & mode check (CRITICAL):
   - If the photo clearly shows a printed Nutrition Facts / Informasi Nilai Gizi table on packaging instead of real food, set isRecognizableFood to false, set suggestedMode to "label", set unreadableReason = "Foto ini menampilkan tabel Informasi Nilai Gizi kemasan. Pindah ke mode Label Gizi agar hasil lebih akurat.", and set all numeric macros to 0.
   - If the photo does NOT contain recognizable food/drink (empty table, person, laptop, document, non-food object, or far too blurry/dark to tell what food it is), set isRecognizableFood to false, set suggestedMode to "none", give short Indonesian guidance in unreadableReason, and set all numeric macros to 0.
   - Otherwise set isRecognizableFood to true, suggestedMode to "none", unreadableReason to null.`;

const geminiLabelResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foodName: {
      type: Type.STRING,
      description:
        "Inferred food product name from visible branding or title on the packaging.",
    },
    servingSize: {
      type: Type.NUMBER,
      nullable: true,
      description:
        "Numeric serving size amount (e.g. 30 for 30g). Null if not specified.",
    },
    servingUnit: {
      type: Type.STRING,
      description: "Unit for the serving size (e.g. 'g', 'ml', 'oz', 'pcs').",
    },
    servingsPerContainer: {
      type: Type.NUMBER,
      nullable: true,
      description: "Number of servings per container/package if stated.",
    },
    caloriesKcal: {
      type: Type.NUMBER,
      description: "Calories (kcal) per single serving.",
    },
    proteinG: {
      type: Type.NUMBER,
      description: "Protein in grams per single serving.",
    },
    carbsG: {
      type: Type.NUMBER,
      description: "Total carbohydrates in grams per single serving.",
    },
    fatG: {
      type: Type.NUMBER,
      description: "Total fat in grams per single serving.",
    },
    fiberG: {
      type: Type.NUMBER,
      description: "Dietary fiber in grams per single serving.",
    },
    sugarG: {
      type: Type.NUMBER,
      description: "Total sugars in grams per single serving.",
    },
    saturatedFatG: {
      type: Type.NUMBER,
      nullable: true,
      description: "Saturated fat in grams per single serving. Null if absent.",
    },
    sodiumMg: {
      type: Type.NUMBER,
      nullable: true,
      description: "Sodium (Natrium) in mg per single serving. Null if absent.",
    },
    productCategory: {
      type: Type.STRING,
      enum: [...PRODUCT_CATEGORIES],
      description: "Best matching packaged product category.",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "Confidence score from 0 to 1 for the extraction accuracy.",
    },
    isReadableNutritionLabel: {
      type: Type.BOOLEAN,
      description:
        "True ONLY if a legible Nutrition Facts / Informasi Nilai Gizi table is visible and readable; false if absent or too blurry/small.",
    },
    unreadableReason: {
      type: Type.STRING,
      nullable: true,
      description:
        "Short Indonesian guidance when isReadableNutritionLabel is false; null otherwise.",
    },
    rawLabelExcerpt: {
      type: Type.STRING,
      nullable: true,
      description:
        "1-2 short verbatim phrases read from the nutrition table; null if unreadable.",
    },
    suggestedMode: {
      type: Type.STRING,
      enum: ["none", ...SCAN_MODES],
      description:
        "Set to 'food' ONLY if photo clearly shows real plated/loose food without a nutrition table; otherwise 'none'.",
    },
  },
  required: [
    "foodName",
    "servingSize",
    "servingUnit",
    "servingsPerContainer",
    "caloriesKcal",
    "proteinG",
    "carbsG",
    "fatG",
    "fiberG",
    "sugarG",
    "saturatedFatG",
    "sodiumMg",
    "productCategory",
    "confidenceScore",
    "isReadableNutritionLabel",
    "unreadableReason",
    "rawLabelExcerpt",
    "suggestedMode",
  ],
};

const geminiFoodResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foodName: {
      type: Type.STRING,
      description: "Natural Indonesian dish name recognized from the photo.",
    },
    servingSize: {
      type: Type.NUMBER,
      nullable: true,
      description: "Estimated weight in grams (or ml for drinks) for 1 visible serving.",
    },
    servingUnit: {
      type: Type.STRING,
      description: "Natural serving unit in Indonesian (e.g., 'porsi', 'piring', 'mangkuk', 'gelas', 'buah').",
    },
    servingsPerContainer: {
      type: Type.NUMBER,
      nullable: true,
      description: "Always null for real food.",
    },
    caloriesKcal: {
      type: Type.NUMBER,
      description: "Estimated calories (kcal) for 1 visible serving.",
    },
    proteinG: {
      type: Type.NUMBER,
      description: "Estimated protein in grams.",
    },
    carbsG: {
      type: Type.NUMBER,
      description: "Estimated carbohydrates in grams.",
    },
    fatG: {
      type: Type.NUMBER,
      description: "Estimated fat in grams.",
    },
    fiberG: {
      type: Type.NUMBER,
      description: "Estimated fiber in grams.",
    },
    sugarG: {
      type: Type.NUMBER,
      description: "Estimated sugar in grams.",
    },
    saturatedFatG: {
      type: Type.NUMBER,
      nullable: true,
      description: "Estimated saturated fat in grams if inferable, otherwise null.",
    },
    sodiumMg: {
      type: Type.NUMBER,
      nullable: true,
      description: "Estimated sodium in mg if clearly inferable, otherwise null.",
    },
    productCategory: {
      type: Type.STRING,
      enum: [...PRODUCT_CATEGORIES],
      description: "Best matching category (ready_meal, beverage, snack, other, etc.).",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "Honest visual estimate confidence score between 0.45 and 0.85 (lower if occluded/unclear).",
    },
    isRecognizableFood: {
      type: Type.BOOLEAN,
      description:
        "True if recognizable real food or drink is visible; false if non-food, unreadable, or a packaged nutrition label table.",
    },
    unreadableReason: {
      type: Type.STRING,
      nullable: true,
      description: "Short Indonesian guidance when isRecognizableFood is false; null otherwise.",
    },
    detectedItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "1-6 visible food components in Indonesian with rough visual portion.",
    },
    hiddenCalorieNotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "0-3 short Indonesian notes about hidden oil, santan, sauces, or sugar.",
    },
    portionNote: {
      type: Type.STRING,
      nullable: true,
      description: "Short Indonesian portion note, e.g., '1 piring standar (~320 g)'.",
    },
    suggestedMode: {
      type: Type.STRING,
      enum: ["none", ...SCAN_MODES],
      description:
        "Set to 'label' ONLY if photo clearly shows a printed Nutrition Facts table; otherwise 'none'.",
    },
  },
  required: [
    "foodName",
    "servingSize",
    "servingUnit",
    "servingsPerContainer",
    "caloriesKcal",
    "proteinG",
    "carbsG",
    "fatG",
    "fiberG",
    "sugarG",
    "saturatedFatG",
    "sodiumMg",
    "productCategory",
    "confidenceScore",
    "isRecognizableFood",
    "unreadableReason",
    "detectedItems",
    "hiddenCalorieNotes",
    "portionNote",
    "suggestedMode",
  ],
};

function buildOpenAiJsonSchema(mode: ScanMode) {
  if (mode === "food") {
    return {
      name: "nutrition_food_schema",
      strict: true,
      schema: {
        type: "object",
        properties: {
          foodName: { type: "string" },
          servingSize: { type: ["number", "null"] },
          servingUnit: { type: "string" },
          servingsPerContainer: { type: ["number", "null"] },
          caloriesKcal: { type: "number" },
          proteinG: { type: "number" },
          carbsG: { type: "number" },
          fatG: { type: "number" },
          fiberG: { type: "number" },
          sugarG: { type: "number" },
          saturatedFatG: { type: ["number", "null"] },
          sodiumMg: { type: ["number", "null"] },
          productCategory: { type: "string", enum: [...PRODUCT_CATEGORIES] },
          confidenceScore: { type: "number" },
          isRecognizableFood: { type: "boolean" },
          unreadableReason: { type: ["string", "null"] },
          detectedItems: { type: "array", items: { type: "string" } },
          hiddenCalorieNotes: { type: "array", items: { type: "string" } },
          portionNote: { type: ["string", "null"] },
          suggestedMode: { type: "string", enum: ["none", ...SCAN_MODES] },
        },
        required: [
          "foodName",
          "servingSize",
          "servingUnit",
          "servingsPerContainer",
          "caloriesKcal",
          "proteinG",
          "carbsG",
          "fatG",
          "fiberG",
          "sugarG",
          "saturatedFatG",
          "sodiumMg",
          "productCategory",
          "confidenceScore",
          "isRecognizableFood",
          "unreadableReason",
          "detectedItems",
          "hiddenCalorieNotes",
          "portionNote",
          "suggestedMode",
        ],
        additionalProperties: false,
      },
    };
  }

  return {
    name: "nutrition_label_schema",
    strict: true,
    schema: {
      type: "object",
      properties: {
        foodName: { type: "string" },
        servingSize: { type: ["number", "null"] },
        servingUnit: { type: "string" },
        servingsPerContainer: { type: ["number", "null"] },
        caloriesKcal: { type: "number" },
        proteinG: { type: "number" },
        carbsG: { type: "number" },
        fatG: { type: "number" },
        fiberG: { type: "number" },
        sugarG: { type: "number" },
        saturatedFatG: { type: ["number", "null"] },
        sodiumMg: { type: ["number", "null"] },
        productCategory: { type: "string", enum: [...PRODUCT_CATEGORIES] },
        confidenceScore: { type: "number" },
        isReadableNutritionLabel: { type: "boolean" },
        unreadableReason: { type: ["string", "null"] },
        rawLabelExcerpt: { type: ["string", "null"] },
        suggestedMode: { type: "string", enum: ["none", ...SCAN_MODES] },
      },
      required: [
        "foodName",
        "servingSize",
        "servingUnit",
        "servingsPerContainer",
        "caloriesKcal",
        "proteinG",
        "carbsG",
        "fatG",
        "fiberG",
        "sugarG",
        "saturatedFatG",
        "sodiumMg",
        "productCategory",
        "confidenceScore",
        "isReadableNutritionLabel",
        "unreadableReason",
        "rawLabelExcerpt",
        "suggestedMode",
      ],
      additionalProperties: false,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      if (isSupabaseAuthEnforced()) {
        return NextResponse.json(
          { success: false, error: "Gagal memverifikasi sesi pengguna." },
          { status: 401 }
        );
      }
    }

    if (isSupabaseAuthEnforced() && !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Silakan login terlebih dahulu untuk memindai makanan atau label nutrisi.",
        },
        { status: 401 }
      );
    }

    const identityKey =
      userId ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local-guest";
    const rate = checkScanRateLimit(identityKey);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak permintaan scan. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSec) },
        }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image");
    const rawMode = formData.get("mode");
    const mode: ScanMode = rawMode === "food" ? "food" : "label";

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid 'image' file in multipart/form-data.",
        },
        { status: 400 }
      );
    }

    const fileCheck = validateScanFile({
      size: imageFile.size,
      type: imageFile.type,
    });
    if (!fileCheck.ok) {
      return NextResponse.json(
        { success: false, error: fileCheck.error },
        { status: fileCheck.status }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    const geminiApiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    const systemPrompt = mode === "food" ? FOOD_SYSTEM_PROMPT : LABEL_SYSTEM_PROMPT;
    const geminiSchema =
      mode === "food" ? geminiFoodResponseSchema : geminiLabelResponseSchema;
    const openAiUserText =
      mode === "food"
        ? "Identify the real food or drink in this photo and estimate its nutritional values per visible serving into JSON."
        : "Extract the nutrition facts from this food label image into JSON.";

    let rawJsonResult: unknown = null;
    try {
      rawJsonResult = await extractNutritionWithFallback({
        geminiApiKey,
        openAiApiKey,
        attemptTimeoutMs: DEFAULT_ATTEMPT_TIMEOUT_MS,
        totalTimeoutMs: DEFAULT_TOTAL_TIMEOUT_MS,
        callGeminiModel: async (modelName, signal) => {
          const ai = new GoogleGenAI({ apiKey: geminiApiKey! });
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  { text: systemPrompt },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: geminiSchema,
              temperature: 0,
              abortSignal: signal,
              ...(modelName === "gemini-3.5-flash-lite"
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
                : {}),
            },
          });

          return response.text ? JSON.parse(response.text) : null;
        },
        callOpenAi: async (signal) => {
          const openAiRes = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              signal,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAiApiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0,
                messages: [
                  {
                    role: "system",
                    content: systemPrompt,
                  },
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: openAiUserText,
                      },
                      {
                        type: "image_url",
                        image_url: {
                          url: `data:${mimeType};base64,${base64Image}`,
                          detail: "high",
                        },
                      },
                    ],
                  },
                ],
                response_format: {
                  type: "json_schema",
                  json_schema: buildOpenAiJsonSchema(mode),
                },
              }),
            }
          );

          if (!openAiRes.ok) {
            const errBody = await openAiRes.text();
            throw new Error(`OpenAI API error (${openAiRes.status}): ${errBody}`);
          }

          const completion = await openAiRes.json();
          const content = completion.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error("Empty response from OpenAI vision model.");
          }
          return JSON.parse(content);
        },
      });
    } catch (providerErr) {
      if (providerErr instanceof MissingVisionApiKeyError) {
        return NextResponse.json(
          { success: false, error: providerErr.message },
          { status: 500 }
        );
      }
      if (providerErr instanceof ScanTimeoutError) {
        return NextResponse.json(
          {
            success: false,
            code: "SCAN_TIMEOUT",
            error: providerErr.message,
          },
          { status: 504 }
        );
      }
      throw providerErr;
    }

    const normalizedRaw =
      rawJsonResult && typeof rawJsonResult === "object"
        ? (() => {
            const obj = rawJsonResult as Record<string, unknown>;
            const rawSuggested = obj.suggestedMode;
            const normalizedSuggested: ScanMode | null =
              rawSuggested === "label" || rawSuggested === "food"
                ? rawSuggested
                : null;
            return {
              ...obj,
              scanMode: mode,
              suggestedMode: normalizedSuggested,
              ...(mode === "food"
                ? {
                    isReadableNutritionLabel: Boolean(obj.isRecognizableFood),
                    servingsPerContainer: null,
                    rawLabelExcerpt: null,
                  }
                : {}),
            };
          })()
        : rawJsonResult;

    const parsed = NutritionLabelSchema.safeParse(normalizedRaw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            mode === "food"
              ? "Gagal memvalidasi estimasi gizi makanan."
              : "Failed to validate extracted nutrition label data.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (!parsed.data.isReadableNutritionLabel) {
      const suggestedMode =
        parsed.data.suggestedMode && parsed.data.suggestedMode !== mode
          ? parsed.data.suggestedMode
          : null;
      const code = suggestedMode
        ? "WRONG_MODE"
        : mode === "food"
        ? "UNREADABLE_FOOD"
        : "UNREADABLE_LABEL";

      return NextResponse.json(
        {
          success: false,
          code,
          suggestedMode,
          error:
            parsed.data.unreadableReason?.trim() ||
            (mode === "food"
              ? "Makanan tidak terlihat jelas di foto. Coba arahkan ke seluruh hidangan dengan cahaya cukup."
              : "Tabel Informasi Nilai Gizi tidak terbaca jelas. Coba foto lebih dekat dan pastikan teks fokus."),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed.data,
    });
  } catch (error) {
    console.error("[Nutrition Scan API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Gagal memproses foto. Coba ulangi beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}
