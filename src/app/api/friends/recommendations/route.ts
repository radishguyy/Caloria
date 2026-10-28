import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, pets, friendships } from "@/db/schema";
import { eq, ne, or, desc } from "drizzle-orm";
import { FriendRecommendation } from "@/types";

export async function GET(request: NextRequest) {
  try {
    let currentUserId: string | null = null;
    let userGoal = "maintenance";
    let userTargetKcal = 2000;

    // 1. Try Supabase Auth
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) currentUserId = user.id;
    } catch {
      // Unauthenticated
    }

    // 2. Try x-user-id header
    if (!currentUserId) {
      const headerUserId = request.headers.get("x-user-id");
      if (headerUserId && headerUserId.trim() && headerUserId !== "undefined" && headerUserId !== "null") {
        currentUserId = headerUserId.trim();
      }
    }

    // 3. Fallback to first profile in DB (for local dev)
    if (!currentUserId && process.env.DATABASE_URL && db) {
      try {
        const [firstProfile] = await db.select({ id: profiles.id }).from(profiles).limit(1);
        if (firstProfile?.id) {
          currentUserId = firstProfile.id;
        }
      } catch {
        // DB error
      }
    }

    if (!currentUserId || !process.env.DATABASE_URL || !db) {
      return NextResponse.json({
        success: true,
        recommendations: [],
      });
    }

    // Find current user profile details
    const [currProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, currentUserId))
      .limit(1);

    if (currProfile) {
      userGoal = currProfile.goal || "maintenance";
      userTargetKcal = currProfile.targetCaloriesKcal || 2000;
    }

    // Find all user IDs who are already friends or have pending requests
    const relations = await db
      .select()
      .from(friendships)
      .where(or(eq(friendships.senderId, currentUserId), eq(friendships.receiverId, currentUserId)));

    const excludedUserIds = new Set<string>([currentUserId]);
    for (const r of relations) {
      if (r.status === "accepted" || r.status === "pending") {
        excludedUserIds.add(r.senderId === currentUserId ? r.receiverId : r.senderId);
      }
    }

    // Query real candidate profiles from the database
    const candidates = await db
      .select()
      .from(profiles)
      .where(ne(profiles.id, currentUserId))
      .orderBy(desc(profiles.currentStreakDays))
      .limit(10);

    const filtered = candidates.filter((c) => !excludedUserIds.has(c.id));

    const recs: FriendRecommendation[] = [];

    // Up to 3 real recommendations
    for (const profile of filtered.slice(0, 3)) {
      const [pet] = await db
        .select()
        .from(pets)
        .where(eq(pets.userId, profile.id))
        .limit(1);

      const streak = profile.currentStreakDays || 0;
      let mutualTag = streak > 0 ? `🔥 ${streak}-day streak` : "✨ Pengguna Aktif";
      if (profile.goal === userGoal) {
        mutualTag = "🎯 Target Sama";
      } else if (
        profile.targetCaloriesKcal &&
        Math.abs(profile.targetCaloriesKcal - userTargetKcal) <= 300
      ) {
        mutualTag = "🥗 Kalori Serupa";
      }

      recs.push({
        id: profile.id,
        username: profile.username,
        fullName: profile.fullName || profile.username,
        avatarUrl: profile.avatarUrl || undefined,
        petName: pet?.name || "Buddy",
        petSpecies: (pet?.species as any) || "bloomie",
        petLevel: pet?.level || 1,
        petStage: pet && (pet.stage === 2 || pet.level >= 5) ? "Juvenile" : "Hatchling",
        mutualTag,
        calorieTarget: profile.targetCaloriesKcal || 2000,
        streakDays: streak,
        goalType: profile.goal || "maintenance",
      });
    }

    return NextResponse.json({
      success: true,
      recommendations: recs,
    });
  } catch (err: any) {
    console.error("[API recs GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
