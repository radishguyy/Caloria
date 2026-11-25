export const MAX_SCAN_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
export const SCAN_RATE_LIMIT_MAX = 15;
export const SCAN_RATE_LIMIT_WINDOW_MS = 60_000;

const ALLOWED_IMAGE_MIME_PREFIX = "image/";
const MAX_RATE_BUCKETS = 500;

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

/**
 * Enforce Supabase session when real project credentials are configured.
 * Matches middleware local-dummy behavior so local dev without env keys works.
 */
export function isSupabaseAuthEnforced(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("dummy-project"));
}

export function validateScanFile(file: {
  size: number;
  type?: string;
}): { ok: true } | { ok: false; status: number; error: string } {
  if (!file.size || file.size <= 0) {
    return { ok: false, status: 400, error: "File gambar kosong." };
  }

  if (file.size > MAX_SCAN_IMAGE_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "Ukuran gambar melebihi batas 4 MB. Coba ambil foto lebih dekat.",
    };
  }

  const mime = (file.type || "").trim().toLowerCase();
  if (mime && !mime.startsWith(ALLOWED_IMAGE_MIME_PREFIX)) {
    return {
      ok: false,
      status: 400,
      error: "Format file harus berupa gambar (JPEG/PNG/WebP).",
    };
  }

  return { ok: true };
}

/**
 * shortcut: in-memory fixed-window limiter resets across serverless cold starts;
 * upgrade to Redis/Upstash ratelimit when scaling across multiple instances.
 */
export function checkScanRateLimit(
  identityKey: string,
  nowMs = Date.now()
): { allowed: boolean; retryAfterSec: number } {
  const key = identityKey || "anonymous";
  const existing = rateBuckets.get(key);

  if (!existing || nowMs >= existing.resetAt) {
    if (rateBuckets.size >= MAX_RATE_BUCKETS) {
      for (const [k, b] of rateBuckets.entries()) {
        if (nowMs >= b.resetAt) rateBuckets.delete(k);
      }
    }
    rateBuckets.set(key, {
      count: 1,
      resetAt: nowMs + SCAN_RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= SCAN_RATE_LIMIT_MAX) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((existing.resetAt - nowMs) / 1000)
    );
    return { allowed: false, retryAfterSec };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function resetScanRateLimitStore(): void {
  rateBuckets.clear();
}
