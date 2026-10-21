"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 500);
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16 flex flex-col items-center justify-center">
      <div className="w-full rounded-3xl border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20">
            <Flame className="h-7 w-7 fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pemulihan Kata Sandi
          </h1>
          <p className="text-xs text-muted-foreground">
            Masukkan email terdaftar kamu untuk menerima tautan instruksi reset password.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 text-center space-y-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold">Email Terkirim!</h3>
            <p className="text-xs opacity-90">
              Instruksi pemulihan kata sandi telah dikirim ke <strong>{email}</strong>. Periksa folder kotak masuk atau spam kamu.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Halaman Masuk</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Email Akun Caloria
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-transform active:scale-95"
            >
              {loading ? "Mengirim..." : "Kirim Tautan Pemulihan"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Halaman Masuk</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

