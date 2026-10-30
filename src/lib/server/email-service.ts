import { Resend } from "resend";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EmailNotificationPayload {
  title: string;
  body: string;
  url?: string;
  actionText?: string;
}

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendInstance) return resendInstance;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resendInstance = new Resend(apiKey);
  return resendInstance;
}

/**
 * Resolves a user's email address by userId from Postgres auth.users or Supabase Admin.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  // 1. Try direct PostgreSQL query if available
  try {
    if (process.env.DATABASE_URL) {
      const rows = await db.execute<{ email?: string }>(
        sql`SELECT email FROM auth.users WHERE id = ${userId}::uuid LIMIT 1`
      );
      if (rows && rows.length > 0 && rows[0].email) {
        return rows[0].email;
      }
    }
  } catch (err) {
    console.warn("[EmailService] Failed to query auth.users via SQL:", err);
  }

  // 2. Fallback to Supabase Admin API
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (!error && data?.user?.email) {
        return data.user.email;
      }
    }
  } catch (err) {
    console.warn("[EmailService] Failed to query auth.users via Supabase Admin:", err);
  }

  return null;
}

/**
 * Renders a friendly, gamified Caloria HTML email template.
 */
export function renderNotificationEmailHtml(options: {
  title: string;
  body: string;
  fullUrl: string;
  actionText: string;
}): string {
  const { title, body, fullUrl, actionText } = options;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7faf8;
      margin: 0;
      padding: 0;
      color: #1f2937;
    }
    .wrapper {
      max-width: 560px;
      margin: 24px auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      padding: 28px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 28px;
    }
    .card {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #14532d;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .card-body {
      font-size: 14px;
      line-height: 1.6;
      color: #166534;
      margin: 0;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 20px 0;
    }
    .cta-btn {
      display: inline-block;
      background-color: #16a34a;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 9999px;
      box-shadow: 0 3px 6px rgba(22, 163, 74, 0.3);
      transition: background-color 0.2s;
    }
    .footer {
      border-top: 1px solid #f3f4f6;
      padding: 20px 28px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
      background-color: #fafafa;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Caloria 🥑🐾</h1>
      <p>Nourish Your Body, Level Up Your Pet</p>
    </div>
    <div class="content">
      <div class="card">
        <h2 class="card-title">${title}</h2>
        <p class="card-body">${body}</p>
      </div>

      <div class="cta-container">
        <a href="${fullUrl}" class="cta-btn" target="_blank">
          ${actionText} &rarr;
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Kamu menerima email ini karena terdaftar sebagai pengguna Caloria.</p>
      <p>Ingin mengatur preferensi notifikasi? Kunjungi <a href="${fullUrl.split("/").slice(0, 3).join("/")}/profile/settings">Pengaturan Akun</a>.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches an email notification via Resend.
 * In development or when RESEND_API_KEY is not configured, logs a clean simulated delivery.
 */
export async function sendEmailNotification(options: {
  to: string;
  subject: string;
  title: string;
  body: string;
  url?: string;
  actionText?: string;
}): Promise<{ success: boolean; id?: string; error?: string; simulated?: boolean }> {
  const { to, subject, title, body, url = "/dashboard", actionText = "Buka Caloria" } = options;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://caloria.app";
  const fullUrl = url.startsWith("http") ? url : `${appUrl}${url.startsWith("/") ? url : `/${url}`}`;
  const html = renderNotificationEmailHtml({ title, body, fullUrl, actionText });

  const resend = getResendClient();

  if (!resend) {
    console.log(
      `[EmailService] (Dev simulated send) To: ${to} | Subject: "${subject}" | Action: ${fullUrl}`
    );
    return { success: true, simulated: true };
  }

  const fromEmail =
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    "Caloria <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.warn("[EmailService] Resend API error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[EmailService] Failed to send email via Resend:", err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}

/**
 * Sends a notification email directly to a specific user by userId.
 */
export async function sendEmailNotificationToUser(
  userId: string,
  payload: EmailNotificationPayload
): Promise<{ success: boolean; email?: string; error?: string; simulated?: boolean }> {
  const email = await getUserEmail(userId);

  if (!email) {
    return { success: false, error: "User email not found" };
  }

  // Derive sensible button CTA action text based on target URL
  let actionText = payload.actionText;
  if (!actionText) {
    if (payload.url?.includes("/diary/add")) {
      actionText = "Catat Menu Sekarang 🍽️";
    } else if (payload.url?.includes("/social")) {
      actionText = "Buka Co-op Squad 🤝";
    } else {
      actionText = "Buka Dashboard Pet 🐾";
    }
  }

  const result = await sendEmailNotification({
    to: email,
    subject: payload.title,
    title: payload.title,
    body: payload.body,
    url: payload.url,
    actionText,
  });

  return { ...result, email };
}

