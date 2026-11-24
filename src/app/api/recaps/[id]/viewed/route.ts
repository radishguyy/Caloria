import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { recaps } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID recap diperlukan." },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(recaps)
      .set({ isViewed: true })
      .where(eq(recaps.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Recap tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      isViewed: true,
      recap: updated,
    });
  } catch (error) {
    console.error("[RecapViewed] Error marking recap as viewed:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui status dilihat." },
      { status: 500 }
    );
  }
}
