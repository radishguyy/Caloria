import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, recaps } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  checkRecapEligibility,
  checkSpecificWeekEligibility,
} from "@/lib/recaps/cadence";
import {
  aggregateRecapMetricsFromDb,
  generateRecapStoryWithAI,
  type RecapStoryData,
} from "@/lib/server/recap-ai";

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;

    // 1. Authenticate user
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // Supabase session missing
    }

    if (!userId) {
      const headerUserId = request.headers.get("x-user-id");
      if (
        headerUserId &&
        headerUserId.trim() &&
        headerUserId !== "undefined" &&
        headerUserId !== "null"
      ) {
        userId = headerUserId.trim();
      }
    }

    if (!userId && process.env.DATABASE_URL && db) {
      try {
        const [firstProfile] = await db
          .select({ id: profiles.id })
          .from(profiles)
          .limit(1);
        if (firstProfile?.id) {
          userId = firstProfile.id;
        }
      } catch {
        // DB not reachable
      }
    }

    if (!userId || !process.env.DATABASE_URL || !db) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak terautentikasi.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const forceRefresh = Boolean(body.forceRefresh);
    const requestedCycle =
      body.cycleNumber !== undefined ? Number(body.cycleNumber) : null;
    const requestedType: "weekly" | "monthly" | null =
      body.type === "monthly" || body.type === "weekly" ? body.type : null;

    // 2. Fetch user profile
    const [userProfile] = await db
      .select({
        id: profiles.id,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const userCreatedAt = new Date(userProfile.createdAt);

    // 3. Check existing recaps count
    const existingRecaps = await db
      .select()
      .from(recaps)
      .where(eq(recaps.userId, userId))
      .orderBy(desc(recaps.cycleNumber));

    // Determine target cycle
    const defaultEligibility = checkRecapEligibility(
      userCreatedAt,
      existingRecaps.length
    );

    const type = requestedType || defaultEligibility.type;
    const cycleNumber =
      requestedCycle !== null ? requestedCycle : defaultEligibility.cycleNumber;

    // 4. Check if already cached in DB
    const [cachedRecap] = await db
      .select()
      .from(recaps)
      .where(
        and(
          eq(recaps.userId, userId),
          eq(recaps.type, type),
          eq(recaps.cycleNumber, cycleNumber)
        )
      )
      .limit(1);

    if (cachedRecap && !forceRefresh) {
      return NextResponse.json({
        success: true,
        recap: cachedRecap,
        storyData: cachedRecap.slidesData as RecapStoryData,
        fromCache: true,
      });
    }

    // 5. Cadence verification: Ensure milestone is unlocked
    const targetWeek = type === "monthly" ? cycleNumber * 4 : cycleNumber;
    const weekEligibility = checkSpecificWeekEligibility(
      userCreatedAt,
      targetWeek
    );

    if (!weekEligibility.isAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: `Recap ${type === "monthly" ? "Bulan" : "Pekan"} ke-${cycleNumber} belum terbuka. Terbuka dalam ${weekEligibility.daysRemaining} hari.`,
          daysRemaining: weekEligibility.daysRemaining,
          unlockDate: weekEligibility.endDate,
        },
        { status: 403 }
      );
    }

    // 6. Aggregate real metrics from database
    const startDate = weekEligibility.startDate;
    const endDate = weekEligibility.endDate;
    const unlockDate = weekEligibility.endDate;

    const metrics = await aggregateRecapMetricsFromDb(
      userId,
      startDate,
      endDate,
      type,
      cycleNumber
    );

    // 7. Call Gemini AI generator with strict schema
    const storyData = await generateRecapStoryWithAI(metrics);

    // 8. Persist to DB or update if forceRefresh
    let savedRecap;
    if (cachedRecap) {
      const [updated] = await db
        .update(recaps)
        .set({
          slidesData: storyData,
          startDate,
          endDate,
          unlockDate,
        })
        .where(eq(recaps.id, cachedRecap.id))
        .returning();
      savedRecap = updated;
    } else {
      const [inserted] = await db
        .insert(recaps)
        .values({
          userId,
          type,
          cycleNumber,
          startDate,
          endDate,
          unlockDate,
          isViewed: false,
          slidesData: storyData,
        })
        .returning();
      savedRecap = inserted;
    }

    return NextResponse.json({
      success: true,
      recap: savedRecap,
      storyData,
      fromCache: false,
    });
  } catch (error) {
    console.error("[RecapGenerate] Error generating recap:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal membuat Caloria Wrapped.",
      },
      { status: 500 }
    );
  }
}
