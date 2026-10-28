import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ExtendedFoodLog,
  MacroTargets,
  MacroCurrent,
  UserGoalPlan,
  CustomFoodItem,
  FoodCatalogItem,
  DailyNutritionSummary,
  DailyComplianceStatus,
} from "@/types";
import { MealTypeId } from "@/lib/constants";
import { FOOD_CATALOG } from "@/lib/food-catalog";
import { formatDateKey, subDays } from "@/lib/date-utils";
import {
  calculateClinicalBenchmarks,
  calculateIMT,
  evaluateDepkesIntake,
  type ClinicalNutritionBenchmarks,
  type DepkesComplianceCode,
  type DepkesComplianceResult,
} from "@/lib/nutrition/calculations";
import {
  getDynamicQuestTargets,
  goalPathToGoalType,
  goalTypeToGoalPath,
  type DailyQuestPlan,
  type GoalPath,
} from "@/lib/gamification/quest-engine";
import { usePetStore } from "@/store/use-pet-store";

export interface NutritionFeedback {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  xpEarned: number;
}

export interface FoodStoreState {
  selectedDate: string;
  logs: ExtendedFoodLog[];
  customFoods: CustomFoodItem[];
  targets: MacroTargets;
  goalPlan: UserGoalPlan;
  isLoading: boolean;
  searchQuery: string;
  latestFeedback: NutritionFeedback | null;

  // Clinical & RPG Quest States
  depkesStatus: DepkesComplianceCode;
  waterLoggedMl: number;
  completedMissions: string[];

  // Actions
  setSelectedDate: (date: string) => void;
  setTargets: (targets: Partial<MacroTargets>) => void;
  setGoalPlan: (plan: Partial<UserGoalPlan>) => void;
  setQuestProgression: (params: {
    goalPath?: GoalPath;
    currentLevel?: number;
    currentWeek?: number;
  }) => void;
  addWater: (amountMl: number) => void;
  setWaterLoggedMl: (amountMl: number) => void;
  toggleMissionComplete: (
    missionId: string,
    xpReward?: number,
    coinReward?: number
  ) => boolean;
  addLog: (log: Omit<ExtendedFoodLog, "id" | "userId" | "createdAt" | "loggedAt">) => NutritionFeedback;
  addBatchLogs: (
    logs: Array<Omit<ExtendedFoodLog, "id" | "userId" | "createdAt" | "loggedAt">>,
    customFeedback?: NutritionFeedback
  ) => NutritionFeedback;
  addCustomFood: (food: Omit<CustomFoodItem, "id" | "createdAt">) => CustomFoodItem;
  removeLog: (id: string) => void;
  setLogs: (logs: ExtendedFoodLog[]) => void;
  setSearchQuery: (query: string) => void;
  clearFeedback: () => void;

  // Computed Helpers
  getConsumed: (date?: string) => MacroCurrent;
  getMealLogs: (mealType: MealTypeId, date?: string) => ExtendedFoodLog[];
  getCaloriesRemaining: (date?: string) => number;
  getRecentFoods: () => FoodCatalogItem[];
  getFrequentFoods: () => FoodCatalogItem[];
  getHistoricalMealLogs: (mealType: MealTypeId, daysAgo: number) => ExtendedFoodLog[];
  getLogsByDate: (dateString: string) => ExtendedFoodLog[];
  getDailySummary: (dateString: string) => DailyNutritionSummary;
  getDailySummariesForDates: (dateStrings: string[]) => Record<string, DailyNutritionSummary>;
  getQuestPlan: () => DailyQuestPlan;
  getDepkesEvaluation: (date?: string) => DepkesComplianceResult;
  getClinicalBenchmarks: () => ClinicalNutritionBenchmarks;
}

const getTodayFormatted = () => {
  return formatDateKey(new Date());
};

