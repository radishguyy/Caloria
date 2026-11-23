import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pets, userLoadouts } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getAccessoryDefinition,
  getCharacterDefinition,
} from "@/lib/character-assets/catalog";
import { sanitizeCharacterId } from "@/lib/character-assets/config-schema";
import { COSMETICS_CATALOG } from "@/lib/cosmetics-catalog";

function resolveItemLabel(itemId?: string | null): string {
  if (
    !itemId ||
    itemId.endsWith("-none") ||
    itemId === "skin-default" ||
    itemId === "room-default"
  ) {
    return "None";
  }
  const acc = getAccessoryDefinition(itemId);
  if (acc) return acc.nameEn || acc.name;
  const cosmetic = COSMETICS_CATALOG.find((c) => c.id === itemId);
  return cosmetic?.nameEn || cosmetic?.name || itemId;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tokenId: string }> },
) {
  const { tokenId: rawTokenId } = await context.params;
  const tokenId = Number(rawTokenId);

  if (!Number.isInteger(tokenId) || tokenId <= 0) {
    return NextResponse.json({ error: "Invalid tokenId" }, { status: 400 });
  }

  try {
    const [pet] = await db
      .select()
      .from(pets)
      .where(eq(pets.nftTokenId, tokenId))
      .limit(1);

    if (!pet) {
      return NextResponse.json({ error: "CalPal NFT not found" }, { status: 404 });
    }

    const [loadout] = await db
      .select()
      .from(userLoadouts)
      .where(eq(userLoadouts.userId, pet.userId))
      .limit(1);

    const charId = sanitizeCharacterId(pet.species || pet.characterId);
    const charDef = getCharacterDefinition(charId);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const stageLabel = (pet.stage || "hatchling").replace(/^\w/, (c) =>
      c.toUpperCase(),
    );

    const metadata = {
      name: `${pet.name} #${tokenId}`,
      description: `Soulbound CalPal companion on Caloria — Level ${pet.level} ${charDef.speciesLabel}. Evolves dynamically as its owner tracks daily nutrition.`,
      image: `${baseUrl}/api/nft/pet/${tokenId}/image.svg`,
      external_url: `${baseUrl}/pet-customization/wardrobe`,
      attributes: [
        { trait_type: "Species", value: charDef.name },
        { trait_type: "Element", value: charDef.element },
        { trait_type: "Primary Macro", value: charDef.primaryMacro },
        { trait_type: "Evolution Stage", value: stageLabel },
        { display_type: "number", trait_type: "Level", value: pet.level },
        { trait_type: "Mood", value: pet.moodStatus || "happy" },
        { trait_type: "Soulbound", value: "Yes" },
        { trait_type: "Hat", value: resolveItemLabel(loadout?.headId) },
        { trait_type: "Glasses", value: resolveItemLabel(loadout?.glassesId) },
        { trait_type: "Outfit", value: resolveItemLabel(loadout?.bodyId) },
        { trait_type: "Held Item", value: resolveItemLabel(loadout?.heldId) },
        { trait_type: "Skin Aura", value: resolveItemLabel(loadout?.skinId || pet.skinColor) },
        { trait_type: "Habitat", value: resolveItemLabel(loadout?.roomId) },
      ],
    };

    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[GET /api/nft/pet/[tokenId]/metadata] Error:", err);
    return NextResponse.json(
      { error: "Failed to load CalPal NFT metadata" },
      { status: 500 },
    );
  }
}
