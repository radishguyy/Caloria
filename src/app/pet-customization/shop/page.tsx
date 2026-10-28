"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Coins,
  Check,
  AlertCircle,
  X,
  Lock,
  ArrowRight,
} from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import {
  COSMETICS_CATALOG,
  CosmeticItem,
  CosmeticCategory,
} from "@/lib/cosmetics-catalog";
import { AccessorySvgPreview } from "@/components/pet/character-svg";
import { PurchaseModal } from "@/components/pet/purchase-modal";
import { purchaseAccessoryAction } from "@/app/actions/pet-customization";
import { cn } from "@/lib/utils";

export default function PetShopPage() {
  const { coins, setCoins, addCoins } = usePetStore();
  const {
    ownedItemIds,
    selectedCategory,
    setSelectedCategory,
    addOwnedItem,
    buyItem,
  } = useCosmeticsStore();

  const [confirmModalItem, setConfirmModalItem] = useState<CosmeticItem | null>(
    null,
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
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
    (item) => item.category === selectedCategory && !item.isDefaultFree,
  );

  const handleConfirmPurchase = async (itemToBuy: CosmeticItem) => {
    setIsPurchasing(true);

    try {
      // 1. Execute purchase via server action for DB persistence & race-condition safety
      const serverResult = await purchaseAccessoryAction(itemToBuy.id);

      if (serverResult.success) {
        if (serverResult.newCoins !== undefined) {
          setCoins(serverResult.newCoins);
        }
        addOwnedItem(itemToBuy.id);
        setPurchaseFeedback({
          success: true,
          message: serverResult.message,
        });
      } else {
        // Fallback for offline / guest mode if not authenticated
        if (serverResult.message.includes("login")) {
          const clientResult = buyItem(itemToBuy.id, coins, (amount) => {
            addCoins(amount);
          });
          setPurchaseFeedback(clientResult);
        } else {
          setPurchaseFeedback({
            success: false,
            message: serverResult.message,
          });
        }
      }
    } catch (err: any) {
      setPurchaseFeedback({
        success: false,
        message: err?.message || "Gagal memproses pembelian. Coba lagi.",
      });
    } finally {
      setIsPurchasing(false);
      setConfirmModalItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Purchase Feedback Toast (Squircle) */}
      {purchaseFeedback && (
        <div
          role="status"
          className={cn(
            "p-3.5 rounded-navigation border flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200",
            purchaseFeedback.success
              ? "bg-accent-green/15 border-accent-green/35 text-text-primary"
              : "bg-destructive/10 border-destructive/30 text-destructive",
          )}
        >
          <div className="flex items-center gap-2.5">
            {purchaseFeedback.success ? (
              <Check className="h-4 w-4 shrink-0 text-accent-green stroke-[2.5]" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive stroke-[2.5]" />
            )}
            <p className="font-semibold">{purchaseFeedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setPurchaseFeedback(null)}
            aria-label="Tutup notifikasi"
            className="p-1 rounded-navigation hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Category Filter Pills (Squircle) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "nav-item rounded-navigation px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border",
              selectedCategory === cat.id
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle",
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
              className={cn(
                "rounded-card border bg-surface p-5 shadow-xs flex flex-col justify-between space-y-3 relative group transition-colors",
                isOwned
                  ? "border-accent-green/40 hover:border-accent-green"
                  : "border-border-divider hover:border-accent-orange/60",
              )}
            >
              {isOwned ? (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-accent-green/15 text-text-primary border border-accent-green/30 flex items-center gap-1">
                  <Check className="h-3 w-3 stroke-[3]" />
                  <span>Dimiliki</span>
                </span>
              ) : (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-surface-subtle text-neutral-10 border border-border-default flex items-center gap-1">
                  <Lock className="h-3 w-3 text-text-muted" />
                  <span>Terkunci</span>
                </span>
              )}

              {item.theme && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-[8px] text-[9px] font-bold uppercase bg-surface-subtle border border-border-divider text-text-muted">
                  {item.theme}
                </span>
              )}

              <div className="space-y-2 text-center pt-3">
                <div className="h-16 w-16 mx-auto flex items-center justify-center">
                  <AccessorySvgPreview itemId={item.id} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">
                  {item.name}
                </h3>
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
                    className="w-full py-2 rounded-navigation bg-accent-yellow hover:bg-accent-green-light text-text-primary font-bold text-xs text-center flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Dandani Calpal</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmModalItem(item)}
                    className={cn(
                      "w-full py-2 rounded-navigation font-bold text-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 shadow-xs",
                      canAfford
                        ? "bg-accent-green hover:bg-accent-green/90 text-text-inverse"
                        : "bg-surface-subtle border border-border-default text-text-muted hover:bg-surface hover:text-text-primary",
                    )}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{canAfford ? "Beli Aksesoris" : "Lihat & Beli"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared Squircle Purchase Confirmation Modal */}
      <PurchaseModal
        item={confirmModalItem}
        userCoins={coins}
        isOpen={Boolean(confirmModalItem)}
        isPurchasing={isPurchasing}
        onClose={() => setConfirmModalItem(null)}
        onConfirm={handleConfirmPurchase}
      />
    </div>
  );
}
