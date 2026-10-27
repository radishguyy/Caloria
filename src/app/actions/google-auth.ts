"use server";

import { createClient } from "@/lib/supabase/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

/**
 * Initiates the Supabase Google OAuth flow.
 *
 * Returns the OAuth URL to redirect the client to. The caller (GoogleButton)
 * should perform a full-document navigation to that URL.
 *
 * The redirect_uri Supabase uses is `${APP_URL}/auth/callback`, which matches
 * the route we created for exchanging the authorization code.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${APP_URL}/auth/callback`,
      // Request refresh token + scopes needed to read Google profile metadata.
      scopes: "email profile",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { error: error.message, url: null };
  }

  if (!data.url) {
    return {
      error: "Gagal memulai alur Google OAuth: URL tidak diterima.",
      url: null,
    };
  }

  return { error: null, url: data.url };
}