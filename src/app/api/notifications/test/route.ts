import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationToUser } from "@/lib/server/push-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId: string = body.targetUserId || user.id;
    const isPoke = body.type === "poke";

    const senderName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      "Temanmu";

    const payload = isPoke
      ? {
          title: `Senggolan dari ${senderName}! 👉🔥`,
          body: `${senderName} menyenggolmu untuk segera mencatat makanan hari ini supaya streak Co-op kalian tetap aman!`,
          url: "/diary/add",
          tag: `poke-${user.id}-${Date.now()}`,
          actionText: "Catat Makanan Sekarang 🍽️",
        }
      : {
          title: "Tes Notifikasi Caloria Berhasil! 🥑🐾",
          body: "Web Push & sistem pengingat makan Caloria kamu sudah aktif. Jangan lupa catat makanmu hari ini ya!",
          url: "/dashboard",
          tag: `caloria-test-${Date.now()}`,
          actionText: "Buka Dashboard Caloria 🐾",
        };

    const result = await sendNotificationToUser(targetUserId, payload, {
      sendPush: body.sendPush !== false,
      sendEmail: body.sendEmail !== false,
    });

    return NextResponse.json({
      ...result,
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
      hasVapidKeys: Boolean(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
      ),
    });
  } catch (err: any) {
    console.error("[Test Notification API Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Gagal mengirim notifikasi uji coba.",
      },
      { status: 500 }
    );
  }
}
