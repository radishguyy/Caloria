import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CosmeticCategory, COSMETICS_CATALOG } from "@/lib/cosmetics-catalog";
import { EquippedCosmetics } from "@/types";

const DEFAULT_OWNED_IDS = [
  "head-none",
  "head-red-ribbon",
  "glasses-none",
  "body-none",
  "held-none",
  "skin-default",
  "room-default",
  // Everyday & Food starter collection unlocked for immediate customization
  "acc-round-glasses",
  "acc-rectangular-glasses",
  "acc-star-glasses",
  "acc-beanie",
  "acc-baseball-cap",
  "acc-bucket-hat",
  "acc-beret",
  "acc-bow",
  "acc-headphones",
  "acc-scarf",
  "acc-backpack",
  "acc-hoodie",
  "acc-lettuce-leaf-hat",
  "acc-strawberry-hair-clip",
  "acc-orange-slice",
  "acc-chef-hat",
  "acc-mini-burger",
  "acc-apple",
  "acc-carrot",
  "acc-rice-bowl",
  "acc-milk-carton",
  "acc-water-bottle",
  "acc-leafy-headband",
  "acc-fruit-hat",
];

interface CosmeticsStoreState {
  ownedItemIds: string[];
  equipped: EquippedCosmetics;
  selectedCategory: CosmeticCategory;

  // Actions
  setSelectedCategory: (category: CosmeticCategory) => void;
  buyItem: (
    itemId: string,
    userCoins: number,
    deductCoins: (amount: number) => void
  ) => {
    success: boolean;
    message: string;
  };
  equipItem: (category: CosmeticCategory, itemId: string) => boolean;
  unequipItem: (category: CosmeticCategory) => void;
  setEquippedLoadout: (loadout: Partial<EquippedCosmetics>) => void;
  isItemOwned: (itemId: string) => boolean;
}

export const useCosmeticsStore = create<CosmeticsStoreState>()(
  persist(
    (set, get) => ({
      ownedItemIds: DEFAULT_OWNED_IDS,
      equipped: {
        head: "head-red-ribbon",
        body: "body-none",
        glasses: "glasses-none",
        held: "held-none",
        skin: "skin-default",
        room: "room-default",
      },
      selectedCategory: "head",

      setSelectedCategory: (category: CosmeticCategory) =>
        set({ selectedCategory: category }),

      isItemOwned: (itemId: string) => {
        return get().ownedItemIds.includes(itemId);
      },

      buyItem: (
        itemId: string,
        userCoins: number,
        deductCoins: (amount: number) => void
      ) => {
        const item = COSMETICS_CATALOG.find((i) => i.id === itemId);
        if (!item) {
          return {
            success: false,
            message: "Item tidak ditemukan dalam katalog.",
          };
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

      setEquippedLoadout: (loadout: Partial<EquippedCosmetics>) => {
        set((state) => ({
          equipped: {
            ...state.equipped,
            ...loadout,
          },
        }));
      },
    }),
    {
      name: "caloria-cosmetics-storage",
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<CosmeticsStoreState>) || {};
        const mergedOwned = Array.from(
          new Set([
            ...DEFAULT_OWNED_IDS,
            ...(Array.isArray(persisted.ownedItemIds)
              ? persisted.ownedItemIds
              : []),
          ])
        );
        return {
          ...currentState,
          ...persisted,
          ownedItemIds: mergedOwned,
          equipped: {
            ...currentState.equipped,
            ...(persisted.equipped || {}),
          },
        };
      },
    }
  )
);
