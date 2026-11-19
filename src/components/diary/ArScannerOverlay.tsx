"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Flashlight,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScanLine,
  X,
  AlertCircle,
} from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";
import { usePetStore } from "@/store/use-pet-store";
import type { NutritionLabelData } from "@/lib/schemas/nutrition-scan";
import {
  compressImageFile,
  defaultScanClient,
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

const STAGE_LABELS: Record<ScanStage, string> = {
  compressing: "Menyiapkan gambar label...",
  scanning: "Membaca tabel Informasi Nilai Gizi...",
  analyzing: "Mengevaluasi kandungan gizi...",
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
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const ownedPreviewUrlRef = useRef<string | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraRetryTick, setCameraRetryTick] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<"initializing" | "ready" | "fallback">(
    "initializing"
  );
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const [processingStage, setProcessingStage] = useState<ScanStage | null>(null);
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
            "Kamera live tidak tersedia di browser ini. Pilih foto kemasan dari galeri."
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
            ? "Izin kamera ditolak. Kamu tetap bisa unggah foto label dari galeri."
            : "Kamera tidak terdeteksi di perangkat ini. Unggah foto label dari galeri saja ya.";
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

      // Hand previewUrl ownership to parent so ReviewScanModal keeps rendering it
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
          : "Label gagal dibaca. Coba foto lebih dekat & cukup cahaya."
      );
    }
  };

  const handleCaptureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setScanError("Video kamera belum siap. Tunggu sebentar atau pilih dari galeri.");
      return;
    }

    setProcessingStage("compressing");
    setScanError(null);

    const maxDim = 960;
    let { videoWidth: width, videoHeight: height } = video;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setProcessingStage(null);
      setScanError("Gagal mengambil frame kamera.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.75)
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
      const { blob, previewUrl } = await compressImageFile(file, 960, 0.75);
      await runScanWithBlob(blob, previewUrl);
    } catch (err) {
      setProcessingStage(null);
      setScanError(
        err instanceof Error ? err.message : "Gagal memproses file gambar."
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
    ? "Kurang jelas nih, coba foto lebih dekat ya!"
    : isProcessing
    ? `${petName || "Calpal"} lagi membaca labelnya...`
    : "Arahkan ke tabel Informasi Nilai Gizi ya!";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AR Scanner Label Gizi"
      className="fixed inset-0 z-50 bg-[#0B1410] text-white flex flex-col overflow-hidden"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top AR HUD Bar */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 bg-black/45 backdrop-blur-md">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup AR Scanner"
          className="min-h-11 min-w-11 px-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
        >
          <X className="h-5 w-5" />
          <span className="hidden sm:inline">Tutup</span>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <ScanLine className="h-4 w-4 text-accent-green-light" />
            <h2 className="text-sm sm:text-base font-extrabold font-heading tracking-tight">
              AR Scanner Gizi
            </h2>
          </div>
          <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-pill bg-accent-green/30 text-[#D9F99D] text-xs font-bold">
            {MEAL_LABELS[mealTime]}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-11 justify-end">
          {torchSupported && cameraStatus === "ready" && !isProcessing && (
            <button
              type="button"
              onClick={handleToggleTorch}
              aria-label={torchEnabled ? "Matikan lampu flash" : "Nyalakan lampu flash"}
              aria-pressed={torchEnabled}
              className={cn(
                "min-h-11 min-w-11 rounded-2xl flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none",
                torchEnabled
                  ? "bg-accent-yellow text-[#1E293B]"
                  : "bg-white/15 hover:bg-white/25 text-white"
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
              className="min-h-11 min-w-11 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Camera / AR Viewfinder Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#0F1B14]">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            (cameraStatus !== "ready" || frozenPreviewUrl) && "opacity-0 pointer-events-none"
          )}
        />

        {frozenPreviewUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={frozenPreviewUrl}
            alt="Pratinjau foto label gizi"
            className="absolute inset-0 w-full h-full object-contain bg-black/85"
          />
        )}

        {cameraStatus === "ready" && !frozenPreviewUrl && (
          <div className="pointer-events-none relative z-10 w-[86%] max-w-sm aspect-[4/3] flex flex-col items-center justify-center">
            <span className="absolute top-0 left-0 h-9 w-9 rounded-tl-2xl border-t-4 border-l-4 border-accent-green-light" />
            <span className="absolute top-0 right-0 h-9 w-9 rounded-tr-2xl border-t-4 border-r-4 border-accent-green-light" />
            <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-4 border-l-4 border-accent-green-light" />
            <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-2xl border-b-4 border-r-4 border-accent-green-light" />

            <div className="w-[88%] h-0.5 rounded-full bg-accent-green-light/85 shadow-[0_0_14px_rgba(186,220,88,0.9)] motion-safe:animate-pulse" />

            <div className="mt-4 px-3.5 py-1.5 rounded-pill bg-black/65 backdrop-blur-xs text-xs font-bold text-white text-center">
              Posisikan tabel Informasi Nilai Gizi di dalam bingkai
            </div>
          </div>
        )}

        {cameraStatus === "initializing" && !frozenPreviewUrl && (
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-accent-green-light" />
            <p className="text-sm font-bold text-white">
              Menyiapkan kamera AR...
            </p>
          </div>
        )}

        {cameraStatus === "fallback" && !frozenPreviewUrl && (
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-card bg-[#182920] p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-accent-green/25 text-accent-green-light flex items-center justify-center">
              <ImagePlus className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white font-heading">
                Unggah Foto Label Gizi
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                {cameraMessage ||
                  "Pilih foto kemasan atau tabel Informasi Nilai Gizi agar Calpal bisa mengecek kandungannya."}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="button-primary w-full min-h-12 px-5 py-3 text-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <ImagePlus className="h-4 w-4" />
                <span>Pilih Foto dari Galeri</span>
              </button>
              <button
                type="button"
                onClick={handleRetryCamera}
                className="w-full min-h-11 px-4 py-2.5 rounded-button bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Coba Aktifkan Kamera Lagi</span>
              </button>
            </div>
          </div>
        )}

        {isProcessing && processingStage && (
          <div
            role="status"
            aria-live="polite"
            className="relative z-20 mx-4 rounded-card bg-[#111F18]/90 backdrop-blur-md px-6 py-5 max-w-xs w-full text-center space-y-3 shadow-2xl"
          >
            <Loader2 className="h-8 w-8 animate-spin text-accent-green-light mx-auto" />
            <p className="text-sm font-extrabold text-white">
              {STAGE_LABELS[processingStage]}
            </p>
            <div className="flex justify-center gap-1.5">
              {(["compressing", "scanning", "analyzing"] as ScanStage[]).map(
                (stage) => (
                  <span
                    key={stage}
                    className={cn(
                      "h-1.5 w-8 rounded-full transition-colors",
                      stage === processingStage
                        ? "bg-accent-green-light"
                        : "bg-white/25"
                    )}
                  />
                )
              )}
            </div>
          </div>
        )}

        {scanError && !isProcessing && (
          <div
            role="alert"
            className="relative z-20 mx-4 rounded-card bg-[#3B181A]/95 px-5 py-4 max-w-sm w-full space-y-3 shadow-2xl"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-[#FCA5A5] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-white">
                  Scan Belum Berhasil
                </p>
                <p className="text-xs text-[#FECACA] leading-relaxed">
                  {scanError}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRetryCamera}
                className="flex-1 min-h-11 px-3 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Foto Ulang</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-h-11 px-3 py-2 rounded-2xl bg-accent-green-light text-text-primary text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span>Dari Galeri</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Calpal Companion Hint */}
        <div className="pointer-events-none absolute bottom-3 left-3 sm:left-6 z-20 flex items-end gap-2 max-w-[85%]">
          <div className="w-14 h-16 sm:w-16 sm:h-20 shrink-0 drop-shadow-lg">
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
          <div className="mb-3 rounded-2xl bg-white/95 text-[#1E293B] px-3.5 py-2 text-xs font-bold shadow-lg leading-snug">
            {calpalBubble}
          </div>
        </div>
      </div>

      {/* Bottom Camera Controls */}
      <footer className="relative z-20 bg-black/60 backdrop-blur-md px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-12 min-w-24 px-4 rounded-2xl bg-white/15 hover:bg-white/25 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green-light focus-visible:outline-none"
          >
            <ImagePlus className="h-4 w-4" />
            <span>Galeri</span>
          </button>

          {isProcessing ? (
            <button
              type="button"
              onClick={handleCancelProcessing}
              className="min-h-12 px-6 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <X className="h-4 w-4" />
              <span>Batal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleCaptureFrame()}
              disabled={cameraStatus !== "ready"}
              aria-label="Jepret dan analisis label gizi"
              className={cn(
                "h-16 w-16 rounded-full bg-accent-green-light text-text-primary flex items-center justify-center shadow-[0_0_0_5px_rgba(255,255,255,0.28)] transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
                cameraStatus !== "ready" && "opacity-40 cursor-not-allowed"
              )}
            >
              <Camera className="h-7 w-7" />
            </button>
          )}

          <div className="min-w-24 flex justify-end">
            <span className="text-xs font-semibold text-white/75 text-right">
              {cameraStatus === "ready" ? "Siap jepret" : "Mode galeri"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
