"use client";

import { useState, useMemo, useRef, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2,
  Coins,
  X,
  Camera,
  Loader2,
  Copy,
  UtensilsCrossed,
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
import { FOOD_CATALOG } from "@/lib/food-catalog";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { FoodCatalogItem, StagedFoodItem } from "@/types";
import {
  evaluateBatchFoodReward,
  BatchRewardEvaluationResult,
} from "@/lib/reward-engine";
import { NutritionLabelData } from "@/lib/schemas/nutrition-scan";
import { ReviewScanModal } from "@/components/diary/ReviewScanModal";
import { CreateCustomFoodModal } from "@/components/diary/CreateCustomFoodModal";
import { cn } from "@/lib/utils";

/**
 * Compress image on client using HTML5 Canvas (max 1200px, 80% JPEG quality)
 */
async function compressImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.8
): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context for compression."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image into JPEG blob."));
            return;
          }
          resolve({ blob, previewUrl: objectUrl });
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load selected image file."));
    };
    img.src = objectUrl;
  });
}

function DiaryAddFoodContent() {
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

  const { feedPet, level, exp, stage, coins } = usePetStore();

  const [activeMeal, setActiveMeal] = useState<MealTypeId>(() => {
    if (mealParam) return mealParam;
    if (typeof window === "undefined") return "breakfast";
    const hours = new Date().getHours();
    if (hours >= 11 && hours < 15) return "lunch";
    if (hours >= 15 && hours < 18) return "snack";
    if (hours >= 18 || hours < 5) return "dinner";
    return "breakfast";
  });
  const [sourceTab, setSourceTab] = useState<
    "all" | "recent" | "frequent" | "saved" | "branded"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Multi-Select Staging Tray State (FatSecret-Style Staging)
  const [stagedItems, setStagedItems] = useState<StagedFoodItem[]>([]);
  const [isTrayDrawerOpen, setIsTrayDrawerOpen] = useState(false);

  // Custom Food Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Gamification Reward states
  const [rewardResult, setRewardResult] =
    useState<BatchRewardEvaluationResult | null>(null);
  const [showLevelUpOverlay, setShowLevelUpOverlay] = useState(false);

  // Nutrition Label Scanner states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isScanningLabel, setIsScanningLabel] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<NutritionLabelData | null>(null);
  const [scannedImagePreviewUrl, setScannedImagePreviewUrl] = useState<string>("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Yesterday's historical logs for one-tap copy shortcut
  const yesterdayLogs = useMemo(() => {
    return getHistoricalMealLogs(activeMeal, 1);
  }, [activeMeal, getHistoricalMealLogs]);

  // Combined Catalog (Static + User Custom)
  const allCatalogItems = useMemo(() => {
    return [...customFoods, ...FOOD_CATALOG];
  }, [customFoods]);

  // Handle OCR File Change
  const handleLabelFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setIsScanningLabel(true);
    setScanError(null);

    try {
      const { blob, previewUrl } = await compressImageFile(file, 1200, 0.8);
      setScannedImagePreviewUrl(previewUrl);

      const formData = new FormData();
      formData.append("image", blob, "nutrition-label.jpg");

      const res = await fetch("/api/nutrition/scan", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(
          json.error || "Gagal mengekstrak informasi nilai gizi dari gambar."
        );
      }

      setScannedData(json.data as NutritionLabelData);
      setIsReviewModalOpen(true);
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memindai label nutrisi."
      );
    } finally {
      setIsScanningLabel(false);
    }
  };

  const consumed = getConsumed();

  // Extract unique categories
  const categories = useMemo(() => {
    return [
      "Semua",
      ...Array.from(new Set(allCatalogItems.map((f) => f.category))),
    ];
  }, [allCatalogItems]);

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
          !!i.brandOrSource
      );
    }
    return allCatalogItems;
  }, [sourceTab, allCatalogItems, customFoods, getRecentFoods, getFrequentFoods]);

  // Filter catalog by search query and category pill
  const filteredItems = useMemo(() => {
    return sourceItems.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.brandOrSource && item.brandOrSource.toLowerCase().includes(query));

      const matchCat =
        selectedCategory === "Semua" || item.category === selectedCategory;

      return matchQuery && matchCat;
    });
  }, [sourceItems, searchQuery, selectedCategory]);

  // Staging Tray Handlers
  const toggleItemInTray = (food: FoodCatalogItem) => {
    setStagedItems((prev) => {
      const exists = prev.find((i) => i.id === food.id);
      if (exists) {
        return prev.filter((i) => i.id !== food.id);
      }
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
          servingMultiplier: food.defaultServingSize || 1,
          servingUnit: food.servingUnit,
          gramsPerUnit: food.gramsPerUnit || 100,
        },
      ];
    });
  };

  const updatePortionMultiplier = (foodId: string, multiplier: number) => {
    setStagedItems((prev) =>
      prev.map((item) =>
        item.id === foodId
          ? { ...item, servingMultiplier: Math.max(0.25, Math.round(multiplier * 100) / 100) }
          : item
      )
    );
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
      baseProteinG: Math.round((log.proteinG / (log.servingSize || 1)) * 10) / 10,
      baseCarbsG: Math.round((log.carbsG / (log.servingSize || 1)) * 10) / 10,
      baseFatG: Math.round((log.fatG / (log.servingSize || 1)) * 10) / 10,
      baseFiberG: Math.round(((log.fiberG ?? 0) / (log.servingSize || 1)) * 10) / 10,
      baseSugarG: Math.round(((log.sugarG ?? 0) / (log.servingSize || 1)) * 10) / 10,
      servingMultiplier: log.servingSize || 1,
      servingUnit: log.servingUnit || "porsi",
      gramsPerUnit: 100,
    }));

    setStagedItems((prev) => {
      const merged = [...prev];
      for (const item of newStaged) {
        if (!merged.some((m) => m.name.toLowerCase() === item.name.toLowerCase())) {
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
        calories: acc.calories + Math.round(item.baseCalories * item.servingMultiplier),
        proteinG: acc.proteinG + Math.round(item.baseProteinG * item.servingMultiplier * 10) / 10,
        carbsG: acc.carbsG + Math.round(item.baseCarbsG * item.servingMultiplier * 10) / 10,
        fatG: acc.fatG + Math.round(item.baseFatG * item.servingMultiplier * 10) / 10,
        fiberG: acc.fiberG + Math.round(item.baseFiberG * item.servingMultiplier * 10) / 10,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
    );

    // Balanced plate combo detector: Protein >= 18g, Carbs >= 20g, and Fiber/Veggie presence
    const hasProtein = totals.proteinG >= 18;
    const hasCarbs = totals.carbsG >= 20;
    const hasFiberOrVeg =
      totals.fiberG >= 2.5 ||
      stagedItems.some(
        (i) =>
          i.category.toLowerCase().includes("sayur") ||
          i.category.toLowerCase().includes("buah")
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
      proteinG: Math.round(item.baseProteinG * item.servingMultiplier * 10) / 10,
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

    const logsToSave = stagedItems.map((item) => ({
      name: item.name,
      mealType: activeMeal,
      calories: Math.round(item.baseCalories * item.servingMultiplier),
      proteinG: Math.round(item.baseProteinG * item.servingMultiplier * 10) / 10,
      carbsG: Math.round(item.baseCarbsG * item.servingMultiplier * 10) / 10,
      fatG: Math.round(item.baseFatG * item.servingMultiplier * 10) / 10,
      fiberG: Math.round(item.baseFiberG * item.servingMultiplier * 10) / 10,
      sugarG: Math.round(item.baseSugarG * item.servingMultiplier * 10) / 10,
      servingSize: item.servingMultiplier,
      servingUnit: `${item.servingMultiplier}x ${item.servingUnit}`,
      loggedDate: dateParam || selectedDate || new Date().toISOString().split("T")[0],
    }));

    addBatchLogs(logsToSave, {
      type: result.feedbackType,
      title: result.title,
      message: result.message,
      xpEarned: result.totalXp,
      coinsEarned: result.coinsEarned,
    });

    feedPet(result.totalBatchCalories, result.totalXp, result.coinsEarned);

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
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-divider">
        <div className="flex items-center gap-2.5">
          <Link
            href="/diary"
            className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary font-heading flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-accent-green" />
              <span>Multi-Select Staging & Pencatatan Makanan</span>
            </h1>
            <p className="text-xs text-text-muted">
              Pilih beberapa menu sekaligus ke piring, atur porsi mandiri, dan dapatkan bonus Combo XP Pet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="px-3.5 py-2 rounded-button border border-border-default bg-surface hover:bg-surface-subtle text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-accent-green" />
            <span>+ Buat Makanan Baru</span>
          </button>
        </div>
      </div>

      {/* Meal Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-text-muted shrink-0 mr-1">
          Waktu Makan:
        </span>
        {MEAL_TYPES.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMeal(m.id)}
            className={cn(
              "nav-item px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border",
              activeMeal === m.id
                ? "is-selected border-accent-orange font-bold shadow-2xs"
                : "bg-surface text-neutral-10 border-border-default"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* One-Tap Copy Yesterday Meal Banner */}
      {yesterdayLogs.length > 0 && (
        <div className="p-3.5 rounded-card bg-accent-green/10 border border-accent-green/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Copy className="h-4 w-4 text-accent-green shrink-0" />
            <div>
              <span className="font-bold text-text-primary">
                Salin Menu {MEAL_TYPES.find((m) => m.id === activeMeal)?.label} Kemarin:
              </span>
              <p className="text-[11px] text-text-muted mt-0.5">
                {yesterdayLogs.map((l) => l.name).join(", ")} (
                {yesterdayLogs.reduce((sum, l) => sum + l.calories, 0)} kcal)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyYesterdayMeal}
            className="px-3.5 py-1.5 rounded-button bg-accent-green text-text-inverse font-bold text-xs hover:opacity-90 transition-opacity shrink-0 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Salin ke Piring ({yesterdayLogs.length} Item)</span>
          </button>
        </div>
      )}

      {/* Catalog Search & Actions */}
      <div className="rounded-card border border-border-divider bg-surface p-4 sm:p-6 space-y-4 shadow-xs">
        {/* Search Bar & AI Label Scan */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Cari makanan (misal: Nasi Padang, Dada Ayam, Tempe, Gado-Gado)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10 pr-4 py-2.5 text-xs font-medium"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleLabelFileChange}
            className="hidden"
          />

          <button
            type="button"
            disabled={isScanningLabel}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "px-4 py-2.5 rounded-button border border-accent-green bg-accent-green-light/60 hover:bg-accent-green-light text-text-primary text-xs font-black flex items-center justify-center gap-1.5 shrink-0 transition-colors",
              isScanningLabel && "opacity-60 cursor-wait"
            )}
          >
            {isScanningLabel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 text-accent-green" />
                <span>Scan Label AI</span>
              </>
            )}
          </button>
        </div>

        {/* Scan Status / Error */}
        {isScanningLabel && (
          <div className="review-card p-3 border border-accent-green/30 flex items-center gap-2.5 text-xs text-text-primary font-semibold animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>Scanning nutrition label... Mengekstrak kalori & makronutrisi dengan AI Vision.</span>
          </div>
        )}

        {scanError && (
          <div className="p-3 rounded-input border border-destructive/30 bg-destructive/10 flex items-center justify-between gap-2 text-xs text-destructive font-medium">
            <span>{scanError}</span>
            <button
              type="button"
              onClick={() => setScanError(null)}
              className="p-1 hover:bg-destructive/20 rounded-input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Quick Filter Source Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border-divider text-xs">
          <button
            onClick={() => setSourceTab("all")}
            className={cn(
              "nav-item px-3.5 py-1.5 rounded-navigation transition-colors flex items-center gap-1.5 whitespace-nowrap",
              sourceTab === "all"
                ? "is-selected font-bold"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Semua Katalog</span>
          </button>

          <button
            onClick={() => setSourceTab("recent")}
            className={cn(
              "nav-item px-3.5 py-1.5 rounded-navigation transition-colors flex items-center gap-1.5 whitespace-nowrap",
              sourceTab === "recent"
                ? "is-selected font-bold"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            <History className="h-3.5 w-3.5" />
            <span>Baru Dimakan</span>
          </button>

          <button
            onClick={() => setSourceTab("frequent")}
            className={cn(
              "nav-item px-3.5 py-1.5 rounded-navigation transition-colors flex items-center gap-1.5 whitespace-nowrap",
              sourceTab === "frequent"
                ? "is-selected font-bold"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Paling Sering</span>
          </button>

          <button
            onClick={() => setSourceTab("saved")}
            className={cn(
              "nav-item px-3.5 py-1.5 rounded-navigation transition-colors flex items-center gap-1.5 whitespace-nowrap",
              sourceTab === "saved"
                ? "is-selected font-bold"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Tersimpan / Resep Saya ({customFoods.length})</span>
          </button>

          <button
            onClick={() => setSourceTab("branded")}
            className={cn(
              "nav-item px-3.5 py-1.5 rounded-navigation transition-colors flex items-center gap-1.5 whitespace-nowrap",
              sourceTab === "branded"
                ? "is-selected font-bold"
                : "text-neutral-10 hover:text-text-primary"
            )}
          >
            <Store className="h-3.5 w-3.5" />
            <span>Restoran & Branded</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "nav-item px-3 py-1 border whitespace-nowrap transition-colors",
                selectedCategory === cat
                  ? "is-selected border-accent-orange font-bold"
                  : "bg-surface-subtle text-neutral-10 border-border-default"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Multi-Select Item Rows */}
        <div className="divide-y divide-border-divider/70 max-h-[500px] overflow-y-auto pr-1 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted space-y-2">
              <p className="font-semibold text-text-primary">
                Makanan tidak ditemukan di tab ini.
              </p>
              <p>
                Tidak menemukan menu yang dicari? Daftarkan langsung ke database pribadimu:
              </p>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(true)}
                className="button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Buat Makanan Baru</span>
              </button>
            </div>
          ) : (
            filteredItems.map((food) => {
              const staged = stagedItems.find((i) => i.id === food.id);
              const isChecked = !!staged;
              const currentMultiplier = staged?.servingMultiplier ?? food.defaultServingSize ?? 1;

              return (
                <div
                  key={food.id}
                  className={cn(
                    "p-3 rounded-card transition-all border",
                    isChecked
                      ? "bg-accent-yellow/20 border-accent-orange shadow-2xs"
                      : "border-transparent hover:bg-surface-subtle"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox & Details */}
                    <div
                      onClick={() => toggleItemInTray(food)}
                      className="flex items-start gap-3 cursor-pointer flex-1"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Controlled by row click
                        className="h-4 w-4 mt-0.5 rounded accent-accent-green cursor-pointer shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground">
                            {food.name}
                          </p>
                          {food.brandOrSource && (
                            <span className="px-1.5 py-0.2 rounded bg-surface border border-border-default text-[10px] text-text-muted">
                              {food.brandOrSource}
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded-pill bg-surface-subtle text-[10px] text-text-muted">
                            {food.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Basis: {food.defaultServingSize} {food.servingUnit} • P:{" "}
                          <span className="text-macro-protein font-semibold">{food.proteinG}g</span> | K:{" "}
                          <span className="text-accent-orange font-semibold">{food.carbsG}g</span> | L:{" "}
                          <span className="text-macro-fat font-semibold">{food.fatG}g</span>
                        </p>
                      </div>
                    </div>

                    {/* Calories & Quick Add Button */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-black text-text-primary">
                        {isChecked
                          ? Math.round(food.calories * currentMultiplier)
                          : food.calories}{" "}
                        kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleItemInTray(food)}
                        className={cn(
                          "h-7 w-7 rounded-navigation flex items-center justify-center text-xs transition-colors",
                          isChecked
                            ? "bg-accent-orange text-text-inverse font-black shadow-xs"
                            : "bg-surface-subtle border border-border-default text-text-muted hover:border-accent-green hover:text-text-primary"
                        )}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Portion Expander when Checked */}
                  {isChecked && (
                    <div className="mt-3 pt-2.5 border-t border-border-divider/60 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-text-muted">
                          Porsi:
                        </span>
                        <div className="flex items-center gap-1">
                          {[0.5, 1, 1.5, 2].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => updatePortionMultiplier(food.id, val)}
                              className={cn(
                                "px-2 py-0.5 rounded-pill text-[10px] font-bold border transition-colors",
                                currentMultiplier === val
                                  ? "bg-accent-orange text-text-inverse border-accent-orange"
                                  : "bg-surface border-border-default text-neutral-10 hover:border-accent-orange"
                              )}
                            >
                              {val}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stepper Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updatePortionMultiplier(food.id, currentMultiplier - 0.25)
                          }
                          className="h-6 w-6 rounded-navigation border border-border-default bg-surface hover:bg-surface-subtle flex items-center justify-center text-text-primary"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-extrabold text-xs min-w-[36px] text-center">
                          {currentMultiplier}x
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updatePortionMultiplier(food.id, currentMultiplier + 0.25)
                          }
                          className="h-6 w-6 rounded-navigation border border-border-default bg-surface hover:bg-surface-subtle flex items-center justify-center text-text-primary"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <span className="text-[10px] text-text-muted ml-1">
                          ({Math.round((food.gramsPerUnit || 100) * currentMultiplier)}g)
                        </span>
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
        <div className="fixed bottom-14 lg:bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-4xl mx-auto z-40">
          <div className="rounded-card border-2 border-accent-green bg-surface/95 backdrop-blur-md shadow-2xl p-3 sm:p-4 transition-all">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Tray Summary */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTrayDrawerOpen(!isTrayDrawerOpen)}
                  className="h-9 w-9 rounded-navigation bg-accent-green text-text-inverse flex items-center justify-center font-black shrink-0 shadow-xs hover:opacity-90"
                >
                  {isTrayDrawerOpen ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronUp className="h-5 w-5" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-text-primary font-heading">
                      🍽️ Piring {MEAL_TYPES.find((m) => m.id === activeMeal)?.label}:
                    </span>
                    <span className="px-2 py-0.5 rounded-pill bg-accent-green/20 text-text-primary text-[10px] font-black">
                      {stagedItems.length} Menu
                    </span>
                    {trayTotals.isComboBalanced && (
                      <span className="px-2 py-0.5 rounded-pill bg-accent-yellow border border-accent-orange text-text-primary text-[10px] font-black hidden sm:inline-flex items-center gap-1">
                        ✨ Combo Seimbang (+40% XP)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span className="font-extrabold text-text-primary">
                      {trayTotals.calories} kcal
                    </span>
                    <span className="text-text-muted text-[11px]">
                      • P: {Math.round(trayTotals.proteinG)}g | K: {Math.round(trayTotals.carbsG)}g | L: {Math.round(trayTotals.fatG)}g
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTrayDrawerOpen(!isTrayDrawerOpen)}
                  className="px-3 py-2 rounded-button border border-border-default bg-surface hover:bg-surface-subtle text-xs font-bold text-text-primary transition-colors"
                >
                  {isTrayDrawerOpen ? "Tutup Piring" : `Lihat Piring (${stagedItems.length})`}
                </button>

                <button
                  type="button"
                  onClick={handleBatchCommit}
                  className="button-primary px-4 py-2 text-xs flex items-center justify-center gap-1.5 font-black shadow-md flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambahkan Dipilih & Dapatkan XP</span>
                </button>
              </div>
            </div>

            {/* Expandable Tray Drawer List */}
            {isTrayDrawerOpen && (
              <div className="mt-3 pt-3 border-t border-border-divider/80 max-h-56 overflow-y-auto space-y-2 pr-1 animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-muted pb-1">
                  <span>Daftar Menu di Piring:</span>
                  <button
                    type="button"
                    onClick={() => setStagedItems([])}
                    className="text-destructive hover:underline"
                  >
                    Kosongkan Piring
                  </button>
                </div>

                {stagedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-input bg-surface-subtle border border-border-divider flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-text-primary">{item.name}</p>
                      <p className="text-[10px] text-text-muted">
                        {item.servingMultiplier}x {item.servingUnit} •{" "}
                        {Math.round(item.baseCalories * item.servingMultiplier)} kcal (P:{" "}
                        {Math.round(item.baseProteinG * item.servingMultiplier)}g)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updatePortionMultiplier(
                              item.id,
                              item.servingMultiplier - 0.25
                            )
                          }
                          className="h-5 w-5 rounded-navigation border border-border-default bg-surface flex items-center justify-center text-text-primary"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-[11px] font-bold w-6 text-center">
                          {item.servingMultiplier}x
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updatePortionMultiplier(
                              item.id,
                              item.servingMultiplier + 0.25
                            )
                          }
                          className="h-5 w-5 rounded-navigation border border-border-default bg-surface flex items-center justify-center text-text-primary"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemFromTray(item.id)}
                        className="p-1 text-text-muted hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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

      {/* AI Label Review & Staging Modal */}
      {scannedData && (
        <ReviewScanModal
          initialData={scannedData}
          imagePreviewUrl={scannedImagePreviewUrl}
          mealTime={activeMeal}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSuccess={() => {
            setIsReviewModalOpen(false);
            router.push("/diary");
          }}
          onAddToStaging={(item) => {
            setStagedItems((prev) => [...prev, item]);
          }}
        />
      )}

      {/* GAMIFICATION REWARD POP-UP MODAL */}
      {rewardResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-border-divider bg-surface p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-pill bg-accent-yellow border-2 border-accent-green text-text-primary flex items-center justify-center mx-auto shadow-xs text-3xl">
              {rewardResult.isDailyJackpot
                ? "🎰"
                : rewardResult.isComboBalanced
                ? "✨"
                : "⭐"}
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-pill text-xs font-bold uppercase tracking-wider bg-accent-green/15 text-text-primary">
                {rewardResult.isComboBalanced
                  ? "COMBO PIRING SEIMBANG!"
                  : "REWARD GIZI DITERIMA"}
              </span>
              <h3 className="text-xl font-black text-text-primary font-heading">
                {rewardResult.title}
              </h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {rewardResult.message}
              </p>
            </div>

            {/* XP & Coin Breakdown */}
            <div className="review-card grid grid-cols-2 gap-3 p-4 border border-accent-green/25 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-10">Total XP Didapat</span>
                <p className="text-xl font-black text-text-primary font-heading">
                  +{rewardResult.totalXp} XP
                </p>
                {rewardResult.bonusMultiplier > 1 && (
                  <span className="text-[9px] font-bold text-text-primary">
                    (x{rewardResult.bonusMultiplier} Combo Multiplier)
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-10">Caloria Coins</span>
                <p className="text-xl font-black text-accent-orange-dark font-heading flex items-center justify-center gap-1">
                  <Coins className="h-4 w-4 text-accent-orange" />
                  +{rewardResult.coinsEarned}
                </p>
                <span className="text-[9px] text-neutral-10">Saldo Baru: {coins} Koin</span>
              </div>
            </div>

            <button
              onClick={handleFinishReward}
              className="button-primary w-full py-3 text-xs font-black"
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
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-pill text-xs font-black uppercase tracking-wider bg-accent-orange text-text-inverse">
                LEVEL UP!
              </span>
              <h2 className="text-2xl font-black text-text-primary font-heading">
                Pet Naik ke Level {rewardResult.newLevel}!
              </h2>
              {rewardResult.evolvedStage && (
                <p className="text-xs font-bold text-accent-orange-dark">
                  ✨ Evolusi Fisik: Pet kini telah bertransformasi ke Tahap {rewardResult.newStage}!
                </p>
              )}
            </div>

            <p className="text-xs text-text-muted">
              Piring nutrisi seimbangmu membuat Pet semakin kuat dan ceria. Terus pertahankan asupan gizi harianmu!
            </p>

            <button
              onClick={handleFinishReward}
              className="button-primary w-full py-3 text-xs font-black"
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
            <p className="text-sm font-medium text-text-muted">
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