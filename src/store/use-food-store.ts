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
  evaluateMissionAutoStatus,
  calculateWeeklyProgression,
  type DailyQuestPlan,
  type GoalPath,
  type QuestMainMission,
  type QuestSideMission,
  type MissionAutoStatus,
  type WeeklyProgressionResult,
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
  getWeeklyProgression: () => WeeklyProgressionResult;
  getEvaluatedMissions: (targetDate?: string) => Array<{
    mission: QuestMainMission | QuestSideMission;
    status: MissionAutoStatus;
    isMain: boolean;
  }>;
}

const getTodayFormatted = () => {
  return formatDateKey(new Date());
};

const createInitialLogs = (): ExtendedFoodLog[] => {
  return [];
};

const INITIAL_GOAL_PLAN: UserGoalPlan = {
  goalType: "diet",
  goalPath: "lose_weight",
  currentLevel: 1,
  currentWeek: 1,
  streakConsecutiveLogs: 0,
  currentWeightKg: 70,
  targetWeightKg: 65,
  heightCm: 170,
  gender: "male",
  age: 25,
  activityLevel: "moderate",
  bmiScore: 24.22,
  bmiCategory: "Normal",
  totalProjectedDays: 90,
  currentDayNumber: 1,
  dailyMarginKcal: -500,
  startDate: getTodayFormatted(),
};

