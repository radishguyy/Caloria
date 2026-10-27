import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/profile";

/**
 * Allowed post-auth redirect destinations (same-origin application paths only).
 * Anything else falls back to "/dashboard".
 */
const ALLOWED_REDIRECTS = new Set<string>([
  "/dashboard",
  "/onboarding",
  "/onboarding/goal",
]);

function resolveRedirect(next: string | null): string {
  if (!next) return "/dashboard";
  // Reject anything that is not a same-origin relative path.
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  // Allow only paths we explicitly trust.
  if (ALLOWED_REDIRECTS.has(next) || next.startsWith("/onboarding/")) {
    return next;
  }
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const errorUri = requestUrl.searchParams.get("error_uri");

  // Diagnostic: surface the raw callback query so the real failure reason is
  // visible in the logs instead of a generic "code not received" message.
  console.log("[auth/callback] incoming", {
    pathname: requestUrl.pathname,
    hasCode: !!code,
    codeLen: code?.length,
    error,
    errorDescription,
    errorUri,
    next,
    cookieNames: request.cookies.getAll().map((c) => c.name),
  });

  // Surface OAuth-level errors to the login page with the real reason.
  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", errorDescription || error || "Autentikasi Google gagal.");
    if (errorUri) loginUrl.searchParams.set("error_uri", errorUri);
    console.warn("[auth/callback] OAuth error, redirecting to /login", { error, errorDescription });
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set(
      "error",
      "Kode otorisasi tidak diterima. Silakan coba lagi."
    );
    console.warn("[auth/callback] no code param; redirecting to /login");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  // Exchange the authorization code for a Supabase session (PKCE flow).
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  console.log("[auth/callback] exchangeCodeForSession result", {
    hasUser: !!data?.user,
    userId: data?.user?.id,
    exchangeError: exchangeError
      ? { message: exchangeError.message, status: exchangeError.status, name: exchangeError.name }
      : null,
  });

  if (exchangeError || !data.user) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set(
      "error",
      exchangeError?.message || "Sesi tidak dapat dibuat. Silakan coba lagi.",
    );
    console.warn("[auth/callback] exchange failed; redirecting to /login", exchangeError?.message);
    return NextResponse.redirect(loginUrl);
  }

  const user = data.user;

  // Ensure a profile exists (idempotent). On failure we still redirect the
  // authenticated user to the dashboard rather than stranding them, but we
  // never treat a profile-creation failure as silent success.
  let onboardingCompleted = false;
  try {
    const { profile } = await ensureProfileForUser({
      userId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    });
    onboardingCompleted = profile.isOnboardingCompleted;
  } catch (profileErr) {
    // Log server-side only; do not leak details to the client.
    console.error("[auth/callback] profile ensure failed", profileErr);
    // Still redirect authenticated user; onboarding will surface missing fields.
  }

  const target = onboardingCompleted
    ? resolveRedirect(next)
    : "/onboarding/goal";

  console.log("[auth/callback] success, redirecting to", target, {
    onboardingCompleted,
    next,
  });

  const response = NextResponse.redirect(new URL(target, requestUrl.origin));
  return response;
}
