/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Check,
  Minus,
  Plus,
  Sparkles,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Loader2,
  BookmarkPlus,
  ShieldCheck,
} from "lucide-react";
import { NutritionLabelData } from "@/lib/schemas/nutrition-scan";
import { logScannedNutritionAction } from "@/app/actions/nutrition-scan";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { StagedFoodItem } from "@/types";
import { cn } from "@/lib/utils";

export interface ReviewScanModalProps {
  initialData: NutritionLabelData;
  imagePreviewUrl: string;
  mealTime: "breakfast" | "lunch" | "dinner" | "snack";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onAddToStaging?: (item: StagedFoodItem) => void;
}

export function ReviewScanModal({
  initialData,
  imagePreviewUrl,
  mealTime,
  isOpen,
  onClose,
  onSuccess,
  onAddToStaging,
}: ReviewScanModalProps) {
  const { addLog } = useFoodStore();
  const { feedPet } = usePetStore();

  // Editable controlled inputs
  const [foodName, setFoodName] = useState(
    initialData.foodName || "Scanned Food"
  );
  const [servingSize, setServingSize] = useState<string>(
    initialData.servingSize !== null && initialData.servingSize !== undefined
      ? String(initialData.servingSize)
      : "100"
  );
  const [servingUnit, setServingUnit] = useState(
    initialData.servingUnit || "g"
  );
  const [servingsConsumed, setServingsConsumed] = useState<number>(1.0);

  // Per-serving macros
  const [caloriesKcal, setCaloriesKcal] = useState<string>(
    String(initialData.caloriesKcal ?? 0)
  );
  const [proteinG, setProteinG] = useState<string>(
    String(initialData.proteinG ?? 0)
  );
  const [carbsG, setCarbsG] = useState<string>(String(initialData.carbsG ?? 0));
  const [fatG, setFatG] = useState<string>(String(initialData.fatG ?? 0));
  const [fiberG, setFiberG] = useState<string>(String(initialData.fiberG ?? 0));
  const [sugarG, setSugarG] = useState<string>(String(initialData.sugarG ?? 0));

  const [saveToCatalog, setSaveToCatalog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync state when initialData changes
  useEffect(() => {
    setFoodName(initialData.foodName || "Scanned Food");
    setServingSize(
      initialData.servingSize !== null && initialData.servingSize !== undefined
        ? String(initialData.servingSize)
        : "100"
    );
    setServingUnit(initialData.servingUnit || "g");
    setServingsConsumed(1.0);
    setCaloriesKcal(String(initialData.caloriesKcal ?? 0));
    setProteinG(String(initialData.proteinG ?? 0));
    setCarbsG(String(initialData.carbsG ?? 0));
    setFatG(String(initialData.fatG ?? 0));
    setFiberG(String(initialData.fiberG ?? 0));
    setSugarG(String(initialData.sugarG ?? 0));
    setSaveToCatalog(false);
    setSubmitError(null);
  }, [initialData]);

  // Parse numeric values safely
  const parsedPerServing = useMemo(() => {
    const parseNum = (v: string) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    return {
      caloriesKcal: parseNum(caloriesKcal),
      proteinG: parseNum(proteinG),
      carbsG: parseNum(carbsG),
      fatG: parseNum(fatG),
      fiberG: parseNum(fiberG),
      sugarG: parseNum(sugarG),
    };
  }, [caloriesKcal, proteinG, carbsG, fatG, fiberG, sugarG]);

  // Real-Time Dynamic Recalculation: Total = perServingValue * servingsConsumed
  const totals = useMemo(() => {
    const mult = Math.max(0.25, servingsConsumed);
    return {
      calories: Math.round(parsedPerServing.caloriesKcal * mult),
      protein: Math.round(parsedPerServing.proteinG * mult * 10) / 10,
      carbs: Math.round(parsedPerServing.carbsG * mult * 10) / 10,
      fat: Math.round(parsedPerServing.fatG * mult * 10) / 10,
      fiber: Math.round(parsedPerServing.fiberG * mult * 10) / 10,
      sugar: Math.round(parsedPerServing.sugarG * mult * 10) / 10,
    };
  }, [parsedPerServing, servingsConsumed]);

  if (!isOpen) return null;

  const handleAdjustServings = (delta: number) => {
    setServingsConsumed((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.max(0.25, next);
    });
  };

  const handleConfirmAndLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const numericServingSize = parseFloat(servingSize);
      const cleanServingSize =
        Number.isFinite(numericServingSize) && numericServingSize > 0
          ? numericServingSize
          : null;

      // 1. Call Server Action (Drizzle DB persistence for foods, food_logs, daily_nutrition_summaries, pets)
      const actionResult = await logScannedNutritionAction({
        foodName: foodName.trim() || "Scanned Food",
        servingSize: cleanServingSize,
        servingUnit: servingUnit.trim() || "g",
        servingsConsumed,
        mealTime,
        perServing: parsedPerServing,
        saveToCatalog,
      });

      if (!actionResult.success && actionResult.error) {
        console.warn("DB action warning:", actionResult.error);
      }

      // 2. Also update client Zustand store so UI reflects immediately
      addLog({
        name: foodName.trim() || "Scanned Food",
        mealType: mealTime,
        calories: totals.calories,
        proteinG: totals.protein,
        carbsG: totals.carbs,
        fatG: totals.fat,
        fiberG: totals.fiber,
        sugarG: totals.sugar,
        servingSize: servingsConsumed,
        servingUnit: `${servingsConsumed}x (${cleanServingSize ?? 100}${
          servingUnit || "g"
        })`,
        loggedDate: new Date().toISOString().split("T")[0],
      });

      // 3. Award +10 Base XP to Pet in client store
      feedPet(totals.calories, 10, 5);

      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data nutrisi. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confidencePercent =
    initialData.confidenceScore !== undefined
      ? Math.round(initialData.confidenceScore * 100)
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-card border border-border-divider bg-surface shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-divider bg-accent-yellow/35">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-navigation bg-accent-green/20 text-text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text-primary font-heading">
                Review Hasil Scan Label Gizi
              </h2>
              <p className="text-[11px] text-neutral-10">
                Periksa & sesuaikan angka sebelum disimpan ke Food Diary
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmAndLog} className="p-6 space-y-5">
          {/* Top Row: Thumbnail Preview & Basic Food Identity */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Compact Thumbnail Preview */}
            <div className="relative w-full sm:w-28 h-28 rounded-button border border-border-default overflow-hidden bg-surface-subtle shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl}
                alt="Scanned nutrition label"
                className="w-full h-full object-cover"
              />
              {confidencePercent !== null && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-input bg-black/75 text-white text-[10px] font-bold flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-accent-green-light" />
                  <span>AI {confidencePercent}%</span>
                </div>
              )}
            </div>

            {/* Food Name & Serving Size Inputs */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                  Nama Makanan / Produk
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  required
                  placeholder="Contoh: Susu UHT Full Cream"
                  className="input-field w-full px-3.5 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Takaran Saji (1 Porsi)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="30"
                    className="input-field w-full px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Satuan Unit
                  </label>
                  <input
                    type="text"
                    value={servingUnit}
                    onChange={(e) => setServingUnit(e.target.value)}
                    placeholder="g / ml / pcs"
                    className="input-field w-full px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Servings Consumed Multiplier Stepper */}
          <div className="rounded-button border border-border-divider bg-surface-subtle p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-foreground block">
                  Jumlah Porsi Dikonsumsi
                </span>
                <span className="text-[11px] text-text-muted">
                  1 porsi = {servingSize || "100"} {servingUnit || "g"}
                  {initialData.servingsPerContainer
                    ? ` • ${initialData.servingsPerContainer} sajian/kemasan`
                    : ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjustServings(-0.25)}
                  className="h-8 w-8 rounded-input border border-border-default bg-surface hover:bg-accent-green-light flex items-center justify-center text-foreground hover:text-text-primary transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="50"
                  value={servingsConsumed}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (Number.isFinite(val) && val > 0) {
                      setServingsConsumed(val);
                    }
                  }}
                  className="input-field w-16 text-center py-1 text-xs font-extrabold"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustServings(0.25)}
                  className="h-8 w-8 rounded-input border border-border-default bg-surface hover:bg-accent-green-light flex items-center justify-center text-foreground hover:text-text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Quick shortcuts for portions (including full package if available) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border-divider/50">
              <span className="text-[10px] font-semibold text-text-muted mr-1">Cepat:</span>
              <button
                type="button"
                onClick={() => setServingsConsumed(1.0)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors",
                  servingsConsumed === 1.0
                    ? "bg-accent-green-light border-brand-primary text-text-primary"
                    : "border-border-default bg-surface text-text-muted hover:text-foreground"
                )}
              >
                1 porsi
              </button>
              {initialData.servingsPerContainer && initialData.servingsPerContainer !== 1 && (
                <button
                  type="button"
                  onClick={() => setServingsConsumed(initialData.servingsPerContainer!)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1",
                    servingsConsumed === initialData.servingsPerContainer
                      ? "bg-accent-green-light border-brand-primary text-text-primary"
                      : "border-border-default bg-surface text-text-muted hover:text-foreground"
                  )}
                >
                  <span>1 kemasan penuh</span>
                  <span className="opacity-75">({initialData.servingsPerContainer} porsi)</span>
                </button>
              )}
              {initialData.servingsPerContainer && initialData.servingsPerContainer > 1 && (
                <button
                  type="button"
                  onClick={() => setServingsConsumed(Math.max(0.25, Math.round((initialData.servingsPerContainer! / 2) * 100) / 100))}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors",
                    servingsConsumed === Math.max(0.25, Math.round((initialData.servingsPerContainer! / 2) * 100) / 100)
                      ? "bg-accent-green-light border-brand-primary text-text-primary"
                      : "border-border-default bg-surface text-text-muted hover:text-foreground"
                  )}
                >
                  1/2 kemasan
                </button>
              )}
            </div>
          </div>

          {/* Editable Per-Serving Macros Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Nilai Gizi Per 1 Sajian (Dapat Diedit)
              </span>
              <span className="text-[11px] text-text-muted">
                Waktu Makan:{" "}
                <strong className="text-text-primary capitalize">
                  {mealTime}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Calories */}
              <div className="rounded-input border border-border-default bg-surface-subtle p-2.5">
                <label className="flex items-center gap-1 text-[10px] font-bold text-text-primary uppercase mb-1">
                  <Flame className="h-3 w-3" /> Kalori (kcal)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={caloriesKcal}
                  onChange={(e) => setCaloriesKcal(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-foreground outline-none"
                />
              </div>

              {/* Protein */}
              <div className="rounded-input border border-border-default bg-surface-subtle p-2.5">
                <label className="flex items-center gap-1 text-[10px] font-bold text-macro-protein uppercase mb-1">
                  <Beef className="h-3 w-3" /> Protein (g)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-foreground outline-none"
                />
              </div>

              {/* Carbs */}
              <div className="rounded-input border border-border-default bg-surface-subtle p-2.5">
                <label className="flex items-center gap-1 text-[10px] font-bold text-accent-orange-dark uppercase mb-1">
                  <Wheat className="h-3 w-3" /> Karbohidrat (g)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-foreground outline-none"
                />
              </div>

              {/* Fat */}
              <div className="rounded-input border border-border-default bg-surface-subtle p-2.5">
                <label className="flex items-center gap-1 text-[10px] font-bold text-macro-fat uppercase mb-1">
                  <Droplets className="h-3 w-3" /> Lemak Total (g)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={fatG}
                  onChange={(e) => setFatG(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-foreground outline-none"
                />
              </div>

              {/* Fiber */}
              <div className="rounded-input border border-border-default bg-surface-subtle p-2.5">
                <label className="block text-[10px] font-bold text-text-primary uppercase mb-1">
                  Serat Pangan (g)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={fiberG}
                  onChange={(e) => setFiberG(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-foreground outline-none"
                />
              </div>

              {/* Sugar */}
              <div className="rounded-input border border-border-default bg-surface-subtle p-2.5">
                <label className="block text-[10px] font-bold text-macro-sugar uppercase mb-1">
                  Gula Total (g)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={sugarG}
                  onChange={(e) => setSugarG(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          {/* Real-Time Dynamic Recalculation Summary Badge (Review Card Surface) */}
          <div className="review-card p-4 space-y-2.5 border border-accent-green/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-text-primary">
                Total Asupan ({servingsConsumed}x Porsi)
              </span>
              <span className="text-lg font-black text-text-primary font-heading">
                {totals.calories} kcal
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-text-primary/15 text-center text-xs">
              <div>
                <span className="text-[10px] text-neutral-10 block">
                  Protein
                </span>
                <span className="font-extrabold text-macro-protein">
                  {totals.protein}g
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-10 block">
                  Karbo
                </span>
                <span className="font-extrabold text-accent-orange-dark">
                  {totals.carbs}g
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-10 block">
                  Lemak
                </span>
                <span className="font-extrabold text-macro-fat">
                  {totals.fat}g
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-10 block">
                  Serat / Gula
                </span>
                <span className="font-bold text-text-primary">
                  {totals.fiber}g / {totals.sugar}g
                </span>
              </div>
            </div>
          </div>

          {/* Save to Custom Food Catalog Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-button border border-border-divider bg-surface-subtle cursor-pointer hover:bg-accent-green-light/25 transition-colors">
            <input
              type="checkbox"
              checked={saveToCatalog}
              onChange={(e) => setSaveToCatalog(e.target.checked)}
              className="h-4 w-4 rounded accent-accent-green cursor-pointer"
            />
            <div className="flex items-center gap-2 text-xs">
              <BookmarkPlus className="h-4 w-4 text-text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                Simpan ke katalog makanan kustom (tabel{" "}
                <code className="text-[11px] px-1 py-0.5 rounded bg-surface border border-border-default">
                  foods
                </code>
                ) untuk digunakan kembali nanti
              </span>
            </div>
          </label>

          {submitError && (
            <div className="p-3 rounded-input bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium">
              {submitError}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-button border border-border-default bg-surface hover:bg-surface-subtle text-xs font-bold text-text-muted hover:text-foreground transition-colors"
            >
              Batal
            </button>

            {onAddToStaging && (
              <button
                type="button"
                onClick={() => {
                  const numericServingSize = parseFloat(servingSize) || 100;
                  onAddToStaging({
                    id: `scan-${Date.now()}`,
                    name: foodName.trim() || "Scanned Food",
                    category: "Label Scan",
                    baseCalories: parsedPerServing.caloriesKcal,
                    baseProteinG: parsedPerServing.proteinG,
                    baseCarbsG: parsedPerServing.carbsG,
                    baseFatG: parsedPerServing.fatG,
                    baseFiberG: parsedPerServing.fiberG,
                    baseSugarG: parsedPerServing.sugarG,
                    servingMultiplier: servingsConsumed,
                    servingUnit: `${servingSize || "100"}${servingUnit || "g"}`,
                    gramsPerUnit: numericServingSize,
                  });
                  onClose();
                }}
                className="px-4 py-2.5 rounded-button border-2 border-accent-green bg-accent-green-light/70 hover:bg-accent-green-light text-text-primary text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="h-4 w-4 text-accent-green" />
                <span>Tambahkan ke Piring (Staging)</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "button-primary px-5 py-2.5 text-xs flex items-center justify-center gap-2",
                isSubmitting && "opacity-75 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Catat Langsung (+10 XP)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
