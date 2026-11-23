import { NextRequest, NextResponse } from "next/server";
import { getAccessoryByTokenId } from "@/lib/web3/accessory-tokens";
import { ACCESSORY_SVG_LAYERS } from "@/lib/character-assets/accessory-layers";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: NextRequest,
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

  const layer = ACCESSORY_SVG_LAYERS[item.id];
  const safeName = escapeXml(item.nameEn || item.name);
  const safeCategory = escapeXml(item.category.toUpperCase());
  const accent = item.colorAccent || "#4D7C0F";

  const artworkSvg = layer
    ? `<svg x="96" y="72" width="320" height="320" viewBox="${layer.previewViewBox}">
        ${layer.backMarkup || ""}
        ${layer.frontMarkup}
      </svg>`
    : `<g transform="translate(256, 224)">
        <circle cx="0" cy="0" r="108" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-width="6" />
        <text x="0" y="18" text-anchor="middle" font-size="78">${escapeXml(item.previewEmoji)}</text>
      </g>`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${safeName} Accessory NFT">
  <defs>
    <linearGradient id="acc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="100%" stop-color="#F1F8E9" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="44" fill="url(#acc-bg)" />
  <rect x="16" y="16" width="480" height="480" rx="34" fill="none" stroke="${accent}" stroke-width="4" opacity="0.35" />
  <rect x="32" y="32" width="132" height="32" rx="14" fill="${accent}" fill-opacity="0.16" />
  <text x="98" y="53" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="800" fill="#1F2937">${safeCategory}</text>
  <text x="476" y="53" text-anchor="end" font-family="ui-monospace, monospace" font-size="13" font-weight="700" fill="#6B7280">ERC-1155 #${tokenId}</text>
  ${artworkSvg}
  <g transform="translate(32, 434)">
    <rect x="0" y="0" width="448" height="48" rx="18" fill="#FFFFFF" fill-opacity="0.94" stroke="#231F20" stroke-opacity="0.12" stroke-width="2" />
    <text x="20" y="30" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="800" fill="#1F2937">${safeName}</text>
    <text x="428" y="30" text-anchor="end" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="700" fill="#4D7C0F">CALORIA</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
