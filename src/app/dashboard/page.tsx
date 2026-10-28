"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  PlusCircle,
  Plus,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  Award,
  Bell,
  Coins,
  X,
} from "lucide-react";
import { PetRenderer } from "@/components/pet/pet-renderer";
import { MacroBar } from "@/components/diary/macro-bar";
import { DashboardCalendarStrip } from "@/components/dashboard/DashboardCalendarStrip";
import { QuestBoard } from "@/components/dashboard/QuestBoard";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { useSocialStore } from "@/store/use-social-store";
import { useNotificationStore } from "@/store/use-notification-store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { FOOD_CATALOG } from "@/lib/food-catalog";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { isToday, formatDateDisplay, getTodayKey } from "@/lib/date-utils";
import { useHydrated } from "@/hooks/use-hydrated";

export default function DashboardPage() {
  const isHydrated = useHydrated();
  const {
    goalPlan,
    selectedDate,
    setSelectedDate,
    getMealLogs,
    addLog,
    addBatchLogs,
    getRecentFoods,
    getFrequentFoods,
    getDepkesEvaluation,
  } = useFoodStore();
  const depkesEval = getDepkesEvaluation();
  const { coins, feedPet, stage } = usePetStore();
  const { coopStreakDays, partyName, friends } = useSocialStore();
  const { toggleDrawer, getUnreadCount } = useNotificationStore();
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    subscribeToPush,
  } = usePushNotifications();

  const [dismissedPushBanner, setDismissedPushBanner] = useState(false);

  const isSelectedToday = isHydrated ? isToday(selectedDate) : true;

  const [quickLogModalOpen, setQuickLogModalOpen] = useState(false);
  const [selectedQuickMeal, setSelectedQuickMeal] = useState<MealTypeId>("breakfast");

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 11 && hours < 15) setSelectedQuickMeal("lunch");
    else if (hours >= 15 && hours < 18) setSelectedQuickMeal("snack");
    else if (hours >= 18 || hours < 5) setSelectedQuickMeal("dinner");
    else setSelectedQuickMeal("breakfast");
  }, []);
  const [quickFilter, setQuickFilter] = useState<"popular" | "recent" | "frequent">("popular");
  const [selectedQuickItems, setSelectedQuickItems] = useState<(typeof FOOD_CATALOG)[0][]>([]);

  const unreadCount = getUnreadCount();
  const remainingDays = Math.max(0, goalPlan.totalProjectedDays - goalPlan.currentDayNumber);
  const progressPercent = Math.min(
    100,
    Math.round((goalPlan.currentDayNumber / goalPlan.totalProjectedDays) * 100)
  );

  const pendingFriends = friends.filter((f) => !f.dailyGoalMet);

  const toggleQuickItem = (foodItem: (typeof FOOD_CATALOG)[0]) => {
    setSelectedQuickItems((prev) => {
      const exists = prev.find((i) => i.id === foodItem.id);
      if (exists) {
        return prev.filter((i) => i.id !== foodItem.id);
      }
      return [...prev, foodItem];
    });
  };

  const handleBatchQuickSave = () => {
    if (selectedQuickItems.length === 0) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const totalCal = selectedQuickItems.reduce((sum, item) => sum + item.calories, 0);

    const logsToSave = selectedQuickItems.map((item) => ({
      name: item.name,
      mealType: selectedQuickMeal,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      fiberG: item.fiberG,
      sugarG: item.sugarG,
      servingSize: item.defaultServingSize || 1,
      servingUnit: item.servingUnit,
      loggedDate: todayStr,
    }));

    const feedback = addBatchLogs(logsToSave);
    feedPet(totalCal, feedback.xpEarned, 0);

    setSelectedQuickItems([]);
    setQuickLogModalOpen(false);
  };

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

    feedPet(foodItem.calories, feedback.xpEarned, 0);
    setSelectedQuickItems([]);
    setQuickLogModalOpen(false);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Goal & N-Day Projection Hero Card (Pale Yellow Surface) */}
      <section className="hero-card border border-accent-green/25 p-6 sm:p-8 relative overflow-hidden" suppressHydrationWarning>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-pill text-xs font-bold uppercase tracking-wider bg-accent-green text-text-inverse shadow-2xs">
                Program {goalPlan.goalType}
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-semibold bg-surface border border-border-default text-text-primary">
                BMI: {goalPlan.bmiScore} ({goalPlan.bmiCategory})
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-semibold bg-surface border border-border-default text-neutral-10 flex items-center gap-1">
                <Target className="h-3 w-3 text-accent-green" />
                Target: {goalPlan.currentWeightKg} kg &rarr; {goalPlan.targetWeightKg} kg
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-heading pt-1">
              Hari ke-{goalPlan.currentDayNumber} dari {goalPlan.totalProjectedDays} Hari
            </h1>

            <p className="text-xs sm:text-sm text-neutral-10">
              Dengan margin harian{" "}
              {goalPlan.dailyMarginKcal > 0
                ? `+${goalPlan.dailyMarginKcal}`
                : goalPlan.dailyMarginKcal}{" "}
              kkal/hari, kamu diproyeksikan mencapai misi utama dalam{" "}
              <strong className="text-text-primary">{remainingDays} hari lagi</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-neutral-10 font-medium">Sisa Waktu</p>
              <p className="text-2xl font-black text-text-primary font-heading">
                {remainingDays} <span className="text-xs font-semibold">Hari</span>
              </p>
            </div>
            <Link
              href="/onboarding/goal"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button border border-border-default bg-surface hover:bg-accent-green-light text-text-primary text-xs font-bold transition-colors"
            >
              <span>Ubah Target</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Progress Bar for N-Day Mission */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[11px] text-text-primary font-semibold">
            <span>Progres Program</span>
            <span>{progressPercent}% tercapai</span>
          </div>
          <div className="h-2.5 w-full rounded-pill bg-surface/80 overflow-hidden border border-accent-green/20">
            <div
              className="h-full bg-accent-green transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Web Push Prompt Banner (After Pet Hatching / Stage >= 2) */}
      {isHydrated && isPushSupported && !isPushSubscribed && !dismissedPushBanner && stage >= 2 && (
        <section className="rounded-card border-2 border-accent-green/30 bg-gradient-to-r from-accent-green/10 via-surface to-accent-yellow/15 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-navigation bg-accent-green text-text-inverse font-bold shadow-xs">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Aktifkan Notifikasi Pengingat Pet! 🐾🔔
              </h2>
              <p className="text-xs text-text-muted">
                Dapatkan alarm jam makan, peringatan streak jam 10 malam, dan info saat temanmu selesai log makanan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setDismissedPushBanner(true)}
              className="px-3 py-1.5 rounded-navigation border border-border-default hover:bg-surface-subtle text-text-muted text-xs font-semibold transition-colors"
            >
              Nanti Saja
            </button>
            <button
              type="button"
              disabled={isPushLoading}
              onClick={subscribeToPush}
              className="button-primary px-4 py-1.5 text-xs inline-flex items-center gap-1.5 shadow-xs"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>{isPushLoading ? "Mengaktifkan..." : "Aktifkan Web Push"}</span>
            </button>
          </div>
        </section>
      )}

      {/* 2. Co-op Streak Alert Banner (Social Accountability) */}
      <section className="rounded-card border border-border-divider bg-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-navigation bg-accent-orange text-text-inverse font-black shadow-xs">
            <Flame className="h-6 w-6 fill-text-inverse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary font-sans">
                Co-op Streak: {coopStreakDays} Hari Bersama {partyName}
              </h2>
            </div>
            <p className="text-xs text-text-muted">
              {pendingFriends.length > 0
                ? `${pendingFriends.length} teman belum mencatat makanan hari ini. Senggol mereka agar streak tidak putus!`
                : "Semua teman di party sudah mencatat makanan hari ini! Streak kalian aman."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={toggleDrawer}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-navigation border border-border-default bg-surface-subtle hover:bg-accent-green-light text-text-primary text-xs font-semibold transition-colors"
          >
            <Bell className="h-3.5 w-3.5 text-accent-green" />
            <span>Notifikasi {unreadCount > 0 && `(${unreadCount})`}</span>
          </button>

          <Link
            href="/social"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-navigation bg-accent-orange hover:bg-accent-orange-dark text-text-inverse text-xs font-bold transition-transform active:scale-95"
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
          <div className="rounded-card border border-border-divider bg-surface p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-border-divider">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-green" />
                <h2 className="text-sm font-bold tracking-tight text-text-primary font-sans">
                  Ruang Pet Virtual
                </h2>
              </div>
              <Link
                href="/pet-customization/shop"
                className="flex items-center gap-1.5 px-3 py-1 rounded-pill bg-accent-yellow/60 text-text-primary border border-accent-yellow text-xs font-bold hover:bg-accent-green-light transition-colors"
              >
                <Coins className="h-3.5 w-3.5 text-accent-orange" />
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
            <div className="mt-4 pt-4 border-t border-border-divider flex items-center justify-between text-xs">
              <span className="text-text-muted">Kustomisasi Outfit & Aksesoris</span>
              <Link
                href="/pet-customization/wardrobe"
                className="inline-flex items-center gap-1 font-bold text-text-primary hover:underline"
              >
                <span>Buka Wardrobe</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Pet Gamification Rules Card */}
          <div className="review-card p-5 text-xs text-neutral-10 space-y-1.5 border border-accent-green/20">
            <p className="font-bold text-text-primary flex items-center gap-1.5">
              <Award className="h-4 w-4 text-accent-green" />
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
          {/* Dashboard Mini-Calendar Strip */}
          <DashboardCalendarStrip />

          {/* Circular Calorie Tracker & Macros */}
          <MacroBar />

          {/* Quick Action Button: + Catat Makanan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              onClick={() => setQuickLogModalOpen(true)}
              className="button-primary flex items-center justify-center gap-2 px-5 py-3.5 text-sm"
            >
              <PlusCircle className="h-5 w-5" />
              <span>+ Quick Catat Makanan</span>
            </button>

            <Link
              href="/diary/add"
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-button border border-border-default bg-surface hover:bg-accent-green-light text-text-primary font-bold text-sm transition-colors"
            >
              <Sparkles className="h-4 w-4 text-accent-green" />
              <span>Cari Katalog & Evaluasi Gizi</span>
            </Link>
          </div>

          {/* Meal Breakdown Quick List */}
          <div className="rounded-card border border-border-divider bg-surface p-6 space-y-3.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-divider">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-text-primary">
                  {isSelectedToday
                    ? "Catatan Waktu Makan Hari Ini"
                    : `Catatan Waktu Makan (${formatDateDisplay(selectedDate, "short")})`}
                </h3>
                {isHydrated && (
                  <span
                    className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold text-white shadow-2xs"
                    style={{ backgroundColor: depkesEval.colorHex }}
                  >
                    {depkesEval.badgeText}
                  </span>
                )}
                {!isSelectedToday && (
                  <button
                    onClick={() => setSelectedDate(getTodayKey())}
                    className="text-[11px] font-bold text-accent-orange-dark hover:underline bg-accent-yellow/50 px-2 py-0.5 rounded-pill"
                  >
                    Kembali ke Hari Ini
                  </button>
                )}
              </div>
              <Link
                href="/diary"
                className="text-xs font-bold text-text-primary hover:underline"
              >
                Buka Food Diary Lengkap &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {!isHydrated
                ? MEAL_TYPES.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-3.5 rounded-button border border-border-divider bg-surface-subtle flex flex-col justify-between h-[88px]"
                    >
                      <div className="space-y-1">
                        <div className="h-3.5 w-16 bg-surface animate-pulse rounded-navigation" />
                        <div className="h-2.5 w-20 bg-surface animate-pulse rounded-navigation" />
                      </div>
                      <div className="h-4 w-12 bg-surface animate-pulse rounded-navigation mt-2" />
                    </div>
                  ))
                : MEAL_TYPES.map((meal) => {
                    const logs = getMealLogs(meal.id);
                    const mealCalories = logs.reduce((sum, item) => sum + item.calories, 0);

                    return (
                      <Link
                        key={meal.id}
                        href={`/diary?meal=${meal.id}`}
                        className="p-3.5 rounded-button border border-border-divider bg-surface-subtle hover:bg-accent-green-light/35 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {meal.label}
                          </p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {logs.length > 0 ? `${logs.length} item` : "Belum dicatat"}
                          </p>
                        </div>
                        <p className="text-sm font-extrabold text-text-primary mt-2">
                          {mealCalories}{" "}
                          <span className="text-[10px] text-text-muted font-normal">
                            kcal
                          </span>
                        </p>
                      </Link>
                    );
                  })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. RPG Quest & Mission Board Widget */}
      <QuestBoard />

      {/* Quick Action Modal: Fast Log Food */}
      {quickLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-border-divider bg-surface p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border-divider">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-accent-green" />
                <span>Quick Catat Makanan</span>
              </h3>
              <button
                onClick={() => setQuickLogModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-navigation hover:bg-accent-green-light/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meal Type Radio Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted">
                Pilih Waktu Makan:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MEAL_TYPES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedQuickMeal(m.id)}
                    className={`nav-item py-1.5 px-1 text-xs font-semibold border text-center transition-colors ${
                      selectedQuickMeal === m.id
                        ? "is-selected border-accent-orange font-bold"
                        : "bg-surface-subtle text-neutral-10 border-border-default"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Source Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border-divider pb-2 text-[11px]">
              <button
                type="button"
                onClick={() => setQuickFilter("popular")}
                className={`px-2.5 py-1 rounded-pill font-bold border transition-colors ${
                  quickFilter === "popular"
                    ? "bg-accent-green text-text-inverse border-accent-green"
                    : "bg-surface text-text-muted border-border-default hover:text-text-primary"
                }`}
              >
                Menu Populer
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter("recent")}
                className={`px-2.5 py-1 rounded-pill font-bold border transition-colors ${
                  quickFilter === "recent"
                    ? "bg-accent-green text-text-inverse border-accent-green"
                    : "bg-surface text-text-muted border-border-default hover:text-text-primary"
                }`}
              >
                Baru Dimakan
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter("frequent")}
                className={`px-2.5 py-1 rounded-pill font-bold border transition-colors ${
                  quickFilter === "frequent"
                    ? "bg-accent-green text-text-inverse border-accent-green"
                    : "bg-surface text-text-muted border-border-default hover:text-text-primary"
                }`}
              >
                Paling Sering
              </button>
            </div>

            {/* Quick Multi-Select List */}
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {(quickFilter === "recent"
                ? getRecentFoods()
                : quickFilter === "frequent"
                ? getFrequentFoods()
                : FOOD_CATALOG.slice(0, 8)
              ).map((food) => {
                const isChecked = selectedQuickItems.some((i) => i.id === food.id);
                return (
                  <div
                    key={food.id}
                    onClick={() => toggleQuickItem(food)}
                    className={`p-2.5 rounded-input border transition-colors flex items-center justify-between cursor-pointer ${
                      isChecked
                        ? "bg-accent-yellow/30 border-accent-orange font-bold"
                        : "border-border-divider bg-surface-subtle hover:bg-accent-green-light/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="h-3.5 w-3.5 rounded accent-accent-green cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground">{food.name}</p>
                        <p className="text-[10px] text-text-muted">
                          {food.defaultServingSize} {food.servingUnit} • P: {food.proteinG}g
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-text-primary">
                        +{food.calories} kcal
                      </span>
                      <button
                        type="button"
                        title="Catat langsung 1 item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(food);
                        }}
                        className="px-2 py-0.5 rounded-pill bg-accent-green/15 text-text-primary text-[10px] font-bold hover:bg-accent-green hover:text-text-inverse transition-colors"
                      >
                        + 1-Klik
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            {selectedQuickItems.length > 0 && (
              <button
                type="button"
                onClick={handleBatchQuickSave}
                className="button-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 font-black shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>
                  Tambahkan Dipilih ({selectedQuickItems.length} Menu) & Kasih Makan Pet
                </span>
              </button>
            )}

            <div className="pt-1 flex items-center justify-between text-xs">
              <Link
                href="/diary/add"
                onClick={() => setQuickLogModalOpen(false)}
                className="font-bold text-text-primary hover:underline"
              >
                Cari di Katalog Lengkap &rarr;
              </Link>
              <button
                onClick={() => {
                  setSelectedQuickItems([]);
                  setQuickLogModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-button border border-border-default hover:bg-accent-green-light text-text-primary font-bold"
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
