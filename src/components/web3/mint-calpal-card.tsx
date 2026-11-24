"use client";

import { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Loader2,
  FileJson,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { usePetStore } from "@/store/use-pet-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { getEvolutionForLevel } from "@/lib/pet/evolution";
import { TARGET_CHAIN } from "@/lib/web3/config";
import {
  CALPAL_PET_ABI,
  CALPAL_PET_CONTRACT_ADDRESS,
  getExplorerTokenUrl,
  getExplorerTxUrl,
} from "@/lib/web3/contracts";
import { recordPetMintAction } from "@/app/actions/web3";
import { syncPetEvolutionProgressAction } from "@/server/actions/pet-actions";

export function MintCalPalCard() {
  const isHydrated = useHydrated();
  const { isAuthenticated, user } = useAuthStore();
  const {
    name,
    species,
    level,
    exp,
    nftTokenId,
    nftContractAddress,
    nftChainId,
    mintTxHash,
    mintStatus,
    setPetState,
  } = usePetStore();

  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const { data: contractOwner } = useReadContract({
    address: CALPAL_PET_CONTRACT_ADDRESS || undefined,
    abi: CALPAL_PET_ABI,
    functionName: "contractOwner",
    query: { enabled: Boolean(CALPAL_PET_CONTRACT_ADDRESS) },
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncingEvolution, setIsSyncingEvolution] = useState(false);

  if (!isHydrated) {
    return null;
  }

  const evolution = getEvolutionForLevel(level);
  const isContractOwner =
    Boolean(address) &&
    Boolean(contractOwner) &&
    address?.toLowerCase() === (contractOwner as string).toLowerCase();

  const handleSyncEvolutionAndMetadata = async () => {
    setIsSyncingEvolution(true);
    try {
      const res = await syncPetEvolutionProgressAction({ level, exp });
      if (res.success) {
        setPetState({ stage: evolution.stageNumber });
        toast.success(res.message || "Progres evolusi & metadata NFT disinkronkan!");
      } else {
        toast.error(res.message || "Gagal menyinkronkan progres evolusi.");
      }

      // Optional EIP-4906 on-chain metadata refresh signal for marketplaces (deployer wallet only)
      if (
        res.success &&
        isContractOwner &&
        nftTokenId !== null &&
        CALPAL_PET_CONTRACT_ADDRESS
      ) {
        try {
          if (chainId !== TARGET_CHAIN.id) {
            await switchChainAsync({ chainId: TARGET_CHAIN.id });
          }
          await writeContractAsync({
            address: CALPAL_PET_CONTRACT_ADDRESS,
            abi: CALPAL_PET_ABI,
            functionName: "emitMetadataUpdate",
            args: [BigInt(nftTokenId)],
            chainId: TARGET_CHAIN.id,
          });
          toast.success(`Sinyal EIP-4906 MetadataUpdate dikirim untuk #${nftTokenId}!`);
        } catch {
          // Off-chain metadata already updated; ignore if user skips on-chain signal
        }
      }
    } finally {
      setIsSyncingEvolution(false);
    }
  };

  const isMinted = mintStatus === "minted" && nftTokenId !== null;
  const isWrongChain = isConnected && chainId !== TARGET_CHAIN.id;
  const isBusy = isWriting || isSwitching || isVerifying;

  const handleMint = async () => {
    if (!isAuthenticated) {
      toast.error("Silakan login akun Caloria terlebih dahulu.");
      return;
    }

    if (!CALPAL_PET_CONTRACT_ADDRESS) {
      toast.error(
        "Kontrak CalPalPet belum dideploy. Set NEXT_PUBLIC_CALPAL_PET_CONTRACT_ADDRESS di .env.local.",
      );
      return;
    }

    if (!isConnected || !address) {
      toast.error("Hubungkan wallet kamu terlebih dahulu di tombol Connect Wallet.");
      return;
    }

    if (
      user?.walletAddress &&
      user.walletAddress.toLowerCase() !== address.toLowerCase()
    ) {
      toast.error(
        "Wallet aktif berbeda dengan wallet yang tertaut di profilmu. Gunakan wallet yang tertaut.",
      );
      return;
    }

    try {
      if (isWrongChain) {
        await switchChainAsync({ chainId: TARGET_CHAIN.id });
      }

      setPetState({ mintStatus: "minting" });

      const txHash = await writeContractAsync({
        address: CALPAL_PET_CONTRACT_ADDRESS,
        abi: CALPAL_PET_ABI,
        functionName: "mintPet",
        args: [species || "flameling"],
        chainId: TARGET_CHAIN.id,
      });

      toast.info("Transaksi dikirim! Memverifikasi Soulbound NFT di Base...");
      setIsVerifying(true);

      const res = await recordPetMintAction({
        txHash,
        chainId: TARGET_CHAIN.id,
        contractAddress: CALPAL_PET_CONTRACT_ADDRESS,
      });

      if (res.success && res.nftTokenId !== null) {
        setPetState({
          nftTokenId: res.nftTokenId,
          nftContractAddress: res.nftContractAddress,
          nftChainId: res.nftChainId,
          mintTxHash: res.mintTxHash,
          mintStatus: "minted",
        });
        toast.success(
          res.message || `CalPal Soulbound NFT #${res.nftTokenId} berhasil dicetak!`,
        );
      } else {
        setPetState({ mintStatus: "unminted" });
        toast.error(res.message || "Gagal memverifikasi transaksi mint.");
      }
    } catch (err: unknown) {
      setPetState({ mintStatus: "unminted" });
      const message = err instanceof Error ? err.message : "";
      if (message.includes("UserRejectedRequestError") || message.includes("rejected")) {
        toast.error("Transaksi mint dibatalkan.");
      } else if (message.includes("AlreadyMinted")) {
        toast.error("Wallet ini sudah pernah mencetak CalPal Soulbound NFT.");
      } else {
        toast.error("Gagal mencetak CalPal NFT. Pastikan saldo Base Sepolia ETH cukup.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (isMinted && nftTokenId !== null) {
    const activeChainId = nftChainId || TARGET_CHAIN.id;
    const activeContract = nftContractAddress || CALPAL_PET_CONTRACT_ADDRESS;

    return (
      <div className="rounded-card border border-accent-green/35 bg-accent-green/10 p-4 space-y-3 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-navigation bg-accent-green/20 text-accent-green">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-accent-green">
                Soulbound NFT Terverifikasi
              </p>
              <h3 className="text-sm font-extrabold text-text-primary">
                {name || "CalPal"} #{nftTokenId}
              </h3>
            </div>
          </div>

          <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-text-muted border border-border-default">
            ERC-5192 • Lvl {level}
          </span>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          Tahap evolusi:{" "}
          <strong className="text-text-primary">{evolution.stageName}</strong>
          {evolution.nextMilestoneLevel
            ? ` • Evolusi berikutnya (${evolution.nextStageName}) di Level ${evolution.nextMilestoneLevel}.`
            : " • Tahap evolusi tertinggi (Mythic) tercapai!"}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSyncEvolutionAndMetadata}
            disabled={isSyncingEvolution}
            className="inline-flex items-center gap-1.5 rounded-navigation border border-accent-green/40 bg-surface px-3 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light disabled:opacity-50"
            title="Sinkronkan level & tahap evolusi ke metadata NFT"
          >
            {isSyncingEvolution ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-accent-green" />
            )}
            <span>Sync Evolusi</span>
          </button>
          {activeContract && (
            <a
              href={getExplorerTokenUrl(activeContract, nftTokenId, activeChainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-navigation border border-border-default bg-surface px-3 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light"
            >
              <span>BaseScan</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          )}

          {mintTxHash && (
            <a
              href={getExplorerTxUrl(mintTxHash, activeChainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-navigation border border-border-default bg-surface px-3 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light"
            >
              <span>Tx Receipt</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          )}

          <a
            href={`/api/nft/pet/${nftTokenId}/image.svg`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-navigation border border-border-default bg-surface px-3 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light"
          >
            <ImageIcon className="h-3.5 w-3.5 opacity-70" />
            <span>Live SVG</span>
          </a>

          <a
            href={`/api/nft/pet/${nftTokenId}/metadata`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-navigation border border-border-default bg-surface px-3 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-accent-green-light"
          >
            <FileJson className="h-3.5 w-3.5 opacity-70" />
            <span>Metadata</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border-default bg-surface p-4 space-y-3 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-navigation bg-accent-yellow text-text-primary">
            <Sparkles className="h-4 w-4 stroke-[2.5]" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              {TARGET_CHAIN.name} • Soulbound ERC-721
            </p>
            <h3 className="text-sm font-extrabold text-text-primary">
              Mint {name || "CalPal"} sebagai NFT
            </h3>
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">
        Abadikan CalPal kamu sebagai Dynamic Soulbound NFT gratis (hanya bayar gas testnet
        Base Sepolia). Level &amp; pakaianmu otomatis tercermin pada metadata NFT.
      </p>

      {!CALPAL_PET_CONTRACT_ADDRESS && (
        <div className="flex items-start gap-2 rounded-navigation border border-accent-orange/35 bg-accent-orange/10 p-2.5 text-[11px] text-text-primary">
          <AlertCircle className="h-4 w-4 shrink-0 text-accent-orange mt-0.5" />
          <span>
            Kontrak belum dikonfigurasi. Deploy{" "}
            <code className="font-mono font-bold">contracts/CalPalPet.sol</code> lalu isi{" "}
            <code className="font-mono font-bold">
              NEXT_PUBLIC_CALPAL_PET_CONTRACT_ADDRESS
            </code>
            .
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleMint}
        disabled={isBusy || !CALPAL_PET_CONTRACT_ADDRESS}
        className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-navigation bg-accent-green-light px-4 text-xs sm:text-sm font-extrabold text-text-primary shadow-button transition-all hover:bg-accent-green hover:text-text-inverse disabled:opacity-50 disabled:pointer-events-none"
      >
        {isBusy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {isVerifying
                ? "Memverifikasi di Base..."
                : isSwitching
                  ? `Beralih ke ${TARGET_CHAIN.name}...`
                  : "Konfirmasi di Wallet..."}
            </span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>
              {isWrongChain
                ? `Switch ke ${TARGET_CHAIN.name} & Mint`
                : "Mint CalPal NFT (Soulbound)"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
