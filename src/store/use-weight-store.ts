import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WeightLogEntry } from "@/types";

interface WeightStoreState {
  weightLogs: WeightLogEntry[];
  
  // Actions
  setWeightLogs: (logs: WeightLogEntry[]) => void;
  addWeightLog: (weightKg: number, notes?: string, customDate?: string) => WeightLogEntry;
  removeWeightLog: (id: string) => void;
  getLatestWeight: () => number;
  getWeightDifference: (targetWeight: number) => {
    diffKg: number;
    hasReachedTarget: boolean;
  };
}

export const useWeightStore = create<WeightStoreState>()(
  persist(
    (set, get) => ({
      weightLogs: [],

      setWeightLogs: (logs: WeightLogEntry[]) => set({ weightLogs: logs }),

      addWeightLog: (weightKg: number, notes?: string, customDate?: string) => {
        const dateStr = customDate || new Date().toISOString().split("T")[0];
        const newEntry: WeightLogEntry = {
          id: `w-log-${Date.now()}`,
          date: dateStr,
          weightKg: Math.round(weightKg * 10) / 10,
          notes: notes || "Pencatatan berat badan berkala",
        };

        set((state) => ({
          weightLogs: [...state.weightLogs, newEntry].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        }));

        return newEntry;
      },

      removeWeightLog: (id: string) =>
        set((state) => ({
          weightLogs: state.weightLogs.filter((entry) => entry.id !== id),
        })),

      getLatestWeight: () => {
        const logs = get().weightLogs;
        if (logs.length === 0) return 70.0;
        return logs[logs.length - 1].weightKg;
      },

      getWeightDifference: (targetWeight: number) => {
        const latest = get().getLatestWeight();
        const diffKg = Math.round(Math.abs(latest - targetWeight) * 10) / 10;
        const hasReachedTarget = Math.abs(latest - targetWeight) <= 0.2;
        return { diffKg, hasReachedTarget };
      },
    }),
    {
      name: "caloria-weight-storage",
    }
  )
);
