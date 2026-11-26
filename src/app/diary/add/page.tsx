"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2,
  Camera,
  Loader2,
  Copy,
  Layers,
  Bookmark,
  History,
  TrendingUp,
  Store,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { FoodCatalogItem, StagedFoodItem } from "@/types";
import {
  evaluateBatchFoodReward,
  BatchRewardEvaluationResult,
} from "@/lib/reward-engine";
import { NutritionLabelData } from "@/lib/schemas/nutrition-scan";
import { ArScannerOverlay } from "@/components/diary/ArScannerOverlay";
import { ReviewScanModal } from "@/components/diary/ReviewScanModal";
import { CreateCustomFoodModal } from "@/components/diary/CreateCustomFoodModal";
import { batchLogFoodsAction, searchFoodsAction } from "@/app/actions/diary";
import {
  toastFoodStaged,
  toastMealsCommitted,
  toastOcrSuccess,
} from "@/lib/toast";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAutoTour } from "@/components/tour/useAutoTour";
import { cn } from "@/lib/utils";

function DiaryAddFoodContent() {
  const isHydrated = useHydrated();
  useAutoTour("diary-add", { enabled: isHydrated });
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealParam = searchParams.get("meal") as MealTypeId | null;
  const dateParam = searchParams.get("date") as string | null;

  const {
    selectedDate,
    setSelectedDate,
    addBatchLogs,
    getConsumed,
    targets,
    goalPlan,
    customFoods,
    getRecentFoods,
    getFrequentFoods,
    getHistoricalMealLogs,
  } = useFoodStore();

  useEffect(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
    }
  }, [dateParam, setSelectedDate]);

  const { feedPet, level, exp, stage } = usePetStore();

  const [activeMeal, setActiveMeal] = useState<MealTypeId>(
    mealParam || "breakfast",
  );

  useEffect(() => {
    if (mealParam) return;
    const timer = setTimeout(() => {
      const hours = new Date().getHours();
      if (hours >= 11 && hours < 15) setActiveMeal("lunch");
      else if (hours >= 15 && hours < 18) setActiveMeal("snack");
      else if (hours >= 18 || hours < 5) setActiveMeal("dinner");
      else setActiveMeal("breakfast");
    }, 0);
    return () => clearTimeout(timer);
  }, [mealParam]);
  const [sourceTab, setSourceTab] = useState<
    "all" | "recent" | "frequent" | "saved" | "branded"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Multi-Select Staging Tray State (FatSecret-Style Staging)
  const [stagedItems, setStagedItems] = useState<StagedFoodItem[]>([]);
  const [isTrayDrawerOpen, setIsTrayDrawerOpen] = useState(false);
  const [editingInputs, setEditingInputs] = useState<
    Record<string, { porsi?: string; grams?: string }>
  >({});

  // Custom Food Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Gamification Reward states
  const [rewardResult, setRewardResult] =
    useState<BatchRewardEvaluationResult | null>(null);
  const [showLevelUpOverlay, setShowLevelUpOverlay] = useState(false);

  // AR Nutrition Label Scanner states
  const [isArScannerOpen, setIsArScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<NutritionLabelData | null>(
    null,
  );
  const [scannedImagePreviewUrl, setScannedImagePreviewUrl] =
    useState<string>("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (scannedImagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(scannedImagePreviewUrl);
      }
    };
  }, [scannedImagePreviewUrl]);

  // Yesterday's historical logs for one-tap copy shortcut
  const yesterdayLogs = useMemo(() => {
    return getHistoricalMealLogs(activeMeal, 1);
  }, [activeMeal, getHistoricalMealLogs]);

  const [dbCatalogItems, setDbCatalogItems] = useState<FoodCatalogItem[]>([]);

  useEffect(() => {
    let active = true;
    const fetchDbFoods = async () => {
      try {
        const res = await searchFoodsAction(searchQuery);
        if (active && res.success && res.data && res.data.length > 0) {
          setDbCatalogItems(res.data);
        }
      } catch (err) {
        console.warn("[DiaryAdd] searchFoodsAction failed:", err);
      }
    };

    const timer = setTimeout(() => {
      fetchDbFoods();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Combined Catalog from PostgreSQL database query & user custom foods
  const allCatalogItems = useMemo(() => {
    return dbCatalogItems.length > 0 ? dbCatalogItems : customFoods;
  }, [dbCatalogItems, customFoods]);

  const consumed = getConsumed();

  // Base list determined by source tab
  const sourceItems = useMemo(() => {
    if (sourceTab === "recent") {
      return getRecentFoods();
    }
    if (sourceTab === "frequent") {
      return getFrequentFoods();
    }
    if (sourceTab === "saved") {
      return customFoods;
    }
    if (sourceTab === "branded") {
      return allCatalogItems.filter(
        (i) =>
          i.category.toLowerCase().includes("branded") ||
          i.category.toLowerCase().includes("restoran") ||
          !!i.brandOrSource,
      );
    }
    return allCatalogItems;
  }, [
    sourceTab,
    allCatalogItems,
    customFoods,
    getRecentFoods,
    getFrequentFoods,
  ]);

  // Filter catalog by search query
  const filteredItems = useMemo(() => {
    return sourceItems.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.brandOrSource &&
          item.brandOrSource.toLowerCase().includes(query));

      return matchQuery;
    });
  }, [sourceItems, searchQuery]);

  // Staging Tray Handlers
  const toggleItemInTray = (food: FoodCatalogItem) => {
    setStagedItems((prev) => {
      const exists = prev.find((i) => i.id === food.id);
      if (exists) {
        return prev.filter((i) => i.id !== food.id);
      }
      toastFoodStaged(food.name);
      return [
        ...prev,
        {
          id: food.id,
          name: food.name,
          category: food.category,
          baseCalories: food.calories,
          baseProteinG: food.proteinG,
          baseCarbsG: food.carbsG,
          baseFatG: food.fatG,
          baseFiberG: food.fiberG,
          baseSugarG: food.sugarG,
          servingMultiplier: 1,
          servingUnit: food.servingUnit,
          gramsPerUnit: food.gramsPerUnit || 100,
        },
      ];
    });
  };

  const updatePortionMultiplier = (foodId: string, multiplier: number) => {
    setEditingInputs((prev) => {
      const next = { ...prev };
      delete next[foodId];
      return next;
    });
    setStagedItems((prev) =>
      prev.map((item) =>
        item.id === foodId
          ? {
              ...item,
              servingMultiplier: Math.max(
                0.01,
                Math.round(multiplier * 10000) / 10000,
              ),
            }
          : item,
      ),
    );
  };

  const handleCustomPorsiChange = (foodId: string, rawVal: string) => {
    setEditingInputs((prev) => ({
      ...prev,
      [foodId]: { porsi: rawVal },
    }));
    const parsed = parseFloat(rawVal.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      setStagedItems((prev) =>
        prev.map((item) =>
          item.id === foodId
            ? {
                ...item,
                servingMultiplier: Math.max(
                  0.01,
                  Math.round(parsed * 10000) / 10000,
                ),
              }
            : item,
        ),
      );
    }
  };

  const handleCustomGramsChange = (
    foodId: string,
    rawVal: string,
    gramsPerUnit: number,
  ) => {
    setEditingInputs((prev) => ({
      ...prev,
      [foodId]: { grams: rawVal },
    }));
    const parsed = parseFloat(rawVal.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      const baseGrams = gramsPerUnit || 100;
      const mult = parsed / baseGrams;
      setStagedItems((prev) =>
        prev.map((item) =>
          item.id === foodId
            ? {
                ...item,
                servingMultiplier: Math.max(
                  0.01,
                  Math.round(mult * 10000) / 10000,
                ),
              }
            : item,
        ),
      );
    }
  };

  const clearEditingInput = (foodId: string) => {
    setEditingInputs((prev) => {
      const next = { ...prev };
      delete next[foodId];
      return next;
    });
  };

  const removeItemFromTray = (foodId: string) => {
    setStagedItems((prev) => prev.filter((i) => i.id !== foodId));
  };

  const handleCopyYesterdayMeal = () => {
    if (yesterdayLogs.length === 0) return;

    const newStaged: StagedFoodItem[] = yesterdayLogs.map((log) => ({
      id: `copy-${log.id}-${Date.now()}`,
      name: log.name,
      category: "Salinan Kemarin",
      baseCalories: Math.round(log.calories / (log.servingSize || 1)),
      baseProteinG:
        Math.round((log.proteinG / (log.servingSize || 1)) * 10) / 10,
      baseCarbsG: Math.round((log.carbsG / (log.servingSize || 1)) * 10) / 10,
      baseFatG: Math.round((log.fatG / (log.servingSize || 1)) * 10) / 10,
      baseFiberG:
        Math.round(((log.fiberG ?? 0) / (log.servingSize || 1)) * 10) / 10,
      baseSugarG:
        Math.round(((log.sugarG ?? 0) / (log.servingSize || 1)) * 10) / 10,
      servingMultiplier: log.servingSize || 1,
      servingUnit: log.servingUnit || "porsi",
      gramsPerUnit: 100,
    }));

    setStagedItems((prev) => {
      const merged = [...prev];
      for (const item of newStaged) {
        if (
          !merged.some((m) => m.name.toLowerCase() === item.name.toLowerCase())
        ) {
          merged.push(item);
        }
      }
      return merged;
    });
  };

  // Live Aggregated Calculations for Staging Tray
  const trayTotals = useMemo(() => {
    const totals = stagedItems.reduce(
      (acc, item) => ({
        calories:
          acc.calories + Math.round(item.baseCalories * item.servingMultiplier),
        proteinG:
          acc.proteinG +
          Math.round(item.baseProteinG * item.servingMultiplier * 10) / 10,
        carbsG:
          acc.carbsG +
          Math.round(item.baseCarbsG * item.servingMultiplier * 10) / 10,
        fatG:
          acc.fatG +
          Math.round(item.baseFatG * item.servingMultiplier * 10) / 10,
        fiberG:
          acc.fiberG +
          Math.round(item.baseFiberG * item.servingMultiplier * 10) / 10,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );

    // Balanced plate combo detector: Protein >= 18g, Carbs >= 20g, and Fiber/Veggie presence
    const hasProtein = totals.proteinG >= 18;
    const hasCarbs = totals.carbsG >= 20;
    const hasFiberOrVeg =
      totals.fiberG >= 2.5 ||
      stagedItems.some(
        (i) =>
          i.category.toLowerCase().includes("sayur") ||
          i.category.toLowerCase().includes("buah"),
      );

    const isComboBalanced = hasProtein && hasCarbs && hasFiberOrVeg;

    return {
      ...totals,
      isComboBalanced,
    };
  }, [stagedItems]);

  // Commit Staging Tray Batch & Trigger Gamification Rewards
  const handleBatchCommit = () => {
    if (stagedItems.length === 0) return;

    const mealLabel =
      MEAL_TYPES.find((m) => m.id === activeMeal)?.label || "Makan Siang";

    const batchInputs = stagedItems.map((item) => ({
      name: item.name,
      category: item.category,
      calories: Math.round(item.baseCalories * item.servingMultiplier),
      proteinG:
        Math.round(item.baseProteinG * item.servingMultiplier * 10) / 10,
      carbsG: Math.round(item.baseCarbsG * item.servingMultiplier * 10) / 10,
      fatG: Math.round(item.baseFatG * item.servingMultiplier * 10) / 10,
      fiberG: Math.round(item.baseFiberG * item.servingMultiplier * 10) / 10,
    }));

    const result = evaluateBatchFoodReward({
      items: batchInputs,
      mealLabel,
      currentDailyConsumed: consumed,
      dailyTargets: targets,
      goalType: goalPlan.goalType,
      currentLevel: level,
      currentExp: exp,
      currentStage: stage,
    });

    const logsToSave = stagedItems.map((item) => {
      const displayMult = Math.round(item.servingMultiplier * 100) / 100;
      const totalGrams = Math.round(
        (item.gramsPerUnit || 100) * item.servingMultiplier,
      );
      const cleanUnit = item.servingUnit.replace(/\s*\(\d+g\)/i, "").trim();
      return {
        name: item.name,
        mealType: activeMeal,
        calories: Math.round(item.baseCalories * item.servingMultiplier),
        proteinG:
          Math.round(item.baseProteinG * item.servingMultiplier * 10) / 10,
        carbsG: Math.round(item.baseCarbsG * item.servingMultiplier * 10) / 10,
        fatG: Math.round(item.baseFatG * item.servingMultiplier * 10) / 10,
        fiberG: Math.round(item.baseFiberG * item.servingMultiplier * 10) / 10,
        sugarG: Math.round(item.baseSugarG * item.servingMultiplier * 10) / 10,
        servingSize: displayMult,
        servingUnit: `${displayMult}x ${cleanUnit} (${totalGrams}g)`,
        loggedDate:
          dateParam || selectedDate || new Date().toISOString().split("T")[0],
      };
    });

    // Persist to Supabase PostgreSQL database via Server Action
    batchLogFoodsAction(
      logsToSave,
      dateParam || selectedDate || new Date().toISOString().split("T")[0],
    ).catch((err) =>
      console.warn("Supabase batchLogFoodsAction warning:", err),
    );

    addBatchLogs(logsToSave, {
      type: result.feedbackType,
      title: result.title,
      message: result.message,
      xpEarned: result.totalXp,
    });

    feedPet(result.totalBatchCalories, result.totalXp, 10);
    toastMealsCommitted(result.totalXp, 10);

    setRewardResult(result);
    if (result.leveledUp) {
      setShowLevelUpOverlay(true);
    }
  };

  const handleFinishReward = () => {
    setRewardResult(null);
    setShowLevelUpOverlay(false);
    setStagedItems([]);
    router.push("/diary");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6 pb-48 lg:pb-36">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/diary"
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-neutral-10 hover:text-[#244710] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]"
            aria-label="Kembali ke Food Diary"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary font-heading">
            Catat Makanan
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="min-h-11 px-4 py-2.5 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-[#244710] text-sm sm:text-base font-bold flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Makanan Baru</span>
          </button>
        </div>
      </div>

      {/* Meal Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2.5 pb-1">
        <span className="text-sm sm:text-base font-bold text-neutral-10 shrink-0 mr-1">
          Waktu Makan:
        </span>
        {MEAL_TYPES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActiveMeal(m.id)}
            aria-pressed={activeMeal === m.id}
            className={cn(
              "min-h-11 px-4 py-2.5 rounded-navigation text-sm sm:text-base whitespace-nowrap transition-colors border cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]",
              activeMeal === m.id
                ? "bg-accent-orange border-accent-orange text-[#1E1204] font-extrabold"
                : "bg-surface text-neutral-10 border-border-default font-bold hover:bg-accent-green-light hover:text-[#244710] hover:border-accent-green-light",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* One-Tap Copy Yesterday Meal Banner */}
      {yesterdayLogs.length > 0 && (
        <div className="p-4 rounded-card bg-accent-green/10 border border-accent-green/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm sm:text-base animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <Copy
              className="h-5 w-5 text-[#244710] shrink-0 mt-0.5 sm:mt-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="font-bold text-[#244710]">
                Salin Menu {MEAL_TYPES.find((m) => m.id === activeMeal)?.label}{" "}
                Kemarin:
              </span>
              <p className="text-sm text-neutral-10 mt-0.5 break-words">
                {yesterdayLogs.map((l) => l.name).join(", ")} (
                {yesterdayLogs.reduce((sum, l) => sum + l.calories, 0)} kcal)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyYesterdayMeal}
            className="min-h-11 px-4 py-2.5 rounded-navigation bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] font-extrabold text-sm sm:text-base transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Salin ke Piring ({yesterdayLogs.length} Item)</span>
          </button>
        </div>
      )}

      {/* Catalog Search & Actions */}
      <div className="rounded-card border border-border-divider bg-surface p-4 sm:p-6 space-y-5 shadow-xs">
        {/* Search Bar & AI Label Scan */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div data-tour="diary-add-search" className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-10"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Cari makanan (misal: Nasi Padang, Dada Ayam, Tempe)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-11 pr-4 py-3 min-h-12 text-base font-medium"
            />
          </div>

          <button
            type="button"
            data-tour="diary-add-scan"
            onClick={() => setIsArScannerOpen(true)}
            className="min-h-12 px-6 py-3 rounded-navigation bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-base sm:text-lg font-extrabold flex items-center justify-center gap-2.5 shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]"
          >
            <Camera className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Scan</span>
          </button>
        </div>

        {/* Quick Filter Source Tabs */}
        <div
          data-tour="diary-add-tabs"
          className="flex flex-wrap items-center gap-2 pb-3 border-b border-border-divider"
        >
          <button
            type="button"
            onClick={() => setSourceTab("all")}
            aria-pressed={sourceTab === "all"}
            className={cn(
              "min-h-11 px-4 py-2 rounded-navigation text-sm sm:text-base transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]",
              sourceTab === "all"
                ? "bg-accent-orange border-accent-orange text-[#1E1204] font-extrabold"
                : "bg-surface border-border-default text-neutral-10 font-bold hover:bg-accent-green-light hover:text-[#244710] hover:border-accent-green-light",
            )}
          >
            <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Semua Katalog</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceTab("recent")}
            aria-pressed={sourceTab === "recent"}
            className={cn(
              "min-h-11 px-4 py-2 rounded-navigation text-sm sm:text-base transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]",
              sourceTab === "recent"
                ? "bg-accent-orange border-accent-orange text-[#1E1204] font-extrabold"
                : "bg-surface border-border-default text-neutral-10 font-bold hover:bg-accent-green-light hover:text-[#244710] hover:border-accent-green-light",
            )}
          >
            <History className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Baru Dimakan</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceTab("frequent")}
            aria-pressed={sourceTab === "frequent"}
            className={cn(
              "min-h-11 px-4 py-2 rounded-navigation text-sm sm:text-base transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]",
              sourceTab === "frequent"
                ? "bg-accent-orange border-accent-orange text-[#1E1204] font-extrabold"
                : "bg-surface border-border-default text-neutral-10 font-bold hover:bg-accent-green-light hover:text-[#244710] hover:border-accent-green-light",
            )}
          >
            <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Paling Sering</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceTab("saved")}
            aria-pressed={sourceTab === "saved"}
            className={cn(
              "min-h-11 px-4 py-2 rounded-navigation text-sm sm:text-base transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]",
              sourceTab === "saved"
                ? "bg-accent-orange border-accent-orange text-[#1E1204] font-extrabold"
                : "bg-surface border-border-default text-neutral-10 font-bold hover:bg-accent-green-light hover:text-[#244710] hover:border-accent-green-light",
            )}
          >
            <Bookmark className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Tersimpan / Resep Saya ({customFoods.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceTab("branded")}
            aria-pressed={sourceTab === "branded"}
            className={cn(
              "min-h-11 px-4 py-2 rounded-navigation text-sm sm:text-base transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]",
              sourceTab === "branded"
                ? "bg-accent-orange border-accent-orange text-[#1E1204] font-extrabold"
                : "bg-surface border-border-default text-neutral-10 font-bold hover:bg-accent-green-light hover:text-[#244710] hover:border-accent-green-light",
            )}
          >
            <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Restoran &amp; Branded</span>
          </button>
        </div>

        {/* Multi-Select Item Rows */}
        <div
          data-tour="diary-add-staging"
          className="divide-y divide-border-divider/70 max-h-[540px] overflow-y-auto pr-1 space-y-2"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-base text-neutral-10 space-y-3">
              <p className="font-bold text-[#244710]">
                Makanan tidak ditemukan di tab ini.
              </p>
              <p className="text-sm sm:text-base">
                Tidak menemukan menu yang dicari? Daftarkan langsung ke database
                pribadimu:
              </p>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(true)}
                className="min-h-11 px-5 py-2.5 rounded-navigation bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] inline-flex items-center gap-2 text-sm sm:text-base font-extrabold transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Makanan Baru</span>
              </button>
            </div>
          ) : (
            filteredItems.map((food) => {
              const staged = stagedItems.find((i) => i.id === food.id);
              const isChecked = !!staged;
              const currentMultiplier = staged?.servingMultiplier ?? 1;

              return (
                <div
                  key={food.id}
                  className={cn(
                    "p-3.5 sm:p-5 rounded-card transition-all border",
                    isChecked
                      ? "bg-accent-yellow/25 border-accent-orange"
                      : "border-transparent hover:bg-surface-subtle",
                  )}
                >
                  {/* Top Row: Checkbox + Food Title aligned with Calories + Checkmark */}
                  <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                    <div
                      onClick={() => toggleItemInTray(food)}
                      className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer flex-1 min-w-0"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemInTray(food);
                        }}
                        aria-label={`Pilih ${food.name}`}
                        className="h-5 w-5 rounded accent-accent-green cursor-pointer shrink-0"
                      />
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <p className="text-base sm:text-lg font-extrabold text-neutral-10 leading-snug">
                          {food.name}
                        </p>
                        {food.brandOrSource && (
                          <span className="px-2.5 py-0.5 rounded-pill bg-surface border border-border-default text-xs sm:text-sm font-semibold text-neutral-10">
                            {food.brandOrSource}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Calories & Checkmark / Quick Add Button */}
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      <span className="text-base sm:text-lg font-black text-[#244710] tabular-nums whitespace-nowrap">
                        {isChecked
                          ? Math.round(food.calories * currentMultiplier)
                          : food.calories}{" "}
                        kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleItemInTray(food)}
                        aria-label={
                          isChecked
                            ? `Batalkan ${food.name}`
                            : `Tambah ${food.name}`
                        }
                        aria-pressed={isChecked}
                        className={cn(
                          "h-11 w-11 rounded-navigation flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]",
                          isChecked
                            ? "bg-accent-orange text-[#1E1204] font-black"
                            : "bg-surface border border-border-default text-neutral-10 hover:border-accent-green hover:bg-accent-green-light hover:text-[#244710]",
                        )}
                      >
                        {isChecked ? (
                          <CheckCircle2
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        ) : (
                          <Plus className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Explanation Appearing Below Aligned Title & Checkmark Row */}
                  {isChecked && (
                    <p className="text-sm sm:text-base font-medium text-neutral-10 mt-2.5 pl-8.5 leading-relaxed">
                      Basis: 1 {food.servingUnit} • P:{" "}
                      <span className="text-blue-700 font-bold">
                        {food.proteinG}g
                      </span>{" "}
                      | K:{" "}
                      <span className="text-amber-700 font-bold">
                        {food.carbsG}g
                      </span>{" "}
                      | L:{" "}
                      <span className="text-rose-700 font-bold">
                        {food.fatG}g
                      </span>
                    </p>
                  )}

                  {/* Inline Portion Expander when Checked */}
                  {isChecked && (
                    <div className="mt-3.5 pt-3 border-t border-border-divider/60 flex flex-wrap items-center justify-between gap-3 text-sm sm:text-base animate-in fade-in duration-150">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-neutral-10">
                          Porsi:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[0.5, 1, 1.5, 2].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                updatePortionMultiplier(food.id, val)
                              }
                              className={cn(
                                "min-h-10 min-w-11 px-3 py-1.5 rounded-pill text-sm font-bold border transition-colors cursor-pointer",
                                Math.round(currentMultiplier * 100) / 100 ===
                                  val
                                  ? "bg-accent-orange text-[#1E1204] border-accent-orange font-extrabold"
                                  : "bg-surface border-border-default text-neutral-10 hover:border-accent-orange",
                              )}
                            >
                              {val}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stepper & Custom Unit / Gram Inputs */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`Kurangi porsi ${food.name}`}
                            onClick={() =>
                              updatePortionMultiplier(
                                food.id,
                                currentMultiplier <= 1
                                  ? Math.max(0.5, currentMultiplier - 0.5)
                                  : Math.floor(currentMultiplier) ===
                                      currentMultiplier
                                    ? currentMultiplier - 1
                                    : Math.floor(currentMultiplier),
                              )
                            }
                            className="h-10 w-10 rounded-navigation border border-border-default bg-surface hover:bg-surface-subtle flex items-center justify-center text-[#244710] shrink-0 cursor-pointer"
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>

                          <label className="h-10 px-3 rounded-navigation border border-border-default bg-surface focus-within:border-accent-orange flex items-center gap-1.5 cursor-text">
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              aria-label="Jumlah porsi"
                              value={
                                editingInputs[food.id]?.porsi !== undefined
                                  ? editingInputs[food.id].porsi
                                  : String(
                                      Math.round(currentMultiplier * 100) / 100,
                                    )
                              }
                              onChange={(e) =>
                                handleCustomPorsiChange(food.id, e.target.value)
                              }
                              onBlur={() => clearEditingInput(food.id)}
                              className="w-12 text-center font-extrabold text-sm sm:text-base text-[#244710] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-sm font-semibold text-neutral-10">
                              {food.servingUnit
                                .replace(/\s*\(\d+g\)/i, "")
                                .trim()}
                            </span>
                          </label>

                          <button
                            type="button"
                            aria-label={`Tambah porsi ${food.name}`}
                            onClick={() =>
                              updatePortionMultiplier(
                                food.id,
                                currentMultiplier < 1
                                  ? 1
                                  : Math.floor(currentMultiplier) + 1,
                              )
                            }
                            className="h-10 w-10 rounded-navigation border border-border-default bg-surface hover:bg-surface-subtle flex items-center justify-center text-[#244710] shrink-0 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>

                        <span className="text-sm text-neutral-10 font-medium">
                          atau
                        </span>

                        {/* Direct Gram Input */}
                        <label className="h-10 px-3 rounded-navigation border border-border-default bg-surface focus-within:border-accent-orange flex items-center gap-1.5 cursor-text">
                          <input
                            type="number"
                            step="any"
                            min="1"
                            aria-label="Berat dalam gram"
                            value={
                              editingInputs[food.id]?.grams !== undefined
                                ? editingInputs[food.id].grams
                                : String(
                                    Math.round(
                                      (food.gramsPerUnit || 100) *
                                        currentMultiplier,
                                    ),
                                  )
                            }
                            onChange={(e) =>
                              handleCustomGramsChange(
                                food.id,
                                e.target.value,
                                food.gramsPerUnit || 100,
                              )
                            }
                            onBlur={() => clearEditingInput(food.id)}
                            className="w-14 text-right font-extrabold text-sm sm:text-base text-[#244710] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-sm font-semibold text-neutral-10">
                            g
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* STICKY STAGING TRAY (FATSECRET-STYLE TRAY / BOTTOM DRAWER) */}
      {stagedItems.length > 0 && (
        <div className="fixed bottom-24 lg:bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-4xl mx-auto z-40">
          <div className="rounded-card border-2 border-accent-green bg-surface/95 backdrop-blur-md shadow-2xl p-4 sm:p-5 transition-all">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
              {/* Tray Summary */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsTrayDrawerOpen(!isTrayDrawerOpen)}
                  className="h-11 w-11 rounded-navigation bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] flex items-center justify-center font-black shrink-0 transition-colors cursor-pointer"
                  aria-label="Buka atau tutup piring"
                >
                  {isTrayDrawerOpen ? (
                    <ChevronDown className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ChevronUp className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-[#244710] font-heading">
                      Piring{" "}
                      {MEAL_TYPES.find((m) => m.id === activeMeal)?.label}:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-pill bg-accent-green/20 text-[#244710] text-xs sm:text-sm font-bold">
                      {stagedItems.length} Menu
                    </span>
                    {trayTotals.isComboBalanced && (
                      <span className="px-2.5 py-0.5 rounded-pill bg-accent-yellow border border-accent-orange text-[#244710] text-xs font-bold hidden sm:inline-flex items-center gap-1">
                        Combo Seimbang (+40% XP)
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base mt-0.5">
                    <span className="font-extrabold text-[#244710]">
                      {trayTotals.calories} kcal
                    </span>
                    <span className="text-neutral-10 text-sm">
                      • P: {Math.round(trayTotals.proteinG)}g | K:{" "}
                      {Math.round(trayTotals.carbsG)}g | L:{" "}
                      {Math.round(trayTotals.fatG)}g
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTrayDrawerOpen(!isTrayDrawerOpen)}
                  className="min-h-12 px-3.5 sm:px-4 py-2.5 rounded-navigation border border-border-default bg-surface hover:bg-surface-subtle text-sm sm:text-base font-bold text-neutral-10 whitespace-nowrap transition-colors cursor-pointer"
                >
                  {isTrayDrawerOpen
                    ? "Tutup Piring"
                    : `Lihat Piring (${stagedItems.length})`}
                </button>

                <button
                  type="button"
                  onClick={handleBatchCommit}
                  className="min-h-12 px-4 sm:px-6 py-3 rounded-navigation bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-base sm:text-lg flex items-center justify-center gap-2 font-extrabold whitespace-nowrap transition-colors flex-1 sm:flex-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244710]"
                >
                  <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>Catat Makanan</span>
                </button>
              </div>
            </div>

            {/* Expandable Tray Drawer List */}
            {isTrayDrawerOpen && (
              <div className="mt-3.5 pt-3.5 border-t border-border-divider/80 max-h-60 overflow-y-auto space-y-2.5 pr-1 animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between text-sm font-bold text-neutral-10 pb-1">
                  <span>Daftar Menu di Piring:</span>
                  <button
                    type="button"
                    onClick={() => setStagedItems([])}
                    className="min-h-9 px-2 text-destructive hover:underline cursor-pointer"
                  >
                    Kosongkan Piring
                  </button>
                </div>

                {stagedItems.map((item) => {
                  const displayMult =
                    Math.round(item.servingMultiplier * 100) / 100;
                  const totalGrams = Math.round(
                    (item.gramsPerUnit || 100) * item.servingMultiplier,
                  );
                  const cleanUnit = item.servingUnit
                    .replace(/\s*\(\d+g\)/i, "")
                    .trim();
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-navigation bg-surface-subtle border border-border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-10 text-sm sm:text-base">
                          {item.name}
                        </p>
                        <p className="text-xs sm:text-sm text-neutral-10">
                          {displayMult}x {cleanUnit} ({totalGrams}g) •{" "}
                          {Math.round(
                            item.baseCalories * item.servingMultiplier,
                          )}{" "}
                          kcal (P:{" "}
                          {Math.round(
                            item.baseProteinG * item.servingMultiplier,
                          )}
                          g)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Kurangi porsi ${item.name}`}
                            onClick={() =>
                              updatePortionMultiplier(
                                item.id,
                                item.servingMultiplier <= 1
                                  ? Math.max(0.5, item.servingMultiplier - 0.5)
                                  : Math.floor(item.servingMultiplier) ===
                                      item.servingMultiplier
                                    ? item.servingMultiplier - 1
                                    : Math.floor(item.servingMultiplier),
                              )
                            }
                            className="h-9 w-9 rounded-navigation border border-border-default bg-surface flex items-center justify-center text-[#244710] cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            aria-label="Jumlah porsi"
                            value={
                              editingInputs[item.id]?.porsi !== undefined
                                ? editingInputs[item.id].porsi
                                : String(displayMult)
                            }
                            onChange={(e) =>
                              handleCustomPorsiChange(item.id, e.target.value)
                            }
                            onBlur={() => clearEditingInput(item.id)}
                            className="h-9 w-12 rounded-navigation border border-border-default bg-surface text-sm font-bold text-center text-[#244710] focus:outline-none focus:border-accent-orange [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label={`Tambah porsi ${item.name}`}
                            onClick={() =>
                              updatePortionMultiplier(
                                item.id,
                                item.servingMultiplier < 1
                                  ? 1
                                  : Math.floor(item.servingMultiplier) + 1,
                              )
                            }
                            className="h-9 w-9 rounded-navigation border border-border-default bg-surface flex items-center justify-center text-[#244710] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <label className="h-9 px-2.5 rounded-navigation border border-border-default bg-surface focus-within:border-accent-orange flex items-center gap-1 cursor-text">
                          <input
                            type="number"
                            step="any"
                            min="1"
                            aria-label="Berat gram"
                            value={
                              editingInputs[item.id]?.grams !== undefined
                                ? editingInputs[item.id].grams
                                : String(totalGrams)
                            }
                            onChange={(e) =>
                              handleCustomGramsChange(
                                item.id,
                                e.target.value,
                                item.gramsPerUnit || 100,
                              )
                            }
                            onBlur={() => clearEditingInput(item.id)}
                            className="w-12 text-right text-sm font-bold text-[#244710] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-sm text-neutral-10">g</span>
                        </label>

                        <button
                          type="button"
                          aria-label={`Hapus ${item.name} dari piring`}
                          onClick={() => removeItemFromTray(item.id)}
                          className="h-9 w-9 rounded-navigation flex items-center justify-center text-neutral-10 hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Custom Food Modal */}
      <CreateCustomFoodModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onCreatedAndStage={(food) => {
          toggleItemInTray(food);
        }}
      />

      {/* AR Label Scanner Viewfinder Overlay */}
      <ArScannerOverlay
        isOpen={isArScannerOpen}
        mealTime={activeMeal}
        onClose={() => setIsArScannerOpen(false)}
        onScanComplete={(data, previewUrl) => {
          setIsArScannerOpen(false);
          setScannedData(data);
          setScannedImagePreviewUrl(previewUrl);
          setIsReviewModalOpen(true);
          toastOcrSuccess();
        }}
      />

      {/* AI Label Review & Staging Modal */}
      {scannedData && (
        <ReviewScanModal
          initialData={scannedData}
          imagePreviewUrl={scannedImagePreviewUrl}
          mealTime={activeMeal}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onRescan={() => {
            setIsReviewModalOpen(false);
            setIsArScannerOpen(true);
          }}
          onSuccess={() => {
            setIsReviewModalOpen(false);
            router.push("/diary");
          }}
          onAddToStaging={(item) => {
            setStagedItems((prev) => [...prev, item]);
            toastFoodStaged(item.name);
          }}
        />
      )}

      {/* GAMIFICATION REWARD POP-UP MODAL */}
      {rewardResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-border-divider bg-surface p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-pill bg-accent-yellow border-2 border-accent-green text-[#244710] flex items-center justify-center mx-auto shadow-xs text-3xl">
              {rewardResult.isDailyJackpot
                ? "🎰"
                : rewardResult.isComboBalanced
                  ? "✨"
                  : "⭐"}
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-pill text-sm font-bold uppercase tracking-wider bg-accent-green/15 text-[#244710]">
                {rewardResult.isComboBalanced
                  ? "COMBO PIRING SEIMBANG!"
                  : "REWARD GIZI DITERIMA"}
              </span>
              <h3 className="text-2xl font-black text-[#244710] font-heading">
                {rewardResult.title}
              </h3>
              <p className="text-sm sm:text-base text-neutral-10 max-w-sm mx-auto">
                {rewardResult.message}
              </p>
            </div>

            {/* XP & Coin Breakdown */}
            <div className="review-card grid grid-cols-2 gap-3 p-4 border border-accent-green/25 text-sm">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-semibold text-neutral-10">
                  Total XP Didapat
                </span>
                <p className="text-2xl font-black text-[#244710] font-heading">
                  +{rewardResult.totalXp} XP
                </p>
                {rewardResult.bonusMultiplier > 1 && (
                  <span className="text-xs font-bold text-[#244710]">
                    (x{rewardResult.bonusMultiplier} Combo Multiplier)
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-semibold text-neutral-10">
                  Total Kalori
                </span>
                <p className="text-2xl font-black text-[#244710] font-heading flex items-center justify-center gap-1">
                  +{rewardResult.totalBatchCalories}
                </p>
                <span className="text-xs sm:text-sm font-semibold text-neutral-10">
                  Kkal Tercatat
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishReward}
              className="min-h-12 w-full py-3 px-6 rounded-navigation bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-base font-extrabold transition-colors cursor-pointer"
            >
              Lanjut ke Food Diary
            </button>
          </div>
        </div>
      )}

      {/* Pet Level Up & Physical Evolution Overlay */}
      {showLevelUpOverlay && rewardResult?.leveledUp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-card bg-surface border-2 border-accent-green p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-90 duration-300">
            <div className="text-4xl animate-bounce">🎉</div>
            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-pill text-sm font-black uppercase tracking-wider bg-accent-orange text-[#1E1204]">
                LEVEL UP!
              </span>
              <h2 className="text-2xl font-black text-[#244710] font-heading">
                Pet Naik ke Level {rewardResult.newLevel}!
              </h2>
              {rewardResult.evolvedStage && (
                <p className="text-sm font-bold text-[#244710]">
                  Evolusi Fisik: Pet kini telah bertransformasi ke Tahap{" "}
                  {rewardResult.newStage}!
                </p>
              )}
            </div>

            <p className="text-sm sm:text-base text-neutral-10">
              Piring nutrisi seimbangmu membuat Pet semakin kuat dan ceria.
              Terus pertahankan asupan gizi harianmu!
            </p>

            <button
              type="button"
              onClick={handleFinishReward}
              className="min-h-12 w-full py-3 px-6 rounded-navigation bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-base font-extrabold transition-colors cursor-pointer"
            >
              Hore! Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiaryAddFoodPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
            <p className="text-base font-medium text-neutral-10">
              Memuat pencatatan makanan...
            </p>
          </div>
        </div>
      }
    >
      <DiaryAddFoodContent />
    </Suspense>
  );
}
