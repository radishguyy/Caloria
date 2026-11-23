import { NextRequest, NextResponse } from "next/server";
import { getAccessoryByTokenId } from "@/lib/web3/accessory-tokens";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tokenId: string }> },
) {
  const { tokenId: rawTokenId } = await context.params;
  const tokenId = Number(rawTokenId);

  if (!Number.isInteger(tokenId) || tokenId <= 0) {
    return NextResponse.json({ error: "Invalid tokenId" }, { status: 400 });
  }

  const item = getAccessoryByTokenId(tokenId);
  if (!item) {
    return NextResponse.json({ error: "Accessory NFT not found" }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const metadata = {
    name: `${item.nameEn || item.name} (#${tokenId})`,
    description: `${item.description} Tradeable ERC-1155 wearable accessory for Caloria CalPal companions.`,
    image: `${baseUrl}/api/nft/accessory/${tokenId}/image.svg`,
    external_url: `${baseUrl}/pet-customization/shop`,
    attributes: [
      { trait_type: "Category", value: item.category },
      { trait_type: "Theme", value: item.theme || "special" },
      { trait_type: "Catalog ID", value: item.id },
      { display_type: "number", trait_type: "Shop Price (Coins)", value: item.priceCoins },
      { trait_type: "Tradeable", value: "Yes" },
    ],
  };

  return NextResponse.json(metadata, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
