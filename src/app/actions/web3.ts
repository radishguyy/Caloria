"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema/profiles";
import { pets } from "@/db/schema/pets";
import { plazaItems, userWardrobe } from "@/db/schema/pets-plaza";
import { eq, and, ne } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  parseEventLogs,
  verifyMessage,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "wagmi/chains";
import { buildWalletLinkMessage, TARGET_CHAIN } from "@/lib/web3/config";
import {
  ACCESSORY_VOUCHER_TYPES,
  CALPAL_ACCESSORIES_ABI,
  CALPAL_ACCESSORIES_CONTRACT_ADDRESS,
  CALPAL_PET_ABI,
  CALPAL_PET_CONTRACT_ADDRESS,
  getAccessoryVoucherDomain,
} from "@/lib/web3/contracts";
import {
  getAccessoryTokenId,
  getAllMintableAccessoryTokens,
} from "@/lib/web3/accessory-tokens";
import { ensurePlazaItemsSeeded } from "@/lib/plaza-sync";

export interface LinkedWalletResult {
  success: boolean;
  walletAddress: string | null;
  walletChainId: number | null;
  message?: string;
}

const SIGNATURE_MAX_AGE_MS = 10 * 60 * 1000;

export async function getLinkedWalletAction(): Promise<LinkedWalletResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        success: false,
        walletAddress: null,
        walletChainId: null,
        message: "Silakan login terlebih dahulu.",
      };
    }

    const [profile] = await db
      .select({
        walletAddress: profiles.walletAddress,
        walletChainId: profiles.walletChainId,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    return {
      success: true,
      walletAddress: profile?.walletAddress ?? null,
      walletChainId: profile?.walletChainId ?? null,
    };
  } catch (err) {
    console.error("[getLinkedWalletAction] Error:", err);
    return {
      success: false,
      walletAddress: null,
      walletChainId: null,
      message: "Gagal memuat status wallet.",
    };
  }
}

export async function linkWalletAction(input: {
  address: string;
  chainId: number;
  signature: `0x${string}`;
  issuedAt: string;
}): Promise<LinkedWalletResult> {
  try {
    if (!input?.address || !isAddress(input.address)) {
      return {
        success: false,
        walletAddress: null,
        walletChainId: null,
        message: "Alamat wallet tidak valid.",
      };
    }

    const issuedTimestamp = Date.parse(input.issuedAt);
    if (
      Number.isNaN(issuedTimestamp) ||
      Math.abs(Date.now() - issuedTimestamp) > SIGNATURE_MAX_AGE_MS
    ) {
      return {
        success: false,
        walletAddress: null,
        walletChainId: null,
        message: "Sesi tanda tangan kedaluwarsa. Silakan coba lagi.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        walletAddress: null,
        walletChainId: null,
        message: "Silakan login terlebih dahulu untuk menautkan wallet.",
      };
    }

    const checksumAddress = getAddress(input.address);
    const expectedMessage = buildWalletLinkMessage({
      userId: user.id,
      address: checksumAddress,
      issuedAt: input.issuedAt,
    });

    const isSignatureValid = await verifyMessage({
      address: checksumAddress,
      message: expectedMessage,
      signature: input.signature,
    });

    if (!isSignatureValid) {
      return {
        success: false,
        walletAddress: null,
        walletChainId: null,
        message: "Verifikasi tanda tangan wallet gagal.",
      };
    }

    const [conflict] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.walletAddress, checksumAddress),
          ne(profiles.id, user.id),
        ),
      )
      .limit(1);

    if (conflict) {
      return {
        success: false,
        walletAddress: null,
        walletChainId: null,
        message: "Wallet ini sudah ditautkan ke akun Caloria lain.",
      };
    }

    const chainId = Number.isFinite(input.chainId)
      ? input.chainId
      : TARGET_CHAIN.id;

    await db
      .update(profiles)
      .set({
        walletAddress: checksumAddress,
        walletChainId: chainId,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    return {
      success: true,
      walletAddress: checksumAddress,
      walletChainId: chainId,
      message: "Wallet berhasil diverifikasi dan ditautkan ke akunmu!",
    };
  } catch (err) {
    console.error("[linkWalletAction] Error:", err);
    return {
      success: false,
      walletAddress: null,
      walletChainId: null,
      message: "Terjadi kesalahan saat menautkan wallet.",
    };
  }
}