const createInitialLogs = (): ExtendedFoodLog[] => {
  const now = new Date();
  const todayStr = formatDateKey(now);
  const dayMinus1 = formatDateKey(subDays(now, 1));
  const dayMinus2 = formatDateKey(subDays(now, 2));
  const dayMinus3 = formatDateKey(subDays(now, 3));
  const dayMinus4 = formatDateKey(subDays(now, 4));
  const dayMinus5 = formatDateKey(subDays(now, 5));

  return [
    // Today
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
      loggedDate: todayStr,
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
      loggedDate: todayStr,
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
      loggedDate: todayStr,
      loggedAt: new Date(),
      createdAt: new Date(),
    },

    // Yesterday: Target Hit (Goal Met) ~2,030 kcal
    {
      id: "sample-y-1",
      userId: "local-user",
      name: "Telur Rebus & Roti Gandum",
      mealType: "breakfast",
      calories: 310,
      proteinG: 18.2,
      carbsG: 32,
      fatG: 11,
      fiberG: 4.5,
      sugarG: 3,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus1,
      loggedAt: subDays(now, 1),
      createdAt: subDays(now, 1),
    },
    {
      id: "sample-y-2",
      userId: "local-user",
      name: "Nasi Merah & Ayam Bakar Madu",
      mealType: "lunch",
      calories: 620,
      proteinG: 44,
      carbsG: 68,
      fatG: 14.5,
      fiberG: 5.2,
      sugarG: 8,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus1,
      loggedAt: subDays(now, 1),
      createdAt: subDays(now, 1),
    },
    {
      id: "sample-y-3",
      userId: "local-user",
      name: "Salmon Panggang & Salad Sayur",
      mealType: "dinner",
      calories: 580,
      proteinG: 42,
      carbsG: 22,
      fatG: 24,
      fiberG: 6.8,
      sugarG: 4,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus1,
      loggedAt: subDays(now, 1),
      createdAt: subDays(now, 1),
    },
    {
      id: "sample-y-4",
      userId: "local-user",
      name: "Greek Yogurt & Campuran Berry",
      mealType: "snack",
      calories: 220,
      proteinG: 17,
      carbsG: 24,
      fatG: 3.5,
      fiberG: 4,
      sugarG: 16,
      servingSize: 1,
      servingUnit: "cup (200g)",
      loggedDate: dayMinus1,
      loggedAt: subDays(now, 1),
      createdAt: subDays(now, 1),
    },
    {
      id: "sample-y-5",
      userId: "local-user",
      name: "Kacang Almond Panggang",
      mealType: "snack",
      calories: 160,
      proteinG: 6,
      carbsG: 6,
      fatG: 14,
      fiberG: 3.5,
      sugarG: 1.2,
      servingSize: 1,
      servingUnit: "genggam (28g)",
      loggedDate: dayMinus1,
      loggedAt: subDays(now, 1),
      createdAt: subDays(now, 1),
    },

    // 2 Days Ago: Under Target ~1,240 kcal
    {
      id: "sample-2d-1",
      userId: "local-user",
      name: "Bubur Ayam Praktis",
      mealType: "breakfast",
      calories: 340,
      proteinG: 14,
      carbsG: 46,
      fatG: 8,
      fiberG: 1.5,
      sugarG: 2,
      servingSize: 1,
      servingUnit: "mangkuk",
      loggedDate: dayMinus2,
      loggedAt: subDays(now, 2),
      createdAt: subDays(now, 2),
    },
    {
      id: "sample-2d-2",
      userId: "local-user",
      name: "Gado-Gado Lontong",
      mealType: "lunch",
      calories: 520,
      proteinG: 19,
      carbsG: 62,
      fatG: 21,
      fiberG: 8.5,
      sugarG: 12,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus2,
      loggedAt: subDays(now, 2),
      createdAt: subDays(now, 2),
    },
    {
      id: "sample-2d-3",
      userId: "local-user",
      name: "Sup Jagung Telur & Tahu Rebus",
      mealType: "dinner",
      calories: 380,
      proteinG: 22,
      carbsG: 35,
      fatG: 9,
      fiberG: 4,
      sugarG: 6,
      servingSize: 1,
      servingUnit: "mangkuk",
      loggedDate: dayMinus2,
      loggedAt: subDays(now, 2),
      createdAt: subDays(now, 2),
    },

    // 3 Days Ago: Target Hit ~2,070 kcal
    {
      id: "sample-3d-1",
      userId: "local-user",
      name: "Smoothie Pisang Protein & Chia",
      mealType: "breakfast",
      calories: 380,
      proteinG: 28,
      carbsG: 48,
      fatG: 6,
      fiberG: 7,
      sugarG: 18,
      servingSize: 1,
      servingUnit: "gelas besar",
      loggedDate: dayMinus3,
      loggedAt: subDays(now, 3),
      createdAt: subDays(now, 3),
    },
    {
      id: "sample-3d-2",
      userId: "local-user",
      name: "Nasi Liwet & Pepes Ikan Mas",
      mealType: "lunch",
      calories: 640,
      proteinG: 45,
      carbsG: 72,
      fatG: 14,
      fiberG: 4.5,
      sugarG: 3,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus3,
      loggedAt: subDays(now, 3),
      createdAt: subDays(now, 3),
    },
    {
      id: "sample-3d-3",
      userId: "local-user",
      name: "Steak Tempe Saus Lada Hitam & Buncis",
      mealType: "dinner",
      calories: 510,
      proteinG: 32,
      carbsG: 46,
      fatG: 18,
      fiberG: 11,
      sugarG: 6,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus3,
      loggedAt: subDays(now, 3),
      createdAt: subDays(now, 3),
    },
    {
      id: "sample-3d-4",
      userId: "local-user",
      name: "Edamame Rebus",
      mealType: "snack",
      calories: 140,
      proteinG: 12,
      carbsG: 10,
      fatG: 5,
      fiberG: 5.5,
      sugarG: 2,
      servingSize: 1,
      servingUnit: "mangkuk kecil",
      loggedDate: dayMinus3,
      loggedAt: subDays(now, 3),
      createdAt: subDays(now, 3),
    },

    // 4 Days Ago: Target Hit ~1,990 kcal
    {
      id: "sample-4d-1",
      userId: "local-user",
      name: "Roti Panggang Alpukat & Telur Mata Sapi",
      mealType: "breakfast",
      calories: 420,
      proteinG: 16,
      carbsG: 38,
      fatG: 22,
      fiberG: 8,
      sugarG: 3,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus4,
      loggedAt: subDays(now, 4),
      createdAt: subDays(now, 4),
    },
    {
      id: "sample-4d-2",
      userId: "local-user",
      name: "Soto Ayam Lamongan & Nasi Putih",
      mealType: "lunch",
      calories: 590,
      proteinG: 38,
      carbsG: 66,
      fatG: 16,
      fiberG: 3,
      sugarG: 4,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus4,
      loggedAt: subDays(now, 4),
      createdAt: subDays(now, 4),
    },
    {
      id: "sample-4d-3",
      userId: "local-user",
      name: "Capcay Seafood Kuah Kental",
      mealType: "dinner",
      calories: 460,
      proteinG: 36,
      carbsG: 34,
      fatG: 12,
      fiberG: 6.5,
      sugarG: 7,
      servingSize: 1,
      servingUnit: "porsi besar",
      loggedDate: dayMinus4,
      loggedAt: subDays(now, 4),
      createdAt: subDays(now, 4),
    },

    // 5 Days Ago: Over Target ~2,420 kcal
    {
      id: "sample-5d-1",
      userId: "local-user",
      name: "Lontong Sayur Betawi Komplit",
      mealType: "breakfast",
      calories: 550,
      proteinG: 20,
      carbsG: 68,
      fatG: 23,
      fiberG: 4,
      sugarG: 5,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus5,
      loggedAt: subDays(now, 5),
      createdAt: subDays(now, 5),
    },
    {
      id: "sample-5d-2",
      userId: "local-user",
      name: "Nasi Padang Rendang Daging & Gulai Daun Singkong",
      mealType: "lunch",
      calories: 880,
      proteinG: 45,
      carbsG: 82,
      fatG: 39,
      fiberG: 5,
      sugarG: 6,
      servingSize: 1,
      servingUnit: "porsi",
      loggedDate: dayMinus5,
      loggedAt: subDays(now, 5),
      createdAt: subDays(now, 5),
    },
    {
      id: "sample-5d-3",
      userId: "local-user",
      name: "Sate Ayam Madura & Lontong",
      mealType: "dinner",
      calories: 670,
      proteinG: 42,
      carbsG: 52,
      fatG: 28,
      fiberG: 3,
      sugarG: 14,
      servingSize: 1,
      servingUnit: "10 tusuk",
      loggedDate: dayMinus5,
      loggedAt: subDays(now, 5),
      createdAt: subDays(now, 5),
    },
    {
      id: "sample-5d-4",
      userId: "local-user",
      name: "Martabak Manis Coklat Keju",
      mealType: "snack",
      calories: 320,
      proteinG: 7,
      carbsG: 46,
      fatG: 15,
      fiberG: 2,
      sugarG: 28,
      servingSize: 1,
      servingUnit: "1 potong",
      loggedDate: dayMinus5,
      loggedAt: subDays(now, 5),
      createdAt: subDays(now, 5),
    },
  ];
};

