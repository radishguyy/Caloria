"use client";

import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-16 flex flex-col items-center justify-center">
      <div className="w-full rounded-2xl border bg-card p-6 sm:p-8 shadow-xs space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20">
          <Flame className="h-7 w-7 fill-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Masuk ke Caloria</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Nourish Your Body, Level Up Your Pet, Achieve Together.
          </p>
        </div>

        <div className="space-y-3 text-left">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              defaultValue="iman@caloria.app"
              className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              defaultValue="••••••••"
              className="mt-1 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
        </div>

        <Link
          href="/"
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 text-sm font-semibold transition-colors"
        >
          <span>Lanjut ke Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

