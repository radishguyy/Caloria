"use client";

import { useState } from "react";
import {
  Wallet,
  CheckCircle2,
  Loader2,
  Link2Off,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi";
import { toast } from "sonner";
import { useAuthStore } from "@/store/use-auth-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  TARGET_CHAIN,
  buildWalletLinkMessage,
  getExplorerAddressUrl,
  shortenAddress,
} from "@/lib/web3/config";
import { linkWalletAction, unlinkWalletAction } from "@/app/actions/web3";
import { cn } from "@/lib/utils";

export function WalletConnectButton({ className }: { className?: string }) {
  const isHydrated = useHydrated();
  const { user, isAuthenticated, setWalletInfo } = useAuthStore();

  const { address, isConnected, chainId } = useAccount();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const [isLinking, setIsLinking] = useState(false);

  const linkedAddress = user?.walletAddress || null;
  const activeAddress = address || linkedAddress;
  const isWrongChain = isConnected && chainId !== TARGET_CHAIN.id;
  const isLinkedMatch =
    Boolean(linkedAddress) &&
    (!isConnected || linkedAddress?.toLowerCase() === address?.toLowerCase());

  const isBusy = isConnecting || isSigning || isSwitching || isLinking;

  const handleConnect = async () => {
    const preferredConnector =
      connectors.find((c) => c.id.toLowerCase().includes("metamask")) ||
      connectors.find((c) => c.type === "injected") ||
      connectors[0];

    if (!preferredConnector) {
      toast.error(
        "Wallet browser tidak ditemukan. Pasang MetaMask atau Coinbase Wallet terlebih dahulu.",
      );
      return;
    }

    try {
      const result = await connectAsync({ connector: preferredConnector });
      const connectedAddress = result.accounts[0];
      if (connectedAddress) {
        toast.success(`Wallet terhubung: ${shortenAddress(connectedAddress)}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("provider not found")) {
        toast.error(
          "Wallet browser tidak ditemukan. Pasang MetaMask atau Coinbase Wallet terlebih dahulu.",
        );
      } else if (msg.includes("failed to connect to metamask")) {
        toast.error(
          "MetaMask terkunci atau belum aktif. Buka ekstensi MetaMask, masukkan password, lalu coba lagi.",
        );
      } else if (msg.includes("already pending") || msg.includes("-32002")) {
        toast.error(
          "Ada permintaan koneksi MetaMask yang masih terbuka. Cek ikon ekstensi MetaMask di browser.",
        );
      } else if (msg.includes("rejected")) {
        toast.error("Koneksi wallet dibatalkan.");
      } else {
        toast.error(
          "Gagal menghubungkan wallet. Pastikan ekstensi wallet sudah dibuka.",
        );
      }
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChainAsync({ chainId: TARGET_CHAIN.id });
      toast.success(`Beralih ke jaringan ${TARGET_CHAIN.name}`);
    } catch {
      toast.error(`Gagal beralih ke jaringan ${TARGET_CHAIN.name}.`);
    }
  };

  const handleVerifyAndLink = async () => {
    if (!address || !user?.id) {
      toast.error("Login akun Caloria dan hubungkan wallet terlebih dahulu.");
      return;
    }

    setIsLinking(true);
    try {
      const issuedAt = new Date().toISOString();
      const message = buildWalletLinkMessage({
        userId: user.id,
        address,
        issuedAt,
      });

      const signature = await signMessageAsync({ message });
      const res = await linkWalletAction({
        address,
        chainId: chainId || TARGET_CHAIN.id,
        signature,
        issuedAt,
      });

      if (res.success && res.walletAddress) {
        setWalletInfo(res.walletAddress, res.walletChainId);
        toast.success(res.message || "Wallet berhasil ditautkan!");
      } else {
        toast.error(res.message || "Gagal menautkan wallet.");
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : "";
      if (errName === "UserRejectedRequestError") {
        toast.error("Tanda tangan dibatalkan.");
      } else {
        toast.error("Gagal memverifikasi wallet.");
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setIsLinking(true);
    try {
      const res = await unlinkWalletAction();
      if (res.success) {
        setWalletInfo(null, null);
        disconnect();
        toast.success("Tautan wallet dilepas.");
      } else {
        toast.error(res.message || "Gagal melepas tautan wallet.");
      }
    } finally {
      setIsLinking(false);
    }
  };

  if (!isHydrated) {
    return (
      <div
        className={cn(
          "inline-flex h-11 w-36 items-center justify-center rounded-navigation border border-accent-green/40 bg-accent-green-light px-4 text-xs sm:text-sm font-bold text-text-primary opacity-75",
          className,
        )}
      >
        <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
        Wallet
      </div>
    );
  }

  // Case 1: Wallet already linked in DB (even if browser wallet isn't actively connected yet)
  if (isLinkedMatch && linkedAddress) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        {isWrongChain ? (
          <button
            type="button"
            onClick={handleSwitchNetwork}
            disabled={isBusy}
            className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-navigation border border-accent-orange/40 bg-accent-orange/10 px-3.5 text-xs font-bold text-accent-orange transition-colors hover:bg-accent-orange/20 disabled:pointer-events-none disabled:opacity-50"
            title={`Beralih ke ${TARGET_CHAIN.name}`}
          >
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            <span>Switch to {TARGET_CHAIN.name}</span>
          </button>
        ) : (
          <a
            href={getExplorerAddressUrl(
              linkedAddress,
              chainId || user?.walletChainId || TARGET_CHAIN.id,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-navigation border border-accent-green/40 bg-accent-green-light px-4 text-xs sm:text-sm font-bold text-text-primary transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-green-light)_88%,var(--color-accent-green))]"
            title="Wallet terverifikasi di Base Sepolia"
          >
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-text-primary"
              aria-hidden="true"
            />
            <span className="font-mono">{shortenAddress(linkedAddress)}</span>
            <ExternalLink
              className="h-3.5 w-3.5 opacity-70"
              aria-hidden="true"
            />
          </a>
        )}

        <button
          type="button"
          onClick={handleUnlink}
          disabled={isBusy}
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-navigation border border-border-default bg-surface text-text-muted transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
          title="Putuskan tautan wallet"
          aria-label="Putuskan tautan wallet"
        >
          {isLinking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2Off className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }

  // Case 2: Browser wallet connected, needs signature verification or network switch
  if (isConnected && address) {
    if (isWrongChain) {
      return (
        <button
          type="button"
          onClick={handleSwitchNetwork}
          disabled={isBusy}
          className={cn(
            "inline-flex h-11 cursor-pointer items-center gap-2 rounded-navigation border border-accent-orange/40 bg-accent-orange/15 px-4 text-xs sm:text-sm font-bold text-accent-orange transition-colors hover:bg-accent-orange/25 disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>Pilih {TARGET_CHAIN.name}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={
          isAuthenticated
            ? handleVerifyAndLink
            : () =>
                toast.error("Login akun Caloria dulu untuk menautkan wallet.")
        }
        disabled={isBusy}
        className={cn(
          "inline-flex h-11 cursor-pointer items-center gap-2 rounded-navigation border border-accent-green/40 bg-accent-green-light px-4 text-xs sm:text-sm font-bold text-text-primary transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-green-light)_88%,var(--color-accent-green))] disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        title="Gratis — tanda tangan pesan tanpa gas fee"
      >
        {isBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4 shrink-0" />
        )}
        <span>Tautkan {shortenAddress(activeAddress)}</span>
      </button>
    );
  }

  // Case 3: Not connected
  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isBusy}
      className={cn(
        "inline-flex h-11 cursor-pointer items-center gap-2 rounded-navigation border border-accent-green/40 bg-accent-green-light px-4 text-xs sm:text-sm font-bold text-text-primary transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-green-light)_88%,var(--color-accent-green))] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>Connect Wallet</span>
    </button>
  );
}
