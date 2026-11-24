"use client";

import React, { useState } from "react";
import { X, Copy, Check, Download, Upload, AlertCircle } from "lucide-react";
import {
  exportConceptualConfig,
  importConceptualConfig,
  AvatarCustomizationState,
  ConceptualAvatarConfig,
} from "@/lib/character-assets/config-schema";

export interface AvatarConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AvatarCustomizationState;
  onImportState: (state: AvatarCustomizationState) => void;
}

export function AvatarConfigModal({
  isOpen,
  onClose,
  currentState,
  onImportState,
}: AvatarConfigModalProps) {
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentJson = JSON.stringify(
    exportConceptualConfig(currentState),
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(currentJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    setImportError(null);
    setImportSuccess(null);
    try {
      if (!jsonInput.trim()) {
        setImportError("Masukkan kode JSON terlebih dahulu.");
        return;
      }
      const parsed = JSON.parse(jsonInput) as ConceptualAvatarConfig;
      if (!parsed.characterId) {
        setImportError("JSON tidak valid: properti 'characterId' wajib ada.");
        return;
      }
      const importedState = importConceptualConfig(parsed);
      onImportState(importedState);
      setImportSuccess("Konfigurasi avatar berhasil dimuat!");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      setImportError(
        `Format JSON tidak valid: ${
          err instanceof Error ? err.message : "Sintaks salah"
        }`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-card bg-surface border border-border-divider p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-border-divider">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-accent-green" />
            <h3 className="text-base font-bold text-text-primary font-heading">
              Ekspor & Impor Konfigurasi Avatar (JSON)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-pill text-text-muted hover:text-text-primary hover:bg-surface-subtle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Export Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              JSON Avatar Saat Ini (Salin):
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-accent-green-light text-text-primary text-xs font-bold hover:bg-accent-green/20 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-accent-green stroke-[3]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-accent-green" />
                  <span>Salin JSON</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 rounded-input bg-neutral-900 text-neutral-100 text-[11px] font-mono overflow-x-auto max-h-36 border border-neutral-700">
            {currentJson}
          </pre>
        </div>

        {/* Import Section */}
        <div className="space-y-2 pt-2 border-t border-border-divider">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Impor Konfigurasi Avatar (Tempel JSON):
          </label>
          <textarea
            rows={4}
            placeholder={`{\n  "characterId": "bloomie",\n  "colors": {\n    "body": "#4ADE80",\n    "accent": "#16A34A"\n  },\n  "accessoryIds": ["acc-round-glasses", "acc-chef-hat"]\n}`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full p-2.5 rounded-input border border-border-default bg-surface-subtle text-xs font-mono text-text-primary placeholder:text-text-muted outline-hidden focus:border-accent-green"
          />

          {importError && (
            <div className="flex items-center gap-1.5 p-2 rounded-input bg-red-50 text-red-700 border border-red-200 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="flex items-center gap-1.5 p-2 rounded-input bg-green-50 text-green-700 border border-green-200 text-xs">
              <Check className="h-4 w-4 shrink-0 text-green-600" />
              <span>{importSuccess}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-divider">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-button border border-border-default text-xs font-semibold text-text-muted hover:bg-surface-subtle transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="button-primary px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Terapkan JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}

