"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Coins, Sparkles, ShoppingBag } from "lucide-react";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from "@/components/shared/segmented-toggle";
import { getPetCustomizationStateAction } from "@/app/actions/pet-customization";

const TOGGLES: SegmentedToggleOption[] = [
  {
    href: "/pet-customization/wardrobe",
    label: "Dandani Calpal",
    icon: Sparkles,
  },
  { href: "/pet-customization/shop", label: "Toko Calpal", icon: ShoppingBag },
];

export function PetCustomizationTopBar() {
  const pathname = usePathname();
  const coins = usePetStore((state) => state.coins);
  const setCoins = usePetStore((state) => state.setCoins);
  const setOwnedItemIds = useCosmeticsStore((state) => state.setOwnedItemIds);

  const isShop = pathname.includes("/shop");

  // Synchronize coins & owned items from PostgreSQL database on mount
  useEffect(() => {
    let isMounted = true;
    getPetCustomizationStateAction().then((res) => {
      if (!isMounted || !res.success) return;
      if (res.coins !== null) {
        setCoins(res.coins);
      }
      if (res.ownedItemIds && res.ownedItemIds.length > 0) {
        setOwnedItemIds(res.ownedItemIds);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setCoins, setOwnedItemIds]);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-navigation bg-accent-green/15 text-text-primary shadow-2xs">
          {isShop ? (
            <ShoppingBag className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
          ) : (
            <Sparkles className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
          )}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary font-heading">
          {isShop ? "Toko Calpal" : "Dandani Calpal"}
        </h1>
      </div>

      {/* Controls: Currency Display & Page Toggle Pill */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Currency Display (Squircle) */}
        <div
          className="inline-flex h-10 items-center gap-2 rounded-navigation border border-border-default bg-accent-yellow px-3.5 text-xs sm:text-sm font-bold text-text-primary shadow-2xs transition-colors"
          title="Saldo Caloria Coins"
          aria-label={`Saldo Caloria Coins: ${coins} Koin`}
        >
          <Coins
            className="h-4 w-4 text-accent-orange shrink-0"
            aria-hidden="true"
          />
          <span suppressHydrationWarning className="tabular-nums">
            {coins} Koin
          </span>
        </div>

        {/* Page Toggle Pill (Squircle) */}
        <SegmentedToggle
          options={TOGGLES}
          label="Navigasi Kustomisasi Calpal"
        />
      </div>
    </header>
  );
}
