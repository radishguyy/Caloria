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

  // Owned items in currently selected category + theme filter
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Award className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pet Wardrobe (Ruang Ganti & Studio Karakter)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pilih dari 12 karakter chibi antropomorfik, kustomisasi warna tubuh & ekspresi, serta pasang 24+ aksesoris SVG modular.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pet-customization/shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-bold text-xs transition-colors"
          >
            <Coins className="h-4 w-4 text-amber-500" />
            <span>{coins} Koin • Buka Pet Shop</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Wardrobe vs Shop */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Link
            href="/pet-customization/wardrobe"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-foreground text-background"
          >
            Wardrobe (Koleksi Milikmu)
          </Link>
          <Link
            href="/pet-customization/shop"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Pet Shop (Beli dengan Koin)
          </Link>
        </div>

        {/* Studio Mode Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("accessories")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
              activeTab === "accessories"
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Aksesoris (24+)</span>
          </button>
          <button
            onClick={() => setActiveTab("characters")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
              activeTab === "characters"
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <Smile className="h-3.5 w-3.5" />
            <span>12 Karakter & Layer</span>
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
              activeTab === "colors"
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Warna & Palet</span>
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
              activeTab === "gallery"
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Contact Sheet Galeri</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Live Pet Preview */}
        <div className="lg:col-span-5 rounded-3xl border bg-card p-6 shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-full flex items-center justify-between border-b border-border pb-2 text-xs">
            <span className="font-bold text-foreground">
              Tampilan Langsung {name}
            </span>
            <span className="text-muted-foreground text-[11px]">
              {currentCharDef.name} • {currentCharDef.speciesLabel}
            </span>
          </div>

          <PetRenderer interactive={true} size="md" />

          {/* Equipped Slots Summary Pills */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border text-[11px]">
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
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border bg-muted/30 hover:bg-muted/60 text-left transition-colors"
                >
                  <span className="text-muted-foreground">{cat.label}:</span>
                  <span className="font-bold text-foreground truncate max-w-[95px]">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                Reset {categories.find((c) => c.id === selectedCategory)?.label}
              </span>
            </button>
            <button
              onClick={() => resetCharacterCustomization()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                      "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border",
                      selectedCategory === cat.id
                        ? "bg-orange-500 text-white border-orange-500 font-bold shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
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
                  <span className="text-muted-foreground font-medium">
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
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors",
                        themeFilter === tf.id
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      )}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Owned Items Grid */}
              <div className="rounded-3xl border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Pilih Aksesoris SVG untuk Dipasang:
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    {categoryOwnedItems.length} item tersedia
                  </span>
                </div>

                {categoryOwnedItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p>Tidak ada item di filter kategori ini.</p>
                    <Link
                      href="/pet-customization/shop"
                      className="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 hover:underline pt-1"
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
                              ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20"
                              : "border-border bg-background hover:bg-muted/30"
                          )}
                        >
                          {isEquipped && (
                            <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}

                          {item.theme && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-muted text-muted-foreground">
                              {item.theme}
                            </span>
                          )}

                          <div className="h-16 w-16 flex items-center justify-center pt-2">
                            <AccessorySvgPreview itemId={item.id} />
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-foreground line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold mt-auto",
                              isEquipped
                                ? "bg-orange-500 text-white"
                                : "bg-muted text-muted-foreground"
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
            <div className="rounded-3xl border bg-card p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Koleksi 12 Karakter Chibi Antropomorfik
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Setiap karakter memiliki siluet kepala, telinga, tubuh, ekor, dan ekspresi khas.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-600">
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
                        "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-1.5 relative",
                        isSelected
                          ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20"
                          : "border-border bg-background hover:bg-muted/30"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
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
                        <p className="text-xs font-bold text-foreground">
                          {char.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {char.speciesLabel}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyDefaultComposition(char.id);
                        }}
                        className="w-full py-1 rounded-lg bg-muted hover:bg-orange-500 hover:text-white text-[10px] font-semibold transition-colors"
                      >
                        Pakai Setelan Bawaan
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Modular Layer Mix-and-Match Controls */}
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-orange-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Kustomisasi Layer Anatomi & Ekspresi Wajah
                  </h4>
                </div>

                {/* Face Variant Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
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
                            "px-2.5 py-1 rounded-lg text-[11px] font-semibold border capitalize transition-colors",
                            active
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-background text-muted-foreground border-border hover:text-foreground"
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
                  <label className="text-xs font-semibold text-muted-foreground">
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
                            "px-2.5 py-1 rounded-lg text-[11px] font-semibold border capitalize transition-colors",
                            active
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-background text-muted-foreground border-border hover:text-foreground"
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
                  <label className="text-xs font-semibold text-muted-foreground">
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
                            "px-2.5 py-1 rounded-lg text-[11px] font-semibold border capitalize transition-colors",
                            active
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-background text-muted-foreground border-border hover:text-foreground"
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
            <div className="rounded-3xl border bg-card p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Kustomisasi Warna & Token CSS Karakter
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Mengubah warna hanya memengaruhi bagian tubuh/aksen yang dituju tanpa merusak mata atau aksesoris.
                  </p>
                </div>
                <button
                  onClick={resetCustomColors}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Warna Bawaan</span>
                </button>
              </div>

              {/* 12 Collectible Color Palette Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                          "flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all",
                          isCurrent
                            ? "border-orange-500 bg-orange-500/10 font-bold"
                            : "border-border bg-background hover:bg-muted/40"
                        )}
                      >
                        <span className="flex items-center -space-x-1.5 shrink-0">
                          <span
                            className="h-5 w-5 rounded-full border border-black/20"
                            style={{ backgroundColor: pal.primary }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-black/20"
                            style={{ backgroundColor: pal.secondary }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-black/20"
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
              <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-2xl border bg-background">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Warna Tubuh Utama
                    </p>
                    <p className="text-[10px] text-muted-foreground">
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
                    className="h-9 w-12 rounded-lg cursor-pointer border border-border bg-transparent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl border bg-background">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Warna Aksen & Detail
                    </p>
                    <p className="text-[10px] text-muted-foreground">
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
                    className="h-9 w-12 rounded-lg cursor-pointer border border-border bg-transparent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl border bg-background">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Warna Perut & Moncong
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Token: --char-belly
                    </p>
                  </div>
                  <input
                    type="color"
                    aria-label="Warna Perut & Moncong"
                    value={effectiveColors.belly}
                    onChange={(e) => setCustomColors({ belly: e.target.value })}
                    className="h-9 w-12 rounded-lg cursor-pointer border border-border bg-transparent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl border bg-background">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Warna Telinga Dalam & Rona Pipi
                    </p>
                    <p className="text-[10px] text-muted-foreground">
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
                    className="h-9 w-12 rounded-lg cursor-pointer border border-border bg-transparent"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="rounded-3xl border bg-card p-5 space-y-6 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Visual Contact Sheet: 12 Karakter & 24+ Aksesoris SVG
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pratinjau komposisi default ke-12 karakter beserta seluruh koleksi aksesoris Everyday & Food-Themed.
                </p>
              </div>

              {/* 12 Characters Default Compositions Contact Sheet */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  12 Karakter dengan Komposisi Aksesoris Bawaan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {CHARACTER_CATALOG.map((char) => {
                    const comp = DEFAULT_CHARACTER_COMPOSITIONS[char.id];
                    return (
                      <div
                        key={`sheet-${char.id}`}
                        onClick={() => handleApplyDefaultComposition(char.id)}
                        className="p-3 rounded-2xl border bg-background hover:border-orange-500 cursor-pointer transition-all flex flex-col items-center text-center space-y-1"
                      >
                        <div className="h-28 w-24">
                          <CharacterSvg
                            characterId={char.id}
                            equipped={comp.equippedAccessories}
                            showRoomBackdrop={false}
                          />
                        </div>
                        <p className="text-xs font-bold text-foreground">
                          {char.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {char.speciesLabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 24+ Accessories Contact Sheet */}
              <div className="space-y-2 pt-3 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Katalog Lengkap Aksesoris SVG ({ACCESSORY_CATALOG.length} Aset)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {ACCESSORY_CATALOG.map((acc) => (
                    <div
                      key={`sheet-acc-${acc.id}`}
                      onClick={() =>
                        equipItem(acc.category as CosmeticCategory, acc.id)
                      }
                      className="p-2.5 rounded-xl border bg-background hover:border-orange-500 cursor-pointer flex flex-col items-center text-center space-y-1"
                    >
                      <div className="h-12 w-12 flex items-center justify-center">
                        <AccessorySvgPreview itemId={acc.id} />
                      </div>
                      <p className="text-[10px] font-bold text-foreground line-clamp-1">
                        {acc.nameEn}
                      </p>
                      <span className="text-[9px] text-muted-foreground uppercase">
                        {acc.theme}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Shop Callout Banner */}
          <div className="p-4 rounded-2xl border bg-muted/40 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">
                Ingin Koleksi Kostum Lainnya?
              </p>
              <p className="text-muted-foreground text-[11px]">
                Gunakan Caloria Coins yang kamu kumpulkan dari konsistensi makan untuk berbelanja.
              </p>
            </div>
            <Link
              href="/pet-customization/shop"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shrink-0 ml-3"
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