export async function unlinkWalletAction(): Promise<LinkedWalletResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        walletAddress: null,
        walletChainId: null,
        message: "Silakan login terlebih dahulu.",
      };
    }

    await db
      .update(profiles)
      .set({
        walletAddress: null,
        walletChainId: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    return {
      success: true,
      walletAddress: null,
      walletChainId: null,
      message: "Tautan wallet berhasil dilepas.",
    };
  } catch (err) {
    console.error("[unlinkWalletAction] Error:", err);
    return {
      success: false,
      walletAddress: null,
      walletChainId: null,
      message: "Gagal melepas tautan wallet.",
    };
  }
}

export interface PetNftStatusResult {
  success: boolean;
  nftTokenId: number | null;
  nftContractAddress: string | null;
  nftChainId: number | null;
  mintTxHash: string | null;
  mintStatus: "unminted" | "minting" | "minted";
  message?: string;
}

export async function getPetNftStatusAction(): Promise<PetNftStatusResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        success: false,
        nftTokenId: null,
        nftContractAddress: null,
        nftChainId: null,
        mintTxHash: null,
        mintStatus: "unminted",
        message: "Silakan login terlebih dahulu.",
      };
    }

    const [pet] = await db
      .select({
        nftTokenId: pets.nftTokenId,
        nftContractAddress: pets.nftContractAddress,
        nftChainId: pets.nftChainId,
        mintTxHash: pets.mintTxHash,
        mintStatus: pets.mintStatus,
      })
      .from(pets)
      .where(eq(pets.userId, user.id))
      .limit(1);

    return {
      success: true,
      nftTokenId: pet?.nftTokenId ?? null,
      nftContractAddress: pet?.nftContractAddress ?? null,
      nftChainId: pet?.nftChainId ?? null,
      mintTxHash: pet?.mintTxHash ?? null,
      mintStatus:
        (pet?.mintStatus as "unminted" | "minting" | "minted") || "unminted",
    };
  } catch (err) {
    console.error("[getPetNftStatusAction] Error:", err);
    return {
      success: false,
      nftTokenId: null,
      nftContractAddress: null,
      nftChainId: null,
      mintTxHash: null,
      mintStatus: "unminted",
      message: "Gagal memuat status NFT CalPal.",
    };
  }
}

export async function recordPetMintAction(input: {
  txHash: `0x${string}`;
  chainId?: number;
  contractAddress?: string;
}): Promise<PetNftStatusResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        nftTokenId: null,
        nftContractAddress: null,
        nftChainId: null,
        mintTxHash: null,
        mintStatus: "unminted",
        message: "Silakan login terlebih dahulu.",
      };
    }

    const expectedContract =
      input.contractAddress && isAddress(input.contractAddress)
        ? getAddress(input.contractAddress)
        : CALPAL_PET_CONTRACT_ADDRESS;

    if (!expectedContract) {
      return {
        success: false,
        nftTokenId: null,
        nftContractAddress: null,
        nftChainId: null,
        mintTxHash: null,
        mintStatus: "unminted",
        message: "Alamat kontrak CalPalPet belum dikonfigurasi.",
      };
    }

    const chainId = input.chainId || TARGET_CHAIN.id;
    const chain = chainId === base.id ? base : baseSepolia;
    const rpcUrl =
      chainId === base.id
        ? process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
        : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: input.txHash,
      timeout: 30_000,
    });

    if (receipt.status !== "success") {
      return {
        success: false,
        nftTokenId: null,
        nftContractAddress: null,
        nftChainId: chainId,
        mintTxHash: input.txHash,
        mintStatus: "unminted",
        message: "Transaksi mint gagal di blockchain.",
      };
    }

    if (
      !receipt.to ||
      getAddress(receipt.to) !== getAddress(expectedContract)
    ) {
      return {
        success: false,
        nftTokenId: null,
        nftContractAddress: null,
        nftChainId: chainId,
        mintTxHash: input.txHash,
        mintStatus: "unminted",
        message: "Transaksi tidak sesuai dengan kontrak CalPalPet.",
      };
    }

    const parsedLogs = parseEventLogs({
      abi: CALPAL_PET_ABI,
      logs: receipt.logs,
    });

    const mintLog =
      parsedLogs.find((l) => l.eventName === "PetMinted") ||
      parsedLogs.find((l) => l.eventName === "Transfer");

    const tokenIdBigInt =
      mintLog && "tokenId" in mintLog.args ? mintLog.args.tokenId : null;

    if (tokenIdBigInt === null || tokenIdBigInt === undefined) {
      return {
        success: false,
        nftTokenId: null,
        nftContractAddress: expectedContract,
        nftChainId: chainId,
        mintTxHash: input.txHash,
        mintStatus: "unminted",
        message: "Event tokenId tidak ditemukan pada log transaksi.",
      };
    }

    const tokenId = Number(tokenIdBigInt);
    const minterAddress = getAddress(receipt.from);

    // Ensure profile walletAddress is also linked if empty
    const [profile] = await db
      .select({ walletAddress: profiles.walletAddress })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (
      profile?.walletAddress &&
      getAddress(profile.walletAddress) !== minterAddress
    ) {
      return {
        success: false,
        nftTokenId: null,
        nftContractAddress: expectedContract,
        nftChainId: chainId,
        mintTxHash: input.txHash,
        mintStatus: "unminted",
        message:
          "Wallet pengirim transaksi tidak cocok dengan wallet yang ditautkan ke akunmu.",
      };
    }

    await db
      .update(pets)
      .set({
        nftTokenId: tokenId,
        nftContractAddress: expectedContract,
        nftChainId: chainId,
        mintTxHash: input.txHash,
        mintStatus: "minted",
        mintedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pets.userId, user.id));

    return {
      success: true,
      nftTokenId: tokenId,
      nftContractAddress: expectedContract,
      nftChainId: chainId,
      mintTxHash: input.txHash,
      mintStatus: "minted",
      message: `CalPal Soulbound NFT #${tokenId} berhasil diverifikasi on-chain!`,
    };
  } catch (err) {
    console.error("[recordPetMintAction] Error:", err);
    return {
      success: false,
      nftTokenId: null,
      nftContractAddress: null,
      nftChainId: null,
      mintTxHash: input.txHash,
      mintStatus: "unminted",
      message: "Gagal memverifikasi transaksi mint di blockchain.",
    };
  }
}

