import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePetDialogueWithAI } from "@/lib/server/pet-dialogue-ai";

const mainMealSlotSchema = z.enum(["breakfast", "lunch", "dinner"]);

const requestSchema = z.object({
  petName: z.string().min(1).max(50).default("CalPal"),
  petSpecies: z.string().min(1).max(50).default("flameling"),
  moodCategory: z.enum([
    "ecstatic",
    "happy",
    "needs_food",
    "needs_attention",
    "needs_both",
  ]),
  currentSlot: mainMealSlotSchema.nullable().default(null),
  fedSlotsToday: z.array(mainMealSlotSchema).max(3).default([]),
  missedMealSlots: z.array(mainMealSlotSchema).max(3).default([]),
  loggedMainMealsToday: z.array(mainMealSlotSchema).max(3).default([]),
  petCountToday: z.number().int().min(0).max(3).default(0),
  hoursSinceFed: z.number().min(0).max(999).default(0),
  hoursSincePetted: z.number().min(0).max(999).default(0),
  completedDailyMissionsCount: z.number().int().min(0).max(50).default(0),
  totalDailyMissionsCount: z.number().int().min(0).max(50).default(0),
  previousMessage: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid dialogue request payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await generatePetDialogueWithAI(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/pet/dialogue] Error:", err);
    return NextResponse.json(
      { error: "Gagal menghasilkan dialog CalPal" },
      { status: 500 },
    );
  }
}