const INITIAL_GOAL_PLAN: UserGoalPlan = {
  goalType: "diet",
  goalPath: "lose_weight",
  currentLevel: 2,
  currentWeek: 1,
  streakConsecutiveLogs: 7,
  currentWeightKg: 76,
  targetWeightKg: 70,
  heightCm: 183,
  gender: "male",
  age: 20,
  activityLevel: "moderate",
  bmiScore: 22.69,
  bmiCategory: "Normal",
  totalProjectedDays: 98,
  currentDayNumber: 12,
  dailyMarginKcal: -100,
  startDate: "2026-10-01",
};

const computeTargetsFromPlan = (plan: UserGoalPlan): MacroTargets => {
  const goalPath = plan.goalPath || goalTypeToGoalPath(plan.goalType);
  const { calorieTarget, macroTargets } = getDynamicQuestTargets({
    weightKg: plan.currentWeightKg,
    heightCm: plan.heightCm,
    age: plan.age,
    gender: plan.gender,
    goalPath,
    currentLevel: plan.currentLevel || 1,
    currentWeek: plan.currentWeek || 1,
  });

  return {
    calories: Math.round(calorieTarget),
    protein: Math.round(macroTargets.proteinGrams),
    carbs: Math.round(macroTargets.carbGrams),
    fat: Math.round(macroTargets.fatGrams),
    fiber: macroTargets.fiberGrams ?? 28,
    sugar: macroTargets.sugarGramsMax ?? 50,
    waterMl: 1500,
  };
};