// ============================================================================
// Phase 3: Tradeable ERC-1155 Accessories — EIP-712 Lazy Mint & On-Chain Sync
// ============================================================================

export interface AccessoryMintVoucherResult {
  success: boolean;
  voucher?: {
    to: `0x${string}`;
    tokenId: number;
    amount: number;
    nonce: number;
    deadline: number;
    signature: `0x${string}`;
    contractAddress: `0x${string}`;
    chainId: number;
  };
  message?: string;
}

export async function getMintedAccessoryIdsAction(): Promise<{
  success: boolean;
  mintedItemIds: string[];
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, mintedItemIds: [] };
    }

    const rows = await db
      .select({
        assetUrl: plazaItems.assetUrl,
        isMintedOnChain: userWardrobe.isMintedOnChain,
      })
      .from(userWardrobe)
      .innerJoin(plazaItems, eq(userWardrobe.itemId, plazaItems.id))
      .where(
        and(
          eq(userWardrobe.userId, user.id),
          eq(userWardrobe.isMintedOnChain, true),
        ),
      );

    return {
      success: true,
      mintedItemIds: rows.map((r) => r.assetUrl),
    };
  } catch (err) {
    console.error("[getMintedAccessoryIdsAction] Error:", err);
    return { success: false, mintedItemIds: [] };
  }
}

