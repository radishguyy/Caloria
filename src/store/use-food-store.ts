import { create } from "zustand";
import { FoodLog, MacroTargets, MacroCurrent } from "@/types";
import { DEFAULT_NUTRITION_TARGETS, MealTypeId } from "@/lib/constants";

interface FoodStoreState {
  selectedDate: string;
  logs: FoodLog[];
  targets: MacroTargets;
  isLoading: boolean;
  searchQuery: string;

  // Actions
  setSelectedDate: (date: string) => void;
  setTargets: (targets: Partial<MacroTargets>) => void;
  addLog: (log: Omit<FoodLog, "id" | "userId" | "createdAt" | "loggedAt">) => void;
  removeLog: (id: string) => void;
  setLogs: (logs: FoodLog[]) => void;
  setSearchQuery: (query: string) => void;

  // Computed Helpers
  getConsumed: () => MacroCurrent;
  getMealLogs: (mealType: MealTypeId) => FoodLog[];
  getCaloriesRemaining: () => number;
}

const getTodayFormatted = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

export const useFoodStore = create<FoodStoreState>((set, get) => ({
  selectedDate: getTodayFormatted(),
  logs: [
    {
      id: "sample-1",
      userId: "local-user",
      name: "Oatmeal dengan Susu & Pisang",
      mealType: "breakfast",
      calories: 380,
      proteinG: 14,
      carbsG: 62,
      fatG: 7,
      servingSize: 1,
      servingUnit: "mangkuk",
      loggedDate: getTodayFormatted(),
      loggedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "sample-2",
      userId: "local-user",
      name: "Dada Ayam Panggang & Nasi Merah",
      mealType: "lunch",
      calories: 520,
      proteinG: 45,
      carbsG: 50,
      fatG: 12,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: getTodayFormatted(),
      loggedAt: new Date(),
      createdAt: new Date(),
    },
  ],
  targets: DEFAULT_NUTRITION_TARGETS,
  isLoading: false,
  searchQuery: "",

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  
  setTargets: (newTargets: Partial<MacroTargets>) =>
    set((state) => ({
      targets: { ...state.targets, ...newTargets },
    })),

  addLog: (logInput) =>
    set((state) => {
      const newLog: FoodLog = {
        ...logInput,
        id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: "local-user",
        loggedAt: new Date(),
        createdAt: new Date(),
      };
      return { logs: [newLog, ...state.logs] };
    }),

  removeLog: (id: string) =>
    set((state) => ({
      logs: state.logs.filter((item) => item.id !== id),
    })),

  setLogs: (logs: FoodLog[]) => set({ logs }),
  
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  getConsumed: () => {
    const { logs, selectedDate } = get();
    const dayLogs = logs.filter((log) => log.loggedDate === selectedDate);
    
    return dayLogs.reduce<MacroCurrent>(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: Math.round((acc.protein + log.proteinG) * 10) / 10,
        carbs: Math.round((acc.carbs + log.carbsG) * 10) / 10,
        fat: Math.round((acc.fat + log.fatG) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  },

  getMealLogs: (mealType: MealTypeId) => {
    const { logs, selectedDate } = get();
    return logs.filter(
      (log) => log.loggedDate === selectedDate && log.mealType === mealType
    );
  },

  getCaloriesRemaining: () => {
    const { targets } = get();
    const consumed = get().getConsumed();
    return Math.max(0, targets.calories - consumed.calories);
  },
}));
