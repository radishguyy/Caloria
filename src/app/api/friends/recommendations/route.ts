import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, pets, friendships } from "@/db/schema";
import { eq, ne, or, notInArray, desc } from "drizzle-orm";
import { FriendRecommendation } from "@/types";

export async function GET(request: NextRequest) {
  try {
    let currentUserId: string | null = null;
    let userGoal = "maintenance";
    let userTargetKcal = 2000;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) currentUserId = user.id;
    } catch {
      // Unauthenticated
    }

    const fallbackRecommendations: FriendRecommendation[] = [
      {
        id: "rec-user-1",
        username: "dimas_runs",
        fullName: "Dimas Anggara",
        petName: "Leafy",
        petSpecies: "bloomie",
        petLevel: 4,
        petStage: "Hatchling",
        mutualTag: "🔥 5-day streak",
        calorieTarget: 2200,
        streakDays: 5,
        goalType: "maintenance",
      },
      {
        id: "rec-user-2",
        username: "siti_balance",
        fullName: "Siti Rahma",
        petName: "Aqua",
        petSpecies: "droplet",
        petLevel: 5,
        petStage: "Juvenile",
        mutualTag: "🎯 Target Seimbang",
        calorieTarget: 1800,
        streakDays: 9,
        goalType: "diet",
      },
      {
        id: "rec-user-3",
        username: "kevin_lift",
        fullName: "Kevin Wijaya",
        petName: "Pyro",
        petSpecies: "flameling",
        petLevel: 6,
        petStage: "Juvenile",
        mutualTag: "💪 Fokus Protein",
        calorieTarget: 2600,
        streakDays: 12,
        goalType: "bulking",
      },
    ];

    if (!currentUserId || !process.env.DATABASE_URL || !db) {
      return NextResponse.json({
        success: true,
        recommendations: fallbackRecommendations.slice(0, 3),
      });
    }

    try {
      // Find current user profile details
      const [currProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, currentUserId))
        .limit(1);

      if (currProfile) {
        userGoal = currProfile.goal;
        userTargetKcal = currProfile.targetCaloriesKcal || 2000;
      }

      // Find all user IDs who are already friends or pending
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

      // Query candidate profiles
      const candidates = await db
        .select()
        .from(profiles)
        .where(ne(profiles.id, currentUserId))
        .orderBy(desc(profiles.currentStreakDays))
        .limit(10);

      const filtered = candidates.filter((c) => !excludedUserIds.has(c.id));

      if (filtered.length === 0) {
        return NextResponse.json({
          success: true,
          recommendations: fallbackRecommendations.slice(0, 3),
        });
      }

      const recs: FriendRecommendation[] = [];

      for (const profile of filtered.slice(0, 3)) {
        const [pet] = await db
          .select()
          .from(pets)
          .where(eq(pets.userId, profile.id))
          .limit(1);

        const streak = profile.currentStreakDays || 1;
        let mutualTag = `🔥 ${streak}-day streak`;
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
          avatarUrl: profile.avatarUrl,
          petName: pet?.name || "Buddy",
          petSpecies: (pet?.species as any) || "bloomie",
          petLevel: pet?.level || 2,
          petStage: pet && pet.level >= 5 ? "Juvenile" : "Hatchling",
          mutualTag,
          calorieTarget: profile.targetCaloriesKcal || 2000,
          streakDays: streak,
          goalType: profile.goal || "maintenance",
        });
      }

      // If less than 3 from DB, top up with fallback
      if (recs.length < 3) {
        for (const fb of fallbackRecommendations) {
          if (recs.length >= 3) break;
          if (!recs.some((r) => r.username === fb.username)) {
            recs.push(fb);
          }
        }
      }

      return NextResponse.json({
        success: true,
        recommendations: recs.slice(0, 3),
      });
    } catch (dbErr: any) {
      console.warn("[API recs GET] DB query fallback:", dbErr?.message);
      return NextResponse.json({
        success: true,
        recommendations: fallbackRecommendations.slice(0, 3),
      });
    }
  } catch (err: any) {
    console.error("[API recs GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
