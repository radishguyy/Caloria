import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CosmeticCategory, COSMETICS_CATALOG } from "@/lib/cosmetics-catalog";
import { EquippedCosmetics } from "@/types";

interface CosmeticsStoreState {
  ownedItemIds: string[];
  equipped: EquippedCosmetics;
  selectedCategory: CosmeticCategory;

  // Actions
  setSelectedCategory: (category: CosmeticCategory) => void;
  buyItem: (itemId: string, userCoins: number, deductCoins: (amount: number) => void) => {
    success: boolean;
    message: string;
  };
  equipItem: (category: CosmeticCategory, itemId: string) => boolean;
  unequipItem: (category: CosmeticCategory) => void;
  isItemOwned: (itemId: string) => boolean;
}

export const useCosmeticsStore = create<CosmeticsStoreState>()(
  persist(
    (set, get) => ({
      ownedItemIds: [
        "head-none",
        "head-red-ribbon",
        "glasses-none",
        "body-none",
        "skin-default",
        "room-default",
      ],
      equipped: {
        head: "head-red-ribbon",
        body: "body-none",
        glasses: "glasses-none",
        skin: "skin-default",
        room: "room-default",
      },
      selectedCategory: "head",

      setSelectedCategory: (category: CosmeticCategory) => set({ selectedCategory: category }),

      isItemOwned: (itemId: string) => {
        return get().ownedItemIds.includes(itemId);
      },

      buyItem: (itemId: string, userCoins: number, deductCoins: (amount: number) => void) => {
        const item = COSMETICS_CATALOG.find((i) => i.id === itemId);
        if (!item) {
          return { success: false, message: "Item tidak ditemukan dalam katalog." };
        }

        if (get().ownedItemIds.includes(itemId)) {
          return { success: false, message: "Kamu sudah memiliki item ini!" };
        }

        if (userCoins < item.priceCoins) {
          return {
            success: false,
            message: `Koin Caloria tidak mencukupi. Butuh ${item.priceCoins} Koin (Saldo kamu: ${userCoins} Koin).`,
          };
        }

        // Deduct coins via callback to keep usePetStore as source of truth
        deductCoins(-item.priceCoins);

        set((state) => ({
          ownedItemIds: [...state.ownedItemIds, itemId],
        }));

        return {
          success: true,
          message: `Berhasil membeli ${item.name}! Item kini tersimpan di Wardrobe kamu.`,
        };
      },

      equipItem: (category: CosmeticCategory, itemId: string) => {
        if (!get().ownedItemIds.includes(itemId)) {
          return false;
        }

        set((state) => ({
          equipped: {
            ...state.equipped,
            [category]: itemId,
          },
        }));
        return true;
      },

      unequipItem: (category: CosmeticCategory) => {
        const defaultItem = COSMETICS_CATALOG.find(
          (i) => i.category === category && i.isDefaultFree
        );
        const fallbackId = defaultItem ? defaultItem.id : `${category}-none`;

        set((state) => ({
          equipped: {
            ...state.equipped,
            [category]: fallbackId,
          },
        }));
      },
    }),
    {
      name: "caloria-cosmetics-storage",
    }
  )
);

