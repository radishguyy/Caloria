"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Coins,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import {
  COSMETICS_CATALOG,
  CosmeticItem,
  CosmeticCategory,
} from "@/lib/cosmetics-catalog";
import { cn } from "@/lib/utils";

export default function PetShopPage() {
  const { coins, addCoins } = usePetStore();
  const {
    ownedItemIds,
    selectedCategory,
    setSelectedCategory,
    buyItem,
  } = useCosmeticsStore();

  const [confirmModalItem, setConfirmModalItem] = useState<CosmeticItem | null>(null);
  const [purchaseFeedback, setPurchaseFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const categories: { id: CosmeticCategory; label: string }[] = [
    { id: "head", label: "Topi & Aksesoris" },
    { id: "glasses", label: "Kacamata" },
    { id: "body", label: "Pakaian & Jubah" },
    { id: "skin", label: "Skin & Aura" },
    { id: "room", label: "Dekorasi Ruangan" },
  ];

  const categoryItems = COSMETICS_CATALOG.filter(
    (item) => item.category === selectedCategory && !item.isDefaultFree
  );

  const handleConfirmPurchase = () => {
    if (!confirmModalItem) return;

    const result = buyItem(confirmModalItem.id, coins, (amount) => {
      addCoins(amount);
    });

    setPurchaseFeedback(result);
    setConfirmModalItem(null);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-highlight text-brown">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Pet Shop Kosmetik
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Beli item kustomisasi pet menggunakan Caloria Coins yang diperoleh dari konsistensi misi gizi.
          </p>
        </div>

        {/* Live Coins Balance */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-warm-border bg-highlight text-ink font-bold text-sm shadow-xs self-start sm:self-auto">
          <Coins className="h-5 w-5 text-brown animate-spin-slow" />
          <span>Saldo: {coins} Caloria Coins</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Wardrobe vs Shop */}
      <div className="flex items-center gap-2 border-b border-warm-border pb-1">
        <Link
          href="/pet-customization/wardrobe"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
        >
          Wardrobe (Koleksi Milikmu)
        </Link>
        <Link
          href="/pet-customization/shop"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-orange text-ink"
        >
          Pet Shop (Beli dengan Koin)
        </Link>
      </div>

      {/* Purchase Feedback Toast */}
      {purchaseFeedback && (
        <div
          className={cn(
            "p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-300",
            purchaseFeedback.success
              ? "bg-brand-green/10 border-brand-green/30 text-ink"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          )}
        >
          <div className="flex items-center gap-2">
            {purchaseFeedback.success ? (
              <Check className="h-4 w-4 text-brand-green-dark" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <p className="font-semibold">{purchaseFeedback.message}</p>
          </div>
          <button
            onClick={() => setPurchaseFeedback(null)}
            className="p-1 rounded-lg hover:bg-brand-green-light hover:text-brand-green-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
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

      {/* Shop Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categoryItems.map((item) => {
          const isOwned = ownedItemIds.includes(item.id);
          const canAfford = coins >= item.priceCoins;

          return (
            <div
              key={item.id}
              className="rounded-3xl border border-warm-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3 relative group hover:border-brand-green-light transition-colors"
            >
              {isOwned && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-green-light text-brand-green-ink">
                  Dimiliki
                </span>
              )}

              <div className="space-y-2 text-center pt-2">
                <div className="text-4xl mx-auto">{item.previewEmoji}</div>
                <h3 className="text-sm font-bold text-ink">{item.name}</h3>
                <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-warm-border/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted font-medium">Harga:</span>
                  <span className="font-extrabold text-brown flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" />
                    {item.priceCoins} Koin
                  </span>
                </div>

                {isOwned ? (
                  <Link
                    href="/pet-customization/wardrobe"
                    className="btn-ghost w-full py-2 text-xs text-center block font-bold"
                  >
                    Buka di Wardrobe
                  </Link>
                ) : (
                  <button
                    onClick={() => setConfirmModalItem(item)}
                    className={cn(
                      "btn-cta min-h-0 w-full py-2 text-xs shadow-[0_4px_0_var(--brand-green-dark)] active:translate-y-1 transition-transform active:scale-95 flex items-center justify-center gap-1.5",
                      canAfford
                        ? "bg-brand-green-light hover:bg-brand-green text-brand-green-ink hover:text-surface-raised shadow-xs"
                        : "bg-surface-sunken text-ink-muted cursor-not-allowed opacity-75"
                    )}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{canAfford ? "Beli Item" : "Koin Belum Cukup"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* [Modal] Konfirmasi Pembelian Item Kosmetik */}
      {confirmModalItem && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-warm-border bg-card p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-4xl">{confirmModalItem.previewEmoji}</div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-ink-muted uppercase">
                Konfirmasi Pembelian
              </span>
              <h3 className="text-lg font-black text-ink">
                {confirmModalItem.name}
              </h3>
              <p className="text-xs text-ink-muted">
                {confirmModalItem.description}
              </p>
            </div>

            <div className="rounded-2xl border border-warm-border bg-surface-sunken/60 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-ink-muted">Saldo Koin Saat Ini:</span>
                <span className="font-bold text-ink">{coins} Koin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Harga Item:</span>
                <span className="font-bold text-brown">
                  -{confirmModalItem.priceCoins} Koin
                </span>
              </div>
              <div className="flex justify-between border-t border-warm-border/60 pt-1 font-bold">
                <span>Sisa Saldo Setelah Beli:</span>
                <span className="text-brand-green-dark">
                  {coins - confirmModalItem.priceCoins} Koin
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setConfirmModalItem(null)}
                className="btn-ghost min-h-0 py-2.5 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="btn-cta min-h-0 py-2.5 text-xs"
              >
                Konfirmasi Beli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

