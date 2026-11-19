import assert from "node:assert/strict";
import {
  extractNutritionWithFallback,
  GEMINI_CANDIDATE_MODELS,
  MissingVisionApiKeyError,
} from "../scan-provider";

console.log("\n=== SUITE: Vision Provider & Fallback Orchestration ===");

async function run() {
  assert.deepEqual(GEMINI_CANDIDATE_MODELS, [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ]);

  // 1. Primary Gemini model succeeds without touching OpenAI
  {
    const geminiCalls: string[] = [];
    let openAiCalls = 0;

    const result = await extractNutritionWithFallback({
      geminiApiKey: "gem-key",
      openAiApiKey: "oai-key",
      callGeminiModel: async (model) => {
        geminiCalls.push(model);
        return { foodName: "Teh Tawar" };
      },
      callOpenAi: async () => {
        openAiCalls += 1;
        return { foodName: "Fallback" };
      },
    });

    assert.deepEqual(geminiCalls, ["gemini-3.5-flash-lite"]);
    assert.equal(openAiCalls, 0);
    assert.deepEqual(result, { foodName: "Teh Tawar" });
    console.log("  ✓ primary Gemini 3.5 Flash-Lite returns immediately");
  }

  // 2. Retries next Gemini model if first fails
  {
    const geminiCalls: string[] = [];
    let openAiCalls = 0;

    const result = await extractNutritionWithFallback({
      geminiApiKey: "gem-key",
      openAiApiKey: "oai-key",
      callGeminiModel: async (model) => {
        geminiCalls.push(model);
        if (model === "gemini-3.5-flash-lite") {
          throw new Error("429 quota");
        }
        return { foodName: "Roti Gandum" };
      },
      callOpenAi: async () => {
        openAiCalls += 1;
        return { foodName: "Fallback" };
      },
    });

    assert.deepEqual(geminiCalls, ["gemini-3.5-flash-lite", "gemini-3.8-flash"]);
    assert.equal(openAiCalls, 0);
    assert.deepEqual(result, { foodName: "Roti Gandum" });
    console.log("  ✓ retries next active Gemini model when primary fails");
  }

  // 3. True fallback: if ALL Gemini models fail, calls OpenAI when key is present
  {
    const geminiCalls: string[] = [];
    let openAiCalls = 0;

    const result = await extractNutritionWithFallback({
      geminiApiKey: "gem-key",
      openAiApiKey: "oai-key",
      callGeminiModel: async (model) => {
        geminiCalls.push(model);
        throw new Error(`Model ${model} down`);
      },
      callOpenAi: async () => {
        openAiCalls += 1;
        return { foodName: "Susu Kedelai" };
      },
    });

    assert.deepEqual(geminiCalls, GEMINI_CANDIDATE_MODELS);
    assert.equal(openAiCalls, 1);
    assert.deepEqual(result, { foodName: "Susu Kedelai" });
    console.log("  ✓ falls back to OpenAI when all Gemini models fail");
  }

  // 4. Throws MissingVisionApiKeyError when neither key is configured
  await assert.rejects(
    () =>
      extractNutritionWithFallback({
        geminiApiKey: undefined,
        openAiApiKey: undefined,
        callGeminiModel: async () => ({}),
        callOpenAi: async () => ({}),
      }),
    MissingVisionApiKeyError
  );
  console.log("  ✓ throws MissingVisionApiKeyError when no API keys exist");

  console.log("\nAll vision provider tests passed! ✅");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
