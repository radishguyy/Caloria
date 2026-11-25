"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Flashlight,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScanLine,
  X,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { ScanInfoTooltip } from "@/components/diary/ScanInfoTooltip";
import { ScanWaitingCard } from "@/components/diary/ScanWaitingCard";
import { usePetStore } from "@/store/use-pet-store";
import type { NutritionLabelData } from "@/lib/schemas/nutrition-scan";
import {
  compressImageFile,
  computeReticleCropRect,
  defaultScanClient,
  fitWithinMaxDimension,
  type ScanStage,
} from "@/lib/nutrition/scan-client";
import { cn } from "@/lib/utils";

export interface ArScannerOverlayProps {
  isOpen: boolean;
  mealTime: "breakfast" | "lunch" | "dinner" | "snack";
  onClose: () => void;
  onScanComplete: (data: NutritionLabelData, previewUrl: string) => void;
}

const MEAL_LABELS: Record<ArScannerOverlayProps["mealTime"], string> = {
  breakfast: "Sarapan",
  lunch: "Makan Siang",
  dinner: "Makan Malam",
  snack: "Camilan",
};

export function ArScannerOverlay(props: ArScannerOverlayProps) {
  if (!props.isOpen) return null;
  return <ArScannerOverlayBody {...props} />;
}

