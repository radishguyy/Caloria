export const GEMINI_CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
] as const;

export class MissingVisionApiKeyError extends Error {
  constructor() {
    super(
      "Missing Vision AI API key. Please set GEMINI_API_KEY (or OPENAI_API_KEY) in your environment variables (.env.local)."
    );
    this.name = "MissingVisionApiKeyError";
  }
}

export interface VisionFallbackParams {
  geminiApiKey?: string;
  openAiApiKey?: string;
  callGeminiModel: (modelName: string) => Promise<unknown | null>;
  callOpenAi: () => Promise<unknown | null>;
}

/**
 * Tries active Gemini 3 Flash models first, then falls back to OpenAI when
 * Gemini fails (or is unconfigured) and OPENAI_API_KEY is available.
 */
export async function extractNutritionWithFallback({
  geminiApiKey,
  openAiApiKey,
  callGeminiModel,
  callOpenAi,
}: VisionFallbackParams): Promise<unknown> {
  if (!geminiApiKey && !openAiApiKey) {
    throw new MissingVisionApiKeyError();
  }

  let lastError: unknown = null;

  if (geminiApiKey) {
    for (const modelName of GEMINI_CANDIDATE_MODELS) {
      try {
        const result = await callGeminiModel(modelName);
        if (result) return result;
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini] model ${modelName} failed, trying next...:`, err);
      }
    }
  }

  if (openAiApiKey) {
    return await callOpenAi();
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Empty response from Vision AI model.");
}
