import type { TourId, TourStepDef } from "@/lib/tour/types";
import { TOUR_DEFS } from "@/lib/tour/tour-workflows";

let registeredDefs: Record<TourId, TourStepDef[]> = { ...TOUR_DEFS };

export function registerTourDefs(
  defs: Partial<Record<TourId, TourStepDef[]>>,
): void {
  registeredDefs = {
    ...registeredDefs,
    ...defs,
  };
}

export function getTourSteps(id: TourId): TourStepDef[] {
  return registeredDefs[id] ?? [];
}
