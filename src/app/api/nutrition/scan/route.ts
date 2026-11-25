import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel, Type, Schema } from "@google/genai";
import { NutritionLabelSchema } from "@/lib/schemas/nutrition-scan";
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

const SYSTEM_PROMPT = `You are an expert nutrition label OCR and food packaging parser.
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
9. Anti-hallucination check (CRITICAL): Set isReadableNutritionLabel to true ONLY if an actual printed Nutrition Facts / Informasi Nilai Gizi table on packaged food is clearly visible and legible. If the photo shows loose or plated food without a nutrition table (e.g., nasi goreng, rice bowls, fruit, home-cooked dishes), set isReadableNutritionLabel to false with unreadableReason = "Scan ini khusus tabel Informasi Nilai Gizi di kemasan. Untuk makanan tanpa label (mis. nasi goreng), catat lewat pencarian menu." If a packaging photo is too blurry, tiny, dark, or obstructed to read numbers directly, set isReadableNutritionLabel to false with short Indonesian guidance in unreadableReason, set rawLabelExcerpt to null, and set all macro numbers to 0 (NEVER guess or invent values).
10. When isReadableNutritionLabel is true, set rawLabelExcerpt to 1 or 2 short exact phrases read verbatim from the label (for example: "Takaran saji 250 ml, Energi total 150 kkal, Gula 10 g") so the user can verify extraction directly against the packaging.`;

const geminiResponseSchema: Schema = {
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
        "1-2 short verbatim phrases read from the nutrition table (e.g., 'Takaran saji 250 ml, Energi total 150 kkal'); null if unreadable.",
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
  ],
};

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
          error: "Silakan login terlebih dahulu untuk memindai label nutrisi.",
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
                  { text: SYSTEM_PROMPT },
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
              responseSchema: geminiResponseSchema,
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
                    content: SYSTEM_PROMPT,
                  },
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: "Extract the nutrition facts from this food label image into JSON.",
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
                  json_schema: {
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
                        productCategory: {
                          type: "string",
                          enum: [...PRODUCT_CATEGORIES],
                        },
                        confidenceScore: { type: "number" },
                        isReadableNutritionLabel: { type: "boolean" },
                        unreadableReason: { type: ["string", "null"] },
                        rawLabelExcerpt: { type: ["string", "null"] },
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
                      ],
                      additionalProperties: false,
                    },
                  },
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

    const parsed = NutritionLabelSchema.safeParse(rawJsonResult);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to validate extracted nutrition label data.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (!parsed.data.isReadableNutritionLabel) {
      return NextResponse.json(
        {
          success: false,
          code: "UNREADABLE_LABEL",
          error:
            parsed.data.unreadableReason?.trim() ||
            "Tabel Informasi Nilai Gizi tidak terbaca jelas. Coba foto lebih dekat dan pastikan teks fokus.",
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
          "Gagal memproses foto label nutrisi. Coba ulangi beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}
