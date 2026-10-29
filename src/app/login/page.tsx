"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { loginAction } from "@/app/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { PeekingCalpal } from "@/components/auth/PeekingCalpal";
import { useRandomLogo } from "@/lib/logos";

export default function LoginPage() {
  const logo = useRandomLogo();
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
      login(res.user.email, res.user.username, res.user.isOnboardingCompleted);
      useAuthStore.setState({
        user: {
          id: res.user.id,
          email: res.user.email,
          username: res.user.username,
          fullName: res.user.fullName,
        },
        onboardingCompleted: res.user.isOnboardingCompleted,
        activeOnboardingStep: res.user.isOnboardingCompleted ? 5 : 1,
      });

      if (!res.user.isOnboardingCompleted) {
        window.location.href = "/onboarding/goal";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12 sm:py-16 flex flex-col items-center justify-center">
      <div className="group relative w-full pt-8">
        <PeekingCalpal characterId="droplet" position="left" expression="idle" title="Droplet mengintip dari kiri" />
        <PeekingCalpal characterId="flameling" position="top-right" expression="happy" title="Flameling mengintip dari atas" />
        <div className="relative z-10 w-full rounded-card border border-border-divider bg-surface p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
            Login akun
          </h1>
          <Link
            href="/"
            className="inline-flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            aria-label="Kembali ke Beranda Caloria"
          >
            <Image
              src={logo}
              alt="Caloria Logo"
              width={150}
              height={40}
              priority
              unoptimized
              className="h-10 w-auto object-contain"
            />
          </Link>

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
    </div>
  );
}