export async function requestAccessoryMintVoucherAction(
  itemId: string,
  walletAddressOverride?: string,
): Promise<AccessoryMintVoucherResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Silakan login terlebih dahulu.",
      };
    }

    if (!CALPAL_ACCESSORIES_CONTRACT_ADDRESS) {
      return {
        success: false,
        message:
          "Kontrak CalPalAccessories belum dikonfigurasi. Set NEXT_PUBLIC_CALPAL_ACCESSORIES_CONTRACT_ADDRESS.",
      };
    }

    const signerKey = process.env.NFT_VOUCHER_SIGNER_PRIVATE_KEY?.trim();
    if (!signerKey || !signerKey.startsWith("0x") || signerKey.length !== 66) {
      return {
        success: false,
        message:
          "NFT_VOUCHER_SIGNER_PRIVATE_KEY belum dikonfigurasi di server (.env.local).",
      };
    }

    const tokenId = getAccessoryTokenId(itemId);
    if (!tokenId) {
      return {
        success: false,
        message: "Item ini tidak tersedia untuk dicetak sebagai ERC-1155 NFT.",
      };
    }

    await ensurePlazaItemsSeeded();

    // Verify user owns this item in user_wardrobe and hasn't already minted it
    const [owned] = await db
      .select({
        wardrobeId: userWardrobe.id,
        isMintedOnChain: userWardrobe.isMintedOnChain,
      })
      .from(userWardrobe)
      .innerJoin(plazaItems, eq(userWardrobe.itemId, plazaItems.id))
      .where(
        and(
          eq(userWardrobe.userId, user.id),
          eq(plazaItems.assetUrl, itemId),
        ),
      )
      .limit(1);

    if (!owned) {
      return {
        success: false,
        message: "Kamu harus membeli aksesoris ini terlebih dahulu di Toko Calpal.",
      };
    }

    if (owned.isMintedOnChain) {
      return {
        success: false,
        message: "Aksesoris ini sudah dicetak on-chain sebagai NFT!",
      };
    }

    const [profile] = await db
      .select({ walletAddress: profiles.walletAddress })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const targetWallet = profile?.walletAddress || walletAddressOverride;
    if (!targetWallet || !isAddress(targetWallet)) {
      return {
        success: false,
        message: "Hubungkan dan tautkan wallet EVM terlebih dahulu.",
      };
    }

    const toAddress = getAddress(targetWallet);
    const amount = 1;
    // Deterministic unique nonce per user/tokenId timestamp window
    const nonce = Date.now() * 1000 + tokenId;
    const deadline = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes
    const chainId = TARGET_CHAIN.id;

    const signerAccount = privateKeyToAccount(signerKey as `0x${string}`);
    const signature = await signerAccount.signTypedData({
      domain: getAccessoryVoucherDomain(
        chainId,
        CALPAL_ACCESSORIES_CONTRACT_ADDRESS,
      ),
      types: ACCESSORY_VOUCHER_TYPES,
      primaryType: "MintVoucher",
      message: {
        to: toAddress,
        tokenId: BigInt(tokenId),
        amount: BigInt(amount),
        nonce: BigInt(nonce),
        deadline: BigInt(deadline),
      },
    });

    return {
      success: true,
      voucher: {
        to: toAddress,
        tokenId,
        amount,
        nonce,
        deadline,
        signature,
        contractAddress: CALPAL_ACCESSORIES_CONTRACT_ADDRESS,
        chainId,
      },
    };
  } catch (err) {
    console.error("[requestAccessoryMintVoucherAction] Error:", err);
    return {
      success: false,
      message: "Gagal membuat voucher mint EIP-712.",
    };
  }
}

export async function recordAccessoryMintAction(input: {
  itemId: string;
  txHash: `0x${string}`;
  chainId?: number;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Silakan login terlebih dahulu." };
    }

    if (!CALPAL_ACCESSORIES_CONTRACT_ADDRESS) {
      return {
        success: false,
        message: "Alamat kontrak CalPalAccessories belum dikonfigurasi.",
      };
    }

    const expectedTokenId = getAccessoryTokenId(input.itemId);
    if (!expectedTokenId) {
      return { success: false, message: "ID aksesoris tidak valid." };
    }

    const chainId = input.chainId || TARGET_CHAIN.id;
    const chain = chainId === base.id ? base : baseSepolia;
    const rpcUrl =
      chainId === base.id
        ? process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
        : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: input.txHash,
      timeout: 30_000,
    });

    if (receipt.status !== "success") {
      return { success: false, message: "Transaksi mint aksesoris gagal di blockchain." };
    }

    if (
      !receipt.to ||
      getAddress(receipt.to) !== getAddress(CALPAL_ACCESSORIES_CONTRACT_ADDRESS)
    ) {
      return {
        success: false,
        message: "Transaksi tidak sesuai dengan kontrak CalPalAccessories.",
      };
    }

    const parsedLogs = parseEventLogs({
      abi: CALPAL_ACCESSORIES_ABI,
      logs: receipt.logs,
    });

    const matchedMint = parsedLogs.find((log) => {
      if (log.eventName === "AccessoryMinted" && "tokenId" in log.args) {
        return Number(log.args.tokenId) === expectedTokenId;
      }
      if (log.eventName === "TransferSingle" && "id" in log.args) {
        return Number(log.args.id) === expectedTokenId;
      }
      return false;
    });

    if (!matchedMint) {
      return {
        success: false,
        message: "Event mint ERC-1155 untuk item ini tidak ditemukan di log transaksi.",
      };
    }

    const [plazaItem] = await db
      .select({ id: plazaItems.id })
      .from(plazaItems)
      .where(eq(plazaItems.assetUrl, input.itemId))
      .limit(1);

    if (!plazaItem) {
      return { success: false, message: "Item tidak ditemukan di katalog database." };
    }

    await db
      .update(userWardrobe)
      .set({
        isMintedOnChain: true,
        mintTxHash: input.txHash,
        mintedAt: new Date(),
      })
      .where(
        and(
          eq(userWardrobe.userId, user.id),
          eq(userWardrobe.itemId, plazaItem.id),
        ),
      );

    return {
      success: true,
      message: `Aksesoris ERC-1155 #${expectedTokenId} berhasil dicetak dan diverifikasi on-chain!`,
    };
  } catch (err) {
    console.error("[recordAccessoryMintAction] Error:", err);
    return {
      success: false,
      message: "Gagal memverifikasi transaksi mint aksesoris.",
    };
  }
}

