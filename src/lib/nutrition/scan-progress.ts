import type { ScanStage } from "@/lib/nutrition/scan-client";

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

function resolveScanningDetail(elapsedMs: number): string {
  if (elapsedMs < 3000) {
    return "Mengenali judul produk, takaran saji, dan baris tabel gizi...";
  }
  if (elapsedMs < 7000) {
    return "Mengekstrak kalori, protein, karbohidrat, lemak, gula, dan natrium...";
  }
  return "Sedikit lagi selesai. Memverifikasi angka agar sesuai teks asli foto...";
}

/**
 * Computes progressive multi-step status, reassuring phase copy, and
 * non-saturating progress percentage while the Vision API parses a label.
 */
export function getScanWaitState(
  stage: ScanStage,
  elapsedMs: number
): ScanWaitState {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const elapsedLabel = `${Math.floor(safeElapsed / 1000)} dtk`;
  const idx = SCAN_PROGRESS_STEPS.findIndex((step) => step.id === stage);
  const activeStepIndex = idx >= 0 ? idx : 0;

  const steps: ScanStepItem[] = SCAN_PROGRESS_STEPS.map((step, index) => ({
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
      headline: "Menyiapkan Foto Label",
      detail: "Memotong area bingkai dan menjaga ketajaman angka tabel...",
      progressPercent: 22,
      elapsedLabel,
      steps,
    };
  }

  if (stage === "analyzing") {
    return {
      activeStepIndex,
      headline: "Menilai Kandungan Gizi",
      detail: "Menyesuaikan hasil ekstraksi dengan target kalori harianmu...",
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
    headline: "Membaca Tabel Gizi dengan AI",
    detail: resolveScanningDetail(safeElapsed),
    progressPercent,
    elapsedLabel,
    steps,
  };
}
