"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Stethoscope } from "lucide-react";
import type { ScanMode } from "@/lib/schemas/nutrition-scan";

export interface NutritionistAskBoxProps {
  summaryText: string;
  scanMode?: ScanMode;
}

const NUTRITIONIST_CHAT_URL =
  process.env.NEXT_PUBLIC_NUTRITIONIST_CHAT_URL?.trim() || "";

/**
 * Mandatory AI-to-human escalation block ("Tanyakan Ahli Gizi") so users
 * can cross-check AI scan estimates with a real nutritionist.
 */
export function NutritionistAskBox({
  summaryText,
  scanMode = "label",
}: NutritionistAskBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-3xl border border-accent-green/30 bg-accent-green-light/25 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Stethoscope className="h-5 w-5 text-text-primary shrink-0 mt-0.5" />
          <p className="text-sm sm:text-base font-bold text-text-primary leading-snug">
            Analisis AI bersifat estimasi awal. Ragu dengan kecocokannya?
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="min-h-12 px-4 py-2.5 rounded-button bg-text-primary hover:bg-accent-green text-text-inverse text-sm sm:text-base font-extrabold inline-flex items-center justify-center gap-2 shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Stethoscope className="h-4 w-4 shrink-0" />
          <span>Tanyakan Ahli Gizi</span>
        </button>
      </div>

      {isOpen && (
        <div className="rounded-2xl border border-border-divider bg-surface p-4 space-y-3">
          <p className="text-sm font-semibold text-neutral-10 leading-relaxed">
            {scanMode === "food"
              ? "Salin ringkasan estimasi makanan ini lalu kirim bersama foto makanannya ke ahli gizi untuk saran sesuai kondisi atau targetmu."
              : "Salin ringkasan label ini lalu kirim ke ahli gizi untuk saran sesuai kebutuhan medis atau targetmu."}
          </p>

          <pre className="whitespace-pre-wrap font-sans text-sm font-medium text-neutral-10 bg-card border border-border-divider rounded-input p-3.5 leading-relaxed">
            {summaryText}
          </pre>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex-1 min-h-12 px-4 py-2.5 rounded-button bg-accent-green-light hover:bg-accent-green text-text-primary hover:text-text-inverse text-sm sm:text-base font-extrabold inline-flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Tersalin! Siap Kirim</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin Ringkasan Gizi</span>
                </>
              )}
            </button>

            {NUTRITIONIST_CHAT_URL && (
              <a
                href={NUTRITIONIST_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-12 px-4 py-2.5 rounded-button bg-text-primary hover:bg-accent-green text-text-inverse text-sm sm:text-base font-extrabold inline-flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Chat Ahli Gizi</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
