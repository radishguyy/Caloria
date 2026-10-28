"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { loginAction } from "@/app/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Harap masukkan email dan password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await loginAction({ email, password });
      if (!res.success || !res.user) {
        setErrorMsg(res.error || "Gagal masuk.");
        setLoading(false);
        return;
      }

      // Sync Zustand local auth state with Supabase profile
      login(res.user.email, res.user.username);
      useAuthStore.setState({
        user: {
          id: res.user.id,
          email: res.user.email,
          username: res.user.username,
          fullName: res.user.fullName,
        },
        onboardingCompleted: res.user.isOnboardingCompleted,
      });

      if (!res.user.isOnboardingCompleted) {
        router.push("/onboarding/goal");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12 sm:py-16 flex flex-col items-center justify-center">
      <div className="w-full rounded-card border border-border-divider bg-surface p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-button bg-accent-green text-text-inverse shadow-xs">
            <Flame className="h-7 w-7 fill-text-inverse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
            Masuk ke Caloria
          </h1>
          <p className="text-xs text-text-muted">
            Lanjutkan perjalanan merawat nutrisi dan meningkatkan level Pet kamu.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-input bg-destructive/10 text-destructive border border-destructive/20 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-semibold text-text-muted">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="input-field mt-1 w-full px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-muted">
                Kata Sandi
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-bold text-text-primary hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-field mt-1 w-full px-3.5 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memverifikasi akun...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-border-divider" />
          <span className="text-[11px] font-semibold text-text-muted">atau</span>
          <div className="h-px flex-1 bg-border-divider" />
        </div>

        <GoogleButton mode="login" />

        <div className="pt-2 text-center text-xs text-text-muted">
          Belum memiliki akun Caloria?{" "}
          <Link
            href="/register"
            className="font-bold text-text-primary hover:underline"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
