import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { friendships, profiles, pets, dailyNutritionSummaries } from "@/db/schema";
import { eq, or, and, sql, desc } from "drizzle-orm";
import { Friend, FriendRequest } from "@/types";

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
      // Supabase not authenticated or cookie missing
    }

    // 2. Check x-user-id header
    if (!userId) {
      const headerUserId = request.headers.get("x-user-id");
      if (headerUserId && headerUserId.trim() && headerUserId !== "undefined" && headerUserId !== "null") {
        userId = headerUserId.trim();
      }
    }

    // 3. Fallback to the first existing profile in DB (e.g. during local dev)
    if (!userId && process.env.DATABASE_URL && db) {
      try {
        const [firstProfile] = await db.select({ id: profiles.id }).from(profiles).limit(1);
        if (firstProfile?.id) {
          userId = firstProfile.id;
        }
      } catch {
        // DB access error
      }
    }

    // If still no user or no DB, return empty lists (NO hardcoded dummy data)
    if (!userId || !process.env.DATABASE_URL || !db) {
      return NextResponse.json({
        success: true,
        friends: [],
        pendingRequests: {
          incoming: [],
          outgoing: [],
        },
      });
    }

    // Query DB for friendships involving current user
    const records = await db
      .select()
      .from(friendships)
      .where(or(eq(friendships.senderId, userId), eq(friendships.receiverId, userId)));

    const accepted = records.filter((r) => r.status === "accepted");
    const pending = records.filter((r) => r.status === "pending");

    const incomingRequests: FriendRequest[] = [];
    const outgoingRequests: FriendRequest[] = [];
    const dbFriends: Friend[] = [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Build real accepted friends
    for (const rec of accepted) {
      const friendUserId = rec.senderId === userId ? rec.receiverId : rec.senderId;
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, friendUserId))
        .limit(1);

      if (profile) {
        const [pet] = await db
          .select()
          .from(pets)
          .where(eq(pets.userId, friendUserId))
          .limit(1);

        // Fetch today's nutrition summary if available
        let caloriesToday = 0;
        let mealsCount = 0;
        let isGoalMet = false;

        try {
          const [summary] = await db
            .select()
            .from(dailyNutritionSummaries)
            .where(
              and(
                eq(dailyNutritionSummaries.userId, friendUserId),
                eq(dailyNutritionSummaries.summaryDate, todayStr)
              )
            )
            .limit(1);

          if (summary) {
            caloriesToday = Number(summary.totalCalories) || 0;
            isGoalMet = summary.isCalorieTargetMet || false;
          }
        } catch {
          // Summary lookup optional
        }

        const calorieTarget = profile.targetCaloriesKcal || 2000;
        const lastActiveText =
          caloriesToday > 0
            ? `Tercatat ${caloriesToday} kkal hari ini`
            : "Belum mencatat makanan hari ini";

        dbFriends.push({
          id: rec.id,
          userId: profile.id,
          username: profile.username,
          fullName: profile.fullName || profile.username,
          avatarUrl: profile.avatarUrl || undefined,
          petName: pet?.name || "Buddy",
          petSpecies: (pet?.species as any) || "bloomie",
          petLevel: pet?.level || 1,
          petStage: pet && (pet.stage === 2 || pet.level >= 5) ? "Juvenile" : "Hatchling",
          goalType: profile.goal || "maintenance",
          caloriesLoggedToday: caloriesToday,
          calorieTarget,
          mealsLoggedToday: mealsCount,
          dailyGoalMet: isGoalMet || (caloriesToday >= calorieTarget * 0.8),
          streakDays: profile.currentStreakDays || 0,
          lastActiveText,
          status: "accepted",
        });
      }
    }

    // Build real pending requests
    for (const req of pending) {
      const isIncoming = req.receiverId === userId;
      const otherId = isIncoming ? req.senderId : req.receiverId;

      const [otherProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, otherId))
        .limit(1);

      const [otherPet] = await db
        .select()
        .from(pets)
        .where(eq(pets.userId, otherId))
        .limit(1);

      const formattedReq: FriendRequest = {
        id: req.id,
        senderId: req.senderId,
        receiverId: req.receiverId,
        status: "pending",
        direction: isIncoming ? "incoming" : "outgoing",
        sender: {
          id: req.senderId,
          username: isIncoming ? (otherProfile?.username || "caloria_user") : "Kamu",
          fullName: isIncoming ? (otherProfile?.fullName || otherProfile?.username || "Pengguna Caloria") : "Kamu",
          avatarUrl: isIncoming ? otherProfile?.avatarUrl : null,
          petName: isIncoming ? otherPet?.name : undefined,
          petSpecies: isIncoming ? (otherPet?.species as any) : undefined,
          petLevel: isIncoming ? otherPet?.level : undefined,
          petStage: isIncoming && otherPet ? (otherPet.stage === 2 || otherPet.level >= 5 ? "Juvenile" : "Hatchling") : undefined,
        },
        receiver: {
          id: req.receiverId,
          username: !isIncoming ? (otherProfile?.username || "caloria_user") : "Kamu",
          fullName: !isIncoming ? (otherProfile?.fullName || otherProfile?.username || "Pengguna Caloria") : "Kamu",
          avatarUrl: !isIncoming ? otherProfile?.avatarUrl : null,
        },
        createdAt: req.createdAt ? new Date(req.createdAt).toLocaleDateString("id-ID") : "Baru saja",
      };

      if (isIncoming) {
        incomingRequests.push(formattedReq);
      } else {
        outgoingRequests.push(formattedReq);
      }
    }

    return NextResponse.json({
      success: true,
      friends: dbFriends,
      pendingRequests: {
        incoming: incomingRequests,
        outgoing: outgoingRequests,
      },
    });
  } catch (error: any) {
    console.error("[API friends GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
