import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/lib/nutrition/product-assessment";

export const SCAN_MODES = ["label", "food"] as const;
export type ScanMode = (typeof SCAN_MODES)[number];

export const NutritionLabelSchema = z.object({
  scanMode: z.enum(SCAN_MODES).default("label"),
  foodName: z.string().default("Scanned Food"),
  servingSize: z.number().nullable(),
  servingUnit: z.string().default("g"),
  servingsPerContainer: z.number().nullable(),
  caloriesKcal: z.number(), // per single serving
  proteinG: z.number().default(0),
  carbsG: z.number().default(0),
  fatG: z.number().default(0),
  fiberG: z.number().default(0),
  sugarG: z.number().default(0),
  saturatedFatG: z.number().nullable().optional(),
  sodiumMg: z.number().nullable().optional(),
  productCategory: z.enum(PRODUCT_CATEGORIES).nullable().optional().catch("other"),
  confidenceScore: z.number().min(0).max(1).optional(),
  isReadableNutritionLabel: z.boolean().default(true),
  unreadableReason: z.string().nullable().optional(),
  rawLabelExcerpt: z.string().nullable().optional(),
  detectedItems: z.array(z.string()).default([]),
  hiddenCalorieNotes: z.array(z.string()).default([]),
  portionNote: z.string().nullable().optional(),
  suggestedMode: z.enum(SCAN_MODES).nullable().optional(),
});

export type NutritionLabelData = z.infer<typeof NutritionLabelSchema>;
