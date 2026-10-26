"use client";

import Link from "next/link";
import {
  Award,
  Coins,
  ShoppingBag,
  Check,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { PetRenderer } from "@/components/pet/pet-renderer";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import {
  COSMETICS_CATALOG,
  CosmeticCategory,
} from "@/lib/cosmetics-catalog";
import { cn } from "@/lib/utils";

export default function PetWardrobePage() {
  const { coins, name } = usePetStore();
  const {
    ownedItemIds,
    equipped,
    selectedCategory,
    setSelectedCategory,
    equipItem,
    unequipItem,
  } = useCosmeticsStore();

  const categories: { id: CosmeticCategory; label: string }[] = [
    { id: "head", label: "Topi & Aksesoris" },
    { id: "glasses", label: "Kacamata" },
    { id: "body", label: "Pakaian & Jubah" },
    { id: "skin", label: "Skin & Aura" },
    { id: "room", label: "Dekorasi Ruangan" },
  ];

  // Owned items in currently selected category
  const categoryOwnedItems = COSMETICS_CATALOG.filter(
    (item) => item.category === selectedCategory && ownedItemIds.includes(item.id)
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-highlight text-brand-green-dark">
              <Award className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Pet Wardrobe (Ruang Ganti)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Ganti outfit, topi, kacamata, skin, dan dekorasi kamar virtual pet kamu.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pet-customization/shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-warm-border bg-highlight text-brown hover:bg-brand-green-light hover:text-brand-green-ink font-bold text-xs transition-colors"
          >
            <Coins className="h-4 w-4 text-brown" />
            <span>{coins} Koin • Buka Pet Shop</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Wardrobe vs Shop */}
      <div className="flex items-center gap-2 border-b border-warm-border pb-1">
        <Link
          href="/pet-customization/wardrobe"
          className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-ink"
        >
          Wardrobe (Koleksi Milikmu)
        </Link>
        <Link
          href="/pet-customization/shop"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
        >
          Pet Shop (Beli dengan Koin)
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Live Pet Preview */}
        <div className="lg:col-span-5 rounded-3xl border border-warm-border bg-card p-6 shadow-card flex flex-col items-center justify-center space-y-4">
          <div className="w-full flex items-center justify-between border-b border-warm-border pb-2 text-xs">
            <span className="font-bold text-ink">Tampilan Langsung {name}</span>
            <span className="text-ink-muted text-[11px]">Kustomisasi Aktif</span>
          </div>

          <PetRenderer interactive={true} size="md" />

          {/* Quick Unequip All in category */}
          <button
            onClick={() => unequipItem(selectedCategory)}
            className="btn-ghost min-h-0 px-3 py-1.5 text-xs transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset {categories.find((c) => c.id === selectedCategory)?.label}</span>
          </button>
        </div>

        {/* Right Column: Owned Items Grid by Category */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border",
                  selectedCategory === cat.id
                    ? "bg-brand-orange text-ink border-brand-orange font-bold shadow-xs"
                    : "bg-card text-ink-muted border-warm-border hover:bg-brand-green-light hover:text-brand-green-ink"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Owned Items Grid */}
          <div className="rounded-3xl border border-warm-border bg-card p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                Pilih Item untuk Dipasang:
              </h3>
              <span className="text-[11px] text-ink-muted">
                {categoryOwnedItems.length} item dimiliki
              </span>
            </div>

            {categoryOwnedItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted space-y-2">
                <ShoppingBag className="h-8 w-8 text-ink-muted/40 mx-auto" />
                <p>Kamu belum memiliki item di kategori ini.</p>
                <Link
                  href="/pet-customization/shop"
                  className="inline-flex items-center gap-1 font-bold text-brand-green-dark hover:underline pt-1"
                >
                  <span>Beli di Pet Shop</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categoryOwnedItems.map((item) => {
                  const isEquipped = equipped[selectedCategory] === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => equipItem(selectedCategory, item.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-2 relative shadow-xs",
                        isEquipped
                          ? "border-brand-orange bg-highlight/60 ring-2 ring-brand-orange/20"
                          : "border-warm-border bg-surface-raised hover:bg-brand-green-light"
                      )}
                    >
                      {isEquipped && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-ink">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}

                      <div className="text-3xl pt-1">{item.previewEmoji}</div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-ink line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-ink-muted line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold mt-auto",
                          isEquipped
                            ? "bg-brand-orange text-ink"
                            : "bg-surface-sunken text-ink-muted"
                        )}
                      >
                        {isEquipped ? "Terpasang" : "Pasang"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shop Callout Banner */}
          <div className="rounded-2xl border border-warm-border bg-surface-sunken/60 p-4 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-ink">Ingin Koleksi Kostum Lainnya?</p>
              <p className="text-ink-muted text-[11px]">
                Gunakan Caloria Coins yang kamu kumpulkan dari konsistensi makan untuk berbelanja.
              </p>
            </div>
            <Link
              href="/pet-customization/shop"
              className="btn-cta min-h-0 ml-3 shrink-0 px-3.5 py-2 text-xs"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Ke Pet Shop</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

