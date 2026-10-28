"use client";

import React, { useEffect, useCallback } from "react";
import { Coins, X, AlertCircle, ShoppingBag, Loader2 } from "lucide-react";
import { CosmeticItem } from "@/lib/cosmetics-catalog";
import { AccessorySvgPreview } from "@/components/pet/character-svg";
import { cn } from "@/lib/utils";

export interface PurchaseModalProps {
  item: CosmeticItem | null;
  userCoins: number;
  isOpen: boolean;
  isPurchasing?: boolean;
  onClose: () => void;
  onConfirm: (item: CosmeticItem) => Promise<void> | void;
}

export function PurchaseModal({
  item,
  userCoins,
  isOpen,
  isPurchasing = false,
  onClose,
  onConfirm,
}: PurchaseModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPurchasing) {
        onClose();
      }
    },
    [onClose, isPurchasing],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !item) return null;

  const canAfford = userCoins >= item.priceCoins;
  const remainingCoins = userCoins - item.priceCoins;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPurchasing) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-card border border-border-divider bg-surface p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPurchasing}
          aria-label="Tutup modal konfirmasi"
          className="absolute top-4 right-4 p-1.5 rounded-navigation text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Item Preview (Squircle) */}
        <div className="h-20 w-20 mx-auto flex items-center justify-center rounded-navigation bg-surface-subtle border border-border-divider shadow-inner">
          <AccessorySvgPreview itemId={item.id} />
        </div>

        {/* Item Info */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Konfirmasi Pembelian
          </span>
          <h3
            id="purchase-modal-title"
            className="text-lg font-black text-text-primary font-heading"
          >
            {item.name}
          </h3>
          <p className="text-xs text-neutral-10 leading-relaxed px-2">
            {item.description}
          </p>
        </div>

        {/* Balance Breakdown Card (Squircle) */}
        <div className="rounded-navigation border border-border-default bg-surface-subtle p-3.5 text-xs space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-neutral-10">Saldo Koin Kamu:</span>
            <span className="font-bold text-text-primary flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-accent-orange" />
              {userCoins} Koin
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-10">Harga Aksesoris:</span>
            <span className="font-bold text-accent-orange-dark flex items-center gap-1">
              -{item.priceCoins} Koin
            </span>
          </div>

          <div className="border-t border-border-divider pt-2 flex items-center justify-between font-bold">
            <span className="text-neutral-10">Sisa Saldo:</span>
            <span
              className={cn(
                canAfford ? "text-text-primary" : "text-destructive",
              )}
            >
              {canAfford ? `${remainingCoins} Koin` : "Tidak Cukup"}
            </span>
          </div>
        </div>

        {/* Insufficient Balance Notice */}
        {!canAfford && (
          <div className="rounded-navigation bg-destructive/10 border border-destructive/25 p-3 flex items-start gap-2.5 text-left text-xs text-destructive animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <div className="leading-snug">
              <p className="font-bold">Koin Tidak Mencukupi</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Kamu membutuhkan {item.priceCoins - userCoins} Koin lagi untuk
                membeli aksesoris ini.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons (Squircle) */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPurchasing}
            className="py-2.5 rounded-button border border-border-default bg-surface text-xs font-bold hover:bg-surface-subtle text-neutral-10 transition-colors disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!canAfford || isPurchasing}
            onClick={() => onConfirm(item)}
            className={cn(
              "py-2.5 rounded-button font-bold text-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 shadow-button-sm",
              canAfford && !isPurchasing
                ? "bg-accent-green hover:bg-accent-green/90 text-text-inverse"
                : "bg-surface-subtle border border-border-default text-text-muted cursor-not-allowed opacity-60 shadow-none",
            )}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{canAfford ? "Beli Sekarang" : "Koin Belum Cukup"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
