"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { loginAction } from "@/app/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { PeekingCalpal } from "@/components/auth/PeekingCalpal";
import { useRandomLogo } from "@/lib/logos";

export default function LoginPage() {
  const logo = useRandomLogo();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Harap masukkan email dan kata sandi.");
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
      login(res.user.email, res.user.username, true);
      useAuthStore.setState({
        user: {
          id: res.user.id,
          email: res.user.email,
          username: res.user.username,
          fullName: res.user.fullName,
        },
        onboardingCompleted: true,
        activeOnboardingStep: 5,
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="container mx-auto max-w-[460px] px-4 py-10 sm:py-16 flex flex-col items-center justify-center">
        <div className="group relative w-full pt-8">
          <PeekingCalpal
            characterId="droplet"
            position="left"
            expression="idle"
            title="Droplet mengintip dari kiri"
          />
          <PeekingCalpal
            characterId="flameling"
            position="top-right"
            expression="happy"
            title="Flameling mengintip dari atas"
          />
          <div className="relative z-10 w-full rounded-2xl border border-border-divider bg-surface p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green"
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
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-text-primary">
                Masuk Akun
              </h1>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/25 text-base font-medium"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 text-left">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-base font-bold text-neutral-10"
                >
                  Alamat Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="input-field mt-1.5 w-full min-h-[48px] px-4 py-3 text-base"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="login-password"
                    className="text-base font-bold text-neutral-10"
                  >
                    Kata Sandi
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm sm:text-base font-bold text-text-primary hover:underline underline-offset-4 py-1"
                  >
                    Lupa Kata Sandi?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    required
                    className="input-field w-full min-h-[48px] pl-4 pr-12 py-3 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-neutral-10 hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] rounded-xl bg-accent-green hover:bg-accent-green/90 px-5 py-3 text-base sm:text-lg font-bold text-text-inverse flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border-divider" />
              <span className="text-sm sm:text-base font-semibold text-neutral-10">
                atau
              </span>
              <div className="h-px flex-1 bg-border-divider" />
            </div>

            <GoogleButton mode="login" />

            <div className="pt-1 text-center text-base text-neutral-10">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-bold text-text-primary hover:underline underline-offset-4"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