export async function syncOnChainAccessoriesAction(
  walletAddressOverride?: string,
): Promise<{
  success: boolean;
  syncedItemIds: string[];
  newlyUnlockedCount: number;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        syncedItemIds: [],
        newlyUnlockedCount: 0,
        message: "Silakan login terlebih dahulu.",
      };
    }

    if (!CALPAL_ACCESSORIES_CONTRACT_ADDRESS) {
      return {
        success: false,
        syncedItemIds: [],
        newlyUnlockedCount: 0,
        message: "Kontrak CalPalAccessories belum dikonfigurasi.",
      };
    }

    const [profile] = await db
      .select({ walletAddress: profiles.walletAddress })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const targetWallet = profile?.walletAddress || walletAddressOverride;
    if (!targetWallet || !isAddress(targetWallet)) {
      return {
        success: false,
        syncedItemIds: [],
        newlyUnlockedCount: 0,
        message: "Hubungkan wallet terlebih dahulu untuk sinkronisasi NFT.",
      };
    }

    const checksumWallet = getAddress(targetWallet);
    const allTokens = getAllMintableAccessoryTokens();
    const accounts = allTokens.map(() => checksumWallet);
    const ids = allTokens.map((t) => BigInt(t.tokenId));

    const chain = TARGET_CHAIN.id === base.id ? base : baseSepolia;
    const rpcUrl =
      TARGET_CHAIN.id === base.id
        ? process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
        : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const balances = await publicClient.readContract({
      address: CALPAL_ACCESSORIES_CONTRACT_ADDRESS,
      abi: CALPAL_ACCESSORIES_ABI,
      functionName: "balanceOfBatch",
      args: [accounts, ids],
    });

    const heldItemIds: string[] = [];
    balances.forEach((bal, idx) => {
      if (bal > BigInt(0)) {
        heldItemIds.push(allTokens[idx].item.id);
      }
    });

    if (heldItemIds.length === 0) {
      return {
        success: true,
        syncedItemIds: [],
        newlyUnlockedCount: 0,
        message: "Tidak ditemukan NFT aksesoris CalPal di wallet ini.",
      };
    }

    await ensurePlazaItemsSeeded();

    const allPlaza = await db
      .select({ id: plazaItems.id, assetUrl: plazaItems.assetUrl })
      .from(plazaItems);
    const plazaByAsset = new Map(allPlaza.map((p) => [p.assetUrl, p.id]));

    let newlyUnlockedCount = 0;

    for (const itemId of heldItemIds) {
      const plazaId = plazaByAsset.get(itemId);
      if (!plazaId) continue;

      const [existing] = await db
        .select({ id: userWardrobe.id, isMintedOnChain: userWardrobe.isMintedOnChain })
        .from(userWardrobe)
        .where(
          and(
            eq(userWardrobe.userId, user.id),
            eq(userWardrobe.itemId, plazaId),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(userWardrobe).values({
          userId: user.id,
          itemId: plazaId,
          isMintedOnChain: true,
          mintedAt: new Date(),
        });
        newlyUnlockedCount += 1;
      } else if (!existing.isMintedOnChain) {
        await db
          .update(userWardrobe)
          .set({ isMintedOnChain: true, mintedAt: new Date() })
          .where(eq(userWardrobe.id, existing.id));
      }
    }

    return {
      success: true,
      syncedItemIds: heldItemIds,
      newlyUnlockedCount,
      message:
        newlyUnlockedCount > 0
          ? `Sinkronisasi selesai! ${newlyUnlockedCount} aksesoris NFT baru terbuka di lemarimu.`
          : `Sinkronisasi selesai! ${heldItemIds.length} aksesoris NFT terverifikasi di walletmu.`,
    };
  } catch (err) {
    console.error("[syncOnChainAccessoriesAction] Error:", err);
    return {
      success: false,
      syncedItemIds: [],
      newlyUnlockedCount: 0,
      message: "Gagal membaca saldo ERC-1155 dari blockchain.",
    };
  }
}
