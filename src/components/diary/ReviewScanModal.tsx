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
  Sparkles,
  UtensilsCrossed,
  Wheat,
  X,
} from "lucide-react";
import { NutritionLabelData } from "@/lib/schemas/nutrition-scan";
import {
  assessProduct,
  assessRealFood,
  formatNutritionistSummary,
  PRODUCT_CATEGORIES,
  type FlaggedNutrient,
  type ProductCategory,
  type ProductVerdict,
} from "@/lib/nutrition/product-assessment";
import { formatDateKey } from "@/lib/date-utils";
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

const EMPTY_LIST: string[] = [];

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
    surface: "bg-accent-green-light/25 border border-accent-green/35",
    badge: "bg-accent-green-light text-text-primary",
    iconColor: "text-text-primary",
    textColor: "text-text-primary",
    Icon: CheckCircle2,
    label: "Baik",
  },
  moderate: {
    surface: "bg-accent-yellow/45 border border-accent-orange/35",
    badge: "bg-accent-yellow text-accent-orange-dark",
    iconColor: "text-accent-orange-dark",
    textColor: "text-accent-orange-dark",
    Icon: AlertTriangle,
    label: "Batasi Porsi",
  },
  poor: {
    surface: "bg-destructive/10 border border-destructive/30",
    badge: "bg-destructive/15 text-destructive",
    iconColor: "text-destructive",
    textColor: "text-destructive",
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

  const resetKey = `${props.initialData.scanMode ?? "label"}::${props.imagePreviewUrl}::${props.initialData.foodName}::${props.initialData.caloriesKcal}`;
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

  const isRealFood = initialData.scanMode === "food";
  const detectedItems = initialData.detectedItems ?? EMPTY_LIST;
  const hiddenCalorieNotes = initialData.hiddenCalorieNotes ?? EMPTY_LIST;

  const [foodName, setFoodName] = useState(
    initialData.foodName ||
      (isRealFood ? "Makanan Hasil Scan" : "Produk Kemasan"),
  );
  const [servingSize, setServingSize] = useState<string>(
    initialData.servingSize !== null && initialData.servingSize !== undefined
      ? String(initialData.servingSize)
      : isRealFood
        ? "250"
        : "100",
  );
  const [servingUnit, setServingUnit] = useState(
    initialData.servingUnit || (isRealFood ? "porsi" : "g"),
  );
  const [servingsConsumed, setServingsConsumed] = useState<number>(1.0);
  const [productCategory, setProductCategory] = useState<ProductCategory>(
    initialData.productCategory ?? (isRealFood ? "ready_meal" : "other"),
  );

  const [caloriesKcal, setCaloriesKcal] = useState<string>(
    String(initialData.caloriesKcal ?? 0),
  );
  const [proteinG, setProteinG] = useState<string>(
    String(initialData.proteinG ?? 0),
  );
  const [carbsG, setCarbsG] = useState<string>(String(initialData.carbsG ?? 0));
  const [fatG, setFatG] = useState<string>(String(initialData.fatG ?? 0));
  const [fiberG, setFiberG] = useState<string>(String(initialData.fiberG ?? 0));
  const [sugarG, setSugarG] = useState<string>(String(initialData.sugarG ?? 0));
  const [saturatedFatG, setSaturatedFatG] = useState<string>(
    initialData.saturatedFatG !== null &&
      initialData.saturatedFatG !== undefined
      ? String(initialData.saturatedFatG)
      : "",
  );
  const [sodiumMg, setSodiumMg] = useState<string>(
    initialData.sodiumMg !== null && initialData.sodiumMg !== undefined
      ? String(initialData.sodiumMg)
      : "",
  );

  const lowConfidenceThreshold = isRealFood ? 0.65 : 0.75;
  const isLowConfidence =
    (initialData.confidenceScore ?? 1) < lowConfidenceThreshold;
  const [isEditExpanded, setIsEditExpanded] = useState(isLowConfidence);
  const [selectedWarning, setSelectedWarning] =
    useState<FlaggedNutrient | null>(null);
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
  const remainingCalories = Math.max(
    0,
    targets.calories - consumedToday.calories,
  );

  const assessmentInput = useMemo(() => {
    const numServing = parseFloat(servingSize);
    return {
      servingSize:
        Number.isFinite(numServing) && numServing > 0 ? numServing : null,
      servingUnit: servingUnit || (isRealFood ? "porsi" : "g"),
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
  }, [servingSize, servingUnit, isRealFood, parsedPerServing, productCategory]);

  const assessment = useMemo(() => {
    const ctx = {
      goalType: goalPlan.goalType,
      remainingCalories: targets.calories > 0 ? remainingCalories : null,
      servingsConsumed,
    };
    return isRealFood
      ? assessRealFood(assessmentInput, ctx)
      : assessProduct(assessmentInput, ctx);
  }, [
    isRealFood,
    assessmentInput,
    goalPlan.goalType,
    targets.calories,
    remainingCalories,
    servingsConsumed,
  ]);

  const nutritionistSummary = useMemo(
    () =>
      formatNutritionistSummary(
        foodName.trim() ||
          (isRealFood ? "Makanan Hasil Scan" : "Produk Kemasan"),
        assessmentInput,
        assessment,
        {
          scanMode: isRealFood ? "food" : "label",
          detectedItems,
          hiddenCalorieNotes,
        },
      ),
    [
      foodName,
      isRealFood,
      assessmentInput,
      assessment,
      detectedItems,
      hiddenCalorieNotes,
    ],
  );

  const verdictStyle = VERDICT_STYLES[assessment.verdict];
  const VerdictIcon = verdictStyle.Icon;

  const activeWarningDetail = assessment.warnings.find(
    (w) => w.nutrient === selectedWarning,
  );

  const extraLabelInfo = useMemo(() => {
    const parts: string[] = [];
    if (isRealFood) {
      parts.push(
        "Hasil ini merupakan estimasi visual AI dari foto makanan (bukan label kemasan). Minyak, santan, bumbu, dan kedalaman piring dapat memengaruhi kalori asli.",
      );
      if (assessment.summary) {
        parts.push(assessment.summary);
      }
      return parts.join(" ");
    }
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
  }, [
    isRealFood,
    initialData.rawLabelExcerpt,
    assessment.summary,
    assessment.missing,
  ]);

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
        servingUnit: servingUnit.trim() || (isRealFood ? "porsi" : "g"),
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
        saveToCatalog: isRealFood ? false : saveToCatalog,
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
        servingUnit: isRealFood
          ? `${servingsConsumed} ${servingUnit || "porsi"} (~${Math.round(
              (cleanServingSize ?? 250) * servingsConsumed,
            )}g)`
          : `${servingsConsumed}x (${cleanServingSize ?? 100}${
              servingUnit || "g"
            })`,
        loggedDate: formatDateKey(new Date()),
      });

      feedPetStore(totals.calories, 10, 5);
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data nutrisi. Silakan coba lagi.",
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
      aria-label={
        isRealFood ? "Hasil Estimasi Makanan Real" : "Hasil Scan Label Gizi"
      }
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
          className="relative z-10 w-full max-h-[86dvh] flex flex-col rounded-t-[28px] sm:rounded-card border border-border-divider bg-surface overflow-hidden"
        >
          {/* Sticky Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-border-divider bg-accent-yellow/35">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary font-heading truncate leading-tight">
                {foodName ||
                  (isRealFood ? "Makanan Hasil Scan" : "Produk Hasil Scan")}
              </h2>
              <p className="text-sm sm:text-base font-bold text-neutral-10 mt-0.5">
                {isRealFood
                  ? `Estimasi Visual AI • ${
                      initialData.portionNote?.trim() ||
                      `1 ${servingUnit || "porsi"} (~${servingSize || "250"} g)`
                    }`
                  : `${CATEGORY_LABELS[productCategory]} • 1 sajian = ${
                      servingSize || "100"
                    } ${servingUnit || "g"}`}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Tutup hasil scan"
              className="min-h-12 min-w-12 rounded-navigation border border-border-default bg-surface hover:bg-accent-green-light text-text-muted hover:text-text-primary flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none shrink-0"
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
                verdictStyle.surface,
              )}
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-button border border-border-default overflow-hidden bg-card shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt={
                    isRealFood
                      ? "Foto makanan yang dianalisis"
                      : "Foto label gizi yang dipindai"
                  }
                  className="w-full h-full object-cover"
                />
                {confidencePercent !== null && (
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-input bg-black/80 text-white text-sm font-extrabold flex items-center justify-center gap-1 tabular-nums">
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
                        verdictStyle.badge,
                      )}
                    >
                      <VerdictIcon
                        className={cn("h-4 w-4", verdictStyle.iconColor)}
                      />
                      <span>{verdictStyle.label}</span>
                    </span>
                    {isRealFood && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border border-border-default bg-surface text-text-primary text-sm font-extrabold">
                        <Sparkles className="h-3.5 w-3.5 text-accent-orange-dark" />
                        <span>Estimasi AI</span>
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-lg sm:text-xl font-extrabold",
                        verdictStyle.textColor,
                      )}
                    >
                      {assessment.headline}
                    </span>
                  </div>

                  {extraLabelInfo && (
                    <ScanInfoTooltip
                      label={
                        isRealFood
                          ? "Detail estimasi visual AI dan ringkasan gizi"
                          : "Detail bacaan label dan ringkasan gizi"
                      }
                      buttonText="Info"
                      content={extraLabelInfo}
                      align="right"
                    />
                  )}
                </div>

                {/* Direct Action Feedback */}
                <div className="rounded-2xl border border-border-divider bg-surface px-4 py-3 text-base font-extrabold text-text-primary leading-snug">
                  {assessment.actionFeedback}
                </div>

                {assessment.personalNote && (
                  <p className="text-sm font-bold text-neutral-10">
                    {assessment.personalNote}
                  </p>
                )}
              </div>
            </div>

            {isLowConfidence && (
              <div
                role="status"
                className="rounded-2xl border border-accent-orange/35 bg-accent-yellow/55 text-accent-orange-dark px-4 py-3.5 flex items-start gap-3 text-sm sm:text-base font-bold leading-snug"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-accent-orange-dark" />
                <span>
                  {isRealFood
                    ? `Tingkat keyakinan visual masih rendah (${confidencePercent}%). Cek porsi dan sesuaikan estimasi angka di bawah sebelum mencatat.`
                    : `Akurasi foto rendah (${confidencePercent}%). Cek ulang angka di form koreksi bawah sebelum mencatat.`}
                </span>
              </div>
            )}

            {/* 1b. Real Food Detected Components & Hidden Calorie Notes */}
            {isRealFood &&
              (detectedItems.length > 0 || hiddenCalorieNotes.length > 0) && (
                <div className="rounded-3xl border border-border-divider bg-card p-4 sm:p-5 space-y-3.5">
                  {detectedItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-extrabold text-text-primary">
                        <UtensilsCrossed className="h-4 w-4 text-accent-green shrink-0" />
                        <span>Komponen Terdeteksi</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detectedItems.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center px-3.5 py-1.5 rounded-pill border border-border-default bg-surface text-text-primary text-sm sm:text-base font-bold"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {hiddenCalorieNotes.length > 0 && (
                    <div className="rounded-2xl border border-accent-orange/35 bg-accent-yellow/45 text-accent-orange-dark px-4 py-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-extrabold">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Catatan Bahan Tersembunyi</span>
                      </div>
                      <ul className="space-y-1 text-sm font-semibold leading-snug">
                        {hiddenCalorieNotes.map((note) => (
                          <li key={note}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            {/* 2. Scannable Warning & Positive Chips */}
            {(assessment.warnings.length > 0 ||
              assessment.positives.length > 0) && (
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
                                prev === flag.nutrient ? null : flag.nutrient,
                              )
                            }
                            className={cn(
                              "min-h-11 inline-flex items-center gap-2 px-4 py-2 rounded-button border text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none",
                              flag.level === "high"
                                ? "border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive"
                                : "border-accent-orange/35 bg-accent-yellow/55 hover:bg-accent-yellow text-accent-orange-dark",
                              isSelected && "ring-2 ring-current",
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
                        className="rounded-2xl bg-text-primary text-text-inverse px-4 py-3 text-sm font-semibold leading-snug"
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
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-accent-green/35 bg-accent-green-light/25 text-text-primary text-sm sm:text-base font-extrabold"
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
              <div className="rounded-3xl border border-border-divider bg-card p-4 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Lightbulb className="h-5 w-5 text-accent-orange-dark shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base font-bold text-neutral-10 leading-snug">
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
            <div className="review-card border border-accent-green/25 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-base sm:text-lg font-extrabold text-text-primary block">
                    Jumlah Porsi
                  </span>
                  <span className="text-sm sm:text-base font-bold text-neutral-10">
                    Total:{" "}
                    <strong className="text-lg sm:text-xl font-black text-text-primary font-heading tabular-nums">
                      {totals.calories} kkal
                    </strong>
                    {!isRealFood && initialData.servingsPerContainer
                      ? ` • ${initialData.servingsPerContainer} sajian/kemasan`
                      : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Kurangi porsi"
                    onClick={() => handleAdjustServings(-0.25)}
                    className="h-12 w-12 rounded-2xl border border-border-default bg-surface hover:bg-accent-green-light/60 flex items-center justify-center text-neutral-10 hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
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
                    className="input-field w-20 h-12 py-2 text-center text-base sm:text-lg font-black text-neutral-10 tabular-nums"
                  />
                  <button
                    type="button"
                    aria-label="Tambah porsi"
                    onClick={() => handleAdjustServings(0.25)}
                    className="h-12 w-12 rounded-2xl border border-border-default bg-surface hover:bg-accent-green-light/60 flex items-center justify-center text-neutral-10 hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Quick portion chips (>= 48px height) */}
              <div className="flex items-center gap-2 flex-wrap">
                {isRealFood ? (
                  [
                    { label: "1/2 porsi", value: 0.5 },
                    { label: "1 porsi", value: 1.0 },
                    { label: "1.5 porsi", value: 1.5 },
                    { label: "2 porsi", value: 2.0 },
                  ].map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setServingsConsumed(chip.value)}
                      className={cn(
                        "min-h-12 px-4 py-2 rounded-pill border text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none",
                        servingsConsumed === chip.value
                          ? "border-accent-green bg-accent-green-light text-text-primary"
                          : "border-border-default bg-surface text-neutral-10 hover:bg-accent-green-light/35",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setServingsConsumed(1.0)}
                      className={cn(
                        "min-h-12 px-4 py-2 rounded-pill border text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none",
                        servingsConsumed === 1.0
                          ? "border-accent-green bg-accent-green-light text-text-primary"
                          : "border-border-default bg-surface text-neutral-10 hover:bg-accent-green-light/35",
                      )}
                    >
                      1 porsi
                    </button>
                    {initialData.servingsPerContainer &&
                      initialData.servingsPerContainer !== 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setServingsConsumed(
                              initialData.servingsPerContainer!,
                            )
                          }
                          className={cn(
                            "min-h-12 px-4 py-2 rounded-pill border text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none",
                            servingsConsumed ===
                              initialData.servingsPerContainer
                              ? "border-accent-green bg-accent-green-light text-text-primary"
                              : "border-border-default bg-surface text-neutral-10 hover:bg-accent-green-light/35",
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
                                Math.round(
                                  (initialData.servingsPerContainer! / 2) * 100,
                                ) / 100,
                              ),
                            )
                          }
                          className={cn(
                            "min-h-12 px-4 py-2 rounded-pill border text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none",
                            servingsConsumed ===
                              Math.max(
                                0.25,
                                Math.round(
                                  (initialData.servingsPerContainer! / 2) * 100,
                                ) / 100,
                              )
                              ? "border-accent-green bg-accent-green-light text-text-primary"
                              : "border-border-default bg-surface text-neutral-10 hover:bg-accent-green-light/35",
                          )}
                        >
                          1/2 kemasan
                        </button>
                      )}
                  </>
                )}
              </div>

              {/* Macro Snapshot Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
                <div className="rounded-2xl border border-border-divider bg-surface px-3 py-3">
                  <span className="text-sm font-bold text-neutral-10 block">
                    Protein
                  </span>
                  <span className="text-lg sm:text-xl font-black text-macro-protein tabular-nums">
                    {totals.protein}g
                  </span>
                </div>
                <div className="rounded-2xl border border-border-divider bg-surface px-3 py-3">
                  <span className="text-sm font-bold text-neutral-10 block">
                    Karbo
                  </span>
                  <span className="text-lg sm:text-xl font-black text-accent-orange-dark tabular-nums">
                    {totals.carbs}g
                  </span>
                </div>
                <div className="rounded-2xl border border-border-divider bg-surface px-3 py-3">
                  <span className="text-sm font-bold text-neutral-10 block">
                    Lemak
                  </span>
                  <span className="text-lg sm:text-xl font-black text-macro-fat tabular-nums">
                    {totals.fat}g
                  </span>
                </div>
                <div className="rounded-2xl border border-border-divider bg-surface px-3 py-3">
                  <span className="text-sm font-bold text-neutral-10 block">
                    Gula
                  </span>
                  <span className="text-lg sm:text-xl font-black text-macro-sugar tabular-nums">
                    {totals.sugar}g
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Collapsible Correction Form */}
            <div className="rounded-3xl border border-border-divider bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setIsEditExpanded((prev) => !prev)}
                aria-expanded={isEditExpanded}
                className="w-full min-h-12 px-5 py-3.5 flex items-center justify-between text-base font-extrabold text-text-primary hover:bg-accent-green-light/20 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-green focus-visible:outline-none"
              >
                <span>
                  {isRealFood
                    ? "Sesuaikan Nama & Estimasi Gizi"
                    : "Koreksi Angka Label"}
                </span>
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
                      <label className="block text-sm font-bold text-neutral-10 mb-1.5">
                        {isRealFood ? "Nama Makanan" : "Nama Produk"}
                      </label>
                      <input
                        type="text"
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        required
                        className="input-field w-full min-h-11 px-3.5 py-2.5 text-base font-bold text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-10 mb-1.5">
                        {isRealFood ? "Kategori Makanan" : "Kategori Produk"}
                      </label>
                      <select
                        value={productCategory}
                        onChange={(e) =>
                          setProductCategory(e.target.value as ProductCategory)
                        }
                        className="input-field w-full min-h-11 px-3.5 py-2.5 text-base font-bold text-foreground"
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
                      <label className="block text-sm font-bold text-neutral-10 mb-1.5">
                        {isRealFood ? "Estimasi Berat (g/ml)" : "Takaran Saji"}
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={servingSize}
                        onChange={(e) => setServingSize(e.target.value)}
                        className="input-field w-full min-h-11 px-3.5 py-2.5 text-base font-bold text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-10 mb-1.5">
                        Satuan Unit
                      </label>
                      <input
                        type="text"
                        value={servingUnit}
                        onChange={(e) => setServingUnit(e.target.value)}
                        className="input-field w-full min-h-11 px-3.5 py-2.5 text-base font-bold text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-input border border-border-default bg-surface p-3 focus-within:ring-2 focus-within:ring-accent-green">
                      <label className="flex items-center gap-1 text-sm font-bold text-text-primary mb-1">
                        <Flame className="h-4 w-4" /> Kalori
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={caloriesKcal}
                        onChange={(e) => setCaloriesKcal(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-foreground outline-none"
                      />
                    </div>
                    <div className="rounded-input border border-border-default bg-surface p-3 focus-within:ring-2 focus-within:ring-accent-green">
                      <label className="flex items-center gap-1 text-sm font-bold text-macro-protein mb-1">
                        <Beef className="h-4 w-4" /> Protein (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={proteinG}
                        onChange={(e) => setProteinG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-foreground outline-none"
                      />
                    </div>
                    <div className="rounded-input border border-border-default bg-surface p-3 focus-within:ring-2 focus-within:ring-accent-green">
                      <label className="flex items-center gap-1 text-sm font-bold text-accent-orange-dark mb-1">
                        <Wheat className="h-4 w-4" /> Karbo (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={carbsG}
                        onChange={(e) => setCarbsG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-foreground outline-none"
                      />
                    </div>
                    <div className="rounded-input border border-border-default bg-surface p-3 focus-within:ring-2 focus-within:ring-accent-green">
                      <label className="flex items-center gap-1 text-sm font-bold text-macro-fat mb-1">
                        <Droplets className="h-4 w-4" /> Lemak (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={fatG}
                        onChange={(e) => setFatG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-foreground outline-none"
                      />
                    </div>
                    <div className="rounded-input border border-border-default bg-surface p-3 focus-within:ring-2 focus-within:ring-accent-green">
                      <label className="block text-sm font-bold text-macro-sugar mb-1">
                        Gula (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={sugarG}
                        onChange={(e) => setSugarG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-foreground outline-none"
                      />
                    </div>
                    <div className="rounded-input border border-border-default bg-surface p-3 focus-within:ring-2 focus-within:ring-accent-green">
                      <label className="block text-sm font-bold text-text-primary mb-1">
                        Serat (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={fiberG}
                        onChange={(e) => setFiberG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-foreground outline-none"
                      />
                    </div>
                    <div className="rounded-input border border-border-default bg-surface p-3 focus-within:ring-2 focus-within:ring-accent-green">
                      <label className="block text-sm font-bold text-destructive mb-1">
                        Jenuh (g)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="-"
                        value={saturatedFatG}
                        onChange={(e) => setSaturatedFatG(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-foreground outline-none"
                      />
                    </div>
                    <div className="rounded-input border border-border-default bg-surface p-3 focus-within:ring-2 focus-within:ring-accent-green">
                      <label className="block text-sm font-bold text-accent-orange-dark mb-1">
                        Natrium (mg)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="-"
                        value={sodiumMg}
                        onChange={(e) => setSodiumMg(e.target.value)}
                        className="w-full bg-transparent text-base font-black text-foreground outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Mandatory AI Escalation: "Tanyakan Ahli Gizi" */}
            <NutritionistAskBox
              summaryText={nutritionistSummary}
              scanMode={isRealFood ? "food" : "label"}
            />

            {/* Save to Catalog Checkbox (packaged labels only) */}
            {!isRealFood && (
              <label className="min-h-12 flex items-center gap-3 p-4 rounded-button border border-border-divider bg-card cursor-pointer hover:bg-accent-green-light/25 transition-colors">
                <input
                  type="checkbox"
                  checked={saveToCatalog}
                  onChange={(e) => setSaveToCatalog(e.target.checked)}
                  className="h-5 w-5 rounded accent-accent-green cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-accent-green"
                />
                <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
                  <BookmarkPlus className="h-5 w-5 text-text-primary shrink-0" />
                  <span>Simpan ke katalog makanan</span>
                </div>
              </label>
            )}

            {submitError && (
              <div className="p-4 rounded-input bg-destructive/10 border border-destructive/30 text-sm sm:text-base font-bold text-destructive">
                {submitError}
              </div>
            )}
          </div>

          {/* Sticky Footer Actions */}
          <div className="shrink-0 border-t border-border-divider bg-surface px-5 sm:px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5">
            {onRescan && (
              <button
                type="button"
                onClick={onRescan}
                disabled={isSubmitting}
                className="min-h-12 px-4 sm:px-5 py-3 rounded-button border border-border-default bg-surface hover:bg-card text-sm sm:text-base font-extrabold text-neutral-10 flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
              >
                <Camera className="h-5 w-5 shrink-0" />
                <span>Scan Ulang</span>
              </button>
            )}

            {onAddToStaging && (
              <button
                type="button"
                onClick={() => {
                  const numericServingSize =
                    parseFloat(servingSize) || (isRealFood ? 250 : 100);
                  onAddToStaging({
                    id: `scan-${Date.now()}`,
                    name: foodName.trim() || "Scanned Food",
                    category: isRealFood
                      ? "Makanan Real (Estimasi AI)"
                      : CATEGORY_LABELS[productCategory],
                    baseCalories: parsedPerServing.caloriesKcal,
                    baseProteinG: parsedPerServing.proteinG,
                    baseCarbsG: parsedPerServing.carbsG,
                    baseFatG: parsedPerServing.fatG,
                    baseFiberG: parsedPerServing.fiberG,
                    baseSugarG: parsedPerServing.sugarG,
                    servingMultiplier: servingsConsumed,
                    servingUnit: isRealFood
                      ? `${servingUnit || "porsi"} (~${numericServingSize}g)`
                      : `${servingSize || "100"}${servingUnit || "g"}`,
                    gramsPerUnit: numericServingSize,
                  });
                  onClose();
                }}
                className="min-h-12 px-4 sm:px-5 py-3 rounded-button border-2 border-accent-green bg-accent-green-light/70 hover:bg-accent-green-light text-text-primary text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
              >
                <Plus className="h-5 w-5 shrink-0" />
                <span>Taruh di Piring</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "col-span-2 sm:col-span-1 min-h-12 px-6 py-3 rounded-button bg-accent-green-light hover:bg-accent-green text-text-primary hover:text-text-inverse text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none",
                isSubmitting && "opacity-75 cursor-not-allowed",
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
