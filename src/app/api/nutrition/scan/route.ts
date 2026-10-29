import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NutritionLabelSchema } from "@/lib/schemas/nutrition-scan";

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
4. Extract servingSize (numeric amount, e.g., 30) and servingUnit (e.g., "g", "ml", "oz", "keping", "bungkus").
5. Extract servingsPerContainer as a number. Carefully check for text like "Jumlah Sajian per Kemasan", "Sajian per kemasan", "Jumlah sajian dalam kemasan", "Servings Per Container", "Servings Per Pack", or "Servings approx". For example: if it says "2 sajian per kemasan", "sekitar 2.5", or "approx. 3 servings", extract the numeric value (e.g. 2, 2.5, 3). Set to null ONLY if completely absent.
6. Infer foodName from any visible product title, branding, or packaging context. If only the nutrition table is visible without branding, provide a descriptive name (e.g., "Scanned Food Product").
7. Set confidenceScore between 0.0 and 1.0 reflecting how legible and complete the nutrition label is in the image.`;

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
  ],
};

export async function POST(request: NextRequest) {
  try {
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

    if (imageFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Uploaded image file is empty.",
        },
        { status: 400 }
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
      const candidateModels = [
        "gemini-3.5-flash",
        "gemini-3.8-flash",
        "gemini-3.1-flash-image",
        "gemini-2.5-flash",
      ];

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
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected server error while scanning nutrition label.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