export const useFoodStore = create<FoodStoreState>()(
  persist(
    (set, get) => ({
      selectedDate: getTodayFormatted(),
      logs: createInitialLogs(),
      customFoods: [
        {
          id: "custom-sample-1",
          name: "Smoothie Protein Pisang & Berry",
          category: "Minuman & Camilan",
          calories: 210,
          proteinG: 24,
          carbsG: 22,
          fatG: 2.5,
          fiberG: 4,
          sugarG: 12,
          defaultServingSize: 1,
          servingUnit: "gelas (300ml)",
          gramsPerUnit: 300,
          origin: "home_cooked",
          visibility: "private",
          tags: ["smoothie", "protein", "pisang"],
          createdAt: "2026-10-20T08:00:00Z",
        },
      ],
      targets: computeTargetsFromPlan(INITIAL_GOAL_PLAN),
      goalPlan: INITIAL_GOAL_PLAN,
      isLoading: false,
      searchQuery: "",
      latestFeedback: null,
      depkesStatus: "defisit_berat",
      waterLoggedMl: 750,
      completedMissions: [],

      setSelectedDate: (date: string) => set({ selectedDate: date }),

      setTargets: (newTargets: Partial<MacroTargets>) =>
        set((state) => ({
          targets: { ...state.targets, ...newTargets },
        })),

      setGoalPlan: (newPlan: Partial<UserGoalPlan>) =>
        set((state) => {
          const updatedPlan: UserGoalPlan = {
            ...state.goalPlan,
            ...newPlan,
          };
          if (newPlan.goalPath && !newPlan.goalType) {
            updatedPlan.goalType = goalPathToGoalType(newPlan.goalPath);
          } else if (newPlan.goalType && !newPlan.goalPath) {
            updatedPlan.goalPath = goalTypeToGoalPath(newPlan.goalType);
          }

          const imtEval = calculateIMT(updatedPlan.currentWeightKg, updatedPlan.heightCm);
          updatedPlan.bmiScore = imtEval.imt;
          updatedPlan.bmiCategory = imtEval.category;

          const questPlan = getDynamicQuestTargets({
            weightKg: updatedPlan.currentWeightKg,
            heightCm: updatedPlan.heightCm,
            age: updatedPlan.age,
            gender: updatedPlan.gender,
            goalPath: updatedPlan.goalPath || goalTypeToGoalPath(updatedPlan.goalType),
            currentLevel: updatedPlan.currentLevel || 1,
            currentWeek: updatedPlan.currentWeek || 1,
          });
          updatedPlan.dailyMarginKcal = questPlan.calorieOffset;

          const nextTargets = computeTargetsFromPlan(updatedPlan);
          const consumed = get().getConsumed();
          const depkes = evaluateDepkesIntake(consumed.calories, nextTargets.calories);

          return {
            goalPlan: updatedPlan,
            targets: nextTargets,
            depkesStatus: depkes.code,
          };
        }),

      setQuestProgression: ({ goalPath, currentLevel, currentWeek }) => {
        const currentPlan = get().goalPlan;
        const resolvedPath =
          goalPath ?? currentPlan.goalPath ?? goalTypeToGoalPath(currentPlan.goalType);
        const resolvedLevel = currentLevel ?? currentPlan.currentLevel ?? 1;
        const resolvedWeek = currentWeek ?? currentPlan.currentWeek ?? 1;

        get().setGoalPlan({
          goalPath: resolvedPath,
          goalType: goalPathToGoalType(resolvedPath),
          currentLevel: resolvedLevel,
          currentWeek: resolvedWeek,
        });
      },

      addWater: (amountMl: number) => {
        const nextWater = Math.max(0, Math.min(4000, get().waterLoggedMl + amountMl));
        get().setWaterLoggedMl(nextWater);
      },

      setWaterLoggedMl: (amountMl: number) => {
        const clamped = Math.max(0, Math.min(4000, amountMl));
        const questPlan = get().getQuestPlan();
        const waterMission = questPlan.sideMissions.find((m) => m.type === "water");
        const currentCompleted = get().completedMissions;

        let nextCompleted = [...currentCompleted];
        if (waterMission) {
          const isAlreadyDone = currentCompleted.includes(waterMission.id);
          if (clamped >= waterMission.targetValue && !isAlreadyDone) {
            nextCompleted.push(waterMission.id);
            usePetStore.getState().gainExp(waterMission.xpReward ?? 25);
            usePetStore.getState().addCoins(waterMission.coinReward ?? 10);
          } else if (clamped < waterMission.targetValue && isAlreadyDone) {
            nextCompleted = nextCompleted.filter((id) => id !== waterMission.id);
          }
        }

        set({
          waterLoggedMl: clamped,
          completedMissions: nextCompleted,
        });
      },

      toggleMissionComplete: (missionId: string, xpReward = 30, coinReward = 15) => {
        const current = get().completedMissions;
        const exists = current.includes(missionId);

        if (exists) {
          set({
            completedMissions: current.filter((id) => id !== missionId),
          });
          return false;
        } else {
          set({
            completedMissions: [...current, missionId],
          });
          usePetStore.getState().gainExp(xpReward);
          usePetStore.getState().addCoins(coinReward);
          return true;
        }
      },

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
          };
        } else if (logInput.proteinG >= 20 || proteinPct >= 70) {
          feedback = {
            type: "success",
            title: "Misi Protein Ideal!",
            message: `Menu ${logInput.name} menyumbang ${logInput.proteinG}g Protein! Kamu sudah memenuhi ${Math.min(100, proteinPct)}% misi protein harian untuk program ${programLabel}-mu.`,
            xpEarned: 35,
          };
        } else if (calPct >= 85 && calPct <= 105) {
          feedback = {
            type: "success",
            title: "Target Kalori Harian Terpenuhi!",
            message: `Luar biasa! Total kalori harianmu (${consumed.calories} kkal) tepat berada di zona ideal program ${programLabel}. Jackpot XP ditambahkan!`,
            xpEarned: 50,
          };
        } else {
          feedback = {
            type: "info",
            title: "Catatan Makanan Tersimpan",
            message: `${logInput.name} (${logInput.calories} kkal) berhasil dicatat. Terus lengkapi nutrisi harianmu agar Pet semakin cepat naik level!`,
            xpEarned: 20,
          };
        }

        const depkes = evaluateDepkesIntake(consumed.calories, targets.calories);
        set({ latestFeedback: feedback, depkesStatus: depkes.code });
        return feedback;
      },

      addBatchLogs: (logInputs, customFeedback) => {
        const newLogs: ExtendedFoodLog[] = logInputs.map((input, idx) => ({
          ...input,
          fiberG: input.fiberG ?? 0,
          sugarG: input.sugarG ?? 0,
          id: `food-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          userId: "local-user",
          loggedAt: new Date(),
          createdAt: new Date(),
        }));

        set((state) => ({
          logs: [...newLogs, ...state.logs],
        }));

        const feedback: NutritionFeedback = customFeedback ?? {
          type: "success",
          title: `${logInputs.length} Menu Berhasil Dicatat!`,
          message: `${logInputs.length} item berhasil ditambahkan ke diary.`,
          xpEarned: 25 + Math.max(0, logInputs.length - 1) * 15,
        };

        const consumed = get().getConsumed();
        const depkes = evaluateDepkesIntake(consumed.calories, get().targets.calories);
        set({ latestFeedback: feedback, depkesStatus: depkes.code });
        return feedback;
      },

      addCustomFood: (foodInput) => {
        const newFood: CustomFoodItem = {
          ...foodInput,
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customFoods: [newFood, ...state.customFoods],
        }));
        return newFood;
      },

      removeLog: (id: string) => {
        set((state) => ({
          logs: state.logs.filter((item) => item.id !== id),
        }));
        const consumed = get().getConsumed();
        const depkes = evaluateDepkesIntake(consumed.calories, get().targets.calories);
        set({ depkesStatus: depkes.code });
      },

      setLogs: (logs: ExtendedFoodLog[]) => set({ logs }),

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      clearFeedback: () => set({ latestFeedback: null }),

      getConsumed: (targetDate?: string) => {
        const { logs, selectedDate } = get();
        const dateToUse = targetDate || selectedDate;
        const dayLogs = logs.filter((log) => log.loggedDate === dateToUse);

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

      getMealLogs: (mealType: MealTypeId, targetDate?: string) => {
        const { logs, selectedDate } = get();
        const dateToUse = targetDate || selectedDate;
        return logs.filter(
          (log) => log.loggedDate === dateToUse && log.mealType === mealType
        );
      },

      getCaloriesRemaining: (targetDate?: string) => {
        const { targets } = get();
        const consumed = get().getConsumed(targetDate);
        return Math.max(0, targets.calories - consumed.calories);
      },

      getLogsByDate: (dateString: string) => {
        const { logs } = get();
        return logs.filter((log) => log.loggedDate === dateString);
      },

      getDailySummary: (dateString: string): DailyNutritionSummary => {
        const { logs, targets } = get();
        const dayLogs = logs.filter((log) => log.loggedDate === dateString);

        const consumed = dayLogs.reduce<MacroCurrent>(
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

        const calTarget = targets.calories || 2100;
        const percentage = Math.round((consumed.calories / calTarget) * 100);

        let status: DailyComplianceStatus = "empty";
        if (dayLogs.length > 0) {
          if (percentage >= 85 && percentage <= 110) {
            status = "hit";
          } else if (percentage < 85) {
            status = "under";
          } else {
            status = "over";
          }
        }

        const proteinPct = Math.round((consumed.protein / (targets.protein || 130)) * 100);
        const carbsPct = Math.round((consumed.carbs / (targets.carbs || 230)) * 100);
        const fatPct = Math.round((consumed.fat / (targets.fat || 55)) * 100);

        const macroStatus = {
          protein: (proteinPct >= 80 ? "hit" : "under") as "hit" | "under" | "over",
          carbs: (carbsPct >= 75 && carbsPct <= 115 ? "hit" : carbsPct < 75 ? "under" : "over") as "hit" | "under" | "over",
          fat: (fatPct <= 105 ? "hit" : "over") as "hit" | "under" | "over",
        };

        const baseXp = dayLogs.length * 25;
        const bonusXp = status === "hit" ? 50 : 0;
        const xpEarned = dayLogs.length > 0 ? baseXp + bonusXp : 0;

        const baseCoins = dayLogs.length * 10;
        const bonusCoins = status === "hit" ? 25 : 0;
        const coinsEarned = dayLogs.length > 0 ? baseCoins + bonusCoins : 0;

        return {
          date: dateString,
          consumed,
          target: targets,
          percentage,
          status,
          macroStatus,
          xpEarned,
          coinsEarned,
          hasLogs: dayLogs.length > 0,
          logs: dayLogs,
        };
      },

      getDailySummariesForDates: (dateStrings: string[]) => {
        const result: Record<string, DailyNutritionSummary> = {};
        for (const dateStr of dateStrings) {
          result[dateStr] = get().getDailySummary(dateStr);
        }
        return result;
      },

      getRecentFoods: () => {
        const { logs, customFoods } = get();
        const catalogPool: FoodCatalogItem[] = [...customFoods, ...FOOD_CATALOG];
        const seenNames = new Set<string>();
        const results: FoodCatalogItem[] = [];

        // Traverse logs newest first
        for (const log of logs) {
          const normName = log.name.trim().toLowerCase();
          if (seenNames.has(normName)) continue;
          seenNames.add(normName);

          const matched = catalogPool.find(
            (c) => c.name.toLowerCase() === normName
          );
          if (matched) {
            results.push(matched);
          } else {
            results.push({
              id: `log-ref-${log.id}`,
              name: log.name,
              category: "Baru Dimakan",
              calories: Math.round(log.calories / (log.servingSize || 1)),
              proteinG: Math.round((log.proteinG / (log.servingSize || 1)) * 10) / 10,
              carbsG: Math.round((log.carbsG / (log.servingSize || 1)) * 10) / 10,
              fatG: Math.round((log.fatG / (log.servingSize || 1)) * 10) / 10,
              fiberG: Math.round(((log.fiberG ?? 0) / (log.servingSize || 1)) * 10) / 10,
              sugarG: Math.round(((log.sugarG ?? 0) / (log.servingSize || 1)) * 10) / 10,
              defaultServingSize: 1,
              servingUnit: log.servingUnit || "porsi",
              gramsPerUnit: 100,
            });
          }

          if (results.length >= 10) break;
        }

        return results;
      },

      getFrequentFoods: () => {
        const { logs, customFoods } = get();
        const catalogPool: FoodCatalogItem[] = [...customFoods, ...FOOD_CATALOG];
        const counts: Record<string, number> = {};

        logs.forEach((log) => {
          const normName = log.name.trim().toLowerCase();
          counts[normName] = (counts[normName] || 0) + 1;
        });

        const sortedNames = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name]) => name);

        const results: FoodCatalogItem[] = [];
        for (const name of sortedNames) {
          const matched = catalogPool.find(
            (c) => c.name.toLowerCase() === name
          );
          if (matched) {
            results.push(matched);
          }
        }

        return results.length > 0 ? results : FOOD_CATALOG.slice(0, 8);
      },

      getHistoricalMealLogs: (mealType: MealTypeId, daysAgo: number) => {
        const { logs, selectedDate } = get();
        const baseDate = new Date(selectedDate);
        baseDate.setDate(baseDate.getDate() - daysAgo);
        const targetDateStr = baseDate.toISOString().split("T")[0];
        return logs.filter(
          (log) => log.loggedDate === targetDateStr && log.mealType === mealType
        );
      },

      getQuestPlan: (): DailyQuestPlan => {
        const { goalPlan } = get();
        const goalPath = goalPlan.goalPath || goalTypeToGoalPath(goalPlan.goalType);
        return getDynamicQuestTargets({
          weightKg: goalPlan.currentWeightKg,
          heightCm: goalPlan.heightCm,
          age: goalPlan.age,
          gender: goalPlan.gender,
          goalPath,
          currentLevel: goalPlan.currentLevel || 1,
          currentWeek: goalPlan.currentWeek || 1,
        });
      },

      getDepkesEvaluation: (targetDate?: string): DepkesComplianceResult => {
        const consumed = get().getConsumed(targetDate);
        const { targets } = get();
        return evaluateDepkesIntake(consumed.calories, targets.calories);
      },

      getClinicalBenchmarks: (): ClinicalNutritionBenchmarks => {
        const { goalPlan } = get();
        return calculateClinicalBenchmarks({
          gender: goalPlan.gender,
          age: goalPlan.age,
          weightKg: goalPlan.currentWeightKg,
          heightCm: goalPlan.heightCm,
        });
      },
    }),
    {
      name: "caloria-food-storage",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2 || !persistedState) {
          return {
            ...persistedState,
            goalPlan: {
              ...INITIAL_GOAL_PLAN,
              ...(persistedState?.goalPlan || {}),
              goalPath:
                persistedState?.goalPlan?.goalPath ||
                goalTypeToGoalPath(persistedState?.goalPlan?.goalType),
              currentLevel: persistedState?.goalPlan?.currentLevel || 1,
              currentWeek: persistedState?.goalPlan?.currentWeek || 1,
            },
            depkesStatus: persistedState?.depkesStatus || "defisit_berat",
            waterLoggedMl: persistedState?.waterLoggedMl ?? 750,
            completedMissions: persistedState?.completedMissions || [],
          };
        }
        return persistedState;
      },
    }
  )
);
