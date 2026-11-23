import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pets, userLoadouts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { composePetNftSvg } from "@/lib/web3/svg-composer";

export async function GET(
  _req: NextRequest,
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

    const svg = composePetNftSvg({
      name: pet.name,
      species: pet.species || pet.characterId || "flameling",
      level: pet.level,
      stage: pet.stage,
      moodStatus: pet.moodStatus,
      customColors: pet.customColors,
      equipped: {
        head: loadout?.headId || "head-none",
        glasses: loadout?.glassesId || "glasses-none",
        body: loadout?.bodyId || "body-none",
        held: loadout?.heldId || "held-none",
        skin: loadout?.skinId || pet.skinColor || "skin-default",
        room: loadout?.roomId || "room-default",
      },
    });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[GET /api/nft/pet/[tokenId]/image.svg] Error:", err);
    return NextResponse.json(
      { error: "Failed to compose CalPal NFT image" },
      { status: 500 },
    );
  }
}
