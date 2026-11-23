import { PET_STAGES } from "@/lib/constants";

export interface PetEvolutionInfo {
  stageNumber: number;
  stageName: string;
  stageSlug: "egg" | "hatchling" | "juvenile" | "adult" | "mythic";
  minLevel: number;
  nextStageName: string | null;
  nextMilestoneLevel: number | null;
}

const STAGE_SLUGS = ["egg", "hatchling", "juvenile", "adult", "mythic"] as const;

export function getEvolutionForLevel(level: number): PetEvolutionInfo {
  const safeLevel = Math.max(1, Math.floor(level || 1));

  let activeIdx = 0;
  for (let i = 0; i < PET_STAGES.length; i++) {
    if (safeLevel >= PET_STAGES[i].minLevel) {
      activeIdx = i;
    }
  }

  const current = PET_STAGES[activeIdx];
  const next = PET_STAGES[activeIdx + 1] || null;

  return {
    stageNumber: current.stage,
    stageName: current.name,
    stageSlug: STAGE_SLUGS[activeIdx],
    minLevel: current.minLevel,
    nextStageName: next ? next.name : null,
    nextMilestoneLevel: next ? next.minLevel : null,
  };
}

export function stageSlugToNumber(stageSlug?: string | null, level = 1): number {
  const normalized = (stageSlug || "").toLowerCase();
  const idx = STAGE_SLUGS.indexOf(normalized as (typeof STAGE_SLUGS)[number]);
  if (idx >= 0) return idx + 1;
  return getEvolutionForLevel(level).stageNumber;
}
