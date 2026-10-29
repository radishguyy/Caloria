"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Target,
  Sparkles,
  Award,
  Bell,
  Coins,
  X,
  Utensils,
  Sun,
  AlertCircle,
  Users,
  ArrowRight,
  Flame,
} from "lucide-react";
import { PetRenderer } from "@/components/pet/pet-renderer";
import { MacroBar } from "@/components/diary/macro-bar";
import { DashboardCalendarStrip } from "@/components/dashboard/DashboardCalendarStrip";
import { QuestWidget } from "@/components/shared/QuestWidget";
import { useFoodStore } from "@/store/use-food-store";
import { usePetStore } from "@/store/use-pet-store";
import { useSocialStore } from "@/stores/social-store";
import { useNotificationStore } from "@/store/use-notification-store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { FOOD_CATALOG } from "@/lib/food-catalog";
import { MEAL_TYPES, MealTypeId } from "@/lib/constants";
import { isToday, formatDateDisplay, getTodayKey } from "@/lib/date-utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReminderStackStore } from "@/store/use-reminder-stack-store";
import { batchLogFoodsAction } from "@/app/actions/diary";
import { cn } from "@/lib/utils";

const PUSH_REMINDER_DISMISS_KEY = "caloria-dismissed-push-reminder";
const COOP_REMINDER_DISMISS_KEY = "caloria-dismissed-coop-reminder";
const INAPP_NOTIF_DISMISS_KEY = "caloria-dismissed-inapp-notif";

function isReminderDismissed(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "dismissed";
  } catch {
    return false;
  }
}

function dismissReminder(key: string) {
  try {
    sessionStorage.setItem(key, "dismissed");
  } catch {}
}

