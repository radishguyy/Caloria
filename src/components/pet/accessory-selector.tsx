"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Check,
  Search,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { AccessorySvgPreview } from "./character-svg";
import {
  CosmeticCategory,
  COSMETICS_CATALOG,
} from "@/lib/cosmetics-catalog";
import { AccessoryTheme, CharacterId } from "@/lib/character-assets/types";
import {
  isAccessoryCompatible,
  getCharacterDefinition,
} from "@/lib/character-assets/catalog";
import { cn } from "@/lib/utils";

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
  const [selectedCategory, setSelectedCategory] = useState<CosmeticCategory>("head");
  const [themeFilter, setThemeFilter] = useState<"all" | AccessoryTheme>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const charDef = getCharacterDefinition(characterId);

  const categories: { id: CosmeticCategory; label: string; count: number }[] = [
    {
      id: "head",
      label: "Topi & Kepala",
      count: COSMETICS_CATALOG.filter(
        (i) => i.category === "head" && ownedItemIds.includes(i.id)
      ).length,
    },
    {
      id: "glasses",
      label: "Kacamata",
      count: COSMETICS_CATALOG.filter(
        (i) => i.category === "glasses" && ownedItemIds.includes(i.id)
      ).length,
    },
    {
      id: "body",
      label: "Pakaian & Tas",
      count: COSMETICS_CATALOG.filter(
        (i) => i.category === "body" && ownedItemIds.includes(i.id)
      ).length,
    },
    {
      id: "held",
      label: "Makanan & Minuman",
      count: COSMETICS_CATALOG.filter(
        (i) => i.category === "held" && ownedItemIds.includes(i.id)
      ).length,
    },
    {
      id: "skin",
      label: "Skin & Aura",
      count: COSMETICS_CATALOG.filter(
        (i) => i.category === "skin" && ownedItemIds.includes(i.id)
      ).length,
    },
    {
      id: "room",
      label: "Dekorasi Ruangan",
      count: COSMETICS_CATALOG.filter(
        (i) => i.category === "room" && ownedItemIds.includes(i.id)
      ).length,
    },
  ];

  const categoryItems = useMemo(() => {
    return COSMETICS_CATALOG.filter((item) => {
      if (item.category !== selectedCategory) return false;
      if (!ownedItemIds.includes(item.id)) return false;
      if (themeFilter !== "all" && !item.isDefaultFree && item.theme !== themeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, ownedItemIds, themeFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Category Pills Header */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "nav-item px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5",
              selectedCategory === cat.id
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle"
            )}
          >
            <span>{cat.label}</span>
            <span className="text-[10px] opacity-75 font-mono">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Theme Sub-filter */}
        {(selectedCategory === "head" ||
          selectedCategory === "glasses" ||
          selectedCategory === "body" ||
          selectedCategory === "held") && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-text-muted font-medium text-[11px]">Tema:</span>
            {(
              [
                { id: "all", label: "Semua" },
                { id: "everyday", label: "Everyday" },
                { id: "food", label: "Food-Themed" },
                { id: "special", label: "Spesial" },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setThemeFilter(tf.id)}
                className={cn(
                  "px-2.5 py-1 rounded-pill text-[11px] font-semibold border transition-colors",
                  themeFilter === tf.id
                    ? "bg-accent-orange text-text-inverse border-accent-orange font-bold"
                    : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="relative sm:w-60 ml-auto">
          <Search className="h-3.5 w-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari aksesoris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-input border border-border-default bg-surface text-xs text-text-primary placeholder:text-text-muted outline-hidden focus:border-accent-green"
          />
        </div>
      </div>

      {/* Grid of Items */}
      <div className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Daftar Koleksi {categories.find((c) => c.id === selectedCategory)?.label}:
          </h3>
          <span className="text-[11px] text-text-muted">
            {categoryItems.length} item tersedia
          </span>
        </div>

        {categoryItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted space-y-2">
            <ShoppingBag className="h-8 w-8 text-text-muted/40 mx-auto" />
            <p>Tidak ada item di filter kategori ini.</p>
            <Link
              href="/pet-customization/shop"
              className="inline-flex items-center gap-1 font-bold text-text-primary hover:underline pt-1"
            >
              <span>Buka Pet Shop untuk Membeli</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryItems.map((item) => {
              const isEquipped = equipped[selectedCategory] === item.id;
              const compatible =
                item.isDefaultFree || isAccessoryCompatible(characterId, item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!compatible) return;
                    if (isEquipped) {
                      onUnequipItem(selectedCategory);
                    } else {
                      onEquipItem(selectedCategory, item.id);
                    }
                  }}
                  className={cn(
                    "p-3 rounded-button border-2 transition-all flex flex-col items-center text-center space-y-2 relative shadow-2xs",
                    !compatible
                      ? "opacity-60 border-dashed border-border-default bg-surface-subtle cursor-not-allowed"
                      : "cursor-pointer",
                    isEquipped
                      ? "border-accent-orange bg-accent-yellow/40 ring-2 ring-accent-orange/20"
                      : compatible
                      ? "border-border-divider bg-surface hover:bg-surface-subtle"
                      : ""
                  )}
                >
                  {/* Equipped Checkmark */}
                  {isEquipped && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-pill bg-accent-orange text-text-inverse shadow-2xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}

                  {/* Incompatibility Notice */}
                  {!compatible && (
                    <span
                      className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill bg-red-100 text-red-700 text-[9px] font-bold"
                      title={`Aksesoris ini tidak cocok dengan siluet ${charDef.name}`}
                    >
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span>Tidak Cocok</span>
                    </span>
                  )}

                  {item.theme && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-input text-[9px] font-bold uppercase bg-surface-subtle border border-border-divider text-text-muted">
                      {item.theme}
                    </span>
                  )}

                  <div className="h-16 w-16 flex items-center justify-center pt-2">
                    <AccessorySvgPreview itemId={item.id} />
                  </div>

                  <div className="space-y-0.5 w-full">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-neutral-10 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="w-full mt-auto pt-1">
                    <button
                      type="button"
                      disabled={!compatible}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!compatible) return;
                        if (isEquipped) {
                          onUnequipItem(selectedCategory);
                        } else {
                          onEquipItem(selectedCategory, item.id);
                        }
                      }}
                      className={cn(
                        "w-full py-1 rounded-input text-[10px] font-bold transition-colors",
                        isEquipped
                          ? "bg-accent-orange text-text-inverse"
                          : compatible
                          ? "bg-surface-subtle border border-border-default hover:bg-accent-green-light text-text-primary"
                          : "bg-surface-subtle text-text-muted cursor-not-allowed"
                      )}
                    >
                      {isEquipped
                        ? "Terpasang (Lepas)"
                        : compatible
                        ? "Pasang"
                        : "Tidak Kompatibel"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
