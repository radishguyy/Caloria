import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { friendships } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { requestId, action } = body;

    if (!requestId || !action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter requestId dan action ('accept' | 'decline') harus valid.",
        },
        { status: 400 }
      );
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    if (!process.env.DATABASE_URL || !db) {
      return NextResponse.json(
        { success: false, message: "Database tidak terhubung." },
        { status: 500 }
      );
    }

    const [updated] = await db
      .update(friendships)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(friendships.id, requestId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pertemanan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message:
        action === "accept"
          ? "Permintaan pertemanan berhasil diterima!"
          : "Permintaan pertemanan ditolak.",
      friendship: updated,
    });
  } catch (err: any) {
    console.error("[API respond PATCH] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}
