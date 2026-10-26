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
import { AccessorySvgPreview } from "@/components/pet/character-svg";
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
    { id: "head", label: "Topi & Kepala" },
    { id: "glasses", label: "Kacamata" },
    { id: "body", label: "Pakaian & Tas" },
    { id: "held", label: "Makanan & Minuman" },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-navigation bg-accent-green/15 text-text-primary">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Pet Shop Kosmetik
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Beli item kustomisasi pet menggunakan Caloria Coins yang diperoleh dari konsistensi misi gizi.
          </p>
        </div>

        {/* Live Coins Balance */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-pill bg-accent-yellow border border-accent-green/30 text-text-primary font-bold text-sm shadow-2xs self-start sm:self-auto">
          <Coins className="h-5 w-5 text-accent-orange" />
          <span suppressHydrationWarning>Saldo: {coins} Caloria Coins</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Wardrobe vs Shop */}
      <div className="flex items-center gap-2 border-b border-border-divider pb-2">
        <Link
          href="/pet-customization/wardrobe"
          className="nav-item px-4 py-2 text-xs font-semibold text-neutral-10"
        >
          Wardrobe (Koleksi Milikmu)
        </Link>
        <Link
          href="/pet-customization/shop"
          aria-current="page"
          className="nav-item is-selected px-4 py-2 text-xs font-bold"
        >
          Pet Shop (Beli dengan Koin)
        </Link>
      </div>

      {/* Purchase Feedback Toast */}
      {purchaseFeedback && (
        <div
          className={cn(
            "p-4 rounded-card border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-300",
            purchaseFeedback.success
              ? "bg-accent-green/15 border-accent-green/35 text-text-primary"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          )}
        >
          <div className="flex items-center gap-2">
            {purchaseFeedback.success ? (
              <Check className="h-4 w-4 text-accent-green" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <p className="font-semibold">{purchaseFeedback.message}</p>
          </div>
          <button
            onClick={() => setPurchaseFeedback(null)}
            className="p-1 rounded-navigation hover:bg-black/10"
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
              "nav-item px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border",
              selectedCategory === cat.id
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default"
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
              className="rounded-card border border-border-divider bg-surface p-5 shadow-xs flex flex-col justify-between space-y-3 relative group hover:border-accent-green transition-colors"
            >
              {isOwned && (
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-pill text-[9px] font-bold bg-accent-green/15 text-text-primary border border-accent-green/30">
                  Dimiliki
                </span>
              )}

              {item.theme && (
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-pill text-[9px] font-bold uppercase bg-surface-subtle border border-border-divider text-text-muted">
                  {item.theme}
                </span>
              )}

              <div className="space-y-2 text-center pt-3">
                <div className="h-16 w-16 mx-auto flex items-center justify-center">
                  <AccessorySvgPreview itemId={item.id} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">{item.name}</h3>
                <p className="text-[11px] text-neutral-10 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-border-divider space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-medium">Harga:</span>
                  <span className="font-extrabold text-accent-orange-dark flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-accent-orange" />
                    {item.priceCoins} Koin
                  </span>
                </div>

                {isOwned ? (
                  <Link
                    href="/pet-customization/wardrobe"
                    className="w-full py-2.5 rounded-button bg-accent-yellow hover:bg-accent-green-light text-text-primary font-bold text-xs text-center block transition-colors"
                  >
                    Buka di Wardrobe
                  </Link>
                ) : (
                  <button
                    onClick={() => setConfirmModalItem(item)}
                    className={cn(
                      "w-full py-2.5 rounded-button font-bold text-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5",
                      canAfford
                        ? "button-primary"
                        : "bg-surface-subtle border border-border-default text-text-muted cursor-not-allowed opacity-75"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-card border border-border-divider bg-surface p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 mx-auto flex items-center justify-center">
              <AccessorySvgPreview itemId={confirmModalItem.id} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase">
                Konfirmasi Pembelian
              </span>
              <h3 className="text-lg font-black text-text-primary font-heading">
                {confirmModalItem.name}
              </h3>
              <p className="text-xs text-neutral-10">
                {confirmModalItem.description}
              </p>
            </div>

            <div className="review-card p-3.5 border border-accent-green/25 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-10">Saldo Koin Saat Ini:</span>
                <span className="font-bold text-text-primary">{coins} Koin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-10">Harga Item:</span>
                <span className="font-bold text-accent-orange-dark">
                  -{confirmModalItem.priceCoins} Koin
                </span>
              </div>
              <div className="flex justify-between border-t border-text-primary/15 pt-1 font-bold text-text-primary">
                <span>Sisa Saldo Setelah Beli:</span>
                <span>{coins - confirmModalItem.priceCoins} Koin</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => setConfirmModalItem(null)}
                className="py-2.5 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-surface-subtle text-neutral-10 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="button-primary py-2.5 text-xs"
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
