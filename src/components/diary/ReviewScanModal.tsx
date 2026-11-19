"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Beef,
  BookmarkPlus,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Info,
  Lightbulb,
  Loader2,
  Minus,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Wheat,
  X,
} from "lucide-react";
import { NutritionLabelData } from "@/lib/schemas/nutrition-scan";
import {
  assessProduct,
  PRODUCT_CATEGORIES,
  type ProductCategory,
  type ProductVerdict,
} from "@/lib/nutrition/product-assessment";
import { logScannedNutritionAction } from "@/app/actions/nutrition-scan";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { PeekingCalpal } from "@/components/auth/PeekingCalpal";
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
  onRescan?: () => void;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  beverage: "Minuman",
  dairy: "Susu & Olahan",
  snack: "Camilan / Snack",
  confectionery: "Permen / Cokelat / Kue",
  instant_noodle: "Mie Instan",
  cereal_bread: "Sereal & Roti",
  ready_meal: "Makanan Siap Saji",
  sauce_condiment: "Saus & Bumbu",
  other: "Lainnya",
};

const VERDICT_STYLES: Record<
  ProductVerdict,
  {
    surface: string;
    badge: string;
    iconColor: string;
    textColor: string;
    Icon: typeof CheckCircle2;
    label: string;
  }
> = {
  good: {
    surface: "bg-[#ECF7E4]",
    badge: "bg-[#D5F0C1] text-[#2F5B14]",
    iconColor: "text-[#3D7A1C]",
    textColor: "text-[#244710]",
    Icon: CheckCircle2,
    label: "Baik",
  },
  moderate: {
    surface: "bg-[#FEF3C7]",
    badge: "bg-[#FDE68A] text-[#7C3A0D]",
    iconColor: "text-[#B45309]",
    textColor: "text-[#632D09]",
    Icon: AlertTriangle,
    label: "Batasi Porsi",
  },
  poor: {
    surface: "bg-[#FEE2E2]",
    badge: "bg-[#FECACA] text-[#991B1B]",
    iconColor: "text-[#DC2626]",
    textColor: "text-[#7F1D1D]",
    Icon: ShieldAlert,
    label: "Kurang Baik",
  },
};

export function ReviewScanModal(props: ReviewScanModalProps) {
  const { isOpen, onClose } = props;
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetKey = `${props.imagePreviewUrl}::${props.initialData.foodName}::${props.initialData.caloriesKcal}`;
  return <ReviewScanModalBody key={resetKey} {...props} />;
}

