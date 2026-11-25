"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Coins,
  Check,
  AlertCircle,
  X,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Snowflake,
  Moon,
} from "lucide-react";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useSocialStore } from "@/store/use-social-store";
import {
  buyStreakFreezeAction,
  buyRestPassAction,
} from "@/app/actions/streak";
import { STREAK_RULES } from "@/lib/constants";
import {
  COSMETICS_CATALOG,
  CosmeticItem,
  CosmeticCategory,
} from "@/lib/cosmetics-catalog";
import { AccessorySvgPreview } from "@/components/pet/character-svg";
import { PurchaseModal } from "@/components/pet/purchase-modal";
import { purchaseAccessoryAction } from "@/app/actions/pet-customization";
import {
  getMintedAccessoryIdsAction,
  recordAccessoryMintAction,
  requestAccessoryMintVoucherAction,
  syncOnChainAccessoriesAction,
} from "@/app/actions/web3";
import {
  CALPAL_ACCESSORIES_ABI,
  CALPAL_ACCESSORIES_CONTRACT_ADDRESS,
} from "@/lib/web3/contracts";
import { getAccessoryTokenId } from "@/lib/web3/accessory-tokens";
import { TARGET_CHAIN } from "@/lib/web3/config";
import { toastShopPurchased } from "@/lib/toast";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAutoTour } from "@/components/tour/useAutoTour";
import { cn } from "@/lib/utils";

