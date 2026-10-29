import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, recaps } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkRecapEligibility } from "@/lib/recaps/cadence";

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // 1. Try Supabase Auth
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // Supabase not authenticated or session cookie missing
    }

    // 2. Check x-user-id header
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

    // 3. Fallback to first profile for local dev
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
      return NextResponse.json({
        success: false,
        error: "Pengguna tidak terautentikasi.",
      }, { status: 401 });
    }

    // Fetch user profile to get createdAt
    const [userProfile] = await db
      .select({
        id: profiles.id,
        createdAt: profiles.createdAt,
        username: profiles.username,
        fullName: profiles.fullName,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const userCreatedAt = userProfile?.createdAt
      ? new Date(userProfile.createdAt)
      : new Date();

    // Fetch existing generated recaps from database
    const existingRecaps = await db
      .select()
      .from(recaps)
      .where(eq(recaps.userId, userId))
      .orderBy(desc(recaps.createdAt));

    // Calculate cadence eligibility
    const eligibility = checkRecapEligibility(
      userCreatedAt,
      existingRecaps.length
    );

    const daysSinceJoin = Math.max(
      0,
      Math.floor(
        (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    return NextResponse.json({
      success: true,
      eligibility,
      history: existingRecaps,
      userCreatedAt: userCreatedAt.toISOString(),
      daysSinceJoin,
      totalRecapsGenerated: existingRecaps.length,
    });
  } catch (error) {
    console.error("[RecapsStatus] Error checking recap status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memeriksa status Caloria Wrapped.",
      },
      { status: 500 }
    );
  }
}
