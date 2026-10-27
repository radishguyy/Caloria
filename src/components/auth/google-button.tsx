"use client";

import { useState } from "react";
import Image from "next/image";
import { signInWithGoogle } from "@/app/actions/google-auth";
import { cn } from "@/lib/utils";

interface GoogleButtonProps {
  mode?: "login" | "register";
  className?: string;
  /** Optional label override (defaults to Indonesian copy). */
  label?: string;
}

/**
 * Google OAuth button.
 *
 * - Uses the official Google branding SVG from `public/icons/google-logo.svg`.
 * - Calls the server action `signInWithGoogle`, which returns a redirect URL.
 * - Performs a full-document navigation to that URL (Supabase OAuth flow).
 * - Shows a loading state and prevents double-submission.
 * - Surfaces Indonesian error messages.
 */
export function GoogleButton({
  mode = "login",
  className,
  label = "Lanjutkan dengan Google",
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) {
        // Full navigation so the OAuth provider's cookies / code flow completes.
        window.location.assign(result.url);
        return;
      }
      setError("Gagal memulai alur Google OAuth: URL tidak diterima.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan tak terduga saat masuk dengan Google."
      );
    } finally {
      // Keep loading until navigation actually happens.
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className={cn(
          "btn-secondary w-full inline-flex items-center justify-center gap-2.5 text-sm font-semibold",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {loading ? (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            <svg
              className="h-4 w-4 animate-spin text-ink"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </span>
        ) : (
          <Image
            src="/icons/google-logo.svg"
            alt=""
            role="presentation"
            width={18}
            height={18}
            priority={false}
            className="h-4 w-4"
            draggable={false}
          />
        )}
        <span>
          {loading
            ? mode === "login"
              ? "Mengalihkan..."
              : "Mendaftarkan..."
            : label}
        </span>
      </button>
      {error && (
        <p
          role="alert"
          className="text-[11px] font-medium text-destructive text-center"
        >
          {error}
        </p>
      )}
    </div>
  );
}