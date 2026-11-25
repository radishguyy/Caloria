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
      <div className="w-full rounded-card border border-border-divider bg-surface p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-button bg-accent-green text-text-inverse shadow-xs">
            <Flame className="h-7 w-7 fill-text-inverse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
            Pemulihan Kata Sandi
          </h1>
          <p className="text-xs text-text-muted">
            Masukkan email terdaftar kamu untuk menerima tautan instruksi reset password.
          </p>
        </div>

        {submitted ? (
          <div className="review-card p-5 border border-accent-green/30 text-text-primary text-center space-y-2">
            <CheckCircle2 className="h-6 w-6 text-accent-green mx-auto" />
            <h3 className="text-sm font-bold">Email Terkirim!</h3>
            <p className="text-xs text-neutral-10">
              Instruksi pemulihan kata sandi telah dikirim ke <strong>{email}</strong>. Periksa folder kotak masuk atau spam kamu.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Halaman Masuk</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-muted">
                Email Akun Caloria
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="input-field w-full pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button-primary w-full py-3.5 text-sm"
            >
              {loading ? "Mengirim..." : "Kirim Tautan Pemulihan"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
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
