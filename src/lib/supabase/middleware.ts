import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-project.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key-caloria",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run heavy queries or complex logic here.
  // getUser() sends a request to Supabase Auth server to securely validate the JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  // The OAuth callback must never be intercepted — it exchanges the auth code
  // and sets session cookies. Let it proceed unconditionally.
  const isCallbackRoute = request.nextUrl.pathname.startsWith("/auth/callback");

  const isProtectedPage =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/diary") ||
    request.nextUrl.pathname.startsWith("/pet") ||
    request.nextUrl.pathname.startsWith("/pet-customization") ||
    request.nextUrl.pathname.startsWith("/social") ||
    request.nextUrl.pathname.startsWith("/onboarding") ||
    request.nextUrl.pathname.startsWith("/profile");

  // Only redirect if real Supabase keys are configured (skip in local dummy mode if no credentials)
  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-project");

  if (isCallbackRoute) {
    return supabaseResponse;
  }

  if (isConfigured) {
    if (!user && isProtectedPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