export default function DashboardPage() {
  const isHydrated = useHydrated();
  const {
    selectedDate,
    setSelectedDate,
    getMealLogs,
    addLog,
    addBatchLogs,
    getRecentFoods,
    getFrequentFoods,
  } = useFoodStore();
  const { name, feedPet } = usePetStore();
  const { coopStreakDays, partyName, friends } = useSocialStore();
  const { toggleDrawer, getUnreadCount, notifications, markAsRead } =
    useNotificationStore();
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    permission: pushPermission,
    isLoading: isPushLoading,
    subscribeToPush,
  } = usePushNotifications();

  const [quickLogModalOpen, setQuickLogModalOpen] = useState(false);
  const [selectedQuickMeal, setSelectedQuickMeal] =
    useState<MealTypeId>("breakfast");

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 11 && hours < 15) setSelectedQuickMeal("lunch");
    else if (hours >= 15 && hours < 18) setSelectedQuickMeal("snack");
    else if (hours >= 18 || hours < 5) setSelectedQuickMeal("dinner");
    else setSelectedQuickMeal("breakfast");
  }, []);

  const [quickFilter, setQuickFilter] = useState<
    "popular" | "recent" | "frequent"
  >("popular");
  const [selectedQuickItems, setSelectedQuickItems] = useState<
    (typeof FOOD_CATALOG)[0][]
  >([]);

  const unreadCount = getUnreadCount();

  const isDesktop = useMediaQuery("(min-width: 640px)");
  const reminderStackRef = useRef<HTMLDivElement | null>(null);

  // Clear legacy localStorage suppression so hard refresh doesn't lock out cards
  useEffect(() => {
    try {
      localStorage.removeItem(PUSH_REMINDER_DISMISS_KEY);
      localStorage.removeItem(COOP_REMINDER_DISMISS_KEY);
    } catch {}
  }, []);

  const [dismissedPushReminder, setDismissedPushReminder] = useState(() =>
    isReminderDismissed(PUSH_REMINDER_DISMISS_KEY),
  );
  const [dismissedCoopReminder, setDismissedCoopReminder] = useState(() =>
    isReminderDismissed(COOP_REMINDER_DISMISS_KEY),
  );
  const [dismissedInAppNotif, setDismissedInAppNotif] = useState(() =>
    isReminderDismissed(INAPP_NOTIF_DISMISS_KEY),
  );

  const isSelectedToday = isHydrated ? isToday(selectedDate) : true;

  const getPetDialogMessages = () => {
    const messages = [
      "Aku lapar!",
      "Sepertinya aku kebanyakan lemak nih.",
      "Yuk, kasih aku makan!",
      "Aku belum berapa lapar...",
      "Mmm, menarik! Aku ikut makan.",
      "Hari ini aku mau makan sayur ya.",
      "Kamu sudah makan enak nih, aku ikut!",
      "Aku mulai merasa lapar, kasih camilan?",
      "Kasihan, Aku mau makan protein, Yuhu!",
      "Aww, kasih aku makanan dan kasih aku ciuman.",
      "Aku terlalu kurus, kasih aku makam malam.",
      "Ini aku lagi latihan, kasih aku protein ya!",
      "Sepertinya aku butuh sedikit makanan, pet!",
      "Yuk ikutan makan siang bareng kamu!",
      "Aku belum pernah mencoba ayam panggang, kasih aku!",
      "Wah, aku jadi lapar, kasih aku nasi!",
      "Jadi, kamu sudah makan, bareng sama aku?",
      "Yuk makan pempek bareng!",
      "Beri aku ayam goreng, umph!",
      "Jangan lupa kasih aku telur!",
      "Ayo pergi cari salad!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const activeFriends = friends || [];
  const pendingFriends = activeFriends.filter((f) => !f.dailyGoalMet);
  const unreadNotifications = (notifications || []).filter((n) => !n.isRead);
  const activeInAppNotif = unreadNotifications[0];

  const showInAppNotification =
    isHydrated && Boolean(activeInAppNotif) && !dismissedInAppNotif;

  const showPushReminder =
    isHydrated &&
    isPushSupported &&
    !isPushSubscribed &&
    pushPermission !== "denied" &&
    !dismissedPushReminder;

  const showCoopReminder =
    isHydrated &&
    coopStreakDays > 0 &&
    pendingFriends.length > 0 &&
    !dismissedCoopReminder;

  const closePushReminder = () => {
    setDismissedPushReminder(true);
    dismissReminder(PUSH_REMINDER_DISMISS_KEY);
  };

  const closeCoopReminder = () => {
    setDismissedCoopReminder(true);
    dismissReminder(COOP_REMINDER_DISMISS_KEY);
  };

  const closeInAppNotification = () => {
    setDismissedInAppNotif(true);
    dismissReminder(INAPP_NOTIF_DISMISS_KEY);
    if (activeInAppNotif) {
      markAsRead(activeInAppNotif.id);
    }
  };

  // Publish the desktop reminder stack height so the global toaster can sit above it.
  useEffect(() => {
    const element = reminderStackRef.current;
    const setDesktopHeight = useReminderStackStore.getState().setDesktopHeight;

    if (!isDesktop || !element) {
      setDesktopHeight(0);
      return;
    }

    const observer = new ResizeObserver(() =>
      setDesktopHeight(element.offsetHeight),
    );
    observer.observe(element);
    setDesktopHeight(element.offsetHeight);

    return () => {
      observer.disconnect();
      setDesktopHeight(0);
    };
  }, [isDesktop, showInAppNotification, showPushReminder, showCoopReminder]);

  useEffect(() => {
    if (!showInAppNotification && !showPushReminder && !showCoopReminder)
      return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showInAppNotification) closeInAppNotification();
      else if (showPushReminder) closePushReminder();
      else closeCoopReminder();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showInAppNotification, showPushReminder, showCoopReminder]);

  const isPokeNotif = activeInAppNotif?.type === "poke";

  const inAppNotificationCard = activeInAppNotif && (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-2xl border bg-surface p-4 shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300",
        isPokeNotif ? "border-accent-orange/30" : "border-accent-green/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
              isPokeNotif
                ? "bg-accent-orange/15 text-accent-orange-dark"
                : "bg-accent-green/15 text-accent-green",
            )}
          >
            {isPokeNotif ? (
              <Users className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Bell className="h-4 w-4" aria-hidden="true" />
            )}
          </div>
          <h4 className="text-sm font-bold text-text-primary">
            {activeInAppNotif.title}
          </h4>
        </div>
        <button
          type="button"
          onClick={closeInAppNotification}
          aria-label="Tutup notifikasi"
          className="-mr-1 -mt-1 shrink-0 rounded-xl p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-2 pl-10 text-xs leading-relaxed text-text-muted">
        {activeInAppNotif.message}
      </p>

      <div className="mt-3 flex gap-2">
        <Link
          href={
            isPokeNotif ? "/social" : activeInAppNotif.actionUrl || "/social"
          }
          onClick={closeInAppNotification}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-center text-xs font-bold text-text-inverse transition-opacity hover:opacity-90",
            isPokeNotif ? "bg-accent-orange" : "bg-accent-green",
          )}
        >
          {isPokeNotif ? "Senggol di Social" : "Lihat Detail"}
        </Link>
        <button
          type="button"
          onClick={closeInAppNotification}
          className="rounded-xl border border-border-default px-3 py-2 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light"
        >
          Tutup
        </button>
      </div>
    </div>
  );

  const pushReminderCard = (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-accent-green/30 bg-surface p-4 shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-green/15 text-accent-green">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-bold text-text-primary">
            Supaya kamu ingat {name}
          </h4>
        </div>
        <button
          type="button"
          onClick={closePushReminder}
          aria-label="Tutup pengingat notifikasi"
          className="-mr-1 -mt-1 shrink-0 rounded-xl p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-2 pl-10 text-xs leading-relaxed text-text-muted">
        Aktifkan notifikasi supaya pengingat waktu makan dan streak co-op sampai
        ke perangkatmu.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            void subscribeToPush();
            closePushReminder();
          }}
          disabled={isPushLoading}
          className="flex-1 rounded-xl bg-accent-green px-3 py-2 text-xs font-bold text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPushLoading ? "Memproses..." : "Aktifkan Notifikasi"}
        </button>
        <button
          type="button"
          onClick={closePushReminder}
          className="rounded-xl border border-border-default px-3 py-2 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light"
        >
          Nanti
        </button>
      </div>
    </div>
  );

  const coopReminderCard = (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-accent-orange/30 bg-surface p-4 shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-orange/15 text-accent-orange-dark">
            <Users className="h-4 w-4" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-bold text-text-primary">
            Pengingat Senggolan Teman âš”ï¸
          </h4>
        </div>
        <button
          type="button"
          onClick={closeCoopReminder}
          aria-label="Tutup pengingat senggolan"
          className="-mr-1 -mt-1 shrink-0 rounded-xl p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-2 pl-10 text-xs leading-relaxed text-text-muted">
        {pendingFriends.length} teman co-op{partyName ? ` ${partyName}` : ""}{" "}
        belum mencatat makan hari ini. Senggol mereka di halaman Social biar
        streak party tetap aman!
      </p>

      <div className="mt-3 flex gap-2">
        <Link
          href="/social"
          onClick={closeCoopReminder}
          className="flex-1 rounded-xl bg-accent-orange px-3 py-2 text-center text-xs font-bold text-text-inverse transition-opacity hover:opacity-90"
        >
          Senggol di Social
        </Link>
        <button
          type="button"
          onClick={closeCoopReminder}
          className="rounded-xl border border-border-default px-3 py-2 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light"
        >
          Nanti
        </button>
      </div>
    </div>
  );

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
    const totalCal = selectedQuickItems.reduce(
      (sum, item) => sum + item.calories,
      0,
    );

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
    feedPet(totalCal, feedback.xpEarned);

    batchLogFoodsAction(
      logsToSave.map((l) => ({
        name: l.name,
        mealType: l.mealType,
        servingSize: l.servingSize,
        servingUnit: l.servingUnit,
        calories: l.calories,
        proteinG: l.proteinG,
        carbsG: l.carbsG,
        fatG: l.fatG,
        fiberG: l.fiberG,
        sugarG: l.sugarG,
      })),
      todayStr
    ).catch((err) =>
      console.error("[Dashboard] Batch quick log sync error:", err)
    );

    setSelectedQuickItems([]);
    setQuickLogModalOpen(false);
  };

  const handleQuickAdd = (foodItem: (typeof FOOD_CATALOG)[0]) => {
    const todayStr = new Date().toISOString().split("T")[0];
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
      loggedDate: todayStr,
    });

    feedPet(foodItem.calories, feedback.xpEarned);

    batchLogFoodsAction(
      [
        {
          name: foodItem.name,
          mealType: selectedQuickMeal,
          servingSize: 1,
          servingUnit: foodItem.servingUnit,
          calories: foodItem.calories,
          proteinG: foodItem.proteinG,
          carbsG: foodItem.carbsG,
          fatG: foodItem.fatG,
          fiberG: foodItem.fiberG,
          sugarG: foodItem.sugarG,
        },
      ],
      todayStr
    ).catch((err) =>
      console.error("[Dashboard] Quick add sync error:", err)
    );

    setSelectedQuickItems([]);
    setQuickLogModalOpen(false);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* Floating reminders: stacked bottom-right on desktop, one at a time centered on mobile */}
      {(showInAppNotification || showPushReminder || showCoopReminder) && (
        <div
          ref={reminderStackRef}
          className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-2.5 p-4 sm:inset-auto sm:bottom-4 sm:right-4 sm:items-end sm:justify-end sm:p-0"
        >
          {isDesktop ? (
            <>
              {showInAppNotification && inAppNotificationCard}
              {showPushReminder && pushReminderCard}
              {showCoopReminder && coopReminderCard}
            </>
          ) : showInAppNotification ? (
            inAppNotificationCard
          ) : showPushReminder ? (
            pushReminderCard
          ) : showCoopReminder ? (
            coopReminderCard
          ) : null}
        </div>
      )}

      {/* CalPal (Virtual Pet) + Daily Nutrition Target Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: CalPal Container */}
        <div className="lg:col-span-6 rounded-card border border-border-divider bg-surface p-6 shadow-xs space-y-4">
          <PetRenderer
            interactive={true}
            size="md"
            dialogMessage={isHydrated ? getPetDialogMessages() : null}
            statusIndicators={true}
          />
        </div>

        {/* Right Column: Daily Nutrition Target + Catat Makanan */}
        <div className="lg:col-span-6 flex flex-col gap-3">
            <MacroBar />
            {/* 2. Unified Nutrition Summary & Calendar Strip */}
          <DashboardCalendarStrip />
          <button
            type="button"
            onClick={() => setQuickLogModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-card border border-border-divider bg-surface py-3.5 text-sm font-bold text-text-primary shadow-xs transition-colors hover:bg-accent-green-light hover:border-accent-green hover:text-accent-green-dark active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Catat Makanan
          </button>
        </div>
      </div>





      {/* Quick Action Modal: Fast Log Food */}
      {quickLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-modal border border-border-divider bg-surface p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-divider pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-accent-orange" />
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  Catat Makanan Cepat
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedQuickItems([]);
                  setQuickLogModalOpen(false);
                }}
                className="rounded-full p-1 text-text-muted hover:bg-surface-subtle hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {(quickFilter === "recent"
                ? getRecentFoods()
                : quickFilter === "frequent"
                  ? getFrequentFoods()
                  : FOOD_CATALOG
              ).map((food) => {
                const isChecked = selectedQuickItems.some(
                  (i) => i.id === food.id,
                );
                return (
                  <div
                    key={food.id}
                    onClick={() => toggleQuickItem(food)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-navigation border transition-colors cursor-pointer ${
                      isChecked
                        ? "border-accent-orange bg-accent-orange/10"
                        : "border-border-default bg-surface-subtle hover:border-accent-green/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-navigation bg-surface-subtle">
                        <Utensils className="h-4 w-4 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {food.name}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {food.calories} kcal â€¢ {food.proteinG}g P â€¢{" "}
                          {food.carbsG}g C â€¢ {food.fatG}g F
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-text-primary">
                        {food.calories}{" "}
                        <span className="text-[10px] text-text-muted">
                          kcal
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(food);
                        }}
                        className="rounded-lg bg-surface px-2 py-1 text-[11px] font-bold text-accent-green hover:bg-accent-green-light border border-border-default"
                      >
                        + 1-Klik
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedQuickItems.length > 0 && (
              <button
                type="button"
                onClick={handleBatchQuickSave}
                className="button-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 font-black shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>
                  Tambahkan Dipilih ({selectedQuickItems.length} Menu) & Kasih
                  Makan Pet
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

      {/* 4. RPG Quest & Mission Board Summary Widget */}
      <QuestWidget />
    </div>
  );
}
