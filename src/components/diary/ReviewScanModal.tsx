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
  formatNutritionistSummary,
  PRODUCT_CATEGORIES,
  type FlaggedNutrient,
  type ProductCategory,
  type ProductVerdict,
} from "@/lib/nutrition/product-assessment";
import { logScannedNutritionAction } from "@/app/actions/nutrition-scan";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { PeekingCalpal } from "@/components/auth/PeekingCalpal";
import { ScanInfoTooltip } from "@/components/diary/ScanInfoTooltip";
import { NutritionistAskBox } from "@/components/diary/NutritionistAskBox";
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
    initialData.foodName || "Produk Kemasan"
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

  const isLowConfidence = (initialData.confidenceScore ?? 1) < 0.75;
  const [isEditExpanded, setIsEditExpanded] = useState(isLowConfidence);
  const [selectedWarning, setSelectedWarning] = useState<FlaggedNutrient | null>(null);
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

  const assessmentInput = useMemo(() => {
    const numServing = parseFloat(servingSize);
    return {
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
    };
  }, [servingSize, servingUnit, parsedPerServing, productCategory]);

  const assessment = useMemo(
    () =>
      assessProduct(assessmentInput, {
        goalType: goalPlan.goalType,
        remainingCalories: targets.calories > 0 ? remainingCalories : null,
        servingsConsumed,
      }),
    [assessmentInput, goalPlan.goalType, targets.calories, remainingCalories, servingsConsumed]
  );

  const nutritionistSummary = useMemo(
    () => formatNutritionistSummary(foodName.trim() || "Produk Kemasan", assessmentInput, assessment),
    [foodName, assessmentInput, assessment]
  );

  const verdictStyle = VERDICT_STYLES[assessment.verdict];
  const VerdictIcon = verdictStyle.Icon;

  const activeWarningDetail = assessment.warnings.find(
    (w) => w.nutrient === selectedWarning
  );

  const extraLabelInfo = useMemo(() => {
    const parts: string[] = [];
    if (initialData.rawLabelExcerpt?.trim()) {
      parts.push(`Teks terbaca: "${initialData.rawLabelExcerpt.trim()}"`);
    }
    if (assessment.summary) {
      parts.push(assessment.summary);
    }
    if (assessment.missing.length > 0) {
      const missingText = assessment.missing
        .map((m) => (m === "saturatedFat" ? "lemak jenuh" : "natrium"))
        .join(" & ");
      parts.push(`Info ${missingText} tidak tercantum di label.`);
    }
    return parts.join(" ");
  }, [initialData.rawLabelExcerpt, assessment.summary, assessment.missing]);

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

  const extraSuggestions = assessment.suggestions.slice(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hasil Scan Label Gizi"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
    >
      {/* Outer wrapper reserves headroom so PeekingCalpal tucks cleanly behind modal top */}
      <div className="relative w-full max-w-2xl pt-14 sm:pt-16 sm:my-4 animate-in zoom-in-95 duration-200">
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

        <form
          onSubmit={handleConfirmAndLog}
          className="relative z-10 w-full max-h-[86dvh] flex flex-col rounded-t-[28px] sm:rounded-card bg-surface shadow-2xl overflow-hidden"
        >
          {/* Sticky Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-[#F6E58D]/70">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#244710] font-heading truncate leading-tight">
                {foodName || "Produk Hasil Scan"}
              </h2>
              <p className="text-sm sm:text-base font-bold text-[#244710] mt-0.5">
                {CATEGORY_LABELS[productCategory]} • 1 sajian = {servingSize || "100"}{" "}
                {servingUnit || "g"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Tutup hasil scan"
              className="min-h-12 min-w-12 rounded-2xl bg-white/90 hover:bg-white text-[#244710] flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* 1. Verdict & Direct Action Card */}
            <div
              className={cn(
                "rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start",
                verdictStyle.surface
              )}
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white/80 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="Foto label gizi yang dipindai"
                  className="w-full h-full object-cover"
                />
                {confidencePercent !== null && (
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-black/80 text-white text-sm font-extrabold flex items-center justify-center gap-1 tabular-nums">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent-green-light shrink-0" />
                    <span>{confidencePercent}%</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 min-w-0 w-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-sm font-extrabold",
                        verdictStyle.badge
                      )}
                    >
                      <VerdictIcon className={cn("h-4 w-4", verdictStyle.iconColor)} />
                      <span>{verdictStyle.label}</span>
                    </span>
                    <span className={cn("text-lg sm:text-xl font-extrabold", verdictStyle.textColor)}>
                      {assessment.headline}
                    </span>
                  </div>

                  {extraLabelInfo && (
                    <ScanInfoTooltip
                      label="Detail bacaan label dan ringkasan gizi"
                      buttonText="Info"
                      content={extraLabelInfo}
                      align="right"
                    />
                  )}
                </div>

                {/* Direct Action Feedback ("ini ngapain") */}
                <div className="rounded-2xl bg-white/90 px-4 py-3 text-base font-extrabold text-[#1E293B] leading-snug">
                  {assessment.actionFeedback}
                </div>

                {assessment.personalNote && (
                  <p className="text-sm font-bold text-[#334155]">
                    {assessment.personalNote}
                  </p>
                )}
              </div>
            </div>

            {isLowConfidence && (
              <div
                role="status"
                className="rounded-2xl bg-[#FEF3C7] text-[#632D09] px-4 py-3.5 flex items-start gap-3 text-sm sm:text-base font-bold leading-snug"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-[#7C3A0D]" />
                <span>
                  Akurasi foto rendah ({confidencePercent}%). Cek ulang angka di form koreksi bawah sebelum mencatat.
                </span>
              </div>
            )}

            {/* 2. Scannable Warning & Positive Chips (Tap chip for detail) */}
            {(assessment.warnings.length > 0 || assessment.positives.length > 0) && (
              <div className="space-y-3">
                {assessment.warnings.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-2">
                      {assessment.warnings.map((flag) => {
                        const isSelected = selectedWarning === flag.nutrient;
                        return (
                          <button
                            key={flag.nutrient}
                            type="button"
                            aria-expanded={isSelected}
                            onClick={() =>
                              setSelectedWarning((prev) =>
                                prev === flag.nutrient ? null : flag.nutrient
                              )
                            }
                            className={cn(
                              "min-h-11 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none",
                              flag.level === "high"
                                ? "bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B]"
                                : "bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#7C3A0D]",
                              isSelected && "ring-2 ring-current"
                            )}
                          >
                            {flag.level === "high" ? (
                              <ShieldAlert className="h-4 w-4 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                            )}
                            <span>{flag.shortLabel}</span>
                            <Info className="h-4 w-4 opacity-75 shrink-0" />
                          </button>
                        );
                      })}
                    </div>

                    {activeWarningDetail && (
                      <div
                        role="status"
                        className="rounded-2xl bg-[#1E293B] text-white px-4 py-3 text-sm font-semibold leading-snug"
                      >
                        {activeWarningDetail.message}
                      </div>
                    )}
                  </div>
                )}

                {assessment.positives.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assessment.positives.map((pos) => (
                      <div
                        key={pos}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-[#ECF7E4] text-[#2F5B14] text-sm sm:text-base font-extrabold"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{pos}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Concise Top Suggestion + Tooltip for Extra Tips */}
            {assessment.suggestions.length > 0 && (
              <div className="rounded-3xl bg-[#F1F5F9] p-4 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Lightbulb className="h-5 w-5 text-accent-orange-dark shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base font-bold text-[#1E293B] leading-snug">
                    {assessment.suggestions[0]}
                  </p>
                </div>

                {extraSuggestions.length > 0 && (
                  <ScanInfoTooltip
                    label="Saran alternatif tambahan"
                    buttonText="Tips lain"
                    content={extraSuggestions.join(" ")}
                    align="right"
                    className="shrink-0"
                  />
                )}
              </div>
            )}

            {/* 4. Servings Multiplier & Large Macro Snapshot */}
            <div className="rounded-3xl bg-[#F8FAFC] p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-base sm:text-lg font-extrabold text-[#1E293B] block">
                    Jumlah Porsi
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#475569]">
                    Total:{" "}
                    <strong className="text-lg sm:text-xl font-black text-[#244710] tabular-nums">
                      {totals.calories} kkal
                    </strong>
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
                    className="h-12 w-12 rounded-2xl bg-white hover:bg-accent-green-light/60 flex items-center justify-center text-[#1E293B] transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none"
                  >
                    <Minus className="h-5 w-5" />
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
                    className="w-20 h-12 rounded-2xl bg-white py-2 text-center text-base sm:text-lg font-black text-[#1E293B] tabular-nums focus:ring-2 focus:ring-[#244710] focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Tambah porsi"
                    onClick={() => handleAdjustServings(0.25)}
                    className="h-12 w-12 rounded-2xl bg-white hover:bg-accent-green-light/60 flex items-center justify-center text-[#1E293B] transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Quick portion chips (flat, >= 48px height) */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setServingsConsumed(1.0)}
                  className={cn(
                    "min-h-12 px-4 py-2 rounded-pill text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none",
                    servingsConsumed === 1.0
                      ? "bg-accent-green-light text-[#244710]"
                      : "bg-white text-[#334155] hover:bg-[#ECF7E4]"
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
                        "min-h-12 px-4 py-2 rounded-pill text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none",
                        servingsConsumed === initialData.servingsPerContainer
                          ? "bg-accent-green-light text-[#244710]"
                          : "bg-white text-[#334155] hover:bg-[#ECF7E4]"
                      )}
                    >
                      1 kemasan ({initialData.servingsPerContainer}x)
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
                        "min-h-12 px-4 py-2 rounded-pill text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none",
                        servingsConsumed ===
                          Math.max(
                            0.25,
                            Math.round((initialData.servingsPerContainer! / 2) * 100) /
                              100
                          )
                          ? "bg-accent-green-light text-[#244710]"
                          : "bg-white text-[#334155] hover:bg-[#ECF7E4]"
                      )}
                    >
                      1/2 kemasan
                    </button>
                  )}
              </div>

              {/* Macro Snapshot Grid (2x2 mobile, 4x1 desktop, bold large numbers) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <span className="text-sm font-bold text-[#475569] block">
                    Protein
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#1D4ED8] tabular-nums">
                    {totals.protein}g
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <span className="text-sm font-bold text-[#475569] block">
                    Karbo
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#9A3412] tabular-nums">
                    {totals.carbs}g
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <span className="text-sm font-bold text-[#475569] block">
                    Lemak
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#BE123C] tabular-nums">
                    {totals.fat}g
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <span className="text-sm font-bold text-[#475569] block">
                    Gula
                  </span>
                  <span className="text-lg sm:text-xl font-black text-macro-sugar tabular-nums">
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
                className="w-full min-h-12 px-5 py-3.5 flex items-center justify-between text-base font-extrabold text-[#1E293B] hover:bg-[#F1F5F9] transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#244710] focus-visible:outline-none"
              >
                <span>Koreksi Angka Label</span>
                {isEditExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {isEditExpanded && (
                <div className="px-5 pb-5 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-[#334155] mb-1.5">
                        Nama Produk
                      </label>
                      <input
                        type="text"
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        required
                        className="w-full min-h-11 rounded-xl bg-white px-3.5 py-2.5 text-base font-bold text-[#1E293B] focus:ring-2 focus:ring-[#244710] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#334155] mb-1.5">
                        Kategori Produk
                      </label>
                      <select
                        value={productCategory}
                        onChange={(e) =>
                          setProductCategory(e.target.value as ProductCategory)
                        }
                        className="w-full min-h-11 rounded-xl bg-white px-3.5 py-2.5 text-base font-bold text-[#1E293B] focus:ring-2 focus:ring-[#244710] focus:outline-none"
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-[#334155] mb-1.5">
                        Takaran Saji
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={servingSize}
                        onChange={(e) => setServingSize(e.target.value)}
                        className="w-full min-h-11 rounded-xl bg-white px-3.5 py-2.5 text-base font-bold text-[#1E293B] focus:ring-2 focus:ring-[#244710] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#334155] mb-1.5">
                        Satuan Unit
                      </label>
                      <input
                        type="text"
                        value={servingUnit}
                        onChange={(e) => setServingUnit(e.target.value)}
                        className="w-full min-h-11 rounded-xl bg-white px-3.5 py-2.5 text-base font-bold text-[#1E293B] focus:ring-2 focus:ring-[#244710] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-white p-3 focus-within:ring-2 focus-within:ring-[#244710]">
                      <label className="flex items-center gap-1 text-sm font-bold text-[#244710] mb-1">
                        <Flame className="h-4 w-4" /> Kalori
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={caloriesKcal}
                        onChange={(e) => setCaloriesKcal(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-3 focus-within:ring-2 focus-within:ring-[#244710]">
                      <label className="flex items-center gap-1 text-sm font-bold text-[#1D4ED8] mb-1">
                        <Beef className="h-4 w-4" /> Protein (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={proteinG}
                        onChange={(e) => setProteinG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-3 focus-within:ring-2 focus-within:ring-[#244710]">
                      <label className="flex items-center gap-1 text-sm font-bold text-[#9A3412] mb-1">
                        <Wheat className="h-4 w-4" /> Karbo (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={carbsG}
                        onChange={(e) => setCarbsG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-3 focus-within:ring-2 focus-within:ring-[#244710]">
                      <label className="flex items-center gap-1 text-sm font-bold text-[#BE123C] mb-1">
                        <Droplets className="h-4 w-4" /> Lemak (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={fatG}
                        onChange={(e) => setFatG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-3 focus-within:ring-2 focus-within:ring-[#244710]">
                      <label className="block text-sm font-bold text-macro-sugar mb-1">
                        Gula (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={sugarG}
                        onChange={(e) => setSugarG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-3 focus-within:ring-2 focus-within:ring-[#244710]">
                      <label className="block text-sm font-bold text-[#244710] mb-1">
                        Serat (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={fiberG}
                        onChange={(e) => setFiberG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-3 focus-within:ring-2 focus-within:ring-[#244710]">
                      <label className="block text-sm font-bold text-[#991B1B] mb-1">
                        Jenuh (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="-"
                        value={saturatedFatG}
                        onChange={(e) => setSaturatedFatG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-[#1E293B] outline-none"
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-3 focus-within:ring-2 focus-within:ring-[#244710]">
                      <label className="block text-sm font-bold text-[#7C3A0D] mb-1">
                        Natrium (mg)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="-"
                        value={sodiumMg}
                        onChange={(e) => setSodiumMg(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-[#1E293B] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Mandatory AI Escalation: "Tanyakan Ahli Gizi" */}
            <NutritionistAskBox summaryText={nutritionistSummary} />

            {/* Save to Catalog Checkbox */}
            <label className="min-h-12 flex items-center gap-3 p-4 rounded-2xl bg-[#F8FAFC] cursor-pointer hover:bg-[#ECF7E4]/65 transition-colors">
              <input
                type="checkbox"
                checked={saveToCatalog}
                onChange={(e) => setSaveToCatalog(e.target.checked)}
                className="h-5 w-5 rounded accent-accent-green cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[#244710]"
              />
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#1E293B]">
                <BookmarkPlus className="h-5 w-5 text-[#244710] shrink-0" />
                <span>Simpan ke katalog makanan</span>
              </div>
            </label>

            {submitError && (
              <div className="p-4 rounded-2xl bg-[#FEE2E2] text-sm sm:text-base font-bold text-[#991B1B]">
                {submitError}
              </div>
            )}
          </div>

          {/* Sticky Flat Footer Actions (zero drop shadow, compact 2+1 grid on phone, row on desktop) */}
          <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-5 sm:px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5">
            {onRescan && (
              <button
                type="button"
                onClick={onRescan}
                disabled={isSubmitting}
                className="min-h-12 px-4 sm:px-5 py-3 rounded-button bg-[#F1F5F9] hover:bg-[#E2E8F0] text-sm sm:text-base font-extrabold text-[#1E293B] flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none"
              >
                <Camera className="h-5 w-5 shrink-0" />
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
                className="min-h-12 px-4 sm:px-5 py-3 rounded-button bg-[#ECF7E4] hover:bg-[#D5F0C1] text-[#244710] text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none"
              >
                <Plus className="h-5 w-5 shrink-0" />
                <span>Taruh di Piring</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "col-span-2 sm:col-span-1 min-h-12 px-6 py-3 rounded-button bg-accent-green-light hover:bg-[#a9ce46] text-[#244710] text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-[#244710] focus-visible:outline-none",
                isSubmitting && "opacity-75 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  <span>Catat (+10 XP)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
