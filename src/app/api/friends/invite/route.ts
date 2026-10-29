import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { friendships, profiles } from "@/db/schema";
import { eq, or, and, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    let currentUserId: string | null = null;
    let currentUsername: string | null = null;

    // 1. Try Supabase Auth
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        currentUserId = user.id;
      }
    } catch {
      // Unauthenticated
    }

    // 2. Check x-user-id header
    if (!currentUserId) {
      const headerUserId = request.headers.get("x-user-id");
      if (headerUserId && headerUserId.trim() && headerUserId !== "undefined" && headerUserId !== "null") {
        currentUserId = headerUserId.trim();
      }
    }

    // 3. Fallback to first profile in DB (for local dev)
    if (!currentUserId && process.env.DATABASE_URL && db) {
      try {
        const [firstProfile] = await db.select({ id: profiles.id, username: profiles.username }).from(profiles).limit(1);
        if (firstProfile?.id) {
          currentUserId = firstProfile.id;
          currentUsername = firstProfile.username;
        }
      } catch {
        // DB error
      }
    }

    if (currentUserId && !currentUsername && process.env.DATABASE_URL && db) {
      try {
        const [prof] = await db
          .select({ username: profiles.username })
          .from(profiles)
          .where(eq(profiles.id, currentUserId))
          .limit(1);
        if (prof?.username) currentUsername = prof.username;
      } catch {
        // Ignore
      }
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
      (currentUserId && resolvedTargetId && resolvedTargetId === currentUserId) ||
      (currentUsername &&
        resolvedTargetUsername &&
        resolvedTargetUsername.toLowerCase() === currentUsername.toLowerCase())
    ) {
      return NextResponse.json(
        { success: false, message: "Kamu tidak bisa menambahkan akun sendiri sebagai teman." },
        { status: 400 }
      );
    }

    if (resolvedTargetId?.startsWith("rec-user-")) {
      return NextResponse.json({
        success: true,
        message: "Permintaan pertemanan berhasil dikirim!",
      });
    }

    if (!process.env.DATABASE_URL || !db || !currentUserId) {
      return NextResponse.json(
        { success: false, message: "Database tidak terhubung atau pengguna belum terotentikasi." },
        { status: 400 }
      );
    }

    // Look up target profile by username if targetUserId wasn't supplied directly
    if (!resolvedTargetId && resolvedTargetUsername) {
      const [targetProfile] = await db
        .select()
        .from(profiles)
        .where(sql`LOWER(${profiles.username}) = LOWER(${resolvedTargetUsername})`)
        .limit(1);

      if (!targetProfile) {
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

    if (resolvedTargetId === currentUserId) {
      return NextResponse.json(
        { success: false, message: "Kamu tidak bisa menambahkan akun sendiri sebagai teman." },
        { status: 400 }
      );
    }

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
      if (existing.status === "declined") {
        // Allow re-inviting if previously declined: update to pending
        const [updated] = await db
          .update(friendships)
          .set({
            senderId: currentUserId,
            receiverId: resolvedTargetId,
            status: "pending",
            updatedAt: new Date(),
          })
          .where(eq(friendships.id, existing.id))
          .returning();

        return NextResponse.json({
          success: true,
          message: "Permintaan pertemanan berhasil dikirim ulang!",
          friendship: updated,
        });
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
  } catch (err: any) {
    console.error("[API invite POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}
