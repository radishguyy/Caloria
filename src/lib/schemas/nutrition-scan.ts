import { z } from "zod";

export const NutritionLabelSchema = z.object({
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
  confidenceScore: z.number().min(0).max(1).optional(),
});

export type NutritionLabelData = z.infer<typeof NutritionLabelSchema>;

