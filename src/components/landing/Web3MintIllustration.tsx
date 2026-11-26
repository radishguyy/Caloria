"use client";

import { motion } from "framer-motion";
import { RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { AvatarRenderer } from "@/components/pet/avatar-renderer";

const ONCHAIN_TRAITS = [
  { label: "Tahap Evolusi", value: "Adult (Tahap 4)" },
  { label: "Level Aktif", value: "Lv. 24" },
  { label: "Spesies", value: "Pippin" },
  { label: "Metadata", value: "EIP-4906 Aktif" },
];

export function Web3MintIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] rounded-2xl border border-border-divider bg-surface p-4 sm:p-6 space-y-4 select-none">
      {/* Top Network & Contract Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-divider bg-surface px-3 py-1 text-[11px] font-extrabold text-neutral-10">
          <span
            className="h-2 w-2 rounded-full bg-accent-green"
            aria-hidden="true"
          />
          <span>Base Network</span>
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-accent-green/15 px-3 py-1 text-[11px] font-extrabold text-text-primary">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Koleksi On-Chain</span>
        </span>
      </div>

      {/* Main NFT Card Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
        {/* Collectible Avatar Frame */}
        <div className="sm:col-span-5 rounded-2xl border border-border-divider bg-accent-yellow/30 p-3.5 flex flex-col items-center text-center">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3.6, ease: "easeInOut" }}
            className="w-26 h-32 sm:w-28 sm:h-36"
          >
            <AvatarRenderer
              characterId="pippin"
              animationState="happy"
              equipped={{
                head: "head-golden-crown",
                body: "body-hero-cape",
              }}
              showRoomBackdrop={false}
              showShadow={false}
              title="Calpal NFT Raja Pippin"
            />
          </motion.div>

          <div className="mt-2 w-full rounded-xl border border-border-divider bg-surface px-2.5 py-1.5">
            <p className="text-[11px] font-extrabold text-neutral-10 truncate">
              Raja Pippin #042
            </p>
            <p className="text-[10px] font-semibold text-text-primary">
              ERC-721 • Tersinkron
            </p>
          </div>
        </div>

        {/* Traits & Metadata Sync */}
        <div className="sm:col-span-7 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {ONCHAIN_TRAITS.map((trait) => (
              <div
                key={trait.label}
                className="rounded-xl border border-border-divider bg-surface p-2.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {trait.label}
                </p>
                <p className="mt-0.5 text-xs font-extrabold text-neutral-10 truncate">
                  {trait.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border-divider bg-accent-green/10 px-3 py-2.5 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-green text-text-inverse">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-text-primary truncate">
                  Sinkronisasi Evolusi & Level
                </p>
                <p className="text-[10px] font-medium text-neutral-10 truncate">
                  Metadata NFT ikut naik saat Calpal tumbuh
                </p>
              </div>
            </div>
            <Sparkles
              className="h-4 w-4 text-accent-orange shrink-0"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Reassuring Optional Strip */}
      <div className="rounded-xl border border-border-divider bg-accent-orange/10 px-3.5 py-2 text-center">
        <p className="text-[11px] font-semibold text-neutral-10">
           Sepenuhnya opsional — catat nutrisi & rawat Calpal tetap gratis tanpa wallet.
        </p>
      </div>
    </div>
  );
}
