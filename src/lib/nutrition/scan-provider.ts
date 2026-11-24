export const GEMINI_CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
] as const;

export const DEFAULT_ATTEMPT_TIMEOUT_MS = 7_500;
export const DEFAULT_TOTAL_TIMEOUT_MS = 10_000;

export class MissingVisionApiKeyError extends Error {
  constructor() {
    super(
      "Missing Vision AI API key. Please set GEMINI_API_KEY (or OPENAI_API_KEY) in your environment variables (.env.local)."
    );
    this.name = "MissingVisionApiKeyError";
  }
}

export class ScanTimeoutError extends Error {
  constructor(
    message = "Waktu pembacaan AI melewati 10 detik. Pastikan label dekat, terang, dan koneksi stabil lalu coba lagi."
  ) {
    super(message);
    this.name = "ScanTimeoutError";
  }
}

export interface VisionFallbackParams {
  geminiApiKey?: string;
  openAiApiKey?: string;
  attemptTimeoutMs?: number;
  totalTimeoutMs?: number;
  callGeminiModel: (
    modelName: string,
    signal?: AbortSignal
  ) => Promise<unknown | null>;
  callOpenAi: (signal?: AbortSignal) => Promise<unknown | null>;
}

async function runAttemptWithTimeout<T>(
  runner: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ScanTimeoutError());
    }, Math.max(1, timeoutMs));
  });

  try {
    return await Promise.race([runner(controller.signal), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Tries active Gemini 3 Flash models first, then falls back to OpenAI when
 * Gemini fails (or is unconfigured) and OPENAI_API_KEY is available.
 * Bounded by per-attempt and total deadlines so users never wait indefinitely.
 */
export async function extractNutritionWithFallback({
  geminiApiKey,
  openAiApiKey,
  attemptTimeoutMs = DEFAULT_ATTEMPT_TIMEOUT_MS,
  totalTimeoutMs = DEFAULT_TOTAL_TIMEOUT_MS,
  callGeminiModel,
  callOpenAi,
}: VisionFallbackParams): Promise<unknown> {
  if (!geminiApiKey && !openAiApiKey) {
    throw new MissingVisionApiKeyError();
  }

  const deadline = Date.now() + Math.max(1, totalTimeoutMs);
  let lastError: unknown = null;
  let hadTimeout = false;

  if (geminiApiKey) {
    for (const modelName of GEMINI_CANDIDATE_MODELS) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        hadTimeout = true;
        break;
      }

      try {
        const result = await runAttemptWithTimeout(
          (signal) => callGeminiModel(modelName, signal),
          Math.min(attemptTimeoutMs, remaining)
        );
        if (result) return result;
      } catch (err) {
        lastError = err;
        if (err instanceof ScanTimeoutError) {
          hadTimeout = true;
        }
        console.warn(`[Gemini] model ${modelName} failed, trying next...:`, err);
      }
    }
  }

  if (openAiApiKey) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new ScanTimeoutError();
    }
    return await runAttemptWithTimeout(
      (signal) => callOpenAi(signal),
      Math.min(attemptTimeoutMs, remaining)
    );
  }

  if (hadTimeout && (!lastError || lastError instanceof ScanTimeoutError)) {
    throw new ScanTimeoutError();
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Empty response from Vision AI model.");
}
