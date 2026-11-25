"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Check,
  Search,
  AlertTriangle,
  Shirt,
  Crown,
  Glasses,
  Utensils,
  Lock,
  CircleDollarSign,
  Store,
  X,
} from "lucide-react";
import { AccessorySvgPreview } from "./character-svg";
import {
  CosmeticCategory,
  COSMETICS_CATALOG,
  CosmeticItem,
} from "@/lib/cosmetics-catalog";
import {
  WARDROBE_CATEGORIES,
  WardrobeCategoryId,
  getWardrobeCategory,
} from "@/lib/wardrobe-categories";
import { CharacterId } from "@/lib/character-assets/types";
import {
  isAccessoryCompatible,
  getCharacterDefinition,
} from "@/lib/character-assets/catalog";
import { PurchaseModal } from "./purchase-modal";
import { purchaseAccessoryAction } from "@/app/actions/pet-customization";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  clothing: Shirt,
  head: Crown,
  accessory: Glasses,
  food: Utensils,
} as const;

export interface AccessorySelectorProps {
  characterId: CharacterId;
  ownedItemIds: string[];
  equipped: {
    head?: string | null;
    glasses?: string | null;
    body?: string | null;
    held?: string | null;
    skin?: string | null;
    room?: string | null;
  };
  onEquipItem: (category: CosmeticCategory, itemId: string) => void;
  onUnequipItem: (category: CosmeticCategory) => void;
}

