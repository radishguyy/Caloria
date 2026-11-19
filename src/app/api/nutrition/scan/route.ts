import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NutritionLabelSchema } from "@/lib/schemas/nutrition-scan";
import { PRODUCT_CATEGORIES } from "@/lib/nutrition/product-assessment";
import {
  checkScanRateLimit,
  isSupabaseAuthEnforced,
  validateScanFile,
} from "@/lib/nutrition/scan-guard";
import { createClient } from "@/lib/supabase/server";

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
8. Set confidenceScore between 0.0 and 1.0 reflecting label legibility.`;

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

    if (geminiApiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const candidateModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

      let lastError: unknown = null;
      for (const modelName of candidateModels) {
        try {
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
              temperature: 0.1,
              ...(modelName === "gemini-2.5-flash"
                ? { thinkingConfig: { thinkingBudget: 0 } }
                : {}),
            },
          });

          const responseText = response.text;
          if (responseText) {
            rawJsonResult = JSON.parse(responseText);
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`[Gemini] model ${modelName} failed, trying next...:`, err);
        }
      }

      if (!rawJsonResult && lastError) {
        throw lastError;
      }
    } else if (openAiApiKey) {
      const openAiRes = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.1,
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
      rawJsonResult = JSON.parse(content);
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Vision AI API key. Please set GEMINI_API_KEY (or OPENAI_API_KEY) in your environment variables (.env.local).",
        },
        { status: 500 }
      );
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
