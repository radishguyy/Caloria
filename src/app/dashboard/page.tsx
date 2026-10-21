"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flame,
  PlusCircle,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  Award,
  Bell,
  Coins,
  Calendar,
  X,
  Plus,
} from "lucide-react";
import { PetRenderer } from "@/components/pet/pet-renderer";
import { MacroBar } from "@/components/diary/macro-bar";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { useSocialStore } from "@/store/use-social-store";
import { useNotificationStore } from "@/store/use-notification-store";
import { FOOD_CATALOG } from "@/lib/food-catalog";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";

export default function DashboardPage() {
  const { goalPlan, getMealLogs, getConsumed, addLog } = useFoodStore();
  const { name, level, stage, coins, feedPet } = usePetStore();
  const { coopStreakDays, partyName, friends } = useSocialStore();
  const { toggleDrawer, getUnreadCount } = useNotificationStore();

  const [quickLogModalOpen, setQuickLogModalOpen] = useState(false);
  const [selectedQuickMeal, setSelectedQuickMeal] = useState<MealTypeId>("breakfast");

  const consumed = getConsumed();
  const unreadCount = getUnreadCount();
  const remainingDays = Math.max(0, goalPlan.totalProjectedDays - goalPlan.currentDayNumber);
  const progressPercent = Math.min(
    100,
    Math.round((goalPlan.currentDayNumber / goalPlan.totalProjectedDays) * 100)
  );

  const pendingFriends = friends.filter((f) => !f.dailyGoalMet);

  const handleQuickAdd = (foodItem: (typeof FOOD_CATALOG)[0]) => {
    const feedback = addLog({
      name: foodItem.name,
      mealType: selectedQuickMeal,
      calories: foodItem.calories,
      proteinG: foodItem.proteinG,
      carbsG: foodItem.carbsG,
      fatG: foodItem.fatG,
      fiberG: foodItem.fiberG,
      sugarG: foodItem.sugarG,
      servingSize: 1,
      servingUnit: foodItem.servingUnit,
      loggedDate: new Date().toISOString().split("T")[0],
    });

    feedPet(foodItem.calories, feedback.xpEarned, feedback.coinsEarned);
    setQuickLogModalOpen(false);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Goal & N-Day Projection Banner */}
      <section className="rounded-3xl border bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500 text-white shadow-xs">
                Program {goalPlan.goalType}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-background border text-foreground">
                BMI: {goalPlan.bmiScore} ({goalPlan.bmiCategory})
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-background border text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3 text-orange-500" />
                Target: {goalPlan.currentWeightKg} kg &rarr; {goalPlan.targetWeightKg} kg
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground pt-1">
              Hari ke-{goalPlan.currentDayNumber} dari {goalPlan.totalProjectedDays} Hari
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Dengan margin harian {goalPlan.dailyMarginKcal > 0 ? `+${goalPlan.dailyMarginKcal}` : goalPlan.dailyMarginKcal} kkal/hari, kamu diproyeksikan mencapai misi utama dalam{" "}
              <strong className="text-foreground">{remainingDays} hari lagi</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground font-medium">Sisa Waktu</p>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {remainingDays} <span className="text-xs font-semibold">Hari</span>
              </p>
            </div>
            <Link
              href="/onboarding/goal"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold transition-colors"
            >
              <span>Ubah Target</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Progress Bar for N-Day Mission */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
            <span>Progres Program</span>
            <span>{progressPercent}% tercapai</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. Co-op Streak Alert Banner (Social Accountability) */}
      <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-black shadow-sm">
            <Flame className="h-6 w-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                Co-op Streak: {coopStreakDays} Hari Bersama {partyName}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingFriends.length > 0
                ? `${pendingFriends.length} teman belum mencatat makanan hari ini. Senggol mereka agar streak tidak putus!`
                : "Semua teman di party sudah mencatat makanan hari ini! Streak kalian aman."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={toggleDrawer}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold"
          >
            <Bell className="h-3.5 w-3.5 text-orange-500" />
            <span>Notifikasi {unreadCount > 0 && `(${unreadCount})`}</span>
          </button>

          <Link
            href="/social/coop"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-transform active:scale-95"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Buka Co-op & Senggol</span>
          </Link>
        </div>
      </section>

      {/* 3. Main Two-Column Section: Pet Stage & Daily Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stage View (Ruang Interaktif Pet) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Ruang Pet Virtual
                </h2>
              </div>
              <Link
                href="/pet-customization/shop"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-colors"
              >
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                <span>{coins} Koin</span>
              </Link>
            </div>

            {/* Interactive Pet Canvas with Dialog */}
            <PetRenderer
              interactive={true}
              size="md"
              dialogMessage={`"Halo! Jangan lupa lengkapi target protein hari ini ya agar aku cepat berevolusi!"`}
            />

            {/* Pet Wardrobe Link Shortcut */}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Kustomisasi Outfit & Aksesoris</span>
              <Link
                href="/pet-customization/wardrobe"
                className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 hover:underline"
              >
                <span>Buka Wardrobe</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Pet Gamification Rules Card */}
          <div className="rounded-2xl border bg-muted/40 p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-500" />
              Mekanisme Reward Gizi ke XP:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Mencatat makanan per waktu makan: +20 sampai +35 Base XP.</li>
              <li>Memenuhi target protein harian: Bonus Multiplier 1.5x XP.</li>
              <li>Menutup hari dengan kalori seimbang: Jackpot XP + Caloria Coins.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Card View (Ringkasan Gizi Harian & Quick Actions) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Circular Calorie Tracker & Macros */}
          <MacroBar />

          {/* Quick Action Button: + Catat Makanan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setQuickLogModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-transform active:scale-98"
            >
              <PlusCircle className="h-5 w-5" />
              <span>+ Quick Catat Makanan</span>
            </button>

            <Link
              href="/diary/add"
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-border bg-card hover:bg-accent text-foreground font-semibold text-sm transition-colors"
            >
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span>Cari Katalog & Evaluasi Gizi</span>
            </Link>
          </div>

          {/* Today's Meal Breakdown Quick List */}
          <div className="rounded-2xl border bg-card p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">
                Catatan Waktu Makan Hari Ini
              </h3>
              <Link
                href="/diary"
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
              >
                Buka Food Diary Lengkap &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MEAL_TYPES.map((meal) => {
                const logs = getMealLogs(meal.id);
                const mealCalories = logs.reduce((sum, item) => sum + item.calories, 0);

                return (
                  <Link
                    key={meal.id}
                    href={`/diary?meal=${meal.id}`}
                    className="p-3 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {meal.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {logs.length > 0 ? `${logs.length} item` : "Belum dicatat"}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-2">
                      {mealCalories} <span className="text-[10px] text-muted-foreground font-normal">kcal</span>
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Modal: Fast Log Food */}
      {quickLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-orange-500" />
                <span>Quick Catat Makanan</span>
              </h3>
              <button
                onClick={() => setQuickLogModalOpen(false)}
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
                    onClick={() => setSelectedQuickMeal(m.id)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-medium border text-center transition-colors ${
                      selectedQuickMeal === m.id
                        ? "bg-orange-500 text-white border-orange-500 font-bold"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Favorites List */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Pilih Cepat Menu Populer:
              </label>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {FOOD_CATALOG.slice(0, 6).map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleQuickAdd(food)}
                    className="p-2.5 rounded-xl border bg-muted/20 hover:bg-orange-500/10 hover:border-orange-500/30 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{food.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {food.defaultServingSize} {food.servingUnit} • P: {food.proteinG}g
                      </p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                      +{food.calories} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <Link
                href="/diary/add"
                onClick={() => setQuickLogModalOpen(false)}
                className="font-semibold text-orange-600 dark:text-orange-400 hover:underline"
              >
                Cari di Katalog Lengkap &rarr;
              </Link>
              <button
                onClick={() => setQuickLogModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border hover:bg-muted font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

