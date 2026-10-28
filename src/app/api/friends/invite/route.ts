import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { friendships, profiles } from "@/db/schema";
import { eq, or, and, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    let currentUserId: string | null = null;
    let currentUsername = "iman_dev";

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        currentUserId = user.id;
        const [prof] = await db
          .select({ username: profiles.username })
          .from(profiles)
          .where(eq(profiles.id, user.id))
          .limit(1);
        if (prof?.username) currentUsername = prof.username;
      }
    } catch {
      // Offline / demo fallback
    }

    const body = await request.json().catch(() => ({}));
    const { targetUserId, username } = body;

    let resolvedTargetId = targetUserId;
    let resolvedTargetUsername = username;

    if (!resolvedTargetId && !resolvedTargetUsername) {
      return NextResponse.json(
        { success: false, message: "Username atau target user ID harus disertakan." },
        { status: 400 }
      );
    }

    // Clean username if provided
    if (resolvedTargetUsername) {
      resolvedTargetUsername = resolvedTargetUsername.trim().replace(/^@/, "");
    }

    // Check self-friending
    if (
      (currentUserId && resolvedTargetId === currentUserId) ||
      (resolvedTargetUsername &&
        resolvedTargetUsername.toLowerCase() === currentUsername.toLowerCase())
    ) {
      return NextResponse.json(
        { success: false, message: "Kamu tidak bisa menambahkan akun sendiri sebagai teman." },
        { status: 400 }
      );
    }

    // If DB is available, perform database lookups and insert
    if (process.env.DATABASE_URL && db) {
      try {
        if (!resolvedTargetId && resolvedTargetUsername) {
          const [targetProfile] = await db
            .select()
            .from(profiles)
            .where(sql`LOWER(${profiles.username}) = LOWER(${resolvedTargetUsername})`)
            .limit(1);

          if (!targetProfile) {
            // Target user not found in DB, return friendly response
            return NextResponse.json(
              {
                success: false,
                message: `Pengguna dengan username @${resolvedTargetUsername} tidak ditemukan.`,
              },
              { status: 404 }
            );
          }
          resolvedTargetId = targetProfile.id;
        }

        if (currentUserId && resolvedTargetId) {
          // Check existing friendship
          const [existing] = await db
            .select()
            .from(friendships)
            .where(
              or(
                and(
                  eq(friendships.senderId, currentUserId),
                  eq(friendships.receiverId, resolvedTargetId)
                ),
                and(
                  eq(friendships.senderId, resolvedTargetId),
                  eq(friendships.receiverId, currentUserId)
                )
              )
            )
            .limit(1);

          if (existing) {
            if (existing.status === "accepted") {
              return NextResponse.json(
                { success: false, message: "Kalian sudah berteman!" },
                { status: 409 }
              );
            }
            if (existing.status === "pending") {
              return NextResponse.json(
                { success: false, message: "Permintaan pertemanan sudah dikirim sebelumnya." },
                { status: 409 }
              );
            }
          }

          // Insert new pending friendship
          const [created] = await db
            .insert(friendships)
            .values({
              senderId: currentUserId,
              receiverId: resolvedTargetId,
              status: "pending",
            })
            .returning();

          return NextResponse.json({
            success: true,
            message: "Permintaan pertemanan berhasil dikirim!",
            friendship: created,
          });
        }
      } catch (dbErr: any) {
        console.warn("[API invite POST] DB execution warning:", dbErr?.message);
      }
    }

    // Success response for demo/mock mode
    return NextResponse.json({
      success: true,
      message: `Undangan berhasil dikirim ke ${resolvedTargetUsername ? "@" + resolvedTargetUsername : "teman"}!`,
      friendship: {
        id: `mock-friendship-${Date.now()}`,
        senderId: currentUserId || "current-user",
        receiverId: resolvedTargetId || `user-${resolvedTargetUsername || "demo"}`,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[API invite POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}

