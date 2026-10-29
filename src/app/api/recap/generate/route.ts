import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  aggregateWeeklyDataFromDb,
  generateWeeklyRecap,
  getWeeklyRecapFromDb,
  persistWeeklyRecap,
  type WeeklyRecapAggregationInput,
} from "@/lib/server/weekly-recap";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const weekNumber = Number(body.weekNumber || 1);
    const forceRefresh = Boolean(body.forceRefresh);
    const clientData: WeeklyRecapAggregationInput | undefined = body.clientData;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. If user is authenticated, check cache in database
    if (user?.id) {
      if (!forceRefresh) {
        const cached = await getWeeklyRecapFromDb(user.id, weekNumber).catch(
          () => null
        );
        if (cached) {
          return NextResponse.json({
            success: true,
            recap: cached,
            fromCache: true,
          });
        }
      }

      // 2. Prepare aggregated data
      let aggregationInput: WeeklyRecapAggregationInput;
      if (clientData && clientData.daysLogged > 0) {
        aggregationInput = {
          ...clientData,
          userId: user.id,
          weekNumber,
        };
      } else {
        aggregationInput = await aggregateWeeklyDataFromDb(user.id, weekNumber);
      }

      // 3. Generate recap with Gemini / fallback
      const recap = await generateWeeklyRecap(aggregationInput);

      // 4. Persist to DB
      await persistWeeklyRecap(user.id, weekNumber, recap).catch((err) =>
        console.warn("[WeeklyRecap] Failed to persist to db:", err)
      );

      return NextResponse.json({
        success: true,
        recap,
        fromCache: false,
      });
    }

    // 3. Guest / local-store mode (e.g. offline or not logged in)
    const fallbackInput: WeeklyRecapAggregationInput = clientData || {
      weekNumber,
      daysLogged: 7,
      averageCalories: 2000,
      targetTee: 2100,
      complianceRate: 85,
      passedLevel: true,
      macroComplianceDistribution: {
        baikPercent: 80,
        lebihPercent: 10,
        defisitPercent: 10,
      },
      petStatus: {
        name: "Calpal",
        level: 1,
        expGained: 250,
      },
    };

    const recap = await generateWeeklyRecap(fallbackInput);

    return NextResponse.json({
      success: true,
      recap,
      isGuest: true,
    });
  } catch (error) {
    console.error("[WeeklyRecap API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memproses AI weekly recap.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekNumber = Number(searchParams.get("weekNumber") || "1");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const recap = await getWeeklyRecapFromDb(user.id, weekNumber);
    if (!recap) {
      return NextResponse.json(
        { success: false, error: "Recap belum ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, recap });
  } catch (error) {
    console.error("[WeeklyRecap GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil recap." },
      { status: 500 }
    );
  }
}

