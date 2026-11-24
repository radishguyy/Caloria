"use client";

import { useSyncExternalStore } from "react";

/**
 * Explicit list of available Caloria logo variants verified in public/logos/.
 * Referenced using their Next.js public URL paths.
 */
export const CALORIA_LOGO_VARIANTS = [
  "/logos/caloria-01.svg",
  "/logos/caloria-02.svg",
  "/logos/caloria-03.svg",
  "/logos/caloria-04.svg",
  "/logos/caloria-5.svg",
  "/logos/caloria-06.svg",
] as const;

export type CaloriaLogoVariant = (typeof CALORIA_LOGO_VARIANTS)[number];

/**
 * Deterministic initial logo rendered identically on server and initial client hydration
 * to prevent any Next.js hydration mismatches.
 */
export const DEFAULT_LOGO_VARIANT: CaloriaLogoVariant =
  CALORIA_LOGO_VARIANTS[0];

const PREV_LOGO_STORAGE_KEY = "caloria_last_logo";

/**
 * In-memory reference that survives React re-renders and client-side navigation (SPA transitions)
 * within the same browser window session. When a full browser page reload occurs, JavaScript
 * memory is completely reinitialized (clearing this variable to null), signaling that a new
 * random logo should be selected.
 */
let inMemorySessionLogo: CaloriaLogoVariant | null = null;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Helper to pick a random variant from an array, avoiding consecutive repeats from previous reload.
 */
export function selectRandomLogoVariant(
  variants: readonly CaloriaLogoVariant[] = CALORIA_LOGO_VARIANTS,
  previousVariant?: string | null,
): CaloriaLogoVariant {
  if (variants.length === 0) {
    return DEFAULT_LOGO_VARIANT;
  }
  if (variants.length === 1) {
    return variants[0];
  }

  const pool = variants.filter((variant) => variant !== previousVariant);
  const candidates = pool.length > 0 ? pool : variants;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

function getClientLogoSnapshot(): CaloriaLogoVariant {
  if (inMemorySessionLogo) {
    return inMemorySessionLogo;
  }

  let previousLogo: string | null = null;
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      previousLogo = window.sessionStorage.getItem(PREV_LOGO_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable or disabled (e.g. strict privacy mode)
  }

  const nextLogo = selectRandomLogoVariant(CALORIA_LOGO_VARIANTS, previousLogo);
  inMemorySessionLogo = nextLogo;

  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(PREV_LOGO_STORAGE_KEY, nextLogo);
    }
  } catch {
    // Storage write error ignored
  }

  return nextLogo;
}

function getServerLogoSnapshot(): CaloriaLogoVariant {
  return DEFAULT_LOGO_VARIANT;
}

/**
 * Hook to retrieve the current Caloria logo variant for the navbar.
 *
 * Requirements met:
 * 1. SSR & Hydration Safety: Uses useSyncExternalStore with getServerLogoSnapshot returning DEFAULT_LOGO_VARIANT.
 * 2. Full Page Reload: After mount on full page reload, picks a randomized logo from CALORIA_LOGO_VARIANTS.
 * 3. No Consecutive Repeats: Avoids selecting the same logo as previous reload via sessionStorage.
 * 4. Stability: Stays stable across component re-renders and client-side navigation via in-memory session cache.
 * 5. Safe Storage: Handles unavailable/restricted sessionStorage (e.g. privacy mode) gracefully.
 * 6. React 19 Cleanliness: No setState inside useEffect, eliminating cascading renders and lint warnings.
 */
export function useRandomLogo(): CaloriaLogoVariant {
  return useSyncExternalStore(
    subscribe,
    getClientLogoSnapshot,
    getServerLogoSnapshot,
  );
}

/**
 * For test execution and verification: resets the in-memory session cache and notifies subscribers.
 */
export function _resetLogoMemoryCache(): void {
  inMemorySessionLogo = null;
  listeners.forEach((listener) => listener());
}
