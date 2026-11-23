import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const isMainnet = process.env.NEXT_PUBLIC_CHAIN_ENV === "mainnet";

export const TARGET_CHAIN = isMainnet ? base : baseSepolia;

export const SUPPORTED_CHAINS = [baseSepolia, base] as const;

const baseSepoliaRpcUrl =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const baseMainnetRpcUrl =
  process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  ssr: true,
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
    [base.id]: http(baseMainnetRpcUrl),
  },
});

export function shortenAddress(address?: string | null, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function getExplorerAddressUrl(
  address: string,
  chainId: number = TARGET_CHAIN.id,
): string {
  const explorerBase =
    chainId === base.id
      ? "https://basescan.org"
      : "https://sepolia.basescan.org";
  return `${explorerBase}/address/${address}`;
}

export function buildWalletLinkMessage(params: {
  userId: string;
  address: string;
  issuedAt: string;
}): string {
  return [
    "Caloria — Verifikasi Kepemilikan Wallet",
    "",
    "Tanda tangani pesan ini untuk menautkan wallet EVM ke akun Caloria kamu.",
    "Aksi ini gratis dan tidak memakan gas fee.",
    "",
    `User ID: ${params.userId}`,
    `Wallet: ${params.address.toLowerCase()}`,
    `Issued At: ${params.issuedAt}`,
  ].join("\n");
}
