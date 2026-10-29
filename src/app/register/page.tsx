"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { registerAction } from "@/app/actions/auth";
import { PeekingCalpal } from "@/components/auth/PeekingCalpal";
import { useRandomLogo } from "@/lib/logos";

export default function RegisterPage() {
  const logo = useRandomLogo();
  const router = useRouter();
  const { register } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
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

    try {
      const res = await registerAction({
        email,
        password,
        fullName,
        username,
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || "Gagal membuat akun.");
        setLoading(false);
        return;
      }

      // Sync Zustand local auth state with Supabase user
      register(res.user.email, res.user.username, res.user.fullName);
      useAuthStore.setState({
        user: {
          id: res.user.id,
          email: res.user.email,
          username: res.user.username,
          fullName: res.user.fullName,
        },
        onboardingCompleted: false,
      });

      router.push("/onboarding/goal");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12 sm:py-16 flex flex-col items-center justify-center">
      <div className="group relative w-full pt-8">
        <PeekingCalpal characterId="sunny" position="right" expression="happy" title="Sunny mengintip dari kanan" />
        <PeekingCalpal characterId="bloomie" position="top-left" expression="idle" title="Bloomie mengintip dari atas" />
        <div className="relative z-10 w-full rounded-card border border-border-divider bg-surface p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
            Daftar Akun
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

          <p className="text-xs text-text-muted">
            Mulai petualangan gizi dan adopsi virtual pet pertamamu!
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-input bg-destructive/10 text-destructive border border-destructive/20 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5 text-left">
          <div>
            <label className="text-xs font-semibold text-text-muted">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="misal: Afza Pratama"
              required
              className="input-field mt-1 w-full px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted">
              Username Unik
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              placeholder="misal: afza_fit"
              required
              className="input-field mt-1 w-full px-3.5 py-2 text-sm"
            />
          </div>

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
            <label className="text-xs font-semibold text-text-muted">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              className="input-field mt-1 w-full px-3.5 py-2 text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="button-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mendaftarkan akun...</span>
                </>
              ) : (
                <>
                  <span>Daftar & Mulai Onboarding</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 text-center text-xs text-text-muted">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-bold text-text-primary hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
