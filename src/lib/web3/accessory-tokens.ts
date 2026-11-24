import { COSMETICS_CATALOG, type CosmeticItem } from "@/lib/cosmetics-catalog";

/**
 * Deterministic ERC-1155 Token ID registry for all purchasable CalPal cosmetics.
 * Default free "*-none" / "*-default" items are excluded because they are base states.
 */
const MINTABLE_COSMETICS: CosmeticItem[] = COSMETICS_CATALOG.filter(
  (item) => !item.isDefaultFree,
);

const ITEM_ID_TO_TOKEN_ID = new Map<string, number>();
const TOKEN_ID_TO_ITEM = new Map<number, CosmeticItem>();

MINTABLE_COSMETICS.forEach((item, index) => {
  const tokenId = index + 1;
  ITEM_ID_TO_TOKEN_ID.set(item.id, tokenId);
  TOKEN_ID_TO_ITEM.set(tokenId, item);
});

export function getAccessoryTokenId(itemId: string): number | null {
  return ITEM_ID_TO_TOKEN_ID.get(itemId) ?? null;
}

export function getAccessoryByTokenId(tokenId: number): CosmeticItem | null {
  return TOKEN_ID_TO_ITEM.get(tokenId) ?? null;
}

export function getAllMintableAccessoryTokens(): Array<{
  tokenId: number;
  item: CosmeticItem;
}> {
  return Array.from(TOKEN_ID_TO_ITEM.entries()).map(([tokenId, item]) => ({
    tokenId,
    item,
  }));
}
