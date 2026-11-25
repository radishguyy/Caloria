"use client";

import { useCallback, useMemo } from "react";
import type { TourId } from "@/lib/tour/types";
import { buildSeenRecord } from "@/lib/tour/tour-ids";
import { useTourStore } from "@/store/use-tour-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTourEngine } from "./TourProvider";

export function useTour(): {
  startTour(id: TourId): void;
  resetTour(id: TourId): void;
  resetAll(): void;
  seen: Record<TourId, boolean>;
} {
  const hydrated = useHydrated();
  const engine = useTourEngine();
  const rawSeen = useTourStore((state) => state.seen);
  const reset = useTourStore((state) => state.reset);
  const resetAllStore = useTourStore((state) => state.resetAll);

  const seen = useMemo(
    () => buildSeenRecord(hydrated ? rawSeen : {}),
    [hydrated, rawSeen],
  );

  const startTour = useCallback(
    (id: TourId) => {
      engine.startTour(id);
    },
    [engine],
  );

  const resetTour = useCallback(
    (id: TourId) => {
      reset(id);
    },
    [reset],
  );

  const resetAll = useCallback(() => {
    resetAllStore();
  }, [resetAllStore]);

  return {
    startTour,
    resetTour,
    resetAll,
    seen,
  };
}
