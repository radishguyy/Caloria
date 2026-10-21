import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ExtendedFoodLog, MacroTargets, MacroCurrent, UserGoalPlan } from "@/types";
import { DEFAULT_NUTRITION_TARGETS, MealTypeId } from "@/lib/constants";

export interface NutritionFeedback {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  xpEarned: number;
  coinsEarned: number;
}

interface FoodStoreState {
  selectedDate: string;
  logs: ExtendedFoodLog[];
  targets: MacroTargets;
  goalPlan: UserGoalPlan;
  isLoading: boolean;
  searchQuery: string;
  latestFeedback: NutritionFeedback | null;

  // Actions
  setSelectedDate: (date: string) => void;
  setTargets: (targets: Partial<MacroTargets>) => void;
  setGoalPlan: (plan: Partial<UserGoalPlan>) => void;
  addLog: (log: Omit<ExtendedFoodLog, "id" | "userId" | "createdAt" | "loggedAt">) => NutritionFeedback;
  removeLog: (id: string) => void;
  setLogs: (logs: ExtendedFoodLog[]) => void;
  setSearchQuery: (query: string) => void;
  clearFeedback: () => void;

  // Computed Helpers
  getConsumed: () => MacroCurrent;
  getMealLogs: (mealType: MealTypeId) => ExtendedFoodLog[];
  getCaloriesRemaining: () => number;
}

const getTodayFormatted = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

export const useFoodStore = create<FoodStoreState>()(
  persist(
    (set, get) => ({
      selectedDate: getTodayFormatted(),
      logs: [
        {
          id: "sample-1",
          userId: "local-user",
          name: "Oatmeal dengan Susu & Pisang",
          mealType: "breakfast",
          calories: 320,
          proteinG: 12.5,
          carbsG: 54,
          fatG: 6.2,
          fiberG: 6.5,
          sugarG: 14,
          servingSize: 1,
          servingUnit: "mangkuk (240g)",
          loggedDate: getTodayFormatted(),
          loggedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: "sample-2",
          userId: "local-user",
          name: "Dada Ayam Panggang (Tanpa Kulit)",
          mealType: "lunch",
          calories: 248,
          proteinG: 46.5,
          carbsG: 0,
          fatG: 5.4,
          fiberG: 0,
          sugarG: 0,
          servingSize: 1,
          servingUnit: "potong (150g)",
          loggedDate: getTodayFormatted(),
          loggedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: "sample-3",
          userId: "local-user",
          name: "Nasi Merah",
          mealType: "lunch",
          calories: 165,
          proteinG: 3.8,
          carbsG: 34.5,
          fatG: 1.3,
          fiberG: 2.8,
          sugarG: 0.5,
          servingSize: 1,
          servingUnit: "centong (150g)",
          loggedDate: getTodayFormatted(),
          loggedAt: new Date(),
          createdAt: new Date(),
        },
      ],
      targets: {
        ...DEFAULT_NUTRITION_TARGETS,
        fiber: 28,
        sugar: 45,
      },
      goalPlan: {
        goalType: "diet",
        currentWeightKg: 75,
        targetWeightKg: 68,
        heightCm: 172,
        gender: "male",
        age: 24,
        activityLevel: "moderate",
        bmiScore: 25.4,
        bmiCategory: "Overweight",
        totalProjectedDays: 98,
        currentDayNumber: 12,
        dailyMarginKcal: -500,
        startDate: "2026-10-01",
      },
      isLoading: false,
      searchQuery: "",
      latestFeedback: null,

      setSelectedDate: (date: string) => set({ selectedDate: date }),

      setTargets: (newTargets: Partial<MacroTargets>) =>
        set((state) => ({
          targets: { ...state.targets, ...newTargets },
        })),

      setGoalPlan: (newPlan: Partial<UserGoalPlan>) =>
        set((state) => ({
          goalPlan: { ...state.goalPlan, ...newPlan },
        })),

      addLog: (logInput) => {
        const newLog: ExtendedFoodLog = {
          ...logInput,
          fiberG: logInput.fiberG ?? 0,
          sugarG: logInput.sugarG ?? 0,
          id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: "local-user",
          loggedAt: new Date(),
          createdAt: new Date(),
        };

        set((state) => ({
          logs: [newLog, ...state.logs],
        }));

        // Evaluate real-time nutrition mission feedback (Grand Design 3.A & 3.B)
        const consumed = get().getConsumed();
        const { targets, goalPlan } = get();
        const programLabel =
          goalPlan.goalType === "diet"
            ? "Diet"
            : goalPlan.goalType === "bulking"
            ? "Bulking"
            : "Maintenance";

        const proteinPct = Math.round((consumed.protein / targets.protein) * 100);
        const fatPct = Math.round((consumed.fat / targets.fat) * 100);
        const calPct = Math.round((consumed.calories / targets.calories) * 100);

        let feedback: NutritionFeedback;

        if (fatPct >= 85 && goalPlan.goalType === "diet") {
          feedback = {
            type: "warning",
            title: "Indikator Peringatan Lemak",
            message: `Asupan lemak hari ini sudah mencapai ${fatPct}% batas maksimal program ${programLabel}-mu. Pilih menu rendah minyak untuk waktu makan berikutnya ya!`,
            xpEarned: 20,
            coinsEarned: 5,
          };
        } else if (logInput.proteinG >= 20 || proteinPct >= 70) {
          feedback = {
            type: "success",
            title: "Misi Protein Ideal!",
            message: `Menu ${logInput.name} menyumbang ${logInput.proteinG}g Protein! Kamu sudah memenuhi ${Math.min(100, proteinPct)}% misi protein harian untuk program ${programLabel}-mu.`,
            xpEarned: 35,
            coinsEarned: 15,
          };
        } else if (calPct >= 85 && calPct <= 105) {
          feedback = {
            type: "success",
            title: "Target Kalori Harian Terpenuhi!",
            message: `Luar biasa! Total kalori harianmu (${consumed.calories} kkal) tepat berada di zona ideal program ${programLabel}. Jackpot XP & Caloria Coins ditambahkan!`,
            xpEarned: 50,
            coinsEarned: 25,
          };
        } else {
          feedback = {
            type: "info",
            title: "Catatan Makanan Tersimpan",
            message: `${logInput.name} (${logInput.calories} kkal) berhasil dicatat. Terus lengkapi nutrisi harianmu agar Pet semakin cepat naik level!`,
            xpEarned: 20,
            coinsEarned: 10,
          };
        }

        set({ latestFeedback: feedback });
        return feedback;
      },

      removeLog: (id: string) =>
        set((state) => ({
          logs: state.logs.filter((item) => item.id !== id),
        })),

      setLogs: (logs: ExtendedFoodLog[]) => set({ logs }),

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      clearFeedback: () => set({ latestFeedback: null }),

      getConsumed: () => {
        const { logs, selectedDate } = get();
        const dayLogs = logs.filter((log) => log.loggedDate === selectedDate);

        return dayLogs.reduce<MacroCurrent>(
          (acc, log) => ({
            calories: acc.calories + log.calories,
            protein: Math.round((acc.protein + log.proteinG) * 10) / 10,
            carbs: Math.round((acc.carbs + log.carbsG) * 10) / 10,
            fat: Math.round((acc.fat + log.fatG) * 10) / 10,
            fiber: Math.round((acc.fiber + (log.fiberG ?? 0)) * 10) / 10,
            sugar: Math.round((acc.sugar + (log.sugarG ?? 0)) * 10) / 10,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
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
    }),
    {
      name: "caloria-food-storage",
    }
  )
);
