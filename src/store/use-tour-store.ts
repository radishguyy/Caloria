import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TourId } from "@/lib/tour/types";

interface TourStoreState {
  seen: Partial<Record<TourId, boolean>>;
  markSeen: (id: TourId) => void;
  reset: (id: TourId) => void;
  resetAll: () => void;
}

export const useTourStore = create<TourStoreState>()(
  persist(
    (set) => ({
      seen: {},

      markSeen: (id) =>
        set((state) => ({
          seen: {
            ...state.seen,
            [id]: true,
          },
        })),

      reset: (id) =>
        set((state) => {
          const next = { ...state.seen };
          delete next[id];
          return { seen: next };
        }),

      resetAll: () => set({ seen: {} }),
    }),
    {
      name: "caloria-tour",
      partialize: (state) => ({ seen: state.seen }),
    },
  ),
);
