import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { friendships, profiles, pets } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { Friend, FriendRequest } from "@/types";

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // Supabase not authenticated
    }

    // Default mock data for unauthenticated or offline demo
    const fallbackFriends: Friend[] = [
      {
        id: "friendship-afza",
        userId: "user-afza",
        username: "afza_design",
        fullName: "Afza Pratama",
        avatarColor: "bg-indigo-500",
        petName: "Leafy",
        petSpecies: "bloomie",
        petLevel: 5,
        petStage: "Juvenile",
        goalType: "bulking",
        caloriesLoggedToday: 1850,
        calorieTarget: 2400,
        mealsLoggedToday: 3,
        dailyGoalMet: true,
        streakDays: 7,
        lastActiveText: "Baru saja mencatat makan siang",
        lastPokedAt: null,
        status: "accepted",
      },
      {
        id: "friendship-nadia",
        userId: "user-nadia",
        username: "nadia_fit",
        fullName: "Nadia Putri",
        avatarColor: "bg-rose-500",
        petName: "Bubbles",
        petSpecies: "droplet",
        petLevel: 4,
        petStage: "Hatchling",
        goalType: "diet",
        caloriesLoggedToday: 420,
        calorieTarget: 1650,
        mealsLoggedToday: 1,
        dailyGoalMet: false,
        streakDays: 4,
        lastActiveText: "Belum mencatat makan siang & malam",
        lastPokedAt: null,
        status: "accepted",
      },
      {
        id: "friendship-rizky",
        userId: "user-rizky",
        username: "rizky_gym",
        fullName: "Rizky Ramadhan",
        avatarColor: "bg-emerald-500",
        petName: "Blaze",
        petSpecies: "flameling",
        petLevel: 6,
        petStage: "Juvenile",
        goalType: "maintenance",
        caloriesLoggedToday: 0,
        calorieTarget: 2100,
        mealsLoggedToday: 0,
        dailyGoalMet: false,
        streakDays: 12,
        lastActiveText: "Belum mencatat makanan hari ini!",
        lastPokedAt: null,
        status: "accepted",
      },
    ];

    const fallbackPending = {
      incoming: [
        {
          id: "req-incoming-1",
          senderId: "user-budi",
          receiverId: "current-user",
          status: "pending" as const,
          direction: "incoming" as const,
          sender: {
            id: "user-budi",
            username: "budi_health",
            fullName: "Budi Santoso",
            avatarColor: "bg-teal-500",
            petName: "Sprout",
            petSpecies: "bloomie",
            petLevel: 3,
            petStage: "Hatchling",
          },
          createdAt: "2 jam yang lalu",
        },
      ],
      outgoing: [
        {
          id: "req-outgoing-1",
          senderId: "current-user",
          receiverId: "user-maya",
          status: "pending" as const,
          direction: "outgoing" as const,
          sender: {
            id: "current-user",
            username: "iman_dev",
            fullName: "Iman Nur",
          },
          receiver: {
            id: "user-maya",
            username: "mayasalsa",
            fullName: "Maya Salsabila",
          },
          createdAt: "Kemarin",
        },
      ],
    };

    if (!userId || !process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        friends: fallbackFriends,
        pendingRequests: fallbackPending,
      });
    }

    // Query DB for relationships
    try {
      const records = await db
        .select()
        .from(friendships)
        .where(or(eq(friendships.senderId, userId), eq(friendships.receiverId, userId)));

      if (!records || records.length === 0) {
        return NextResponse.json({
          success: true,
          friends: fallbackFriends,
          pendingRequests: fallbackPending,
        });
      }

      const accepted = records.filter((r) => r.status === "accepted");
      const pending = records.filter((r) => r.status === "pending");

      const incomingRequests: FriendRequest[] = [];
      const outgoingRequests: FriendRequest[] = [];
      const dbFriends: Friend[] = [];

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

          dbFriends.push({
            id: rec.id,
            userId: profile.id,
            username: profile.username,
            fullName: profile.fullName || profile.username,
            avatarUrl: profile.avatarUrl,
            petName: pet?.name || "Buddy",
            petSpecies: (pet?.species as any) || "bloomie",
            petLevel: pet?.level || 1,
            petStage: pet && pet.level >= 5 ? "Juvenile" : "Hatchling",
            goalType: profile.goal || "maintenance",
            caloriesLoggedToday: 0,
            calorieTarget: profile.targetCaloriesKcal || 2000,
            mealsLoggedToday: 0,
            dailyGoalMet: false,
            streakDays: profile.currentStreakDays || 0,
            lastActiveText: "Aktif hari ini",
            status: "accepted",
          });
        }
      }

      for (const req of pending) {
        const isIncoming = req.receiverId === userId;
        const otherId = isIncoming ? req.senderId : req.receiverId;
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, otherId))
          .limit(1);

        const [pet] = await db
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
            username: isIncoming ? (profile?.username || "caloria_user") : "Kamu",
            fullName: isIncoming ? (profile?.fullName || "Teman Caloria") : "Kamu",
            avatarUrl: isIncoming ? profile?.avatarUrl : null,
            petName: isIncoming ? pet?.name : undefined,
            petSpecies: isIncoming ? (pet?.species as any) : undefined,
            petLevel: isIncoming ? pet?.level : undefined,
            petStage: isIncoming && pet ? (pet.level >= 5 ? "Juvenile" : "Hatchling") : undefined,
          },
          receiver: {
            id: req.receiverId,
            username: !isIncoming ? (profile?.username || "caloria_user") : "Kamu",
            fullName: !isIncoming ? (profile?.fullName || "Teman Caloria") : "Kamu",
            avatarUrl: !isIncoming ? profile?.avatarUrl : null,
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
        friends: dbFriends.length > 0 ? dbFriends : fallbackFriends,
        pendingRequests: {
          incoming: incomingRequests.length > 0 ? incomingRequests : fallbackPending.incoming,
          outgoing: outgoingRequests.length > 0 ? outgoingRequests : fallbackPending.outgoing,
        },
      });
    } catch (dbErr: any) {
      console.warn("[API friends GET] Falling back to mock data due to DB error:", dbErr?.message);
      return NextResponse.json({
        success: true,
        friends: fallbackFriends,
        pendingRequests: fallbackPending,
      });
    }
  } catch (error: any) {
    console.error("[API friends GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
