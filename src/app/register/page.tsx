"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      setErrorMsg("Harap lengkapi semua kolom pendaftaran.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      register(email, username, fullName);
      // New user registered -> always directed into smart onboarding flow step 1
      router.push("/onboarding/goal");
    }, 400);
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12 sm:py-16 flex flex-col items-center justify-center">
      <div className="w-full rounded-3xl border border-warm-border bg-card p-6 sm:p-8 shadow-card space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-green to-brand-green-light text-surface-raised shadow-lg shadow-brand-green/25">
            <Flame className="h-7 w-7 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Daftar Akun Caloria
          </h1>
          <p className="text-xs text-ink-muted">
            Mulai petualangan gizi dan adopsi virtual pet pertamamu.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5 text-left">
          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="misal: Afza Pratama"
              required
              className="field mt-1 w-full px-3.5 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Username Unik
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              placeholder="misal: afza_fit"
              required
              className="field mt-1 w-full px-3.5 py-2 text-sm outline-none"
            />
          </div>

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
              className="field mt-1 w-full px-3.5 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              className="field mt-1 w-full px-3.5 py-2 text-sm outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-cta w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <span>{loading ? "Mendaftarkan..." : "Daftar & Mulai Onboarding"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="pt-2 text-center text-xs text-ink-muted">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-bold text-brand-green-dark hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}

