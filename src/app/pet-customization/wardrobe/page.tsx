"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Coins,
  ShoppingBag,
  Sparkles,
  Check,
  RotateCcw,
  ArrowRight,
  Palette,
  Layers,
  Smile,
  LayoutGrid,
} from "lucide-react";
import { PetRenderer } from "@/components/pet/pet-renderer";
import {
  CharacterSvg,
  AccessorySvgPreview,
} from "@/components/pet/character-svg";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import {
  COSMETICS_CATALOG,
  CosmeticCategory,
} from "@/lib/cosmetics-catalog";
import {
  ACCESSORY_CATALOG,
  ALL_CHARACTER_IDS,
  CHARACTER_CATALOG,
  CHARACTER_COLOR_PALETTES,
  DEFAULT_CHARACTER_COMPOSITIONS,
  getCharacterDefinition,
} from "@/lib/character-assets/catalog";
import { AccessoryTheme, CharacterId } from "@/lib/character-assets/types";
import { cn } from "@/lib/utils";

type WardrobeSectionTab = "accessories" | "characters" | "colors" | "gallery";

export default function PetWardrobePage() {
  const {
    coins,
    name,
    species,
    earsVariant,
    tailVariant,
    faceVariant,
    setSpecies,
    setPetName,
    setCustomColors,
    applyColorPalette,
    resetCustomColors,
    setEarsVariant,
    setTailVariant,
    setFaceVariant,
    resetCharacterCustomization,
    getEffectiveColors,
  } = usePetStore();

  const {
    ownedItemIds,
    equipped,
    selectedCategory,
    setSelectedCategory,
    equipItem,
    unequipItem,
    setEquippedLoadout,
  } = useCosmeticsStore();

  const [activeTab, setActiveTab] = useState<WardrobeSectionTab>("accessories");
  const [themeFilter, setThemeFilter] = useState<"all" | AccessoryTheme>("all");

  const effectiveColors = getEffectiveColors();
  const currentCharDef = getCharacterDefinition(species);

  const categories: { id: CosmeticCategory; label: string }[] = [
    { id: "head", label: "Topi & Kepala" },
    { id: "glasses", label: "Kacamata" },
    { id: "body", label: "Pakaian & Tas" },
    { id: "held", label: "Makanan & Minuman" },
    { id: "skin", label: "Skin & Aura" },
    { id: "room", label: "Dekorasi Ruangan" },
  ];

  const categoryOwnedItems = COSMETICS_CATALOG.filter((item) => {
    if (item.category !== selectedCategory) return false;
    if (!ownedItemIds.includes(item.id)) return false;
    if (themeFilter !== "all" && !item.isDefaultFree && item.theme !== themeFilter) {
      return false;
    }
    return true;
  });

  const handleApplyDefaultComposition = (charId: CharacterId) => {
    const def = getCharacterDefinition(charId);
    const comp = DEFAULT_CHARACTER_COMPOSITIONS[charId];
    setSpecies(charId);
    setPetName(def.defaultNickname);
    if (comp?.equippedAccessories) {
      setEquippedLoadout({
        head: comp.equippedAccessories.head || "head-none",
        glasses: comp.equippedAccessories.glasses || "glasses-none",
        body: comp.equippedAccessories.body || "body-none",
        held: comp.equippedAccessories.held || "held-none",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-navigation bg-accent-green/15 text-text-primary">
              <Award className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Pet Wardrobe (Ruang Ganti & Studio Karakter)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Pilih dari 12 karakter chibi antropomorfik, kustomisasi warna tubuh & ekspresi, serta pasang 24+ aksesoris SVG modular.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pet-customization/shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-accent-yellow border border-accent-green/30 hover:bg-accent-green-light text-text-primary font-bold text-xs transition-colors"
          >
            <Coins className="h-4 w-4 text-accent-orange" />
            <span suppressHydrationWarning>{coins} Koin • Buka Pet Shop</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Wardrobe vs Shop */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-divider pb-2">
        <div className="flex items-center gap-2">
          <Link
            href="/pet-customization/wardrobe"
            aria-current="page"
            className="nav-item is-selected px-4 py-2 text-xs font-bold"
          >
            Wardrobe (Koleksi Milikmu)
          </Link>
          <Link
            href="/pet-customization/shop"
            className="nav-item px-4 py-2 text-xs font-semibold text-neutral-10"
          >
            Pet Shop (Beli dengan Koin)
          </Link>
        </div>

        {/* Studio Mode Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("accessories")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "accessories"
                ? "is-selected border-accent-orange font-bold"
                : "bg-surface text-neutral-10 border-border-default"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Aksesoris (24+)</span>
          </button>
          <button
            onClick={() => setActiveTab("characters")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "characters"
                ? "is-selected border-accent-orange font-bold"
                : "bg-surface text-neutral-10 border-border-default"
            )}
          >
            <Smile className="h-3.5 w-3.5" />
            <span>12 Karakter & Layer</span>
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "colors"
                ? "is-selected border-accent-orange font-bold"
                : "bg-surface text-neutral-10 border-border-default"
            )}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Warna & Palet</span>
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={cn(
              "nav-item inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors",
              activeTab === "gallery"
                ? "is-selected border-accent-orange font-bold"
                : "bg-surface text-neutral-10 border-border-default"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Contact Sheet Galeri</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Live Pet Preview */}
        <div className="lg:col-span-5 rounded-card border border-border-divider bg-surface p-6 shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-full flex items-center justify-between border-b border-border-divider pb-2 text-xs">
            <span className="font-bold text-text-primary" suppressHydrationWarning>
              Tampilan Langsung {name}
            </span>
            <span className="text-text-muted text-[11px]" suppressHydrationWarning>
              {currentCharDef.name} • {currentCharDef.speciesLabel}
            </span>
          </div>

          <PetRenderer interactive={true} size="md" />

          {/* Equipped Slots Summary Pills */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border-divider text-[11px]">
            {categories.slice(0, 4).map((cat) => {
              const eqItem = COSMETICS_CATALOG.find(
                (i) => i.id === equipped[cat.id]
              );
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveTab("accessories");
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-input border border-border-divider bg-surface-subtle hover:bg-accent-green-light/40 text-left transition-colors"
                >
                  <span className="text-text-muted">{cat.label}:</span>
                  <span className="font-bold text-text-primary truncate max-w-[95px]" suppressHydrationWarning>
                    {eqItem && !eqItem.isDefaultFree ? eqItem.name : "Kosong"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Reset Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => unequipItem(selectedCategory)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-navigation border border-border-default text-xs text-neutral-10 hover:text-text-primary hover:bg-accent-green-light transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                Reset {categories.find((c) => c.id === selectedCategory)?.label}
              </span>
            </button>
            <button
              onClick={() => resetCharacterCustomization()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-navigation border border-border-default text-xs text-neutral-10 hover:text-text-primary hover:bg-accent-green-light transition-colors"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Reset Warna & Anatomi</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Customization Panels */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === "accessories" && (
            <>
              {/* Category Tabs */}
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

              {/* Theme Sub-filter (Everyday vs Food-themed) */}
              {(selectedCategory === "head" ||
                selectedCategory === "glasses" ||
                selectedCategory === "body" ||
                selectedCategory === "held") && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted font-medium">
                    Filter Tema:
                  </span>
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
                      onClick={() => setThemeFilter(tf.id)}
                      className={cn(
                        "nav-item px-2.5 py-1 text-[11px] font-semibold border transition-colors",
                        themeFilter === tf.id
                          ? "is-selected border-accent-orange"
                          : "bg-surface text-neutral-10 border-border-default"
                      )}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Owned Items Grid */}
              <div className="rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Pilih Aksesoris SVG untuk Dipasang:
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    {categoryOwnedItems.length} item tersedia
                  </span>
                </div>

                {categoryOwnedItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-text-muted space-y-2">
                    <ShoppingBag className="h-8 w-8 text-text-muted/40 mx-auto" />
                    <p>Tidak ada item di filter kategori ini.</p>
                    <Link
                      href="/pet-customization/shop"
                      className="inline-flex items-center gap-1 font-bold text-text-primary hover:underline pt-1"
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
                            "p-3.5 rounded-button border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-2 relative shadow-2xs",
                            isEquipped
                              ? "border-accent-orange bg-accent-yellow/50 ring-2 ring-accent-orange/20"
                              : "border-border-divider bg-surface hover:bg-surface-subtle"
                          )}
                        >
                          {isEquipped && (
                            <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-pill bg-accent-orange text-text-inverse">
                              <Check className="h-3 w-3 stroke-[3]" />
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

                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-text-primary line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-neutral-10 line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-pill text-[10px] font-bold mt-auto",
                              isEquipped
                                ? "bg-accent-orange text-text-inverse"
                                : "bg-surface-subtle border border-border-default text-text-primary"
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
            </>
          )}

          {activeTab === "characters" && (
            <div className="rounded-card border border-border-divider bg-surface p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Koleksi 12 Karakter Chibi Antropomorfik
                  </h3>
                  <p className="text-xs text-text-muted">
                    Setiap karakter memiliki siluet kepala, telinga, tubuh, ekor, dan ekspresi khas.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-pill text-[11px] font-bold bg-accent-green/15 text-text-primary">
                  12 Karakter Original
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CHARACTER_CATALOG.map((char) => {
                  const isSelected = species === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() => setSpecies(char.id)}
                      className={cn(
                        "p-3 rounded-button border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-1.5 relative",
                        isSelected
                          ? "border-accent-orange bg-accent-yellow/50 ring-2 ring-accent-orange/20"
                          : "border-border-divider bg-surface hover:bg-surface-subtle"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-pill bg-accent-orange text-text-inverse">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}

                      <div className="h-24 w-20 flex items-center justify-center">
                        <CharacterSvg
                          characterId={char.id}
                          showRoomBackdrop={false}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-text-primary">
                          {char.name}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {char.speciesLabel}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyDefaultComposition(char.id);
                        }}
                        className="w-full py-1 rounded-input bg-surface-subtle border border-border-default hover:bg-accent-green-light text-text-primary text-[10px] font-bold transition-colors"
                      >
                        Pakai Setelan Bawaan
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Modular Layer Mix-and-Match Controls */}
              <div className="pt-4 border-t border-border-divider space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent-green" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Kustomisasi Layer Anatomi & Ekspresi Wajah
                  </h4>
                </div>

                {/* Face Variant Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted">
                    Varian Ekspresi Wajah (Mata, Alis & Mulut):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CHARACTER_IDS.map((vid) => {
                      const active = (faceVariant || species) === vid;
                      return (
                        <button
                          key={`face-${vid}`}
                          onClick={() =>
                            setFaceVariant(vid === species ? undefined : vid)
                          }
                          className={cn(
                            "nav-item px-2.5 py-1 text-[11px] font-semibold border capitalize transition-colors",
                            active
                              ? "is-selected border-accent-orange"
                              : "bg-surface text-neutral-10 border-border-default"
                          )}
                        >
                          {vid}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ears Variant Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted">
                    Varian Telinga:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CHARACTER_IDS.map((vid) => {
                      const active = (earsVariant || species) === vid;
                      return (
                        <button
                          key={`ears-${vid}`}
                          onClick={() =>
                            setEarsVariant(vid === species ? undefined : vid)
                          }
                          className={cn(
                            "nav-item px-2.5 py-1 text-[11px] font-semibold border capitalize transition-colors",
                            active
                              ? "is-selected border-accent-orange"
                              : "bg-surface text-neutral-10 border-border-default"
                          )}
                        >
                          {vid}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tail Variant Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted">
                    Varian Ekor:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CHARACTER_IDS.map((vid) => {
                      const active = (tailVariant || species) === vid;
                      return (
                        <button
                          key={`tail-${vid}`}
                          onClick={() =>
                            setTailVariant(vid === species ? undefined : vid)
                          }
                          className={cn(
                            "nav-item px-2.5 py-1 text-[11px] font-semibold border capitalize transition-colors",
                            active
                              ? "is-selected border-accent-orange"
                              : "bg-surface text-neutral-10 border-border-default"
                          )}
                        >
                          {vid}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "colors" && (
            <div className="rounded-card border border-border-divider bg-surface p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Kustomisasi Warna & Token CSS Karakter
                  </h3>
                  <p className="text-xs text-text-muted">
                    Mengubah warna hanya memengaruhi bagian tubuh/aksen yang dituju tanpa merusak mata atau aksesoris.
                  </p>
                </div>
                <button
                  onClick={resetCustomColors}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-navigation border border-border-default text-xs font-bold text-text-primary hover:bg-accent-green-light"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Warna Bawaan</span>
                </button>
              </div>

              {/* 12 Collectible Color Palette Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  12 Palet Warna Koleksi:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ALL_CHARACTER_IDS.map((pid) => {
                    const pal = CHARACTER_COLOR_PALETTES[pid];
                    const isCurrent =
                      effectiveColors.primary.toLowerCase() ===
                      pal.primary.toLowerCase();
                    return (
                      <button
                        key={pal.id}
                        onClick={() => applyColorPalette(pid)}
                        className={cn(
                          "flex items-center gap-2.5 p-2.5 rounded-button border text-left transition-all",
                          isCurrent
                            ? "border-accent-orange bg-accent-yellow/50 font-bold"
                            : "border-border-default bg-surface hover:bg-surface-subtle"
                        )}
                      >
                        <span className="flex items-center -space-x-1.5 shrink-0">
                          <span
                            className="h-5 w-5 rounded-pill border border-black/20"
                            style={{ backgroundColor: pal.primary }}
                          />
                          <span
                            className="h-4 w-4 rounded-pill border border-black/20"
                            style={{ backgroundColor: pal.secondary }}
                          />
                          <span
                            className="h-4 w-4 rounded-pill border border-black/20"
                            style={{ backgroundColor: pal.belly }}
                          />
                        </span>
                        <span className="text-xs text-foreground truncate">
                          {pal.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fine-Grained Color Token Controls */}
              <div className="pt-4 border-t border-border-divider grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-button border border-border-default bg-surface-subtle">
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      Warna Tubuh Utama
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Token: --char-primary
                    </p>
                  </div>
                  <input
                    type="color"
                    aria-label="Warna Tubuh Utama"
                    value={effectiveColors.primary}
                    onChange={(e) =>
                      setCustomColors({ primary: e.target.value })
                    }
                    className="h-9 w-12 rounded-input cursor-pointer border border-border-default bg-transparent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-button border border-border-default bg-surface-subtle">
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      Warna Aksen & Detail
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Token: --char-secondary
                    </p>
                  </div>
                  <input
                    type="color"
                    aria-label="Warna Aksen & Detail"
                    value={effectiveColors.secondary}
                    onChange={(e) =>
                      setCustomColors({ secondary: e.target.value })
                    }
                    className="h-9 w-12 rounded-input cursor-pointer border border-border-default bg-transparent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-button border border-border-default bg-surface-subtle">
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      Warna Perut & Moncong
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Token: --char-belly
                    </p>
                  </div>
                  <input
                    type="color"
                    aria-label="Warna Perut & Moncong"
                    value={effectiveColors.belly}
                    onChange={(e) => setCustomColors({ belly: e.target.value })}
                    className="h-9 w-12 rounded-input cursor-pointer border border-border-default bg-transparent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-button border border-border-default bg-surface-subtle">
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      Warna Telinga Dalam & Rona Pipi
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Token: --char-inner-ear / --char-blush
                    </p>
                  </div>
                  <input
                    type="color"
                    aria-label="Warna Telinga Dalam"
                    value={effectiveColors.innerEar}
                    onChange={(e) =>
                      setCustomColors({
                        innerEar: e.target.value,
                        blush: e.target.value,
                      })
                    }
                    className="h-9 w-12 rounded-input cursor-pointer border border-border-default bg-transparent"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="rounded-card border border-border-divider bg-surface p-6 space-y-6 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Visual Contact Sheet: 12 Karakter & 24+ Aksesoris SVG
                </h3>
                <p className="text-xs text-text-muted">
                  Pratinjau komposisi default ke-12 karakter beserta seluruh koleksi aksesoris Everyday & Food-Themed.
                </p>
              </div>

              {/* 12 Characters Default Compositions Contact Sheet */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  12 Karakter dengan Komposisi Aksesoris Bawaan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {CHARACTER_CATALOG.map((char) => {
                    const comp = DEFAULT_CHARACTER_COMPOSITIONS[char.id];
                    return (
                      <div
                        key={`sheet-${char.id}`}
                        onClick={() => handleApplyDefaultComposition(char.id)}
                        className="p-3 rounded-button border border-border-default bg-surface hover:border-accent-green cursor-pointer transition-all flex flex-col items-center text-center space-y-1"
                      >
                        <div className="h-28 w-24">
                          <CharacterSvg
                            characterId={char.id}
                            equipped={comp.equippedAccessories}
                            showRoomBackdrop={false}
                          />
                        </div>
                        <p className="text-xs font-bold text-text-primary">
                          {char.name}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {char.speciesLabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 24+ Accessories Contact Sheet */}
              <div className="space-y-2 pt-3 border-t border-border-divider">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Katalog Lengkap Aksesoris SVG ({ACCESSORY_CATALOG.length} Aset)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {ACCESSORY_CATALOG.map((acc) => (
                    <div
                      key={`sheet-acc-${acc.id}`}
                      onClick={() =>
                        equipItem(acc.category as CosmeticCategory, acc.id)
                      }
                      className="p-2.5 rounded-input border border-border-default bg-surface hover:border-accent-green cursor-pointer flex flex-col items-center text-center space-y-1"
                    >
                      <div className="h-12 w-12 flex items-center justify-center">
                        <AccessorySvgPreview itemId={acc.id} />
                      </div>
                      <p className="text-[10px] font-bold text-text-primary line-clamp-1">
                        {acc.nameEn}
                      </p>
                      <span className="text-[9px] text-text-muted uppercase">
                        {acc.theme}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Shop Callout Banner (Review Card Surface) */}
          <div className="review-card p-5 border border-accent-green/25 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-text-primary">
                Ingin Koleksi Kostum Lainnya?
              </p>
              <p className="text-neutral-10 text-[11px]">
                Gunakan Caloria Coins yang kamu kumpulkan dari konsistensi makan untuk berbelanja.
              </p>
            </div>
            <Link
              href="/pet-customization/shop"
              className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs shrink-0 ml-3"
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
