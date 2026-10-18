"use client";

import Link from "next/link";
import { Award, Coins, ShoppingBag, Palette, ArrowLeft } from "lucide-react";
import { PetRenderer } from "@/components/pet/pet-renderer";
import { usePetStore } from "@/store/use-pet-store";

export default function PetWardrobeShopPage() {
  const { coins } = usePetStore();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Award className="h-3.5 w-3.5" />
            Assigned Module: Afza
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            Pet Wardrobe & Shop
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ruang ganti pakaian/aksesoris pet dan toko item kustomisasi menggunakan Caloria Coins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <Coins className="h-4 w-4 text-amber-500" />
            <span>{coins} Caloria Coins</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Pet Preview */}
        <div className="lg:col-span-5 rounded-2xl border bg-card p-6 flex flex-col items-center justify-center">
          <PetRenderer interactive={true} size="md" />
        </div>

        {/* Wardrobe & Shop Workspace for Afza */}
        <div className="lg:col-span-7 rounded-2xl border border-dashed border-border bg-muted/30 p-8 flex flex-col justify-center items-center text-center space-y-4">
          <div className="flex items-center gap-3 text-orange-500">
            <ShoppingBag className="h-8 w-8" />
            <Palette className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">
            Placeholder Workspace untuk Afza (`src/app/pet/page.tsx`)
          </h2>
          <p className="text-xs text-muted-foreground max-w-md">
            Area ini disiapkan untuk Katalog Aksesoris (Topi, Kacamata, Baju, Skin Warna, & Dekorasi Ruangan) serta Caloria Plaza Showcase. Saldo koin terhubung ke{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono">usePetStore().coins</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

