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
  const [scanVersion, setScanVersion] = useState(0);

  const handleLabelFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so the same file can be re-selected if needed
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

      setScanVersion((v) => v + 1);
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

    // 1. Evaluate reward using pure calculation engine
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

    // 2. Persist log
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

    // 3. Feed the pet
    feedPet(calculated.calories, result.totalXp, result.coinsEarned);

    // 4. Trigger popups
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
      <div className="flex items-center justify-between pb-4  ">
        <div className="flex items-center gap-2">
          <Link
            href="/diary"
            className="btn-icon"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Pencarian Makanan & Input Porsi
            </h1>
            <p className="text-xs text-ink-muted">
              Pilih waktu makan, cari katalog makanan, dan amati panel evaluasi gizi real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Meal Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-ink-muted shrink-0 mr-1">
          Waktu Makan:
        </span>
        {MEAL_TYPES.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMeal(m.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
              activeMeal === m.id
                ? "bg-brand-orange text-ink  font-bold "
                : "bg-card text-ink-muted  hover:bg-brand-green-light hover:text-brand-green-ink"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Catalog Search */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl   bg-card p-5  space-y-3">
            {/* Search Input & Scan Label Trigger */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Cari makanan (misal: Nasi, Dada Ayam, Tempe, Gado-Gado)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full field py-2.5 pl-10 pr-4 text-xs font-medium"
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
                  "btn-secondary text-xs shrink-0",
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
              <div className="p-3 rounded-2xl bg-brand-green/10 flex items-center gap-2.5 text-xs text-ink font-semibold animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>
                  Scanning nutrition label... Mengekstrak kalori & makronutrisi dengan AI Vision.
                </span>
              </div>
            )}

            {/* Scan Error Banner */}
            {scanError && (
              <div className="p-3 rounded-2xl   bg-destructive/10 flex items-center justify-between gap-2 text-xs text-destructive font-medium">
                <span>{scanError}</span>
                <button
                  type="button"
                  onClick={() => setScanError(null)}
                  className="p-1 hover:bg-destructive/20 rounded-lg"
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
                    "px-3 py-1 rounded-lg whitespace-nowrap transition-colors",
                    selectedCategory === cat
                      ? "bg-brand-orange text-ink  font-bold"
                      : "bg-surface text-ink-muted  hover:bg-brand-green-light hover:text-brand-green-ink"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Item List */}
            <div className="  max-h-[380px] overflow-y-auto pr-1">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-ink-muted">
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
                        "py-3 px-3 rounded-2xl cursor-pointer transition-colors flex items-center justify-between",
                        isSelected
                          ? "bg-brand-orange/15"
                          : "hover:bg-brand-green-light/40"
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold text-ink">{food.name}</p>
                        <p className="text-[11px] text-ink-muted">
                          {food.defaultServingSize} {food.servingUnit} • P: {food.proteinG}g | K: {food.carbsG}g | L: {food.fatG}g
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="shrink-0 whitespace-nowrap text-xs font-extrabold text-brand-green-dark">
                          {food.calories} kcal
                        </span>
                        <div
                          className={cn(
                            "h-7 w-7 rounded-xl flex items-center justify-center text-xs",
                            isSelected
                              ? "bg-brand-orange text-ink font-bold"
                              : "bg-surface text-ink-muted"
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
            <div className="rounded-3xl   bg-card p-5  space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="text-[10px] font-bold text-ink-muted uppercase">
                  Menu Terpilih
                </span>
                <h3 className="text-base font-extrabold text-ink">
                  {selectedFood.name}
                </h3>
              </div>

              {/* Portion Controls */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-ink-muted">Ukuran Porsi:</span>
                  <span className="font-bold text-ink">
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
                        "py-2 rounded-lg text-xs font-bold transition-colors",
                        portionMultiplier === v
                          ? "bg-brand-orange text-ink "
                          : "bg-surface  text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink"
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
                  className="w-full accent-brand-green cursor-pointer pt-1"
                />
              </div>

              {/* Live Nutrition Values Preview */}
              <div className="rounded-2xl   bg-surface p-4 space-y-2">
                <div className="flex justify-between items-baseline   pb-2">
                  <span className="text-xs font-semibold text-ink-muted">Total Kalori</span>
                  <span className="text-xl font-black text-brand-green-dark">
                    {calculated.calories} kcal
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-ink-muted">Protein</span>
                    <p className="font-bold text-brand-green-dark">
                      {calculated.proteinG}g
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted">Karbo</span>
                    <p className="font-bold text-brown">
                      {calculated.carbsG}g
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted">Lemak</span>
                    <p className="font-bold text-brand-green-dark">
                      {calculated.fatG}g
                    </p>
                  </div>
                </div>
              </div>

              {/* [Live Component] Panel Evaluasi Gizi Real-time */}
              {liveEvaluation && (
                <div className="p-3.5 rounded-2xl bg-surface text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    {liveEvaluation.type === "ideal" ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-green-dark" />
                    ) : liveEvaluation.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-brown" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-brand-green-dark" />
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
                className="btn-cta w-full text-sm flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Simpan ke Diary & Dapatkan XP</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl    bg-card p-10 text-center text-xs text-ink-muted space-y-2">
              <Sparkles className="h-8 w-8 text-ink-muted/40 mx-auto" />
              <p className="font-semibold text-ink">Pilih Makanan Terlebih Dahulu</p>
              <p>Klik salah satu makanan di katalog sebelah kiri untuk mengatur porsi gramasi dan melihat kalkulasi evaluasi gizi.</p>
            </div>
          )}
        </div>
      </div>

      {/* [Modal] Reward Engine Pop-up (+Base XP, Bonus Multiplier XP, Jackpot & Coins) */}
      {rewardResult && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl   bg-card p-6  text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-brand-green text-surface-raised flex items-center justify-center mx-auto  text-3xl">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-highlight text-brand-green-dark">
                Reward Gizi Diterima
              </span>
              <h3 className="text-xl font-black text-ink">
                {rewardResult.title}
              </h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                {rewardResult.message}
              </p>
            </div>

            {/* XP & Coin Breakdown */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-surface   text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-ink-muted">Total XP Didapat</span>
                <p className="text-xl font-black text-brand-green-dark">
                  +{rewardResult.totalXp} XP
                </p>
                {rewardResult.bonusMultiplier > 1 && (
                  <span className="text-[9px] font-bold text-brand-green-dark">
                    (x{rewardResult.bonusMultiplier} Bonus Multiplier)
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-ink-muted">Caloria Coins</span>
                <p className="text-xl font-black text-brown flex items-center justify-center gap-1">
                  <Coins className="h-4 w-4" />
                  +{rewardResult.coinsEarned}
                </p>
                <span className="text-[9px] text-ink-muted">Saldo Baru: {coins} Koin</span>
              </div>
            </div>

            <button
              onClick={handleFinishReward}
              className="btn-cta w-full text-xs"
            >
              Lanjut ke Food Diary
            </button>
          </div>
        </div>
      )}

      {/* [Overlay] Pet Level Up & Evolusi Fisik Trigger */}
      {showLevelUpOverlay && rewardResult?.leveledUp && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm surface-card rounded-3xl p-6 text-center space-y-4 animate-in zoom-in-90 duration-300">
            <Sparkles className="mx-auto h-10 w-10 animate-bounce text-brand-green-dark" />
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-highlight text-ink">
                LEVEL UP!
              </span>
              <h2 className="text-2xl font-black text-ink">
                Pet Naik ke Level {rewardResult.newLevel}!
              </h2>
              {rewardResult.evolvedStage && (
                <p className="text-xs font-bold text-brown">
                  Evolusi Fisik: Pet kini telah bertransformasi ke Tahap {rewardResult.newStage}!
                </p>
              )}
            </div>

            <p className="text-xs text-ink-muted">
              Konsistensi gizimu membuat Pet semakin kuat dan ceria. Terus pertahankan asupan nutrisimu!
            </p>

            <button
              onClick={handleFinishReward}
              className="btn-cta w-full text-xs"
            >
              Hore! Lanjutkan
            </button>
          </div>
        </div>
      )}
      {/* [Modal] Editable Review & Verification Modal for Scanned Nutrition Label */}
      {scannedData && (
        <ReviewScanModal
          key={`${scanVersion}-${isReviewModalOpen ? "open" : "closed"}`}
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
        <div className="container mx-auto max-w-5xl px-4 py-16 text-center text-sm text-ink-muted">
          Memuat pencarian makanan...
        </div>
      }
    >
      <DiaryAddFoodContent />
    </Suspense>
  );
}