export default function PetShopPage() {
  const isHydrated = useHydrated();
  useAutoTour("shop", { enabled: isHydrated });
  const { coins, setCoins, addCoins } = usePetStore();
  const {
    ownedItemIds,
    mintedItemIds,
    selectedCategory,
    setSelectedCategory,
    addOwnedItem,
    setOwnedItemIds,
    setMintedItemIds,
    addMintedItem,
    buyItem,
  } = useCosmeticsStore();
  const { streakFreezes, restPasses, setStreakMeta } = useSocialStore();

  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [confirmModalItem, setConfirmModalItem] = useState<CosmeticItem | null>(
    null,
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [buyingPowerUp, setBuyingPowerUp] = useState<"freeze" | "rest" | null>(
    null,
  );
  const [mintingItemId, setMintingItemId] = useState<string | null>(null);
  const [isSyncingNfts, setIsSyncingNfts] = useState(false);
  const [purchaseFeedback, setPurchaseFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    getMintedAccessoryIdsAction().then((res) => {
      if (active && res.success) {
        setMintedItemIds(res.mintedItemIds);
      }
    });
    return () => {
      active = false;
    };
  }, [setMintedItemIds]);

  const handleMintAccessoryNft = async (item: CosmeticItem) => {
    if (!CALPAL_ACCESSORIES_CONTRACT_ADDRESS) {
      toast.error(
        "Kontrak CalPalAccessories belum dikonfigurasi. Deploy contracts/CalPalAccessories.sol terlebih dahulu.",
      );
      return;
    }

    if (!isConnected || !address) {
      toast.error("Hubungkan wallet EVM terlebih dahulu di tombol Connect Wallet.");
      return;
    }

    setMintingItemId(item.id);
    try {
      if (chainId !== TARGET_CHAIN.id) {
        await switchChainAsync({ chainId: TARGET_CHAIN.id });
      }

      const voucherRes = await requestAccessoryMintVoucherAction(item.id, address);
      if (!voucherRes.success || !voucherRes.voucher) {
        toast.error(voucherRes.message || "Gagal membuat voucher mint.");
        return;
      }

      const v = voucherRes.voucher;
      const txHash = await writeContractAsync({
        address: v.contractAddress,
        abi: CALPAL_ACCESSORIES_ABI,
        functionName: "mintWithVoucher",
        args: [
          BigInt(v.tokenId),
          BigInt(v.amount),
          BigInt(v.nonce),
          BigInt(v.deadline),
          v.signature,
        ],
        chainId: v.chainId,
      });

      toast.info("Transaksi dikirim! Memverifikasi ERC-1155 NFT di Base...");
      const verifyRes = await recordAccessoryMintAction({
        itemId: item.id,
        txHash,
        chainId: v.chainId,
      });

      if (verifyRes.success) {
        addMintedItem(item.id);
        toast.success(verifyRes.message);
      } else {
        toast.error(verifyRes.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("UserRejectedRequestError") || msg.includes("rejected")) {
        toast.error("Transaksi mint aksesoris dibatalkan.");
      } else {
        toast.error("Gagal mencetak NFT aksesoris. Pastikan saldo Base Sepolia ETH cukup.");
      }
    } finally {
      setMintingItemId(null);
    }
  };

  const handleSyncWalletNfts = async () => {
    if (!CALPAL_ACCESSORIES_CONTRACT_ADDRESS) {
      toast.error("Kontrak CalPalAccessories belum dikonfigurasi.");
      return;
    }

    setIsSyncingNfts(true);
    try {
      const res = await syncOnChainAccessoriesAction(address);
      if (res.success) {
        if (res.syncedItemIds.length > 0) {
          setOwnedItemIds([...ownedItemIds, ...res.syncedItemIds]);
          setMintedItemIds([...mintedItemIds, ...res.syncedItemIds]);
        }
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsSyncingNfts(false);
    }
  };

  const categories: { id: CosmeticCategory; label: string }[] = [
    { id: "head", label: "Topi & Kepala" },
    { id: "glasses", label: "Kacamata" },
    { id: "body", label: "Pakaian & Tas" },
    { id: "held", label: "Makanan & Minuman" },
    { id: "skin", label: "Skin & Aura" },
    { id: "room", label: "Dekorasi Ruangan" },
  ];

  const categoryItems = COSMETICS_CATALOG.filter(
    (item) => item.category === selectedCategory && !item.isDefaultFree,
  );

  const handleConfirmPurchase = async (itemToBuy: CosmeticItem) => {
    setIsPurchasing(true);

    try {
      // 1. Execute purchase via server action for DB persistence & race-condition safety
      const serverResult = await purchaseAccessoryAction(itemToBuy.id);

      if (serverResult.success) {
        if (serverResult.newCoins !== undefined) {
          setCoins(serverResult.newCoins);
        }
        addOwnedItem(itemToBuy.id);
        toastShopPurchased(itemToBuy.priceCoins);
        setPurchaseFeedback({
          success: true,
          message: serverResult.message,
        });
      } else {
        // Fallback for offline / guest mode if not authenticated
        if (serverResult.message.includes("login")) {
          const clientResult = buyItem(itemToBuy.id, coins, (amount) => {
            addCoins(amount);
          });
          if (clientResult.success) {
            toastShopPurchased(itemToBuy.priceCoins);
          }
          setPurchaseFeedback(clientResult);
        } else {
          setPurchaseFeedback({
            success: false,
            message: serverResult.message,
          });
        }
      }
    } catch (err: unknown) {
      setPurchaseFeedback({
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "Gagal memproses pembelian. Coba lagi.",
      });
    } finally {
      setIsPurchasing(false);
      setConfirmModalItem(null);
    }
  };

  const handleBuyFreeze = async () => {
    setBuyingPowerUp("freeze");
    try {
      const res = await buyStreakFreezeAction();
      if (res.success) {
        if (res.newCoins !== undefined) setCoins(res.newCoins);
        if (res.streakFreezes !== undefined) {
          setStreakMeta({ streakFreezes: res.streakFreezes });
        }
        toastShopPurchased(STREAK_RULES.FREEZE_PRICE_COINS);
      }
      setPurchaseFeedback({ success: res.success, message: res.message });
    } catch {
      setPurchaseFeedback({
        success: false,
        message: "Gagal membeli Streak Freeze.",
      });
    } finally {
      setBuyingPowerUp(null);
    }
  };

  const handleBuyRestPass = async () => {
    setBuyingPowerUp("rest");
    try {
      const res = await buyRestPassAction();
      if (res.success) {
        if (res.newCoins !== undefined) setCoins(res.newCoins);
        if (res.restPasses !== undefined) {
          setStreakMeta({ restPasses: res.restPasses });
        }
        toastShopPurchased(STREAK_RULES.REST_PASS_PRICE_COINS);
      }
      setPurchaseFeedback({ success: res.success, message: res.message });
    } catch {
      setPurchaseFeedback({
        success: false,
        message: "Gagal membeli Rest Day Pass.",
      });
    } finally {
      setBuyingPowerUp(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Purchase Feedback Toast (Squircle) */}
      {purchaseFeedback && (
        <div
          role="status"
          className={cn(
            "p-3.5 rounded-navigation border flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200",
            purchaseFeedback.success
              ? "bg-accent-green/15 border-accent-green/35 text-text-primary"
              : "bg-destructive/10 border-destructive/30 text-destructive",
          )}
        >
          <div className="flex items-center gap-2.5">
            {purchaseFeedback.success ? (
              <Check className="h-4 w-4 shrink-0 text-accent-green stroke-[2.5]" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive stroke-[2.5]" />
            )}
            <p className="font-semibold">{purchaseFeedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setPurchaseFeedback(null)}
            aria-label="Tutup notifikasi"
            className="p-1 rounded-navigation hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pelindung Streak (Power-Up) Section */}
      <section
        data-tour="shop-powerups"
        className="rounded-card border border-border-divider bg-surface p-4 sm:p-5 space-y-3 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-text-primary font-heading flex items-center gap-1.5">
              <Snowflake className="h-4 w-4 text-sky-500" />
              <span>Pelindung Streak (Power-Up)</span>
            </h2>
            <p className="text-[11px] text-text-muted">
              Lindungi konsistensi nutrisi harianmu dari hari sibuk atau akhir pekan santai.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-[#FCF8E3] border border-accent-orange/30 text-[11px] font-bold text-accent-orange-dark">
            <Coins className="h-3.5 w-3.5 text-accent-orange" />
            {coins} Koin
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Streak Freeze Card */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Snowflake className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-extrabold text-text-primary">Streak Freeze</p>
                  <span className="px-1.5 py-0.5 rounded-pill bg-sky-100 text-sky-700 text-[10px] font-bold">
                    {streakFreezes}/{STREAK_RULES.MAX_FREEZE_COUNT}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Otomatis menahan streak agar tidak putus saat terlewat 1 hari.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBuyFreeze}
              disabled={
                buyingPowerUp !== null ||
                streakFreezes >= STREAK_RULES.MAX_FREEZE_COUNT ||
                coins < STREAK_RULES.FREEZE_PRICE_COINS
              }
              className="shrink-0 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {buyingPowerUp === "freeze" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : streakFreezes >= STREAK_RULES.MAX_FREEZE_COUNT ? (
                <span>Penuh</span>
              ) : (
                <>
                  <Coins className="h-3 w-3" />
                  <span>{STREAK_RULES.FREEZE_PRICE_COINS}</span>
                </>
              )}
            </button>
          </div>

          {/* Rest Day / Weekend Pass Card */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-extrabold text-text-primary">Rest Day Pass</p>
                  <span className="px-1.5 py-0.5 rounded-pill bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                    {restPasses}/{STREAK_RULES.MAX_REST_PASS_COUNT}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Aktifkan hari istirahat terencana di kalender tanpa memutus streak.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBuyRestPass}
              disabled={
                buyingPowerUp !== null ||
                restPasses >= STREAK_RULES.MAX_REST_PASS_COUNT ||
                coins < STREAK_RULES.REST_PASS_PRICE_COINS
              }
              className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {buyingPowerUp === "rest" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : restPasses >= STREAK_RULES.MAX_REST_PASS_COUNT ? (
                <span>Penuh</span>
              ) : (
                <>
                  <Coins className="h-3 w-3" />
                  <span>{STREAK_RULES.REST_PASS_PRICE_COINS}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Category Filter Pills (Squircle) + On-Chain NFT Sync */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          data-tour="shop-categories"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "nav-item rounded-navigation px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border",
                selectedCategory === cat.id
                  ? "is-selected border-accent-orange font-bold shadow-2xs"
                  : "bg-surface text-neutral-10 border-border-default hover:bg-surface-subtle",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSyncWalletNfts}
          disabled={isSyncingNfts}
          className="inline-flex items-center gap-1.5 rounded-navigation border border-border-default bg-surface px-3 py-2 text-xs font-bold text-text-primary shadow-2xs transition-colors hover:bg-accent-green-light disabled:opacity-50"
          title="Sinkronkan aksesoris ERC-1155 yang kamu miliki di wallet ke lemari Caloria"
        >
          {isSyncingNfts ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span>Sync Wallet NFTs</span>
        </button>
      </div>

      {/* Shop Catalog Grid */}
      <div
        data-tour="shop-catalog"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {categoryItems.map((item) => {
          const isOwned = ownedItemIds.includes(item.id);
          const canAfford = coins >= item.priceCoins;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-card border bg-surface p-5 shadow-xs flex flex-col justify-between space-y-3 relative group transition-colors",
                isOwned
                  ? "border-accent-green/40 hover:border-accent-green"
                  : "border-border-divider hover:border-accent-orange/60",
              )}
            >
              {isOwned ? (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-accent-green/15 text-text-primary border border-accent-green/30 flex items-center gap-1">
                  <Check className="h-3 w-3 stroke-[3]" />
                  <span>Dimiliki</span>
                </span>
              ) : (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-surface-subtle text-neutral-10 border border-border-default flex items-center gap-1">
                  <Lock className="h-3 w-3 text-text-muted" />
                  <span>Terkunci</span>
                </span>
              )}

              {item.theme && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-[8px] text-[9px] font-bold uppercase bg-surface-subtle border border-border-divider text-text-muted">
                  {item.theme}
                </span>
              )}

              <div className="space-y-2 text-center pt-3">
                <div className="h-16 w-16 mx-auto flex items-center justify-center">
                  <AccessorySvgPreview itemId={item.id} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">
                  {item.name}
                </h3>
                <p className="text-[11px] text-neutral-10 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-border-divider space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-medium">Harga:</span>
                  <span className="font-extrabold text-accent-orange-dark flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-accent-orange" />
                    {item.priceCoins} Koin
                  </span>
                </div>

                {isOwned ? (
                  <div className="space-y-1.5">
                    <Link
                      href="/pet-customization/wardrobe"
                      className="w-full py-2 rounded-navigation bg-accent-yellow hover:bg-accent-green-light text-text-primary font-bold text-xs text-center flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Dandani Calpal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    {mintedItemIds.includes(item.id) ? (
                      <a
                        href={`/api/nft/accessory/${getAccessoryTokenId(item.id)}/image.svg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 rounded-navigation border border-accent-green/35 bg-accent-green/10 text-accent-green font-bold text-[11px] flex items-center justify-center gap-1 hover:bg-accent-green/20 transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>NFT On-Chain #{getAccessoryTokenId(item.id)}</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMintAccessoryNft(item)}
                        disabled={mintingItemId === item.id}
                        className="w-full py-1.5 rounded-navigation border border-border-default bg-surface-subtle hover:bg-accent-green-light text-text-primary font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {mintingItemId === item.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Mencetak NFT...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 text-accent-orange" />
                            <span>Mint NFT (ERC-1155)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmModalItem(item)}
                    className={cn(
                      "w-full py-2 rounded-navigation font-bold text-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 shadow-xs",
                      canAfford
                        ? "bg-accent-green hover:bg-accent-green/90 text-text-inverse"
                        : "bg-surface-subtle border border-border-default text-text-muted hover:bg-surface hover:text-text-primary",
                    )}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{canAfford ? "Beli Aksesoris" : "Lihat & Beli"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared Squircle Purchase Confirmation Modal */}
      <PurchaseModal
        item={confirmModalItem}
        userCoins={coins}
        isOpen={Boolean(confirmModalItem)}
        isPurchasing={isPurchasing}
        onClose={() => setConfirmModalItem(null)}
        onConfirm={handleConfirmPurchase}
      />
    </div>
  );
}
