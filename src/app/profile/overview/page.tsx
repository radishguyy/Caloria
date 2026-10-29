"use client";

import { useState } from "react";
import { Dumbbell, Scale, X } from "lucide-react";
import { useFoodStore } from "@/store/use-food-store";
import { useWeightStore } from "@/store/use-weight-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { calculateBmi } from "@/lib/nutrition-calculator";
import { WeightChart } from "@/components/profile/weight-chart";
import { ProfileHeader } from "@/components/profile/profile-header";
import {
  BmiCategory,
  formatLogDate,
  formatWeightValue,
  getProfileOverview,
  getWeekNumber,
} from "@/lib/dummy/profile-overview";
import { cn } from "@/lib/utils";

const BMI_BADGE_CLASSES: Record<BmiCategory, string> = {
  Underweight: "bg-macro-protein/15 text-macro-protein",
  Normal: "bg-accent-green/15 text-text-primary",
  Overweight: "bg-accent-yellow/60 text-neutral-10",
  "Obese I": "bg-accent-orange/15 text-accent-orange-dark",
  "Obese II": "bg-macro-fat/15 text-macro-fat",
};

export default function ProfileOverviewPage() {
  const isHydrated = useHydrated();
  const { goalPlan, setGoalPlan } = useFoodStore();
  const { addWeightLog, getLatestWeight } = useWeightStore();
  const { user } = useAuthStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState<number>(getLatestWeight());
  const [newNotes, setNewNotes] = useState("");

  const overview = isHydrated ? getProfileOverview() : null;

  const latestWeight = getLatestWeight();
  const currentBmi = calculateBmi(goalPlan.heightCm, latestWeight);

  const displayName = isHydrated
    ? user?.username?.trim() ||
      user?.fullName?.trim() ||
      user?.email?.split("@")[0] ||
      "Pengguna"
    : "Pengguna";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const avatarUrl = isHydrated ? user?.avatarUrl : undefined;

  const weightDiff = overview
    ? Math.round((overview.currentWeightKg - overview.targetWeightKg) * 10) / 10
    : 0;
  const diffLabel = overview
    ? Math.abs(weightDiff) <= 0.1
      ? "Target tercapai"
      : `${weightDiff > 0 ? "+" : "\u2212"}${Math.abs(weightDiff).toFixed(1)} kg dari tujuan`
    : "";
  const progressPercent = overview
    ? Math.min(100, Math.max(0, (overview.currentDay / Math.max(overview.totalProgramDays, 1)) * 100))
    : 0;

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || newWeight <= 0) return;

    addWeightLog(newWeight, newNotes);

    setGoalPlan({
      currentWeightKg: newWeight,
      bmiScore: currentBmi.score,
      bmiCategory: currentBmi.category,
    });

    setModalOpen(false);
    setNewNotes("");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      <ProfileHeader title="Progres & Riwayat Berat Badan" />

      {/* Profile identity */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`Foto profil ${displayName}`}
            className="h-[72px] w-[72px] shrink-0 rounded-2xl border border-border-divider object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border border-border-divider bg-accent-green/15 text-2xl font-extrabold text-text-primary"
          >
            {avatarInitial}
          </div>
        )}
        <p
          className="min-w-0 truncate text-2xl font-extrabold tracking-tight text-text-primary font-heading sm:text-3xl"
          suppressHydrationWarning
        >
          {displayName}
        </p>
      </div>

      {/* Progress summary */}
      {overview ? (
        <section className="space-y-4 rounded-2xl border border-border-divider bg-surface p-5 shadow-xs sm:p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              {overview.currentDay} / {overview.totalProgramDays} hari menuju target misi
            </p>
            <div
              role="progressbar"
              aria-label="Progres hari program"
              aria-valuemin={1}
              aria-valuemax={overview.totalProgramDays}
              aria-valuenow={overview.currentDay}
              className="h-3 w-full overflow-hidden rounded-md bg-border-divider"
            >
              <div
                className="h-full rounded-md bg-accent-green"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4 border-t border-border-divider pt-4 lg:grid-cols-[1fr_1fr_auto]">
            <div className="min-w-0 lg:pr-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                BMI
              </p>
              <p
                className="font-heading font-extrabold leading-none text-text-primary"
                style={{ fontSize: "clamp(2.75rem, 9vw, 4.5rem)" }}
              >
                {overview.bmiScore.toFixed(1)}
              </p>
              <span
                className={cn(
                  "mt-2 inline-block rounded-xl px-2.5 py-1 text-xs font-bold",
                  BMI_BADGE_CLASSES[overview.bmiCategory]
                )}
              >
                {overview.bmiCategory}
              </span>
            </div>

            <div className="min-w-0 border-border-divider pl-0 lg:border-l lg:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Berat Badan
              </p>
              <p
                className="font-heading font-extrabold leading-none text-text-primary"
                style={{ fontSize: "clamp(2.75rem, 9vw, 4.5rem)" }}
              >
                {formatWeightValue(overview.currentWeightKg)}
                <span className="ml-0.5 align-baseline text-sm font-bold text-text-muted sm:ml-1 sm:text-lg">
                  kg
                </span>
              </p>
              <p className="mt-2 text-xs font-semibold text-text-muted">{diffLabel}</p>
            </div>

            <div className="col-span-2 flex justify-center border-t border-border-divider pt-3 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <button
                type="button"
                onClick={() => {
                  setNewWeight(latestWeight);
                  setModalOpen(true);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-green px-4 py-2.5 text-xs font-bold text-text-inverse transition-colors hover:bg-accent-green/90 lg:h-[4.5rem] lg:w-auto lg:px-7 lg:text-sm"
              >
                <Dumbbell className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Perbarui Berat Badan</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div
          aria-hidden="true"
          className="h-44 animate-pulse rounded-2xl border border-border-divider bg-surface-subtle"
        />
      )}

      {/* Chart + history */}
      {overview ? (
        <section className="rounded-2xl border border-border-divider bg-surface p-5 shadow-xs sm:p-6">
          <div className="grid gap-5 lg:grid-cols-3 lg:gap-0">
            <div className="lg:col-span-2 lg:pr-6">
              <h2 className="text-sm font-bold text-text-primary">Grafik Berat Badan</h2>
              <div className="mt-3">
                <WeightChart
                  logs={overview.logs}
                  targetWeightKg={overview.targetWeightKg}
                  programStartDate={overview.programStartDate}
                />
              </div>
            </div>

            <div className="lg:border-l lg:border-border-divider lg:pl-6">
              <h2 className="text-sm font-bold text-text-primary">Riwayat Timbangan</h2>
              <div className="mt-3 h-[220px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                {overview.logs.length === 0 ? (
                  <p className="text-xs text-text-muted">Belum ada riwayat timbangan.</p>
                ) : (
                  <ul className="divide-y divide-border-divider/60">
                    {[...overview.logs].reverse().map((log) => (
                      <li
                        key={log.id}
                        className="whitespace-nowrap py-2 text-[11px] font-medium text-neutral-10"
                      >
                        Minggu {getWeekNumber(overview.programStartDate, log.date)} -{" "}
                        {formatWeightValue(log.weightKg)} kg - {formatLogDate(log.date)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div
          aria-hidden="true"
          className="h-80 animate-pulse rounded-2xl border border-border-divider bg-surface-subtle"
        />
      )}

      {/* [Modal] Update Berat Badan Berkala */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border-divider bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border-divider">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-accent-green" />
                <h3 className="text-base font-bold text-text-primary">
                  Update Berat Badan
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Tutup"
                className="rounded-xl p-1 text-text-muted hover:bg-surface-subtle hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWeight} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-text-muted">
                  Berat Badan Terkini (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                  required
                  className="input-field mt-1 w-full px-4 py-2.5 text-base font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Setelah olahraga pagi, perut kosong"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="input-field mt-1 w-full px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border-default bg-surface py-2.5 text-xs font-bold text-neutral-10 hover:bg-surface-subtle"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-accent-green py-2.5 text-xs font-bold text-text-inverse transition-colors hover:bg-accent-green/90"
                >
                  Simpan Timbangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