const autoEvaluateAndSyncMissions = (
  consumed: MacroCurrent,
  dayLogs: ExtendedFoodLog[],
  waterLoggedMl: number,
  questPlan: DailyQuestPlan,
  currentCompleted: string[]
): string[] => {
  let nextCompleted = [...currentCompleted];
  const allMissions = [
    ...questPlan.mainMissions,
    ...questPlan.sideMissions,
  ];

  for (const item of allMissions) {
    const status = evaluateMissionAutoStatus(item, {
      consumedCalories: consumed.calories,
      consumedProtein: consumed.protein,
      consumedCarbs: consumed.carbs,
      consumedFat: consumed.fat,
      consumedFiber: consumed.fiber,
      consumedSugar: consumed.sugar,
      targetCalories: questPlan.calorieTarget,
      dayLogsCount: dayLogs.length,
      waterLoggedMl,
    });

    const isAlreadyDone = nextCompleted.includes(item.id);
    if (status.isCompleted && !isAlreadyDone) {
      nextCompleted.push(item.id);
      usePetStore.getState().gainExp(item.xpReward ?? 30);
      usePetStore.getState().addCoins(item.coinReward ?? 15);
    } else if (!status.isCompleted && isAlreadyDone) {
      nextCompleted = nextCompleted.filter((id) => id !== item.id);
    }
  }

  return nextCompleted;
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
          const prevPath =
            state.goalPlan.goalPath || goalTypeToGoalPath(state.goalPlan.goalType);
          const nextPath =
            newPlan.goalPath ||
            (newPlan.goalType ? goalTypeToGoalPath(newPlan.goalType) : prevPath);
          const isPathChanged = Boolean(nextPath && nextPath !== prevPath);

          const updatedPlan: UserGoalPlan = {
            ...state.goalPlan,
            ...newPlan,
          };
          if (newPlan.goalPath && !newPlan.goalType) {
            updatedPlan.goalType = goalPathToGoalType(newPlan.goalPath);
          } else if (newPlan.goalType && !newPlan.goalPath) {
            updatedPlan.goalPath = goalTypeToGoalPath(newPlan.goalType);
          }

          let nextCompletedMissions = state.completedMissions;

          // Requirement 2: If a user changes their path, reset progress on previous path!
          if (isPathChanged && !newPlan.startDate) {
            updatedPlan.currentLevel = 1;
            updatedPlan.currentWeek = 1;
            updatedPlan.startDate = getTodayFormatted();
            updatedPlan.streakConsecutiveLogs = 0;
            nextCompletedMissions = [];
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
            completedMissions: nextCompletedMissions,
          };
        }),

      setQuestProgression: ({ goalPath, currentLevel, currentWeek }) => {
        const currentPlan = get().goalPlan;
        const currentPath =
          currentPlan.goalPath || goalTypeToGoalPath(currentPlan.goalType);
        const resolvedPath = goalPath ?? currentPath;

        // If path changed, reset completely to level 1 week 1 on new path
        if (resolvedPath !== currentPath) {
          get().setGoalPlan({
            goalPath: resolvedPath,
            goalType: goalPathToGoalType(resolvedPath),
            currentLevel: 1,
            currentWeek: 1,
          });
          return;
        }

        const weeklyProgression = get().getWeeklyProgression();
        const resolvedLevel = currentLevel ?? currentPlan.currentLevel ?? 1;
        const resolvedWeek = currentWeek ?? currentPlan.currentWeek ?? 1;

        // Requirement 3: User cannot skip to locked levels!
        const isUnlocked = weeklyProgression.unlockedStages.some(
          (s) =>
            s.level === resolvedLevel &&
            (currentWeek === undefined || s.week === resolvedWeek)
        );

        if (!isUnlocked) {
          get().setGoalPlan({
            currentLevel: weeklyProgression.activeStage.level,
            currentWeek: weeklyProgression.activeStage.week,
          });
          return;
        }

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
        const consumed = get().getConsumed();
        const dayLogs = get().getLogsByDate(get().selectedDate);
        const currentCompleted = get().completedMissions;

        const nextCompleted = autoEvaluateAndSyncMissions(
          consumed,
          dayLogs,
          clamped,
          questPlan,
          currentCompleted
        );

        set({
          waterLoggedMl: clamped,
          completedMissions: nextCompleted,
        });
      },

      toggleMissionComplete: (missionId: string, xpReward = 30, coinReward = 15) => {
        // Requirement 4: Tasks can only be completed based on calories consumed, not as a to-do list.
        const questPlan = get().getQuestPlan();
        const mainMission = questPlan.mainMissions.find((m) => m.id === missionId);
        if (mainMission) {
          // Intake missions cannot be manually checked as to-do list!
          return get().completedMissions.includes(missionId);
        }

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
        const dayLogs = get().getLogsByDate(get().selectedDate);
        const nextCompleted = autoEvaluateAndSyncMissions(
          consumed,
          dayLogs,
          get().waterLoggedMl,
          get().getQuestPlan(),
          get().completedMissions
        );
        set({ latestFeedback: feedback, depkesStatus: depkes.code, completedMissions: nextCompleted });
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
        const dayLogs = get().getLogsByDate(get().selectedDate);
        const nextCompleted = autoEvaluateAndSyncMissions(
          consumed,
          dayLogs,
          get().waterLoggedMl,
          get().getQuestPlan(),
          get().completedMissions
        );
        set({ latestFeedback: feedback, depkesStatus: depkes.code, completedMissions: nextCompleted });
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
        const dayLogs = get().getLogsByDate(get().selectedDate);
        const nextCompleted = autoEvaluateAndSyncMissions(
          consumed,
          dayLogs,
          get().waterLoggedMl,
          get().getQuestPlan(),
          get().completedMissions
        );
        set({ depkesStatus: depkes.code, completedMissions: nextCompleted });
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

      getWeeklyProgression: (): WeeklyProgressionResult => {
        const { goalPlan, logs, targets } = get();
        const goalPath = goalPlan.goalPath || goalTypeToGoalPath(goalPlan.goalType);
        return calculateWeeklyProgression({
          startDate: goalPlan.startDate || getTodayFormatted(),
          goalPath,
          logs,
          selectedLevel: goalPlan.currentLevel,
          selectedWeek: goalPlan.currentWeek,
          todayDateStr: getTodayFormatted(),
          targetCalories: targets.calories,
        });
      },

      getEvaluatedMissions: (targetDate?: string) => {
        const dateToUse = targetDate || get().selectedDate;
        const consumed = get().getConsumed(dateToUse);
        const dayLogs = get().getLogsByDate(dateToUse);
        const questPlan = get().getQuestPlan();
        const waterLoggedMl = get().waterLoggedMl;

        const results: Array<{
          mission: QuestMainMission | QuestSideMission;
          status: MissionAutoStatus;
          isMain: boolean;
        }> = [];

        for (const main of questPlan.mainMissions) {
          const status = evaluateMissionAutoStatus(main, {
            consumedCalories: consumed.calories,
            consumedProtein: consumed.protein,
            consumedCarbs: consumed.carbs,
            consumedFat: consumed.fat,
            consumedFiber: consumed.fiber,
            consumedSugar: consumed.sugar,
            targetCalories: questPlan.calorieTarget,
            dayLogsCount: dayLogs.length,
            waterLoggedMl,
          });
          results.push({ mission: main, status, isMain: true });
        }

        for (const side of questPlan.sideMissions) {
          const status = evaluateMissionAutoStatus(side, {
            consumedCalories: consumed.calories,
            consumedProtein: consumed.protein,
            consumedCarbs: consumed.carbs,
            consumedFat: consumed.fat,
            consumedFiber: consumed.fiber,
            consumedSugar: consumed.sugar,
            targetCalories: questPlan.calorieTarget,
            dayLogsCount: dayLogs.length,
            waterLoggedMl,
          });
          results.push({ mission: side, status, isMain: false });
        }

        return results;
      },
    }),
    {
      name: "caloria-food-storage",
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 3 || !persistedState) {
          const cleanLogs = Array.isArray(persistedState?.logs)
            ? persistedState.logs.filter((l: any) => !l.id?.startsWith("sample-"))
            : [];
          return {
            ...persistedState,
            logs: cleanLogs,
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
            waterLoggedMl: persistedState?.waterLoggedMl ?? 0,
            completedMissions: persistedState?.completedMissions || [],
          };
        }
        return persistedState;
      },
    }
  )
);
