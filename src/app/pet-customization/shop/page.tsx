"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CircleDollarSign,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldMinus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { usePetStore } from "@/store/use-pet-store";
import { useCosmeticsStore } from "@/store/use-cosmetics-store";
import { useSocialStore } from "@/store/use-social-store";
import { buyStreakFreezeAction, buyRestPassAction } from "@/app/actions/streak";
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
  const [expandedPowerUps, setExpandedPowerUps] = useState<{
    freeze: boolean;
    rest: boolean;
  }>({
    freeze: false,
    rest: false,
  });
  const [mintingItemId, setMintingItemId] = useState<string | null>(null);
  const [isSyncingNfts, setIsSyncingNfts] = useState(false);
  const [purchaseFeedback, setPurchaseFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const togglePowerUpDescription = (key: "freeze" | "rest") => {
    setExpandedPowerUps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
      toast.error(
        "Hubungkan wallet EVM terlebih dahulu di tombol Connect Wallet.",
      );
      return;
    }

    setMintingItemId(item.id);
    try {
      if (chainId !== TARGET_CHAIN.id) {
        await switchChainAsync({ chainId: TARGET_CHAIN.id });
      }

      const voucherRes = await requestAccessoryMintVoucherAction(
        item.id,
        address,
      );
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
      if (
        msg.includes("UserRejectedRequestError") ||
        msg.includes("rejected")
      ) {
        toast.error("Transaksi mint aksesoris dibatalkan.");
      } else {
        toast.error(
          "Gagal mencetak NFT aksesoris. Pastikan saldo Base Sepolia ETH cukup.",
        );
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
        message: "Gagal membeli Pembeku Streak.",
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
        message: "Gagal membeli Kupon Jeda.",
      });
    } finally {
      setBuyingPowerUp(null);
    }
  };

  const powerUpItems = [
    {
      key: "freeze" as const,
      name: "Pembeku Streak",
      description: "Menjaga streak tetap menyala saat lupa mencatat",
      count: streakFreezes,
      maxCount: STREAK_RULES.MAX_FREEZE_COUNT,
      price: STREAK_RULES.FREEZE_PRICE_COINS,
      onBuy: handleBuyFreeze,
    },
    {
      key: "rest" as const,
      name: "Kupon Jeda",
      description: "Jadwalkan hari istirahat tanpa kehilangan streak-mu",
      count: restPasses,
      maxCount: STREAK_RULES.MAX_REST_PASS_COUNT,
      price: STREAK_RULES.REST_PASS_PRICE_COINS,
      onBuy: handleBuyRestPass,
    },
  ];

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
              <Check
                className="h-4 w-4 shrink-0 text-accent-green stroke-[2.5]"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="h-4 w-4 shrink-0 text-destructive stroke-[2.5]"
                aria-hidden="true"
              />
            )}
            <p className="font-semibold">{purchaseFeedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setPurchaseFeedback(null)}
            aria-label="Tutup notifikasi"
            className="p-1.5 rounded-navigation text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Power-Up Section */}
      <section
        data-tour="shop-powerups"
        className="rounded-card border border-border-divider bg-surface p-5 sm:p-6 space-y-4 shadow-xs"
      >
        <div className="flex items-center">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-primary font-heading flex items-center gap-2">
            <ShieldMinus
              className="h-5 w-5 text-accent-green shrink-0"
              aria-hidden="true"
            />
            <span>Power-Up</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {powerUpItems.map((powerUp) => {
            const isExpanded = expandedPowerUps[powerUp.key];
            const isMaxed = powerUp.count >= powerUp.maxCount;
            const isBuying = buyingPowerUp === powerUp.key;
            const descId = `powerup-desc-${powerUp.key}`;

            return (
              <div
                key={powerUp.key}
                className="rounded-button border border-border-divider bg-surface-subtle p-4 sm:p-5 flex flex-col justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center flex-wrap gap-2 min-w-0">
                    <p className="text-base sm:text-lg font-extrabold text-text-primary leading-snug">
                      {powerUp.name}
                    </p>
                    <span className="inline-flex items-center rounded-pill border border-border-default bg-surface px-2.5 py-0.5 text-xs font-bold text-neutral-10 tabular-nums">
                      {powerUp.count}/{powerUp.maxCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePowerUpDescription(powerUp.key)}
                      aria-expanded={isExpanded}
                      aria-controls={descId}
                      aria-label={
                        isExpanded
                          ? `Sembunyikan deskripsi ${powerUp.name}`
                          : `Lihat deskripsi ${powerUp.name}`
                      }
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-navigation border border-border-default bg-surface text-text-muted transition-colors hover:bg-accent-green-light hover:text-text-primary"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={powerUp.onBuy}
                    disabled={
                      buyingPowerUp !== null || isMaxed || coins < powerUp.price
                    }
                    className="button-primary inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs shrink-0"
                  >
                    {isBuying ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : isMaxed ? (
                      <span>Penuh</span>
                    ) : (
                      <>
                        <CircleDollarSign
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="tabular-nums">{powerUp.price}</span>
                      </>
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <p
                    id={descId}
                    className="text-xs sm:text-sm text-neutral-10 leading-relaxed pt-1"
                  >
                    {powerUp.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Category Filter Tabs + On-Chain NFT Sync */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div
          data-tour="shop-categories"
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={isActive}
                className={cn(
                  "nav-item rounded-navigation px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer",
                  isActive
                    ? "is-selected border-accent-orange font-bold shadow-2xs"
                    : "bg-surface text-neutral-10 border-border-default hover:bg-accent-green-light hover:text-text-primary",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSyncWalletNfts}
          disabled={isSyncingNfts}
          className="inline-flex items-center gap-1.5 rounded-navigation border border-border-default bg-surface px-3 py-2 text-xs font-bold text-text-primary shadow-2xs transition-colors hover:bg-accent-green-light disabled:opacity-50"
          title="Sinkronkan aksesoris ERC-1155 yang kamu miliki di wallet ke lemari Caloria"
        >
          {isSyncingNfts ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
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
                "rounded-card border bg-surface p-5 shadow-xs flex flex-col justify-between gap-4 relative transition-colors",
                isOwned
                  ? "border-accent-green/40 hover:border-accent-green"
                  : "border-border-divider hover:border-accent-orange/60",
              )}
            >
              {isOwned && (
                <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-pill text-[11px] font-bold bg-accent-green/15 text-text-primary border border-accent-green/30 flex items-center gap-1">
                  <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                  <span>Dimiliki</span>
                </span>
              )}

              <div className="flex flex-col items-center text-center gap-3 pt-4">
                <div className="h-28 w-28 sm:h-32 sm:w-32 mx-auto flex items-center justify-center">
                  <AccessorySvgPreview
                    itemId={item.id}
                    className="h-full w-full"
                  />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-text-primary leading-snug">
                  {item.name}
                </h3>
              </div>

              <div className="space-y-3 mt-auto">
                <div className="flex items-center justify-center gap-1.5 text-sm sm:text-base font-extrabold text-accent-orange-dark">
                  <CircleDollarSign
                    className="h-4 w-4 sm:h-5 sm:w-5 text-accent-orange shrink-0"
                    aria-hidden="true"
                  />
                  <span className="tabular-nums">{item.priceCoins} Koin</span>
                </div>

                {isOwned ? (
                  <div className="space-y-2">
                    <Link
                      href="/pet-customization/wardrobe"
                      className="w-full py-2 px-3 rounded-navigation bg-accent-yellow hover:bg-accent-green-light text-text-primary font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Dandani Calpal</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>

                    {mintedItemIds.includes(item.id) ? (
                      <a
                        href={`/api/nft/accessory/${getAccessoryTokenId(item.id)}/image.svg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 px-3 rounded-navigation border border-accent-green/35 bg-accent-green/10 text-accent-green font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-accent-green/20 transition-colors"
                      >
                        <ShieldCheck
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          NFT On-Chain #{getAccessoryTokenId(item.id)}
                        </span>
                        <ExternalLink
                          className="h-3 w-3 opacity-70 shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMintAccessoryNft(item)}
                        disabled={mintingItemId === item.id}
                        className="w-full py-1.5 px-3 rounded-navigation border border-border-default bg-surface-subtle hover:bg-accent-green-light text-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {mintingItemId === item.id ? (
                          <>
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                            <span>Mencetak NFT...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles
                              className="h-3.5 w-3.5 text-accent-orange"
                              aria-hidden="true"
                            />
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
                      "w-full py-2.5 px-4 rounded-button font-bold text-sm transition-all flex items-center justify-center gap-1.5",
                      canAfford
                        ? "button-primary"
                        : "bg-surface-subtle border border-border-default text-text-muted hover:bg-surface hover:text-text-primary",
                    )}
                  >
                    Beli
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
