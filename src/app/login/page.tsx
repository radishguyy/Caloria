"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight, UserCheck } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const router = useRouter();
  const { login, onboardingCompleted, activeOnboardingStep } = useAuthStore();

  const [email, setEmail] = useState("iman@caloria.app");
  const [password, setPassword] = useState("password123");
  const [demoStatus, setDemoStatus] = useState<"onboarded" | "new_user">("onboarded");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Harap masukkan email dan password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      login(email);

      // Check onboarding status
      if (demoStatus === "new_user" || !onboardingCompleted) {
        // Redirect to incomplete onboarding step
        const stepRoutes = [
          "/onboarding/goal",
          "/onboarding/profile-calculator",
          "/onboarding/projection",
          "/onboarding/adopt-pet",
        ];
        const targetRoute = stepRoutes[activeOnboardingStep - 1] || "/onboarding/goal";
        router.push(targetRoute);
      } else {
        // Onboarding already complete -> redirect directly to dashboard
        router.push("/dashboard");
      }
    }, 400);
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12 sm:py-16 flex flex-col items-center justify-center">
      <div className="w-full rounded-3xl   bg-card p-6 sm:p-8  space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green text-surface-raised  ">
            <Flame className="h-7 w-7 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Masuk ke Caloria
          </h1>
          <p className="text-xs text-ink-muted">
            Lanjutkan perjalanan merawat nutrisi dan meningkatkan level Pet kamu.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive   text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="field mt-1 w-full px-3.5 py-2 text-sm "
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-muted">
                Kata Sandi
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-brand-green-dark hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              required
              className="field mt-1 w-full px-3.5 py-2 text-sm "
            />
          </div>

          {/* Quick Demo State Selector */}
          <div className="rounded-2xl   bg-surface p-3 space-y-2">
            <span className="text-[11px] font-bold text-ink flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-brand-green" />
              Simulasi Cek Status Profil Pengguna:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoStatus("onboarded")}
                className={`p-2 rounded-lg text-center font-medium transition-colors ${
                  demoStatus === "onboarded"
                    ? "bg-brand-orange text-ink  font-bold"
                    : " bg-surface text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
                }`}
              >
                Pengguna Lama &rarr; /dashboard
              </button>
              <button
                type="button"
                onClick={() => setDemoStatus("new_user")}
                className={`p-2 rounded-lg text-center font-medium transition-colors ${
                  demoStatus === "new_user"
                    ? "bg-brand-orange text-ink  font-bold"
                    : " bg-surface text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
                }`}
              >
                Pengguna Baru &rarr; /onboarding
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-cta w-full text-sm flex items-center justify-center gap-2"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Aplikasi"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-warm-border" />
          <span className="text-[11px] font-semibold text-ink-muted">atau</span>
          <div className="h-px flex-1 bg-warm-border" />
        </div>

        <GoogleButton mode="login" />

        <div className="pt-2 text-center text-xs text-ink-muted">
          Belum memiliki akun Caloria?{" "}
          <Link
            href="/register"
            className="font-bold text-brand-green-dark hover:underline"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
