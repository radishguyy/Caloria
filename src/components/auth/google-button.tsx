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
          : "Terjadi kesalahan tak terduga saat masuk dengan Google.",
      );
    } finally {
      // Keep loading until navigation actually happens.
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className={cn(
          "w-full min-h-[52px] inline-flex items-center justify-center gap-3 rounded-xl border border-border-default bg-surface px-5 py-3 text-base sm:text-lg font-bold text-neutral-10 transition-colors hover:bg-surface-subtle cursor-pointer",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {loading ? (
          <span className="inline-flex h-5 w-5 items-center justify-center">
            <svg
              className="h-5 w-5 animate-spin text-neutral-10"
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
            width={20}
            height={20}
            priority
            unoptimized
            className="h-5 w-5 shrink-0"
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
          className="text-sm sm:text-base font-medium text-destructive text-center"
        >
          {error}
        </p>
      )}
    </div>
  );
}