function ArScannerOverlayBody({
  mealTime,
  onClose,
  onScanComplete,
}: ArScannerOverlayProps) {
  const {
    species,
    name: petName,
    customColors,
    earsVariant,
    tailVariant,
    faceVariant,
  } = usePetStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reticleRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const ownedPreviewUrlRef = useRef<string | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [cameraRetryTick, setCameraRetryTick] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<
    "initializing" | "ready" | "fallback"
  >("initializing");
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const [processingStage, setProcessingStage] = useState<ScanStage | null>(
    null,
  );
  const [frozenPreviewUrl, setFrozenPreviewUrl] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const stopCameraTracks = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const clearOwnedPreview = useCallback(() => {
    if (ownedPreviewUrlRef.current) {
      URL.revokeObjectURL(ownedPreviewUrlRef.current);
      ownedPreviewUrlRef.current = null;
    }
    setFrozenPreviewUrl(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initCamera = async () => {
      stopCameraTracks();

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        if (!cancelled) {
          setTorchSupported(false);
          setTorchEnabled(false);
          setCameraStatus("fallback");
          setCameraMessage(
            "Kamera live belum tersedia di browser ini. Pilih foto label dari galeri.",
          );
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const [videoTrack] = stream.getVideoTracks();
        const caps = videoTrack?.getCapabilities?.() as
          | (MediaTrackCapabilities & { torch?: boolean })
          | undefined;
        setTorchSupported(Boolean(caps?.torch));
        setTorchEnabled(false);
        setCameraMessage(null);
        setCameraStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof Error ? err.name : "";
        const friendly =
          name === "NotAllowedError" || name === "PermissionDeniedError"
            ? "Izin kamera ditolak. Pilih foto label kemasan dari galeri."
            : "Kamera tidak terdeteksi. Pilih foto label kemasan dari galeri.";
        setTorchSupported(false);
        setTorchEnabled(false);
        setCameraStatus("fallback");
        setCameraMessage(friendly);
      }
    };

    void initCamera();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      stopCameraTracks();
      if (ownedPreviewUrlRef.current) {
        URL.revokeObjectURL(ownedPreviewUrlRef.current);
        ownedPreviewUrlRef.current = null;
      }
    };
  }, [facingMode, cameraRetryTick, stopCameraTracks]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopCameraTracks();
    clearOwnedPreview();
    onClose();
  }, [clearOwnedPreview, onClose, stopCameraTracks]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const runScanWithBlob = async (blob: Blob, previewUrl: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    ownedPreviewUrlRef.current = previewUrl;
    setFrozenPreviewUrl(previewUrl);
    setScanError(null);

    try {
      const data = await defaultScanClient.scanBlob(blob, {
        signal: controller.signal,
        onStageChange: (stage) => setProcessingStage(stage),
      });

      ownedPreviewUrlRef.current = null;
      setProcessingStage(null);
      stopCameraTracks();
      onScanComplete(data, previewUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        clearOwnedPreview();
        setProcessingStage(null);
        return;
      }
      setProcessingStage(null);
      setScanError(
        err instanceof Error
          ? err.message
          : "Label gagal dibaca. Foto lebih dekat dengan cahaya terang.",
      );
    }
  };

  const handleCaptureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setScanError(
        "Kamera belum siap. Tunggu sebentar atau pilih dari galeri.",
      );
      return;
    }

    setProcessingStage("compressing");
    setScanError(null);

    const crop = reticleRef.current
      ? computeReticleCropRect({
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          videoRect: video.getBoundingClientRect(),
          reticleRect: reticleRef.current.getBoundingClientRect(),
          paddingRatio: 0.12,
        })
      : { sx: 0, sy: 0, sw: video.videoWidth, sh: video.videoHeight };

    const { width, height } = fitWithinMaxDimension(crop.sw, crop.sh, 840);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setProcessingStage(null);
      setScanError("Gagal mengambil frame kamera.");
      return;
    }

    ctx.drawImage(
      video,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      width,
      height,
    );
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.72),
    );

    if (!blob) {
      setProcessingStage(null);
      setScanError("Gagal mengompres hasil foto.");
      return;
    }

    const previewUrl = URL.createObjectURL(blob);
    await runScanWithBlob(blob, previewUrl);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setProcessingStage("compressing");
    setScanError(null);
    clearOwnedPreview();

    try {
      const { blob, previewUrl } = await compressImageFile(file, 840, 0.72);
      await runScanWithBlob(blob, previewUrl);
    } catch (err) {
      setProcessingStage(null);
      setScanError(
        err instanceof Error ? err.message : "Gagal memproses file gambar.",
      );
    }
  };

  const handleToggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchEnabled;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchEnabled(next);
    } catch {
      setTorchSupported(false);
    }
  };

  const handleCancelProcessing = () => {
    abortRef.current?.abort();
    clearOwnedPreview();
    setProcessingStage(null);
    setScanError(null);
  };

  const handleRetryCamera = () => {
    clearOwnedPreview();
    setScanError(null);
    if (cameraStatus === "fallback") {
      setCameraStatus("initializing");
      setCameraRetryTick((n) => n + 1);
    }
  };

  const handleFlipCamera = () => {
    setCameraStatus("initializing");
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const isProcessing = processingStage !== null;
  const calpalBubble = scanError
    ? "Foto lebih dekat & terang ya!"
    : isProcessing
      ? `${petName || "Calpal"} lagi cek gizinya...`
      : "Khusus tabel gizi kemasan!";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan Label Gizi Kemasan"
      className="fixed inset-0 z-50 h-[100dvh] bg-[#0B1410] text-white flex flex-col overflow-hidden"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top AR HUD Bar */}
      <header className="relative z-30 bg-black/80 px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup Scan Label"
            className="min-h-12 min-w-12 px-3.5 rounded-navigation bg-white/15 hover:bg-white/25 text-white flex items-center justify-center gap-2 text-sm sm:text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
          >
            <X className="h-5 w-5" />
            <span className="hidden sm:inline">Tutup</span>
          </button>

          <div className="text-center min-w-0">
            <div className="flex items-center justify-center gap-2">
              <ScanLine className="h-5 w-5 text-accent-green-light shrink-0" />
              <h2 className="text-base sm:text-lg font-extrabold font-heading tracking-tight truncate">
                Scan Label Gizi
              </h2>
            </div>
            <span className="inline-block mt-0.5 px-3 py-0.5 rounded-pill bg-accent-green/30 text-accent-green-light text-sm font-bold">
              {MEAL_LABELS[mealTime]}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <ScanInfoTooltip
              tone="dark"
              align="right"
              label="Panduan Scan Label Gizi"
              content="Khusus tabel Informasi Nilai Gizi pada makanan/minuman kemasan. Makanan tanpa label (seperti nasi goreng atau lauk piring) catat lewat pencarian menu. Proses scan dibatasi maks. 10 detik."
            />
            {torchSupported && cameraStatus === "ready" && !isProcessing && (
              <button
                type="button"
                onClick={handleToggleTorch}
                aria-label={
                  torchEnabled ? "Matikan lampu flash" : "Nyalakan lampu flash"
                }
                aria-pressed={torchEnabled}
                className={cn(
                  "min-h-11 min-w-11 rounded-navigation flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none",
                  torchEnabled
                    ? "bg-accent-yellow text-text-primary"
                    : "bg-white/15 hover:bg-white/25 text-white",
                )}
              >
                <Flashlight className="h-5 w-5" />
              </button>
            )}
            {cameraStatus === "ready" && !isProcessing && (
              <button
                type="button"
                onClick={handleFlipCamera}
                aria-label="Ganti kamera depan atau belakang"
                className="min-h-11 min-w-11 rounded-navigation bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Camera / Stage Viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            cameraStatus === "ready" && !frozenPreviewUrl
              ? "opacity-100"
              : "opacity-0 pointer-events-none",
          )}
        />

        {frozenPreviewUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={frozenPreviewUrl}
            alt="Pratinjau foto label gizi"
            className="absolute inset-0 w-full h-full object-contain bg-black/90"
          />
        )}

        {/* Spacious Responsive Reticle with Spotlight Mask */}
        {cameraStatus === "ready" && !frozenPreviewUrl && (
          <div className="pointer-events-none relative z-10 flex flex-col items-center gap-4 px-4">
            <div
              ref={reticleRef}
              className="relative w-[min(90vw,520px)] h-[min(50dvh,380px)] sm:w-[min(82vw,560px)] sm:h-[min(54dvh,420px)] rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.52)] flex items-center justify-center"
            >
              {/* Clean SVG corner brackets (no rounded-border collision) */}
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full overflow-visible"
              >
                <path
                  d="M 2 14 L 2 4 Q 2 2 4 2 L 14 2"
                  fill="none"
                  stroke="#BADC58"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M 86 2 L 96 2 Q 98 2 98 4 L 98 14"
                  fill="none"
                  stroke="#BADC58"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M 2 86 L 2 96 Q 2 98 4 98 L 14 98"
                  fill="none"
                  stroke="#BADC58"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M 86 98 L 96 98 Q 98 98 98 96 L 98 86"
                  fill="none"
                  stroke="#BADC58"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div className="w-[88%] h-0.5 rounded-full bg-accent-green-light/85" />
            </div>

            <div className="px-4 py-2 rounded-pill bg-black/80 text-sm sm:text-base font-extrabold text-white text-center">
              Arahkan ke Tabel Informasi Nilai Gizi
            </div>
          </div>
        )}

        {cameraStatus === "initializing" && !frozenPreviewUrl && (
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent-green-light" />
            <p className="text-base font-extrabold text-white">
              Menyiapkan kamera...
            </p>
          </div>
        )}

        {cameraStatus === "fallback" && !frozenPreviewUrl && (
          <div className="relative z-10 mx-4 w-full max-w-md rounded-card border border-white/15 bg-[#182920] p-6 sm:p-7 text-center space-y-5 shadow-xl">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-accent-green/25 text-accent-green-light flex items-center justify-center">
              <ImagePlus className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-white font-heading">
                Unggah Foto Label Kemasan
              </h3>
              <p className="text-sm sm:text-base font-semibold text-white/85 leading-relaxed">
                {cameraMessage ||
                  "Pilih foto tabel Informasi Nilai Gizi kemasan dari galeri."}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="button-primary w-full min-h-14 px-5 py-3 text-base font-extrabold flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <ImagePlus className="h-5 w-5" />
                <span>Pilih Foto dari Galeri</span>
              </button>
              <button
                type="button"
                onClick={handleRetryCamera}
                className="w-full min-h-12 px-4 py-3 rounded-button bg-white/15 hover:bg-white/25 text-sm sm:text-base font-extrabold text-white flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Coba Aktifkan Kamera</span>
              </button>
            </div>
          </div>
        )}

        {isProcessing && processingStage && (
          <ScanWaitingCard
            stage={processingStage}
            previewUrl={frozenPreviewUrl}
          />
        )}

        {scanError && !isProcessing && (
          <div
            role="alert"
            className="relative z-20 mx-4 rounded-card border border-white/15 bg-[#3B181A]/95 p-5 sm:p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-[#FCA5A5] shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-base sm:text-lg font-extrabold text-white">
                  Scan Belum Berhasil
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#FECACA] leading-relaxed">
                  {scanError}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleRetryCamera}
                className="flex-1 min-h-12 px-4 py-3 rounded-button bg-white/15 hover:bg-white/25 text-sm sm:text-base font-extrabold text-white flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Foto Ulang</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="button-primary flex-1 min-h-12 px-4 py-3 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <ImagePlus className="h-4 w-4" />
                <span>Dari Galeri</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Calpal Companion (docked cleanly on desktop so mobile stage stays unobstructed) */}
        <div className="pointer-events-none hidden md:flex absolute bottom-4 left-6 z-20 items-end gap-2.5 max-w-xs">
          <div className="w-16 h-20 shrink-0">
            <AvatarRenderer
              characterId={species}
              colors={customColors}
              earsVariant={earsVariant}
              tailVariant={tailVariant}
              faceVariant={faceVariant}
              animationState={scanError ? "idle" : "happy"}
              moodStatus={scanError ? "complaining" : "happy"}
              showRoomBackdrop={false}
              showShadow={false}
              title={petName || "Calpal"}
            />
          </div>
          <div className="mb-3 rounded-2xl border border-border-divider bg-surface/95 text-neutral-10 px-4 py-2.5 text-sm font-extrabold leading-snug shadow-sm">
            {calpalBubble}
          </div>
        </div>
      </div>

      {/* Bottom Camera Controls */}
      <footer className="relative z-30 bg-black/85 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-14 min-w-28 px-5 rounded-button bg-white/15 hover:bg-white/25 disabled:opacity-50 text-white text-base font-extrabold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
          >
            <ImagePlus className="h-5 w-5" />
            <span>Galeri</span>
          </button>

          {isProcessing ? (
            <button
              type="button"
              onClick={handleCancelProcessing}
              className="min-h-14 px-7 rounded-pill bg-white/20 hover:bg-white/30 text-white text-base font-extrabold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <X className="h-5 w-5" />
              <span>Batalkan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleCaptureFrame()}
              disabled={cameraStatus !== "ready"}
              aria-label="Jepret dan analisis label gizi"
              className={cn(
                "h-[72px] w-[72px] rounded-full bg-accent-green-light hover:bg-accent-green text-text-primary hover:text-text-inverse flex items-center justify-center ring-4 ring-white/30 transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-white focus-visible:outline-none",
                cameraStatus !== "ready" && "opacity-40 cursor-not-allowed",
              )}
            >
              <Camera className="h-8 w-8" />
            </button>
          )}

          <div className="min-w-28 flex justify-end">
            <span className="text-sm sm:text-base font-bold text-accent-green-light text-right">
              {isProcessing
                ? "Memindai..."
                : cameraStatus === "ready"
                  ? "Siap jepret"
                  : "Mode galeri"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}