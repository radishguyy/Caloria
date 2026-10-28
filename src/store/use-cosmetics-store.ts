import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CosmeticCategory,
  COSMETICS_CATALOG,
  DEFAULT_FREE_ITEM_IDS,
} from "@/lib/cosmetics-catalog";
import { EquippedCosmetics } from "@/types";

export { DEFAULT_FREE_ITEM_IDS };

interface CosmeticsStoreState {
  ownedItemIds: string[];
  equipped: EquippedCosmetics;
  selectedCategory: CosmeticCategory;

  // Actions
  setSelectedCategory: (category: CosmeticCategory) => void;
  setOwnedItemIds: (ids: string[]) => void;
  addOwnedItem: (itemId: string) => void;
  buyItem: (
    itemId: string,
    userCoins: number,
    deductCoins: (amount: number) => void,
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
      // Every accessory starts locked and unowned by default; only free defaults are owned
      ownedItemIds: DEFAULT_FREE_ITEM_IDS,
      equipped: {
        head: "head-none",
        body: "body-none",
        glasses: "glasses-none",
        held: "held-none",
        skin: "skin-default",
        room: "room-default",
      },
      selectedCategory: "head",

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      setOwnedItemIds: (ids) => {
        // Guarantee default items are always included
        const merged = Array.from(new Set([...DEFAULT_FREE_ITEM_IDS, ...ids]));
        set({ ownedItemIds: merged });
      },

      addOwnedItem: (itemId) =>
        set((state) => ({
          ownedItemIds: state.ownedItemIds.includes(itemId)
            ? state.ownedItemIds
            : [...state.ownedItemIds, itemId],
        })),

      buyItem: (itemId, userCoins, deductCoins) => {
        const item = COSMETICS_CATALOG.find((i) => i.id === itemId);
        if (!item) {
          return { success: false, message: "Item tidak ditemukan." };
        }

        const state = get();
        if (state.ownedItemIds.includes(itemId)) {
          return {
            success: false,
            message: "Aksesori ini sudah kamu miliki!",
          };
        }

        if (userCoins < item.priceCoins) {
          return {
            success: false,
            message: `Caloria Coins tidak cukup! Butuh ${item.priceCoins} koin.`,
          };
        }

        // Deduct coins & add to inventory
        deductCoins(item.priceCoins);
        state.addOwnedItem(itemId);

        return {
          success: true,
          message: `Berhasil membeli ${item.name}! Aksesori telah ditambahkan ke koleksi.`,
        };
      },

      equipItem: (category, itemId) => {
        const state = get();
        // Check ownership (free items are always owned)
        if (!state.isItemOwned(itemId)) {
          return false;
        }

        set((s) => ({
          equipped: {
            ...s.equipped,
            [category]: itemId,
          },
        }));
        return true;
      },

      unequipItem: (category) => {
        const noneMap: Record<CosmeticCategory, string> = {
          head: "head-none",
          glasses: "glasses-none",
          body: "body-none",
          held: "held-none",
          skin: "skin-default",
          room: "room-default",
        };

        set((state) => ({
          equipped: {
            ...state.equipped,
            [category]: noneMap[category],
          },
        }));
      },

      setEquippedLoadout: (loadout) =>
        set((state) => ({
          equipped: {
            ...state.equipped,
            ...loadout,
          },
        })),

      isItemOwned: (itemId) => {
        const state = get();
        // Default items are always unlocked
        const item = COSMETICS_CATALOG.find((i) => i.id === itemId);
        if (item?.isDefaultFree || DEFAULT_FREE_ITEM_IDS.includes(itemId)) {
          return true;
        }
        return state.ownedItemIds.includes(itemId);
      },
    }),
    {
      name: "caloria-cosmetics-storage-v2",
      // Merge function ensures newly added default items or migrations don't break existing local cache
      merge: (persistedState, currentState) => {
        const typed = persistedState as Partial<CosmeticsStoreState>;
        const rawOwned = typed?.ownedItemIds || [];
        const mergedOwned = Array.from(
          new Set([...DEFAULT_FREE_ITEM_IDS, ...rawOwned]),
        );
        return {
          ...currentState,
          ...typed,
          ownedItemIds: mergedOwned,
          equipped: {
            ...currentState.equipped,
            ...(typed?.equipped || {}),
          },
        };
      },
    },
  ),
);
