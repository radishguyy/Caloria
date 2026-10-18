"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Beef,
  Wheat,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { useFoodStore, NutritionFeedback } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { FOOD_CATALOG } from "@/lib/food-catalog";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { FoodCatalogItem } from "@/types";
import { cn } from "@/lib/utils";

export default function FoodDiaryPage() {
  const {
    logs,
    addLog,
    removeLog,
    getConsumed,
    targets,
    goalPlan,
    latestFeedback,
    clearFeedback,
  } = useFoodStore();

  const { feedPet } = usePetStore();

  const [activeMealType, setActiveMealType] = useState<MealTypeId>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedFood, setSelectedFood] = useState<FoodCatalogItem | null>(null);
  const [servingPortion, setServingPortion] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const consumed = getConsumed();

  // Extract unique categories from catalog
  const categories = useMemo(() => {
    const set = new Set(FOOD_CATALOG.map((item) => item.category));
    return ["Semua", ...Array.from(set)];
  }, []);

  // Filter catalog based on search & category
  const filteredCatalog = useMemo(() => {
    return FOOD_CATALOG.filter((item) => {
      const matchQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "Semua" || item.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  // Calculated nutrition based on portion multiplier
  const calculatedMacros = useMemo(() => {
    if (!selectedFood) return null;
    const mult = Math.max(0.1, servingPortion);
    return {
      calories: Math.round(selectedFood.calories * mult),
      proteinG: Math.round(selectedFood.proteinG * mult * 10) / 10,
      carbsG: Math.round(selectedFood.carbsG * mult * 10) / 10,
      fatG: Math.round(selectedFood.fatG * mult * 10) / 10,
      fiberG: Math.round(selectedFood.fiberG * mult * 10) / 10,
      sugarG: Math.round(selectedFood.sugarG * mult * 10) / 10,
      grams: Math.round(selectedFood.gramsPerUnit * mult),
    };
  }, [selectedFood, servingPortion]);

  const handleSelectFood = (food: FoodCatalogItem) => {
    setSelectedFood(food);
    setServingPortion(food.defaultServingSize);
    setShowAddModal(true);
  };

  const handleSaveFood = () => {
    if (!selectedFood || !calculatedMacros) return;

    // 1. Add log to food store and compute real-time feedback
    const feedback: NutritionFeedback = addLog({
      name: selectedFood.name,
      mealType: activeMealType,
      calories: calculatedMacros.calories,
      proteinG: calculatedMacros.proteinG,
      carbsG: calculatedMacros.carbsG,
      fatG: calculatedMacros.fatG,
      fiberG: calculatedMacros.fiberG,
      sugarG: calculatedMacros.sugarG,
      servingSize: servingPortion,
      servingUnit: `${servingPortion}x ${selectedFood.servingUnit}`,
      loggedDate: new Date().toISOString().split("T")[0],
    });

    // 2. Feed the pet and grant XP + Coins (Reward Engine)
    feedPet(calculatedMacros.calories, feedback.xpEarned, feedback.coinsEarned);

    // 3. Close modal & reset selection
    setShowAddModal(false);
    setSelectedFood(null);
    setServingPortion(1);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1.5 rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Food Diary & Kalkulator Gizi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-8 sm:ml-0">
            Cari katalog makanan lokal & umum, atur porsi gramasi, dan dapatkan feedback evaluasi misi harian.
          </p>
        </div>

        {/* Quick Calorie Remaining Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-card border shadow-xs text-xs">
          <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
          <span className="text-muted-foreground">Tersisa:</span>
          <span className="font-bold text-foreground">
            {Math.max(0, targets.calories - consumed.calories)} kcal
          </span>
        </div>
      </div>

      {/* Real-time Nutrition Mission Feedback Banner (Grand Design 3.A) */}
      {latestFeedback && (
        <div
          className={cn(
            "p-4 rounded-2xl border transition-all animate-in fade-in duration-300 relative",
            latestFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
              : latestFeedback.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
              : "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-100"
          )}
        >
          <button
            onClick={clearFeedback}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="mt-0.5">
              {latestFeedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : latestFeedback.type === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold">{latestFeedback.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/80 border">
                  +{latestFeedback.xpEarned} XP • +{latestFeedback.coinsEarned} Koin
                </span>
              </div>
              <p className="text-xs opacity-90">{latestFeedback.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Meal Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MEAL_TYPES.map((meal) => {
          const isActive = activeMealType === meal.id;
          const count = logs.filter((l) => l.mealType === meal.id).length;
          return (
            <button
              key={meal.id}
              onClick={() => setActiveMealType(meal.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                isActive
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{meal.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Catalog Search on Left, Logged Meals on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Food Search & Catalog Picker */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <h2 className="text-sm font-bold text-foreground flex items-center justify-between">
              <span>Pencarian Database Makanan</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Untuk {MEAL_TYPES.find((m) => m.id === activeMealType)?.label}
              </span>
            </h2>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari makanan (misal: Nasi, Dada Ayam, Tempe, Gado-Gado)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors",
                    selectedCategory === cat
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Food Catalog List */}
            <div className="divide-y divide-border max-h-[380px] overflow-y-auto pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Makanan tidak ditemukan. Coba kata kunci lain.
                </div>
              ) : (
                filteredCatalog.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="py-2.5 px-2 hover:bg-muted/40 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {food.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {food.defaultServingSize} {food.servingUnit} • P: {food.proteinG}g | K: {food.carbsG}g | L: {food.fatG}g
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {food.calories} <span className="text-[10px] text-muted-foreground font-normal">kcal</span>
                      </span>
                      <button className="h-7 w-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Logged Meals for Selected Meal Type & Today */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Catatan {MEAL_TYPES.find((m) => m.id === activeMealType)?.label} Hari Ini
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {logs.filter((l) => l.mealType === activeMealType).length} item tercatat
                </p>
              </div>

              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {logs
                  .filter((l) => l.mealType === activeMealType)
                  .reduce((sum, item) => sum + item.calories, 0)}{" "}
                kcal
              </span>
            </div>

            {/* List of logged foods */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {logs.filter((l) => l.mealType === activeMealType).length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    Belum ada makanan dicatat untuk waktu makan ini. Pilih makanan dari katalog di sebelah kiri.
                  </p>
                </div>
              ) : (
                logs
                  .filter((l) => l.mealType === activeMealType)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">{log.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {log.servingUnit} • {log.calories} kcal
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>P: {log.proteinG}g</span>
                          <span>K: {log.carbsG}g</span>
                          <span>L: {log.fatG}g</span>
                          {log.fiberG ? <span>S: {log.fiberG}g</span> : null}
                        </div>
                      </div>

                      <button
                        onClick={() => removeLog(log.id)}
                        className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Hapus Makanan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Daily Total Summary Card */}
          <div className="rounded-2xl border bg-card p-4 space-y-2 text-xs">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <Info className="h-4 w-4 text-orange-500" />
              Total Gizi Terkumpul Hari Ini
            </h4>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <span className="text-[10px] text-muted-foreground">Protein</span>
                <p className="font-bold text-foreground">{consumed.protein}g</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <span className="text-[10px] text-muted-foreground">Karbo</span>
                <p className="font-bold text-foreground">{consumed.carbs}g</p>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <span className="text-[10px] text-muted-foreground">Lemak</span>
                <p className="font-bold text-foreground">{consumed.fat}g</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Dialog: Adjust Portion & Preview Nutrition */}
      {showAddModal && selectedFood && calculatedMacros && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Atur Porsi Makanan
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {selectedFood.name}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meal Type Radio Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Pilih Waktu Makan:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MEAL_TYPES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMealType(m.id)}
                    className={cn(
                      "py-1.5 px-1 rounded-xl text-xs font-medium border text-center transition-colors",
                      activeMealType === m.id
                        ? "bg-orange-500 text-white border-orange-500 font-bold"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Portion / Multiplier Controls */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">
                  Ukuran Porsi:
                </span>
                <span className="font-bold text-foreground">
                  {servingPortion}x ({calculatedMacros.grams} gram)
                </span>
              </div>

              {/* Quick Multiplier Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1, 1.5, 2].map((val) => (
                  <button
                    key={val}
                    onClick={() => setServingPortion(val)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold border transition-colors",
                      servingPortion === val
                        ? "bg-foreground text-background border-foreground"
                        : "bg-muted/30 border-border hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {val}x
                  </button>
                ))}
              </div>

              {/* Slider for fine adjustment */}
              <input
                type="range"
                min="0.25"
                max="4"
                step="0.25"
                value={servingPortion}
                onChange={(e) => setServingPortion(parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Calculated Nutrition Preview */}
            <div className="rounded-2xl bg-muted/40 p-4 space-y-2 border">
              <div className="flex justify-between items-baseline border-b border-border/60 pb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Total Nilai Kalori
                </span>
                <span className="text-xl font-extrabold text-orange-600 dark:text-orange-400">
                  {calculatedMacros.calories} kcal
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground">Protein</span>
                  <p className="font-bold text-blue-600 dark:text-blue-400">
                    {calculatedMacros.proteinG}g
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Karbo</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    {calculatedMacros.carbsG}g
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Lemak</span>
                  <p className="font-bold text-rose-600 dark:text-rose-400">
                    {calculatedMacros.fatG}g
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-accent text-foreground transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveFood}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Simpan Makanan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

