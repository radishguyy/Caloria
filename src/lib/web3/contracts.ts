import { base } from "wagmi/chains";
import { isAddress } from "viem";
import { TARGET_CHAIN } from "./config";

const rawPetContract = process.env.NEXT_PUBLIC_CALPAL_PET_CONTRACT_ADDRESS?.trim() || "";
const rawAccessoriesContract =
  process.env.NEXT_PUBLIC_CALPAL_ACCESSORIES_CONTRACT_ADDRESS?.trim() || "";

export const CALPAL_PET_CONTRACT_ADDRESS: `0x${string}` | null = isAddress(rawPetContract)
  ? (rawPetContract as `0x${string}`)
  : null;

export const CALPAL_ACCESSORIES_CONTRACT_ADDRESS: `0x${string}` | null = isAddress(
  rawAccessoriesContract,
)
  ? (rawAccessoriesContract as `0x${string}`)
  : null;

export const CALPAL_PET_ABI = [
  {
    type: "function",
    name: "mintPet",
    stateMutability: "nonpayable",
    inputs: [{ name: "speciesId", type: "string" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenOfOwner",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "locked",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "petSpecies",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "contractOwner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "emitMetadataUpdate",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "event",
    name: "Transfer",
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "PetMinted",
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "speciesId", type: "string" },
    ],
  },
  {
    type: "event",
    name: "Locked",
    anonymous: false,
    inputs: [{ indexed: false, name: "tokenId", type: "uint256" }],
  },
] as const;

function getExplorerBase(chainId: number = TARGET_CHAIN.id): string {
  return chainId === base.id
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";
}

export function getExplorerTxUrl(
  txHash: string,
  chainId: number = TARGET_CHAIN.id,
): string {
  return `${getExplorerBase(chainId)}/tx/${txHash}`;
}

export function getExplorerTokenUrl(
  contractAddress: string,
  tokenId: number,
  chainId: number = TARGET_CHAIN.id,
): string {
  return `${getExplorerBase(chainId)}/token/${contractAddress}?a=${tokenId}`;
}

export const CALPAL_ACCESSORIES_ABI = [
  {
    type: "function",
    name: "mintWithVoucher",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOfBatch",
    stateMutability: "view",
    inputs: [
      { name: "accounts", type: "address[]" },
      { name: "ids", type: "uint256[]" },
    ],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "uri",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "event",
    name: "TransferSingle",
    anonymous: false,
    inputs: [
      { indexed: true, name: "operator", type: "address" },
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "id", type: "uint256" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "AccessoryMinted",
    anonymous: false,
    inputs: [
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "nonce", type: "uint256" },
    ],
  },
] as const;

export const ACCESSORY_VOUCHER_TYPES = {
  MintVoucher: [
    { name: "to", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export function getAccessoryVoucherDomain(
  chainId: number,
  verifyingContract: `0x${string}`,
) {
  return {
    name: "CalPalAccessories",
    version: "1",
    chainId,
    verifyingContract,
  } as const;
}
