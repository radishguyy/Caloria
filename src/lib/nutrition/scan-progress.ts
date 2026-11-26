import type { ScanStage } from "@/lib/nutrition/scan-client";
import type { ScanMode } from "@/lib/schemas/nutrition-scan";

export type ScanStepStatus = "done" | "active" | "pending";

export interface ScanStepItem {
  id: ScanStage;
  label: string;
  status: ScanStepStatus;
}

export interface ScanWaitState {
  activeStepIndex: number;
  headline: string;
  detail: string;
  progressPercent: number;
  elapsedLabel: string;
  steps: ScanStepItem[];
}

export const SCAN_PROGRESS_STEPS: ReadonlyArray<{ id: ScanStage; label: string }> = [
  { id: "compressing", label: "Memfokuskan area bingkai label" },
  { id: "scanning", label: "Membaca tabel Informasi Nilai Gizi" },
  { id: "analyzing", label: "Menghitung skor gizi & saran Calpal" },
];

export const FOOD_SCAN_PROGRESS_STEPS: ReadonlyArray<{ id: ScanStage; label: string }> = [
  { id: "compressing", label: "Menyiapkan foto piring & hidangan" },
  { id: "scanning", label: "Mengenali menu & komponen makanan" },
  { id: "analyzing", label: "Menghitung estimasi gizi & saran Calpal" },
];

function resolveScanningDetail(elapsedMs: number, mode: ScanMode): string {
  if (mode === "food") {
    if (elapsedMs < 2500) {
      return "Mengenali jenis hidangan dan komponen lauk yang terlihat...";
    }
    if (elapsedMs < 6000) {
      return "Memperkirakan porsi, kalori, protein, karbo, lemak, dan bahan tersembunyi...";
    }
    return "Hampir selesai (maks. 10 detik). Merapikan estimasi gizi makanan...";
  }

  if (elapsedMs < 2500) {
    return "Mengenali takaran saji dan kolom tabel gizi...";
  }
  if (elapsedMs < 6000) {
    return "Membaca angka kalori, protein, karbohidrat, lemak, dan gula...";
  }
  return "Hampir selesai (maks. 10 detik). Memastikan angka sesuai foto...";
}

/**
 * Computes progressive multi-step status, reassuring phase copy, and
 * non-saturating progress percentage while the Vision API parses a label or meal.
 */
export function getScanWaitState(
  stage: ScanStage,
  elapsedMs: number,
  mode: ScanMode = "label"
): ScanWaitState {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const elapsedLabel = `${Math.floor(safeElapsed / 1000)} dtk`;
  const stepDefs = mode === "food" ? FOOD_SCAN_PROGRESS_STEPS : SCAN_PROGRESS_STEPS;
  const idx = stepDefs.findIndex((step) => step.id === stage);
  const activeStepIndex = idx >= 0 ? idx : 0;

  const steps: ScanStepItem[] = stepDefs.map((step, index) => ({
    id: step.id,
    label: step.label,
    status:
      index < activeStepIndex
        ? "done"
        : index === activeStepIndex
        ? "active"
        : "pending",
  }));

  if (stage === "compressing") {
    return {
      activeStepIndex,
      headline: mode === "food" ? "Menyiapkan Foto Makanan" : "Menyiapkan Foto Label",
      detail:
        mode === "food"
          ? "Menjaga kejelasan piring, lauk, dan proporsi porsi makanan..."
          : "Memotong area bingkai dan menjaga ketajaman angka tabel...",
      progressPercent: 22,
      elapsedLabel,
      steps,
    };
  }

  if (stage === "analyzing") {
    return {
      activeStepIndex,
      headline: mode === "food" ? "Menyusun Estimasi Gizi" : "Menilai Kandungan Gizi",
      detail:
        mode === "food"
          ? "Menyesuaikan estimasi porsi makanan dengan sisa kalori harianmu..."
          : "Menyesuaikan hasil ekstraksi dengan target kalori harianmu...",
      progressPercent: 96,
      elapsedLabel,
      steps,
    };
  }

  const progressPercent = Math.min(
    86,
    Math.round(36 + 50 * (1 - Math.exp(-safeElapsed / 4500)))
  );

  return {
    activeStepIndex,
    headline:
      mode === "food"
        ? "Menganalisis Makanan dengan AI"
        : "Membaca Tabel Gizi dengan AI",
    detail: resolveScanningDetail(safeElapsed, mode),
    progressPercent,
    elapsedLabel,
    steps,
  };
}
