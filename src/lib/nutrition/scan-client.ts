import type { NutritionLabelData, ScanMode } from "@/lib/schemas/nutrition-scan";

export type ScanStage = "compressing" | "scanning" | "analyzing";

const DEFAULT_MAX_DIMENSION = 840;
const DEFAULT_JPEG_QUALITY = 0.72;
const DEFAULT_CACHE_LIMIT = 20;
export const DEFAULT_SCAN_CLIENT_TIMEOUT_MS = 12_000;

export class ScanApiError extends Error {
  readonly code?: string;
  readonly suggestedMode: ScanMode | null;
  readonly status?: number;

  constructor(
    message: string,
    meta: { code?: string; suggestedMode?: ScanMode | null; status?: number } = {}
  ) {
    super(message);
    this.name = "ScanApiError";
    this.code = meta.code;
    this.suggestedMode = meta.suggestedMode ?? null;
    this.status = meta.status;
  }
}

export function fitWithinMaxDimension(
  width: number,
  height: number,
  maxDimension = DEFAULT_MAX_DIMENSION
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 1, height: 1 };
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  if (width >= height) {
    return {
      width: maxDimension,
      height: Math.round((height * maxDimension) / width),
    };
  }
  return {
    width: Math.round((width * maxDimension) / height),
    height: maxDimension,
  };
}

export interface ReticleCropInput {
  videoWidth: number;
  videoHeight: number;
  videoRect: { left: number; top: number; width: number; height: number };
  reticleRect: { left: number; top: number; width: number; height: number };
  paddingRatio?: number;
}

/**
 * Maps a DOM scan-reticle bounding box over an `object-cover` video element
 * back into raw video pixel coordinates so captured frames exclude surrounding clutter.
 */
export function computeReticleCropRect({
  videoWidth,
  videoHeight,
  videoRect,
  reticleRect,
  paddingRatio = 0.12,
}: ReticleCropInput): { sx: number; sy: number; sw: number; sh: number } {
  const fullFrame = {
    sx: 0,
    sy: 0,
    sw: Math.max(1, Math.round(videoWidth)),
    sh: Math.max(1, Math.round(videoHeight)),
  };

  if (
    videoWidth <= 0 ||
    videoHeight <= 0 ||
    videoRect.width <= 0 ||
    videoRect.height <= 0 ||
    reticleRect.width <= 0 ||
    reticleRect.height <= 0
  ) {
    return fullFrame;
  }

  const scale = Math.max(videoRect.width / videoWidth, videoRect.height / videoHeight);
  const offsetX = (videoWidth * scale - videoRect.width) / 2;
  const offsetY = (videoHeight * scale - videoRect.height) / 2;

  const rawX = (reticleRect.left - videoRect.left + offsetX) / scale;
  const rawY = (reticleRect.top - videoRect.top + offsetY) / scale;
  const rawW = reticleRect.width / scale;
  const rawH = reticleRect.height / scale;

  const safePadding = Math.max(0, paddingRatio);
  const padX = rawW * safePadding;
  const padY = rawH * safePadding;

  const left = Math.max(0, rawX - padX);
  const top = Math.max(0, rawY - padY);
  const right = Math.min(videoWidth, rawX + rawW + padX);
  const bottom = Math.min(videoHeight, rawY + rawH + padY);

  if (right <= left || bottom <= top) {
    return fullFrame;
  }

  const sx = Math.round(left);
  const sy = Math.round(top);
  const sw = Math.max(1, Math.min(videoWidth - sx, Math.round(right - left)));
  const sh = Math.max(1, Math.min(videoHeight - sy, Math.round(bottom - top)));

  return { sx, sy, sw, sh };
}

export async function hashBlobSha256(blob: Blob): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buffer = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return `fallback-${blob.size}-${blob.type}`;
}

/**
 * Downscale and JPEG-compress an image file/blob on the client so AI upload
 * stays fast on mobile networks while keeping details sharp.
 */
export async function compressImageFile(
  file: Blob,
  maxDimension = DEFAULT_MAX_DIMENSION,
  quality = DEFAULT_JPEG_QUALITY
): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { width, height } = fitWithinMaxDimension(
        img.width,
        img.height,
        maxDimension
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Gagal menyiapkan kanvas kompresi gambar."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Gagal mengompres gambar menjadi JPEG."));
            return;
          }
          resolve({ blob, previewUrl: objectUrl });
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("File gambar tidak dapat dibaca."));
    };
    img.src = objectUrl;
  });
}

export interface ScanClientDeps {
  fetchFn?: typeof fetch;
  hashFn?: (blob: Blob) => Promise<string>;
  maxCacheSize?: number;
  timeoutMs?: number;
}

export interface ScanBlobOptions {
  mode?: ScanMode;
  signal?: AbortSignal;
  timeoutMs?: number;
  onStageChange?: (stage: ScanStage) => void;
}

export function createScanClient(deps: ScanClientDeps = {}) {
  const fetchFn = deps.fetchFn ?? fetch;
  const hashFn = deps.hashFn ?? hashBlobSha256;
  const maxCacheSize = deps.maxCacheSize ?? DEFAULT_CACHE_LIMIT;
  const defaultTimeoutMs = deps.timeoutMs ?? DEFAULT_SCAN_CLIENT_TIMEOUT_MS;
  const cache = new Map<string, NutritionLabelData>();

  async function scanBlob(
    blob: Blob,
    options: ScanBlobOptions = {}
  ): Promise<NutritionLabelData> {
    const mode: ScanMode = options.mode ?? "label";
    const key = `${mode}:${await hashFn(blob)}`;
    const cached = cache.get(key);
    if (cached) {
      options.onStageChange?.("analyzing");
      return cached;
    }

    options.onStageChange?.("scanning");
    const formData = new FormData();
    formData.append(
      "image",
      blob,
      mode === "food" ? "real-food.jpg" : "nutrition-label.jpg"
    );
    formData.append("mode", mode);

    const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    const controller = new AbortController();
    let timedOut = false;

    const onExternalAbort = () => controller.abort();
    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener("abort", onExternalAbort, { once: true });
      }
    }

    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, Math.max(1, timeoutMs));

    let res: Response;
    try {
      res = await fetchFn("/api/nutrition/scan", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } catch (err) {
      if (timedOut) {
        throw new ScanApiError(
          mode === "food"
            ? "Waktu scan terlalu lama (>12 detik). Pastikan koneksi stabil dan foto makanan terlihat jelas, lalu coba lagi."
            : "Waktu scan terlalu lama (>12 detik). Pastikan koneksi stabil dan teks label cukup dekat, lalu coba lagi.",
          { code: "SCAN_TIMEOUT", status: 504 }
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onExternalAbort);
    }

    options.onStageChange?.("analyzing");

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.success || !json?.data) {
      const suggestedMode: ScanMode | null =
        json?.suggestedMode === "label" || json?.suggestedMode === "food"
          ? json.suggestedMode
          : null;
      throw new ScanApiError(
        json?.error ||
          (mode === "food"
            ? "Gagal mengenali makanan dari foto. Pastikan hidangan terlihat jelas dan terang."
            : "Gagal mengekstrak informasi nilai gizi dari gambar."),
        {
          code: typeof json?.code === "string" ? json.code : undefined,
          suggestedMode,
          status: res.status,
        }
      );
    }

    const data = json.data as NutritionLabelData;
    if (cache.size >= maxCacheSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }
    cache.set(key, data);
    return data;
  }

  return {
    scanBlob,
    clearCache: () => cache.clear(),
  };
}

export const defaultScanClient = createScanClient();