export function AccessorySelector({
  characterId,
  ownedItemIds,
  equipped,
  onEquipItem,
  onUnequipItem,
}: AccessorySelectorProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<WardrobeCategoryId>("clothing");
  const [searchQuery, setSearchQuery] = useState("");

  const coins = usePetStore((state) => state.coins);
  const setCoins = usePetStore((state) => state.setCoins);
  const addCoins = usePetStore((state) => state.addCoins);
  const addOwnedItem = useCosmeticsStore((state) => state.addOwnedItem);
  const buyItemClient = useCosmeticsStore((state) => state.buyItem);

  const [confirmModalItem, setConfirmModalItem] = useState<CosmeticItem | null>(
    null,
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseToast, setPurchaseToast] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const charDef = getCharacterDefinition(characterId);

  const activeCategory =
    WARDROBE_CATEGORIES.find((category) => category.id === selectedCategory) ??
    WARDROBE_CATEGORIES[0];

  // Only show owned or default-free items in Wardrobe (hide unpurchased items)
  const categoryItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return COSMETICS_CATALOG.filter((item) => {
      if (getWardrobeCategory(item.id) !== activeCategory.id) return false;
      const isOwned =
        Boolean(item.isDefaultFree) || ownedItemIds.includes(item.id);
      if (!isOwned) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        (item.nameEn ? item.nameEn.toLowerCase().includes(query) : false)
      );
    }).sort((a, b) => {
      if (a.id.endsWith("-none")) return -1;
      if (b.id.endsWith("-none")) return 1;
      return 0;
    });
  }, [activeCategory.id, ownedItemIds, searchQuery]);

  const handleConfirmPurchase = async (itemToBuy: CosmeticItem) => {
    setIsPurchasing(true);

    try {
      const serverResult = await purchaseAccessoryAction(itemToBuy.id);

      if (serverResult.success) {
        if (serverResult.newCoins !== undefined) {
          setCoins(serverResult.newCoins);
        }
        addOwnedItem(itemToBuy.id);
        setPurchaseToast({
          success: true,
          message: serverResult.message,
        });
        onEquipItem(activeCategory.slot, itemToBuy.id);
      } else {
        if (serverResult.message.includes("login")) {
          const clientResult = buyItemClient(itemToBuy.id, coins, (amount) => {
            addCoins(amount);
          });
          setPurchaseToast(clientResult);
          if (clientResult.success) {
            onEquipItem(activeCategory.slot, itemToBuy.id);
          }
        } else {
          setPurchaseToast({
            success: false,
            message: serverResult.message,
          });
        }
      }
    } catch (err: unknown) {
      setPurchaseToast({
        success: false,
        message:
          err instanceof Error ? err.message : "Gagal memproses pembelian.",
      });
    } finally {
      setIsPurchasing(false);
      setConfirmModalItem(null);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Toast Feedback */}
      {purchaseToast && (
        <div
          role="status"
          className={cn(
            "p-3.5 rounded-navigation border flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200",
            purchaseToast.success
              ? "bg-accent-green/15 border-accent-green/35 text-text-primary"
              : "bg-destructive/10 border-destructive/30 text-destructive",
          )}
        >
          <div className="flex items-center gap-2">
            {purchaseToast.success ? (
              <Check className="h-4 w-4 shrink-0 text-accent-green stroke-[3]" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive stroke-[2.5]" />
            )}
            <p className="font-bold">{purchaseToast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setPurchaseToast(null)}
            aria-label="Tutup notifikasi"
            className="p-1.5 rounded-navigation hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {WARDROBE_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id];
            const isActive = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                aria-pressed={isActive}
                className={cn(
                  "nav-item inline-flex items-center gap-1.5 whitespace-nowrap border px-3.5 py-2 text-xs font-semibold rounded-navigation transition-colors",
                  isActive
                    ? "is-selected border-accent-orange font-bold shadow-2xs"
                    : "bg-surface text-neutral-10 border-border-default hover:bg-accent-green-light hover:text-text-primary",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Cari aksesoris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-navigation border border-border-default bg-surface py-2 pl-9 pr-8 text-xs font-semibold text-text-primary shadow-xs outline-none placeholder:text-text-muted focus:border-accent-green focus:ring-1 focus:ring-accent-green/30 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Owned Items + Dedicated "Kunjungi Toko" Card */}
      <div className="flex-1 rounded-card border border-border-divider bg-surface p-4 sm:p-6 shadow-xs">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          {categoryItems.map((item) => {
            const isFree = Boolean(item.isDefaultFree);
            const isOwned = isFree || ownedItemIds.includes(item.id);
            const isNoneItem = item.id.endsWith("-none");
            const currentSlotVal =
              equipped[activeCategory.slot] || `${activeCategory.slot}-none`;
            const isEquipped = currentSlotVal === item.id;
            const compatible =
              isFree || isAccessoryCompatible(characterId, item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!compatible) return;
                  if (!isOwned) {
                    setConfirmModalItem(item);
                    return;
                  }
                  if (isNoneItem) {
                    onUnequipItem(activeCategory.slot);
                  } else if (isEquipped) {
                    onUnequipItem(activeCategory.slot);
                  } else {
                    onEquipItem(activeCategory.slot, item.id);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center justify-between space-y-2.5 rounded-button border-2 p-3.5 text-center transition-colors shadow-2xs",
                  !compatible
                    ? "cursor-not-allowed bg-surface-subtle opacity-60"
                    : "cursor-pointer",
                  isEquipped
                    ? "border-accent-orange bg-accent-yellow/35 ring-2 ring-accent-orange/20"
                    : isOwned
                      ? "border-border-divider bg-surface hover:border-accent-green hover:bg-surface-subtle"
                      : "border-border-default bg-surface-subtle/60 hover:border-accent-orange/60",
                )}
              >
                {/* Equipped check badge */}
                {isEquipped && (
                  <span
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-pill bg-accent-orange text-text-inverse shadow-2xs"
                    title="Terpilih"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                )}

                {/* Lock icon only */}
                {!isOwned && (
                  <span
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-pill bg-surface border border-border-default shadow-2xs"
                    title="Item Terkunci"
                    aria-label="Item Terkunci"
                  >
                    <Lock className="h-3.5 w-3.5 text-accent-orange" />
                  </span>
                )}

                {!compatible && (
                  <span
                    className="absolute left-2 top-2 flex items-center gap-0.5 rounded-pill bg-destructive/10 border border-destructive/25 px-2 py-0.5 text-xs font-bold text-destructive"
                    title={`Aksesoris ini tidak cocok dengan siluet ${charDef.name}`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>Tidak Cocok</span>
                  </span>
                )}

                {/* Preview SVG */}
                <div className="flex h-20 w-20 items-center justify-center pt-1">
                  <AccessorySvgPreview itemId={item.id} />
                </div>

                {/* Title & Price */}
                <div className="w-full space-y-1">
                  <p className="w-full truncate text-sm font-extrabold text-text-primary">
                    {item.name}
                  </p>
                  {!isOwned && !isFree && (
                    <p className="text-sm font-bold text-accent-orange-dark flex items-center justify-center gap-1">
                      <CircleDollarSign className="h-4 w-4 text-accent-orange" />
                      <span>{item.priceCoins}</span>
                    </p>
                  )}
                </div>

                {/* Action Button: Terpilih / Pasang / Beli */}
                <div className="mt-auto w-full pt-1">
                  {isOwned ? (
                    <button
                      type="button"
                      disabled={!compatible}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!compatible) return;
                        if (isNoneItem) {
                          onUnequipItem(activeCategory.slot);
                        } else if (isEquipped) {
                          onUnequipItem(activeCategory.slot);
                        } else {
                          onEquipItem(activeCategory.slot, item.id);
                        }
                      }}
                      className={cn(
                        "w-full rounded-navigation py-1.5 px-3 text-xs font-bold transition-colors shadow-2xs",
                        isEquipped
                          ? "bg-accent-orange text-text-inverse hover:bg-accent-orange-dark"
                          : compatible
                            ? "border border-border-default bg-surface text-text-primary hover:bg-accent-green-light"
                            : "cursor-not-allowed bg-surface-subtle text-text-muted opacity-50",
                      )}
                    >
                      {isEquipped
                        ? "Terpilih"
                        : compatible
                          ? "Pasang"
                          : "Tidak Cocok"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!compatible}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!compatible) return;
                        setConfirmModalItem(item);
                      }}
                      className="button-primary w-full py-1.5 px-3 text-xs"
                    >
                      Beli
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Dedicated "Kunjungi Toko" Card */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-button border-2 border-dashed border-border-default bg-surface-subtle/60 p-4 text-center">
            <div className="flex flex-1 items-center justify-center py-4">
              <Store
                className="h-14 w-14 text-text-primary stroke-[1.75]"
                aria-hidden="true"
              />
            </div>
            <Link
              href="/pet-customization/shop"
              className="button-primary w-full py-2 px-3 text-xs text-center inline-flex items-center justify-center"
            >
              Kunjungi Toko
            </Link>
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      <PurchaseModal
        item={confirmModalItem}
        userCoins={coins}
        isOpen={Boolean(confirmModalItem)}
        isPurchasing={isPurchasing}
        onClose={() => {
          if (!isPurchasing) setConfirmModalItem(null);
        }}
        onConfirm={handleConfirmPurchase}
      />
    </div>
  );
}
