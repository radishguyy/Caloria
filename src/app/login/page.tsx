"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight, ShieldCheck, CheckCircle2, UserCheck } from "lucide-react";
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
      <div className="w-full rounded-3xl border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20">
            <Flame className="h-7 w-7 fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Masuk ke Caloria
          </h1>
          <p className="text-xs text-muted-foreground">
            Lanjutkan perjalanan merawat nutrisi dan meningkatkan level Pet kamu.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">
                Kata Sandi
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
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
              className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          {/* Quick Demo State Selector */}
          <div className="p-3 rounded-2xl bg-muted/40 border space-y-2">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-orange-500" />
              Simulasi Cek Status Profil Pengguna:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoStatus("onboarded")}
                className={`p-2 rounded-xl border text-center font-medium transition-colors ${
                  demoStatus === "onboarded"
                    ? "bg-orange-500 text-white border-orange-500 font-bold"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Pengguna Lama &rarr; /dashboard
              </button>
              <button
                type="button"
                onClick={() => setDemoStatus("new_user")}
                className={`p-2 rounded-xl border text-center font-medium transition-colors ${
                  demoStatus === "new_user"
                    ? "bg-orange-500 text-white border-orange-500 font-bold"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Pengguna Baru &rarr; /onboarding
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Aplikasi"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Belum memiliki akun Caloria?{" "}
          <Link
            href="/register"
            className="font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
