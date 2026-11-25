"use client";

import { useEffect, useRef } from "react";
import type { TourId } from "@/lib/tour/types";
import { useTourStore } from "@/store/use-tour-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { findFirstVisibleTarget } from "./target-resolver";
import { useTourEngine } from "./TourProvider";

/**
 * Retry delays (5 attempts spanning ~2 seconds) so pages that render loading
 * skeletons first still launch their tour once targets appear in the DOM.
 */
const RETRY_DELAYS_MS = [150, 350, 450, 500, 550] as const;

export function useAutoTour(id: TourId, opts?: { enabled?: boolean }): void {
  const enabled = opts?.enabled !== false;
  const hydrated = useHydrated();
  const isSeen = useTourStore((state) => Boolean(state.seen[id]));
  const { startTour, getStepsForTour, isTourActive } = useTourEngine();

  const startedRef = useRef(false);

  // Reset attempt flag when tour id changes or when the tour is reset to unseen.
  useEffect(() => {
    if (!isSeen) {
      startedRef.current = false;
    }
  }, [id, isSeen]);

  useEffect(() => {
    if (!enabled || !hydrated || isSeen || isTourActive || startedRef.current) {
      return;
    }

    const steps = getStepsForTour(id);
    if (!steps.length) return;

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const tryStart = () => {
      if (cancelled || startedRef.current) return;

      const hasVisibleTarget = steps.some(
        (step) => findFirstVisibleTarget(step.target) !== null,
      );

      if (hasVisibleTarget) {
        const started = startTour(id);
        if (started) {
          startedRef.current = true;
          return;
        }
      }

      if (attempt < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[attempt];
        attempt += 1;
        timerId = setTimeout(tryStart, delay);
      }
    };

    // Start first check on the initial delay to let initial paint settle.
    timerId = setTimeout(tryStart, RETRY_DELAYS_MS[0]);
    attempt = 1;

    return () => {
      cancelled = true;
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, [enabled, getStepsForTour, hydrated, id, isSeen, isTourActive, startTour]);
}
