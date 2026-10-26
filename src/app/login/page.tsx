"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight, UserCheck } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";

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

      if (demoStatus === "new_user" || !onboardingCompleted) {
        const stepRoutes = [
          "/onboarding/goal",
          "/onboarding/profile-calculator",
          "/onboarding/projection",
          "/onboarding/adopt-pet",
        ];
        const targetRoute = stepRoutes[activeOnboardingStep - 1] || "/onboarding/goal";
        router.push(targetRoute);
      } else {
        router.push("/dashboard");
      }
    }, 400);
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

          {/* Quick Demo State Selector */}
          <div className="p-3.5 rounded-button bg-accent-yellow/40 border border-accent-green/25 space-y-2">
            <span className="text-[11px] font-bold text-text-primary flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-accent-green" />
              Simulasi Cek Status Profil Pengguna:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoStatus("onboarded")}
                className={`nav-item p-2 border text-center font-medium transition-colors ${
                  demoStatus === "onboarded"
                    ? "is-selected border-accent-orange font-bold"
                    : "bg-surface text-neutral-10 border-border-default"
                }`}
              >
                Pengguna Lama &rarr; /dashboard
              </button>
              <button
                type="button"
                onClick={() => setDemoStatus("new_user")}
                className={`nav-item p-2 border text-center font-medium transition-colors ${
                  demoStatus === "new_user"
                    ? "is-selected border-accent-orange font-bold"
                    : "bg-surface text-neutral-10 border-border-default"
                }`}
              >
                Pengguna Baru &rarr; /onboarding
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Aplikasi"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

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
