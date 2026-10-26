/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Plus,
  AlertCircle,
  Building2,
  ChefHat,
  Globe2,
  Lock,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { FOOD_CATALOG } from "@/lib/food-catalog";
import {
  CustomFoodItem,
  CustomFoodOrigin,
  CustomFoodVisibility,
  FoodCatalogItem,
} from "@/types";
import { cn } from "@/lib/utils";

interface CreateCustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatedAndStage: (food: FoodCatalogItem) => void;
}

export function CreateCustomFoodModal({
  isOpen,
  onClose,
  onCreatedAndStage,
}: CreateCustomFoodModalProps) {
  const { addCustomFood, customFoods } = useFoodStore();

  const [origin, setOrigin] = useState<CustomFoodOrigin>("home_cooked");
  const [foodName, setFoodName] = useState("");
  const [brandOrSource, setBrandOrSource] = useState("");
  const [servingBasis, setServingBasis] = useState<"portion" | "100g">("portion");
  const [servingUnit, setServingUnit] = useState("porsi (150g)");
  const [gramsPerUnit, setGramsPerUnit] = useState("150");

  // Mandatory Macros
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  // Optional Micros
  const [fiber, setFiber] = useState("");
  const [sugar, setSugar] = useState("");

  // Metadata
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  // Visibility
  const [visibility, setVisibility] = useState<CustomFoodVisibility>("private");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrigin("home_cooked");
      setFoodName("");
      setBrandOrSource("");
      setServingBasis("portion");
      setServingUnit("porsi (150g)");
      setGramsPerUnit("150");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setFiber("");
      setSugar("");
      setTagsInput("");
      setNotes("");
      setVisibility("private");
    }
  }, [isOpen]);

  // Adjust visibility default when origin changes
  useEffect(() => {
    if (origin === "home_cooked") {
      setVisibility("private");
    }
  }, [origin]);

  // Real-time Debounced Deduplication Check
  const potentialDuplicates = useMemo(() => {
    const query = foodName.trim().toLowerCase();
    if (query.length < 3) return [];

    const allItems: FoodCatalogItem[] = [...customFoods, ...FOOD_CATALOG];
    return allItems
      .filter((item) => {
        const itemLower = item.name.toLowerCase();
        return itemLower.includes(query) || query.includes(itemLower);
      })
      .slice(0, 3);
  }, [foodName, customFoods]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const calNum = parseFloat(calories) || 0;
    const proteinNum = parseFloat(protein) || 0;
    const carbsNum = parseFloat(carbs) || 0;
    const fatNum = parseFloat(fat) || 0;
    const fiberNum = parseFloat(fiber) || 0;
    const sugarNum = parseFloat(sugar) || 0;
    const gramsNum = parseFloat(gramsPerUnit) || 100;

    const tags = tagsInput
      .split(/[,\s#]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const createdItem: CustomFoodItem = addCustomFood({
      name: foodName.trim() || "Makanan Baru",
      category: origin === "branded" ? "Restoran & Branded" : "Buatan Sendiri",
      brandOrSource: brandOrSource.trim() || undefined,
      calories: calNum,
      proteinG: proteinNum,
      carbsG: carbsNum,
      fatG: fatNum,
      fiberG: fiberNum,
      sugarG: sugarNum,
      defaultServingSize: 1,
      servingUnit: servingBasis === "100g" ? "100g / 100ml" : servingUnit.trim() || "porsi",
      gramsPerUnit: servingBasis === "100g" ? 100 : gramsNum,
      origin,
      visibility: origin === "branded" ? visibility : "private",
      tags,
      notes: notes.trim() || undefined,
    });

    onCreatedAndStage(createdItem);
    onClose();
  };

  const isFormValid =
    foodName.trim().length > 1 &&
    calories.trim().length > 0 &&
    protein.trim().length > 0 &&
    carbs.trim().length > 0 &&
    fat.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-card border border-border-divider bg-surface shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border-divider bg-surface-subtle">
          <div>
            <h2 className="text-base sm:text-lg font-black text-text-primary font-heading flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent-green" />
              <span>Tambah Makanan Baru ke Database</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Daftarkan resep sendiri atau makanan kemasan/restoran dengan validasi gizi lengkap.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-navigation border border-border-default hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: Select Origin */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              1. Asal Makanan <span className="text-accent-orange">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOrigin("home_cooked")}
                className={cn(
                  "p-3 rounded-button border text-left transition-colors flex items-start gap-2.5",
                  origin === "home_cooked"
                    ? "bg-accent-green-light border-accent-green text-text-primary"
                    : "bg-surface-subtle border-border-default text-text-muted hover:text-text-primary"
                )}
              >
                <ChefHat className="h-4 w-4 mt-0.5 text-accent-green shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Buatan Sendiri</p>
                  <p className="text-[10px] text-text-muted">Masakan rumah, racikan menu, atau resep pribadi</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrigin("branded")}
                className={cn(
                  "p-3 rounded-button border text-left transition-colors flex items-start gap-2.5",
                  origin === "branded"
                    ? "bg-accent-green-light border-accent-green text-text-primary"
                    : "bg-surface-subtle border-border-default text-text-muted hover:text-text-primary"
                )}
              >
                <Building2 className="h-4 w-4 mt-0.5 text-accent-orange shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Branded / Restoran</p>
                  <p className="text-[10px] text-text-muted">Produk kemasan, resto cepat saji, atau kafe</p>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Name & Deduplication */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              2. Nama Makanan <span className="text-accent-orange">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Soto Betawi Daging Sapi Tanpa Santan..."
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="input-field w-full px-3.5 py-2.5 text-xs font-medium"
            />

            {origin === "branded" && (
              <input
                type="text"
                placeholder="Nama Merk / Restoran (Contoh: Indomie, KFC, Hokben)..."
                value={brandOrSource}
                onChange={(e) => setBrandOrSource(e.target.value)}
                className="input-field w-full px-3.5 py-2 text-xs font-medium"
              />
            )}

            {/* Deduplication Warning Banner */}
            {potentialDuplicates.length > 0 && (
              <div className="p-3 rounded-button bg-accent-yellow/30 border border-accent-orange/40 text-xs space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 font-bold text-accent-orange-dark">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Item Serupa Ditemukan di Database!</span>
                </div>
                <p className="text-[11px] text-text-primary">
                  Cek apakah menu ini sudah cocok agar tidak terjadi duplikasi:
                </p>
                <div className="space-y-1 pt-1">
                  {potentialDuplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="p-2 rounded-input bg-surface border border-border-divider flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-text-primary">{dup.name}</span>
                        <span className="text-[10px] text-text-muted ml-2">
                          ({dup.calories} kcal • P: {dup.proteinG}g)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onCreatedAndStage(dup);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-pill bg-accent-green text-text-inverse text-[10px] font-bold hover:opacity-90"
                      >
                        Pakai Menu Ini
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Nutrition Facts & Serving Basis */}
          <div className="space-y-3 pt-1 border-t border-border-divider">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary">
                3. Nilai Informasi Gizi <span className="text-accent-orange">*</span>
              </label>

              {/* Basis Toggle */}
              <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-pill border border-border-default text-[10px]">
                <button
                  type="button"
                  onClick={() => setServingBasis("portion")}
                  className={cn(
                    "px-2.5 py-1 rounded-pill font-bold transition-colors",
                    servingBasis === "portion"
                      ? "bg-accent-green text-text-inverse"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Per 1 Porsi
                </button>
                <button
                  type="button"
                  onClick={() => setServingBasis("100g")}
                  className={cn(
                    "px-2.5 py-1 rounded-pill font-bold transition-colors",
                    servingBasis === "100g"
                      ? "bg-accent-green text-text-inverse"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Per 100g / 100ml
                </button>
              </div>
            </div>

            {servingBasis === "portion" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-text-muted">Nama Satuan Porsi:</span>
                  <input
                    type="text"
                    placeholder="misal: mangkuk (200g), potong"
                    value={servingUnit}
                    onChange={(e) => setServingUnit(e.target.value)}
                    className="input-field w-full px-3 py-1.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-text-muted">Perkiraan Gramasi (g):</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="150"
                    value={gramsPerUnit}
                    onChange={(e) => setGramsPerUnit(e.target.value)}
                    className="input-field w-full px-3 py-1.5 text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Mandatory 4 Macros */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[11px] font-bold text-text-primary flex items-center justify-between">
                  <span>Kalori (kcal) *</span>
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="input-field w-full px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-macro-protein flex items-center justify-between">
                  <span>Protein (g) *</span>
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="input-field w-full px-3 py-2 text-xs font-bold text-macro-protein"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-accent-orange flex items-center justify-between">
                  <span>Karbohidrat (g) *</span>
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="input-field w-full px-3 py-2 text-xs font-bold text-accent-orange"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-macro-fat flex items-center justify-between">
                  <span>Lemak (g) *</span>
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="input-field w-full px-3 py-2 text-xs font-bold text-macro-fat"
                />
              </div>
            </div>

            {/* Optional Micros */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <span className="text-[10px] text-text-muted">Serat / Fiber (g) (Opsional):</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  className="input-field w-full px-3 py-1.5 text-xs font-medium"
                />
              </div>

              <div>
                <span className="text-[10px] text-text-muted">Gula / Sugar (g) (Opsional):</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className="input-field w-full px-3 py-1.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: Tags & Notes */}
          <div className="space-y-1.5 pt-1 border-t border-border-divider">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-accent-green" />
              <span>4. Tag Pencarian & Catatan</span>
            </label>
            <input
              type="text"
              placeholder="Tag dipisahkan spasi atau koma (misal: #dadaayam #bebasminyak #halal)..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="input-field w-full px-3.5 py-2 text-xs font-medium"
            />
          </div>

          {/* STEP 5: Visibility & Privacy */}
          <div className="space-y-1.5 pt-1 border-t border-border-divider">
            <label className="text-xs font-bold text-text-primary">
              5. Pengaturan Privasi & Komunitas
            </label>

            {origin === "branded" ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={cn(
                    "p-2.5 rounded-button border text-left flex items-start gap-2 transition-colors",
                    visibility === "public"
                      ? "bg-accent-green-light border-accent-green text-text-primary"
                      : "bg-surface-subtle border-border-default text-text-muted"
                  )}
                >
                  <Globe2 className="h-4 w-4 text-accent-green shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Berbagi & Kolaborasi</p>
                    <p className="text-[10px] text-text-muted">Dapat dicari oleh komunitas Caloria</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={cn(
                    "p-2.5 rounded-button border text-left flex items-start gap-2 transition-colors",
                    visibility === "private"
                      ? "bg-accent-green-light border-accent-green text-text-primary"
                      : "bg-surface-subtle border-border-default text-text-muted"
                  )}
                >
                  <Lock className="h-4 w-4 text-accent-orange shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Jangan Dibagikan</p>
                    <p className="text-[10px] text-text-muted">Hanya tersimpan di akun pribadimu</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-input bg-surface-subtle border border-border-default flex items-center gap-2 text-xs text-text-muted">
                <Lock className="h-4 w-4 text-text-muted shrink-0" />
                <span>
                  Makanan buatan sendiri otomatis diatur sebagai <strong>Pribadi</strong> untuk menjaga privasi resepmu.
                </span>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-divider">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-button border border-border-default bg-surface hover:bg-surface-subtle text-xs font-bold text-text-muted hover:text-foreground transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!isFormValid}
              className={cn(
                "button-primary px-5 py-2.5 text-xs flex items-center gap-2",
                !isFormValid && "opacity-50 cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan Makanan & Masukkan ke Piring</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}