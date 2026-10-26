"use client";

import { useState, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Plus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Coins,
  X,
  Camera,
  Loader2,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { FOOD_CATALOG } from "@/lib/food-catalog";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { FoodCatalogItem } from "@/types";
import { evaluateFoodReward, RewardEvaluationResult } from "@/lib/reward-engine";
import { NutritionLabelData } from "@/lib/schemas/nutrition-scan";
import { ReviewScanModal } from "@/components/diary/ReviewScanModal";
import { cn } from "@/lib/utils";

/**
 * Compress an image file on the client using an HTML5 Canvas
 * (max 1200px width/height, ~80% JPEG quality).
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
  const initialMeal = (searchParams.get("meal") as MealTypeId) || "breakfast";

  const { addLog, getConsumed, targets, goalPlan } = useFoodStore();
  const { feedPet, level, exp, stage, coins } = usePetStore();

  const [activeMeal, setActiveMeal] = useState<MealTypeId>(initialMeal);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedFood, setSelectedFood] = useState<FoodCatalogItem | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [rewardResult, setRewardResult] = useState<RewardEvaluationResult | null>(null);
  const [showLevelUpOverlay, setShowLevelUpOverlay] = useState(false);

  // Nutrition Label Scanner states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isScanningLabel, setIsScanningLabel] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<NutritionLabelData | null>(null);
  const [scannedImagePreviewUrl, setScannedImagePreviewUrl] = useState<string>("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

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
    return ["Semua", ...Array.from(new Set(FOOD_CATALOG.map((f) => f.category)))];
  }, []);

  // Filter catalog
  const filteredItems = useMemo(() => {
    return FOOD_CATALOG.filter((item) => {
      const matchQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "Semua" || item.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  // Live calculated nutrition
  const calculated = useMemo(() => {
    if (!selectedFood) return null;
    const mult = Math.max(0.1, portionMultiplier);
    return {
      calories: Math.round(selectedFood.calories * mult),
      proteinG: Math.round(selectedFood.proteinG * mult * 10) / 10,
      carbsG: Math.round(selectedFood.carbsG * mult * 10) / 10,
      fatG: Math.round(selectedFood.fatG * mult * 10) / 10,
      fiberG: Math.round(selectedFood.fiberG * mult * 10) / 10,
      sugarG: Math.round(selectedFood.sugarG * mult * 10) / 10,
      grams: Math.round(selectedFood.gramsPerUnit * mult),
    };
  }, [selectedFood, portionMultiplier]);

  // Live Real-Time Nutrition Evaluation Preview
  const liveEvaluation = useMemo(() => {
    if (!calculated) return null;
    const prospectiveFat = consumed.fat + calculated.fatG;
    const fatPercent = Math.round((prospectiveFat / targets.fat) * 100);

    const prospectiveProtein = consumed.protein + calculated.proteinG;
    const proteinPercent = Math.round((prospectiveProtein / targets.protein) * 100);

    if (fatPercent >= 85 && goalPlan.goalType === "diet") {
      return {
        type: "warning" as const,
        title: "Peringatan Asupan Lemak Mendekati Batas",
        message: `Dengan menu ini, total lemak hari ini mencapai ${fatPercent}% dari kuota program Diet. Pertimbangkan porsi lebih kecil atau kurangi minyak pada makan malam nanti ya!`,
      };
    }

    if (calculated.proteinG >= 20 || proteinPercent >= 70) {
      return {
        type: "ideal" as const,
        title: "Pilihan Bagus! Mendukung Misi Protein",
        message: `Menu ini menyumbang ${calculated.proteinG}g protein. Kamu sudah memenuhi ${Math.min(100, proteinPercent)}% misi protein harian untuk program ${goalPlan.goalType.toUpperCase()}-mu!`,
      };
    }

    return {
      type: "info" as const,
      title: "Menu Nutrisi Seimbang",
      message: `Menu ini menyumbang ${calculated.calories} kcal ke target harianmu.`,
    };
  }, [calculated, consumed, targets, goalPlan]);

  const handleSaveAndEvaluate = () => {
    if (!selectedFood || !calculated) return;

    const result = evaluateFoodReward({
      foodName: selectedFood.name,
      foodCalories: calculated.calories,
      foodProteinG: calculated.proteinG,
      foodFatG: calculated.fatG,
      currentDailyConsumed: consumed,
      dailyTargets: targets,
      goalType: goalPlan.goalType,
      currentLevel: level,
      currentExp: exp,
      currentStage: stage,
    });

    addLog({
      name: selectedFood.name,
      mealType: activeMeal,
      calories: calculated.calories,
      proteinG: calculated.proteinG,
      carbsG: calculated.carbsG,
      fatG: calculated.fatG,
      fiberG: calculated.fiberG,
      sugarG: calculated.sugarG,
      servingSize: portionMultiplier,
      servingUnit: `${portionMultiplier}x ${selectedFood.servingUnit}`,
      loggedDate: new Date().toISOString().split("T")[0],
    });

    feedPet(calculated.calories, result.totalXp, result.coinsEarned);

    setRewardResult(result);
    if (result.leveledUp) {
      setShowLevelUpOverlay(true);
    }
  };

  const handleFinishReward = () => {
    setRewardResult(null);
    setShowLevelUpOverlay(false);
    router.push("/diary");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-divider">
        <div className="flex items-center gap-2">
          <Link
            href="/diary"
            className="p-1.5 rounded-navigation border border-border-default hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary font-heading">
              Pencarian Makanan & Input Porsi
            </h1>
            <p className="text-xs text-text-muted">
              Pilih waktu makan, cari katalog makanan, dan amati panel evaluasi gizi real-time.
            </p>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Catalog Search */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-card border border-border-divider bg-surface p-6 space-y-3.5 shadow-xs">
            {/* Search Input & Scan Label Trigger */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari makanan (misal: Nasi, Dada Ayam, Tempe, Gado-Gado)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field w-full pl-10 pr-4 py-2.5 text-xs font-medium"
                />
              </div>

              {/* Hidden File Input for Camera / Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleLabelFileChange}
                className="hidden"
              />

              {/* Scan Label Button */}
              <button
                type="button"
                disabled={isScanningLabel}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "px-4 py-2.5 rounded-button border border-accent-green bg-accent-green-light/60 hover:bg-accent-green-light text-text-primary text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-colors",
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
                    <Camera className="h-4 w-4" />
                    <span>Scan Label</span>
                  </>
                )}
              </button>
            </div>

            {/* Scanning Status Banner */}
            {isScanningLabel && (
              <div className="review-card p-3 border border-accent-green/30 flex items-center gap-2.5 text-xs text-text-primary font-semibold animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>
                  Scanning nutrition label... Mengekstrak kalori & makronutrisi dengan AI Vision.
                </span>
              </div>
            )}

            {/* Scan Error Banner */}
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

            {/* Item List */}
            <div className="divide-y divide-border-divider/60 max-h-[380px] overflow-y-auto pr-1">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  Makanan tidak ditemukan. Coba kata kunci lainnya.
                </div>
              ) : (
                filteredItems.map((food) => {
                  const isSelected = selectedFood?.id === food.id;
                  return (
                    <div
                      key={food.id}
                      onClick={() => {
                        setSelectedFood(food);
                        setPortionMultiplier(food.defaultServingSize);
                      }}
                      className={cn(
                        "py-3 px-3 rounded-button cursor-pointer transition-colors flex items-center justify-between",
                        isSelected
                          ? "bg-accent-yellow/55 border border-accent-orange"
                          : "hover:bg-surface-subtle"
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{food.name}</p>
                        <p className="text-[11px] text-text-muted">
                          {food.defaultServingSize} {food.servingUnit} • P: {food.proteinG}g | K: {food.carbsG}g | L: {food.fatG}g
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-text-primary">
                          {food.calories} kcal
                        </span>
                        <div
                          className={cn(
                            "h-7 w-7 rounded-navigation flex items-center justify-center text-xs",
                            isSelected
                              ? "bg-accent-orange text-text-inverse font-bold"
                              : "bg-surface-subtle border border-border-default text-text-muted"
                          )}
                        >
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Portion Adjuster & Real-Time Evaluator */}
        <div className="lg:col-span-5 space-y-4">
          {selectedFood && calculated ? (
            <div className="rounded-card border border-border-divider bg-surface p-6 space-y-4 shadow-xs animate-in fade-in duration-200">
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase">
                  Menu Terpilih
                </span>
                <h3 className="text-base font-extrabold text-text-primary">
                  {selectedFood.name}
                </h3>
              </div>

              {/* Portion Controls */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-muted">Ukuran Porsi:</span>
                  <span className="font-bold text-text-primary">
                    {portionMultiplier}x ({calculated.grams} gram)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[0.5, 1, 1.5, 2].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPortionMultiplier(v)}
                      className={cn(
                        "nav-item py-2 text-xs font-bold border transition-colors",
                        portionMultiplier === v
                          ? "is-selected border-accent-orange"
                          : "bg-surface-subtle border-border-default text-neutral-10"
                      )}
                    >
                      {v}x
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="0.25"
                  max="4"
                  step="0.25"
                  value={portionMultiplier}
                  onChange={(e) => setPortionMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-accent-green cursor-pointer pt-1"
                />
              </div>

              {/* Live Nutrition Values Preview (Review Card Surface) */}
              <div className="review-card p-4 border border-accent-green/25 space-y-2">
                <div className="flex justify-between items-baseline border-b border-text-primary/15 pb-2">
                  <span className="text-xs font-bold text-text-primary">Total Kalori</span>
                  <span className="text-xl font-black text-text-primary font-heading">
                    {calculated.calories} kcal
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-10">Protein</span>
                    <p className="font-bold text-macro-protein">
                      {calculated.proteinG}g
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-10">Karbo</span>
                    <p className="font-bold text-accent-orange-dark">
                      {calculated.carbsG}g
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-10">Lemak</span>
                    <p className="font-bold text-macro-fat">
                      {calculated.fatG}g
                    </p>
                  </div>
                </div>
              </div>

              {/* [Live Component] Panel Evaluasi Gizi Real-time */}
              {liveEvaluation && (
                <div
                  className={cn(
                    "p-3.5 rounded-button border text-xs space-y-1",
                    liveEvaluation.type === "ideal"
                      ? "bg-accent-green/15 border-accent-green/35 text-text-primary"
                      : liveEvaluation.type === "warning"
                      ? "bg-accent-orange/15 border-accent-orange/35 text-accent-orange-dark"
                      : "bg-surface-subtle border-border-divider text-neutral-10"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {liveEvaluation.type === "ideal" ? (
                      <CheckCircle2 className="h-4 w-4 text-accent-green" />
                    ) : liveEvaluation.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-accent-orange" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-text-primary" />
                    )}
                    <span>{liveEvaluation.title}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed pl-5">
                    {liveEvaluation.message}
                  </p>
                </div>
              )}

              {/* Action: Save & Trigger Reward Pop-up */}
              <button
                onClick={handleSaveAndEvaluate}
                className="button-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Simpan ke Diary & Dapatkan XP</span>
              </button>
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-border-default bg-surface p-10 text-center text-xs text-text-muted space-y-2">
              <Sparkles className="h-8 w-8 text-accent-green/50 mx-auto" />
              <p className="font-bold text-text-primary">Pilih Makanan Terlebih Dahulu</p>
              <p>Klik salah satu makanan di katalog sebelah kiri untuk mengatur porsi gramasi dan melihat kalkulasi evaluasi gizi.</p>
            </div>
          )}
        </div>
      </div>

      {/* [Modal] Reward Engine Pop-up (+Base XP, Bonus Multiplier XP, Jackpot & Coins) */}
      {rewardResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-border-divider bg-surface p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-pill bg-accent-yellow border-2 border-accent-green text-text-primary flex items-center justify-center mx-auto shadow-xs text-3xl">
              {rewardResult.isDailyJackpot ? "🎰" : "⭐"}
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-pill text-xs font-bold uppercase tracking-wider bg-accent-green/15 text-text-primary">
                Reward Gizi Diterima
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
                    (x{rewardResult.bonusMultiplier} Bonus Multiplier)
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
              className="button-primary w-full py-3 text-xs"
            >
              Lanjut ke Food Diary
            </button>
          </div>
        </div>
      )}

      {/* [Overlay] Pet Level Up & Evolusi Fisik Trigger */}
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
              Konsistensi gizimu membuat Pet semakin kuat dan ceria. Terus pertahankan asupan nutrisimu!
            </p>

            <button
              onClick={handleFinishReward}
              className="button-primary w-full py-3 text-xs"
            >
              Hore! Lanjutkan
            </button>
          </div>
        </div>
      )}
      {/* [Modal] Editable Review & Verification Modal for Scanned Nutrition Label */}
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
        />
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
