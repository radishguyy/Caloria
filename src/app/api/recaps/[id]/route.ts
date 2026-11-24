import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { recaps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { type RecapStoryData } from "@/lib/server/recap-ai";

export async function GET(
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

    const [recap] = await db
      .select()
      .from(recaps)
      .where(eq(recaps.id, id))
      .limit(1);

    if (!recap) {
      return NextResponse.json(
        { success: false, error: "Recap tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      recap,
      storyData: recap.slidesData as RecapStoryData,
    });
  } catch (error) {
    console.error("[RecapGetById] Error fetching recap:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat recap." },
      { status: 500 }
    );
  }
}