function ReviewScanModalBody({
  initialData,
  imagePreviewUrl,
  mealTime,
  onClose,
  onSuccess,
  onAddToStaging,
  onRescan,
}: ReviewScanModalProps) {
  const { addLog, getConsumed, targets, goalPlan } = useFoodStore();
  const {
    species,
    name: petName,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
    feedPet: feedPetStore,
  } = usePetStore();

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
  const [productCategory, setProductCategory] = useState<ProductCategory>(
    initialData.productCategory ?? "other"
  );

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
  const [saturatedFatG, setSaturatedFatG] = useState<string>(
    initialData.saturatedFatG !== null && initialData.saturatedFatG !== undefined
      ? String(initialData.saturatedFatG)
      : ""
  );
  const [sodiumMg, setSodiumMg] = useState<string>(
    initialData.sodiumMg !== null && initialData.sodiumMg !== undefined
      ? String(initialData.sodiumMg)
      : ""
  );

  const [isEditExpanded, setIsEditExpanded] = useState(false);
  const [saveToCatalog, setSaveToCatalog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsedPerServing = useMemo(() => {
    const parseNonNeg = (v: string) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    const parseOptional = (v: string) => {
      if (!v.trim()) return null;
      const n = parseFloat(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    return {
      caloriesKcal: parseNonNeg(caloriesKcal),
      proteinG: parseNonNeg(proteinG),
      carbsG: parseNonNeg(carbsG),
      fatG: parseNonNeg(fatG),
      fiberG: parseNonNeg(fiberG),
      sugarG: parseNonNeg(sugarG),
      saturatedFatG: parseOptional(saturatedFatG),
      sodiumMg: parseOptional(sodiumMg),
    };
  }, [
    caloriesKcal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    saturatedFatG,
    sodiumMg,
  ]);

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

  const consumedToday = getConsumed();
  const remainingCalories = Math.max(0, targets.calories - consumedToday.calories);

  const assessment = useMemo(() => {
    const numServing = parseFloat(servingSize);
    return assessProduct(
      {
        servingSize: Number.isFinite(numServing) && numServing > 0 ? numServing : null,
        servingUnit: servingUnit || "g",
        caloriesKcal: parsedPerServing.caloriesKcal,
        proteinG: parsedPerServing.proteinG,
        carbsG: parsedPerServing.carbsG,
        fatG: parsedPerServing.fatG,
        fiberG: parsedPerServing.fiberG,
        sugarG: parsedPerServing.sugarG,
        saturatedFatG: parsedPerServing.saturatedFatG,
        sodiumMg: parsedPerServing.sodiumMg,
        category: productCategory,
      },
      {
        goalType: goalPlan.goalType,
        remainingCalories: targets.calories > 0 ? remainingCalories : null,
        servingsConsumed,
      }
    );
  }, [
    servingSize,
    servingUnit,
    parsedPerServing,
    productCategory,
    goalPlan.goalType,
    targets.calories,
    remainingCalories,
    servingsConsumed,
  ]);

  const verdictStyle = VERDICT_STYLES[assessment.verdict];
  const VerdictIcon = verdictStyle.Icon;

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

      const actionResult = await logScannedNutritionAction({
        foodName: foodName.trim() || "Scanned Food",
        servingSize: cleanServingSize,
        servingUnit: servingUnit.trim() || "g",
        servingsConsumed,
        mealTime,
        perServing: {
          caloriesKcal: parsedPerServing.caloriesKcal,
          proteinG: parsedPerServing.proteinG,
          carbsG: parsedPerServing.carbsG,
          fatG: parsedPerServing.fatG,
          fiberG: parsedPerServing.fiberG,
          sugarG: parsedPerServing.sugarG,
        },
        saveToCatalog,
      });

      if (!actionResult.success && actionResult.error) {
        console.warn("DB action warning:", actionResult.error);
      }

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

      feedPetStore(totals.calories, 10, 5);
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hasil AR Scanner Gizi"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 overflow-y-auto"
    >
      {/* Outer wrapper reserves headroom so PeekingCalpal is never clipped */}
      <div className="relative w-full max-w-xl pt-14 sm:pt-16 my-4 sm:my-8 animate-in zoom-in-95 duration-200">
        <PeekingCalpal
          characterId={species}
          colors={customColors}
          earsVariant={earsVariant}
          tailVariant={tailVariant}
          faceVariant={faceVariant}
          position="top-left"
          alwaysVisible
          expression={assessment.calpalReaction.expression}
          moodStatus={assessment.calpalReaction.moodStatus}
          bubbleText={assessment.calpalReaction.bubbleText}
          bubbleTone={assessment.verdict}
          title={`${petName || "Calpal"} mengecek gizinya`}
        />

        <div className="relative z-10 w-full rounded-card bg-surface shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 bg-[#F6E58D]/55">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-text-primary font-heading truncate">
                {foodName || "Produk Hasil Scan"}
              </h2>
              <p className="text-xs font-medium text-[#3B5233]">
                {CATEGORY_LABELS[productCategory]} • 1 sajian = {servingSize || "100"}{" "}
                {servingUnit || "g"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Tutup hasil scan"
              className="min-h-11 min-w-11 rounded-2xl bg-white/80 hover:bg-white text-text-primary flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleConfirmAndLog} className="p-5 sm:p-6 space-y-4">
            {/* 1. Verdict Summary Card + Thumbnail */}
            <div
              className={cn(
                "rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start",
                verdictStyle.surface
              )}
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white/70 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="Foto label gizi yang dipindai"
                  className="w-full h-full object-cover"
                />
                {confidencePercent !== null && (
                  <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded-lg bg-black/75 text-white text-xs font-bold flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-accent-green-light shrink-0" />
                    <span>{confidencePercent}%</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-extrabold",
                      verdictStyle.badge
                    )}
                  >
                    <VerdictIcon className={cn("h-4 w-4", verdictStyle.iconColor)} />
                    <span>{verdictStyle.label}</span>
                  </span>
                  <span className={cn("text-sm sm:text-base font-extrabold", verdictStyle.textColor)}>
                    {assessment.headline}
                  </span>
                </div>

                <p className={cn("text-xs sm:text-sm font-medium leading-relaxed", verdictStyle.textColor)}>
                  {assessment.summary}
                </p>

                {assessment.personalNote && (
                  <p className="text-xs font-bold text-[#334155] bg-white/65 rounded-xl px-3 py-1.5 inline-block">
                    {assessment.personalNote}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Warning Signs & Positives (icon + label, filled chips, no heavy borders) */}
            {(assessment.warnings.length > 0 || assessment.positives.length > 0) && (
              <div className="space-y-2.5">
                {assessment.warnings.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assessment.warnings.map((flag) => (
                      <div
                        key={flag.nutrient}
                        className={cn(
                          "inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold",
                          flag.level === "high"
                            ? "bg-[#FEE2E2] text-[#991B1B]"
                            : "bg-[#FEF3C7] text-[#7C3A0D]"
                        )}
                      >
                        {flag.level === "high" ? (
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{flag.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {assessment.positives.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assessment.positives.map((pos) => (
                      <div
                        key={pos}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill bg-[#ECF7E4] text-[#2F5B14] text-xs font-bold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{pos}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Saran Alternatif & Catatan */}
            {assessment.suggestions.length > 0 && (
              <div className="rounded-3xl bg-[#F1F5F9] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#1E293B]">
                  <Lightbulb className="h-4 w-4 text-accent-orange-dark shrink-0" />
                  <span>Saran Alternatif</span>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm font-medium text-[#334155]">
                  {assessment.suggestions.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-green shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing nutrient notice (if label omitted sodium or sat fat) */}
            {assessment.missing.length > 0 && (
              <div className="rounded-2xl bg-[#F8FAFC] px-3.5 py-2.5 flex items-center gap-2 text-xs font-medium text-[#475569]">
                <Info className="h-4 w-4 shrink-0 text-text-muted" />
                <span>
                  Info{" "}
                  {assessment.missing
                    .map((m) => (m === "saturatedFat" ? "lemak jenuh" : "natrium"))
                    .join(" & ")}{" "}
                  tidak terbaca di label. Draf standar gizi menanti tinjauan Hima.
                </span>
              </div>
            )}

            {/* 4. Servings Multiplier & Total Summary (filled, no borders) */}
            <div className="rounded-3xl bg-[#F8FAFC] p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-extrabold text-[#1E293B] block">
                    Jumlah Porsi Dikonsumsi
                  </span>
                  <span className="text-xs font-medium text-[#475569]">
                    Total: <strong className="text-text-primary">{totals.calories} kkal</strong>
                    {initialData.servingsPerContainer
                      ? ` • ${initialData.servingsPerContainer} sajian/kemasan`
                      : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Kurangi porsi"
                    onClick={() => handleAdjustServings(-0.25)}
                    className="h-10 w-10 rounded-2xl bg-white hover:bg-accent-green-light/50 flex items-center justify-center text-[#1E293B] shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    aria-label="Jumlah porsi"
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
                    className="w-16 rounded-2xl bg-white py-2 text-center text-sm font-extrabold text-[#1E293B] shadow-2xs focus:ring-2 focus:ring-accent-green focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Tambah porsi"
                    onClick={() => handleAdjustServings(0.25)}
                    className="h-10 w-10 rounded-2xl bg-white hover:bg-accent-green-light/50 flex items-center justify-center text-[#1E293B] shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quick portion chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setServingsConsumed(1.0)}
                  className={cn(
                    "px-3 py-1.5 rounded-pill text-xs font-bold transition-colors",
                    servingsConsumed === 1.0
                      ? "bg-accent-green-light text-text-primary"
                      : "bg-white text-[#475569] hover:text-[#1E293B]"
                  )}
                >
                  1 porsi
                </button>
                {initialData.servingsPerContainer &&
                  initialData.servingsPerContainer !== 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setServingsConsumed(initialData.servingsPerContainer!)
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-pill text-xs font-bold transition-colors",
                        servingsConsumed === initialData.servingsPerContainer
                          ? "bg-accent-green-light text-text-primary"
                          : "bg-white text-[#475569] hover:text-[#1E293B]"
                      )}
                    >
                      1 kemasan penuh ({initialData.servingsPerContainer}x)
                    </button>
                  )}
                {initialData.servingsPerContainer &&
                  initialData.servingsPerContainer > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setServingsConsumed(
                          Math.max(
                            0.25,
                            Math.round((initialData.servingsPerContainer! / 2) * 100) /
                              100
                          )
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-pill text-xs font-bold transition-colors",
                        servingsConsumed ===
                          Math.max(
                            0.25,
                            Math.round((initialData.servingsPerContainer! / 2) * 100) /
                              100
                          )
                          ? "bg-accent-green-light text-text-primary"
                          : "bg-white text-[#475569] hover:text-[#1E293B]"
                      )}
                    >
                      1/2 kemasan
                    </button>
                  )}
              </div>

              {/* Macro Snapshot Bar */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                <div className="rounded-2xl bg-white px-2 py-2">
                  <span className="text-xs font-medium text-[#475569] block">
                    Protein
                  </span>
                  <span className="text-sm font-extrabold text-macro-protein">
                    {totals.protein}g
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-2 py-2">
                  <span className="text-xs font-medium text-[#475569] block">
                    Karbo
                  </span>
                  <span className="text-sm font-extrabold text-accent-orange-dark">
                    {totals.carbs}g
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-2 py-2">
                  <span className="text-xs font-medium text-[#475569] block">
                    Lemak
                  </span>
                  <span className="text-sm font-extrabold text-macro-fat">
                    {totals.fat}g
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-2 py-2">
                  <span className="text-xs font-medium text-[#475569] block">
                    Gula
                  </span>
                  <span className="text-sm font-extrabold text-macro-sugar">
                    {totals.sugar}g
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Collapsible OCR Correction Form */}
            <div className="rounded-3xl bg-[#F8FAFC] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsEditExpanded((prev) => !prev)}
                aria-expanded={isEditExpanded}
                className="w-full px-4 py-3 flex items-center justify-between text-xs sm:text-sm font-bold text-[#334155] hover:bg-[#F1F5F9] transition-colors"
              >
                <span>Koreksi Angka Label & Kategori Produk</span>
                {isEditExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {isEditExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">
                        Nama Produk
                      </label>
                      <input
                        type="text"
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        required
                        className="w-full rounded-xl bg-white px-3 py-2 text-xs sm:text-sm font-bold text-[#1E293B] focus:ring-2 focus:ring-accent-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">
                        Kategori Produk
                      </label>
                      <select
                        value={productCategory}
                        onChange={(e) =>
                          setProductCategory(e.target.value as ProductCategory)
                        }
                        className="w-full rounded-xl bg-white px-3 py-2 text-xs sm:text-sm font-bold text-[#1E293B] focus:ring-2 focus:ring-accent-green focus:outline-none"
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">
                        Takaran Saji
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={servingSize}
                        onChange={(e) => setServingSize(e.target.value)}
                        className="w-full rounded-xl bg-white px-3 py-2 text-xs sm:text-sm font-bold text-[#1E293B] focus:ring-2 focus:ring-accent-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">
                        Satuan Unit
                      </label>
                      <input
                        type="text"
                        value={servingUnit}
                        onChange={(e) => setServingUnit(e.target.value)}
                        className="w-full rounded-xl bg-white px-3 py-2 text-xs sm:text-sm font-bold text-[#1E293B] focus:ring-2 focus:ring-accent-green focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-2xl bg-white p-2.5">
                      <label className="flex items-center gap-1 text-xs font-bold text-text-primary mb-1">
                        <Flame className="h-3.5 w-3.5" /> Kalori
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={caloriesKcal}
                        onChange={(e) => setCaloriesKcal(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-2.5">
                      <label className="flex items-center gap-1 text-xs font-bold text-macro-protein mb-1">
                        <Beef className="h-3.5 w-3.5" /> Protein (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={proteinG}
                        onChange={(e) => setProteinG(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-2.5">
                      <label className="flex items-center gap-1 text-xs font-bold text-accent-orange-dark mb-1">
                        <Wheat className="h-3.5 w-3.5" /> Karbo (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={carbsG}
                        onChange={(e) => setCarbsG(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-2.5">
                      <label className="flex items-center gap-1 text-xs font-bold text-macro-fat mb-1">
                        <Droplets className="h-3.5 w-3.5" /> Lemak (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={fatG}
                        onChange={(e) => setFatG(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-2.5">
                      <label className="block text-xs font-bold text-macro-sugar mb-1">
                        Gula (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={sugarG}
                        onChange={(e) => setSugarG(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-2.5">
                      <label className="block text-xs font-bold text-text-primary mb-1">
                        Serat (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={fiberG}
                        onChange={(e) => setFiberG(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-2.5">
                      <label className="block text-xs font-bold text-[#991B1B] mb-1">
                        Jenuh (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="-"
                        value={saturatedFatG}
                        onChange={(e) => setSaturatedFatG(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-2.5">
                      <label className="block text-xs font-bold text-[#7C3A0D] mb-1">
                        Natrium (mg)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="-"
                        value={sodiumMg}
                        onChange={(e) => setSodiumMg(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-[#1E293B] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save to Catalog Checkbox */}
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] cursor-pointer hover:bg-[#ECF7E4]/65 transition-colors">
              <input
                type="checkbox"
                checked={saveToCatalog}
                onChange={(e) => setSaveToCatalog(e.target.checked)}
                className="h-4 w-4 rounded accent-accent-green cursor-pointer shrink-0"
              />
              <div className="flex items-center gap-2 text-xs font-semibold text-[#334155]">
                <BookmarkPlus className="h-4 w-4 text-text-primary shrink-0" />
                <span>Simpan ke katalog makanan agar mudah dipakai lagi</span>
              </div>
            </label>

            {submitError && (
              <div className="p-3.5 rounded-2xl bg-[#FEE2E2] text-xs font-bold text-[#991B1B]">
                {submitError}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
              {onRescan && (
                <button
                  type="button"
                  onClick={onRescan}
                  disabled={isSubmitting}
                  className="px-4 py-3 rounded-button bg-[#F1F5F9] hover:bg-[#E2E8F0] text-xs font-bold text-[#334155] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>Scan Ulang</span>
                </button>
              )}

              {onAddToStaging && (
                <button
                  type="button"
                  onClick={() => {
                    const numericServingSize = parseFloat(servingSize) || 100;
                    onAddToStaging({
                      id: `scan-${Date.now()}`,
                      name: foodName.trim() || "Scanned Food",
                      category: CATEGORY_LABELS[productCategory],
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
                  className="px-4 py-3 rounded-button bg-[#ECF7E4] hover:bg-[#D5F0C1] text-text-primary text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Taruh di Piring</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "button-primary px-5 py-3 text-xs flex items-center justify-center gap-2",
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
    </div>
  );
}
