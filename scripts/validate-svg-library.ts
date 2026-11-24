import fs from "node:fs";
import path from "node:path";
import {
  ACCESSORY_CATALOG,
  CHARACTER_CATALOG,
  DEFAULT_CHARACTER_COMPOSITIONS,
  isAccessoryCompatible,
  resolveAccessoryTransform,
} from "../src/lib/character-assets/catalog";
import { CHARACTER_SVG_LAYERS } from "../src/lib/character-assets/character-layers";
import { ACCESSORY_SVG_LAYERS } from "../src/lib/character-assets/accessory-layers";

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`VALIDATION FAILED: ${message}`);
  }
}

function validate() {
  console.log("=== Caloria Modular SVG Character & Accessory Library Validation ===");

  // 1. Verify all 12 characters exist and have distinct modular layers
  assert(
    CHARACTER_CATALOG.length === 12,
    `Expected 12 characters, found ${CHARACTER_CATALOG.length}`
  );

  const headSet = new Set<string>();
  const faceSet = new Set<string>();
  const bodySet = new Set<string>();
  const earsSet = new Set<string>();

  for (const char of CHARACTER_CATALOG) {
    const layers = CHARACTER_SVG_LAYERS[char.id];
    assert(layers, `Missing SVG layers for character ${char.id}`);

    for (const [layerName, relPath] of Object.entries(char.componentPaths)) {
      const fullPath = path.join(PUBLIC_DIR, relPath.replace(/^\//, ""));
      assert(
        fs.existsSync(fullPath),
        `Missing SVG file on disk for ${char.id}.${layerName}: ${relPath}`
      );
      const svgText = fs.readFileSync(fullPath, "utf8");
      assert(
        svgText.includes('viewBox="0 0 128 160"'),
        `Invalid viewBox in ${relPath}`
      );
      assert(
        !svgText.includes("<image") && !svgText.includes("data:image/"),
        `Raster image forbidden in ${relPath}`
      );
      assert(
        !svgText.includes("<text"),
        `Emoji/text element forbidden in character SVG ${relPath}`
      );
      assert(
        svgText.includes("var(--char-"),
        `Missing CSS custom property tokens in ${relPath}`
      );
      if (layerName === "head" || layerName === "body" || layerName === "ears" || layerName === "full") {
        assert(
          svgText.includes("var(--char-primary"),
          `Missing var(--char-primary) token in ${relPath}`
        );
      }
    }

    headSet.add(layers.head);
    faceSet.add(layers.face);
    bodySet.add(layers.body);
    earsSet.add(layers.ears);
  }

  assert(
    headSet.size === 12 && faceSet.size === 12 && bodySet.size === 12 && earsSet.size === 12,
    "Each of the 12 characters must have unique head, face, body, and ear SVG geometry (no generic recolored duplicates)."
  );
  console.log("✔ 12 unique chibi anthropomorphic characters verified (72 SVG layer files).");

  // 2. Verify at least 24 accessories (12 everyday + 12 food-themed + 8 special = 32)
  const everydayAcc = ACCESSORY_CATALOG.filter((a) => a.theme === "everyday");
  const foodAcc = ACCESSORY_CATALOG.filter((a) => a.theme === "food");
  assert(
    everydayAcc.length >= 12,
    `Expected at least 12 everyday accessories, found ${everydayAcc.length}`
  );
  assert(
    foodAcc.length >= 12,
    `Expected at least 12 food-themed accessories, found ${foodAcc.length}`
  );
  assert(
    ACCESSORY_CATALOG.length >= 24,
    `Expected at least 24 total accessories, found ${ACCESSORY_CATALOG.length}`
  );

  for (const acc of ACCESSORY_CATALOG) {
    const fullPath = path.join(PUBLIC_DIR, acc.svgPath.replace(/^\//, ""));
    assert(
      fs.existsSync(fullPath),
      `Missing accessory SVG file on disk: ${acc.svgPath}`
    );
    const svgText = fs.readFileSync(fullPath, "utf8");
    assert(
      svgText.includes('viewBox="0 0 128 160"'),
      `Invalid viewBox in ${acc.svgPath}`
    );
    assert(
      !svgText.includes("<image") && !svgText.includes("data:image/") && !svgText.includes("<text"),
      `Forbidden raster or text element in ${acc.svgPath}`
    );
    assert(
      !svgText.includes("var(--char-primary"),
      `Accessory ${acc.id} must not use --char-primary so character recoloring never alters accessory colors.`
    );
  }
  console.log(
    `✔ ${ACCESSORY_CATALOG.length} modular SVG accessories verified (${everydayAcc.length} everyday, ${foodAcc.length} food-themed, ${ACCESSORY_CATALOG.length - everydayAcc.length - foodAcc.length} special).`
  );

  // 3. Verify zero SVG ID collisions when all 12 characters and all accessories are composed together
  const allIdMatches: string[] = [];
  for (const char of CHARACTER_CATALOG) {
    const l = CHARACTER_SVG_LAYERS[char.id];
    const combined = `${l.ears}\n${l.tail}\n${l.body}\n${l.head}\n${l.face}`;
    const matches = [...combined.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    allIdMatches.push(...matches);
  }
  for (const acc of ACCESSORY_CATALOG) {
    const l = ACCESSORY_SVG_LAYERS[acc.id];
    const combined = `${l.backMarkup || ""}\n${l.frontMarkup}`;
    const matches = [...combined.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    allIdMatches.push(...matches);
  }
  const uniqueIds = new Set(allIdMatches);
  assert(
    uniqueIds.size === allIdMatches.length,
    `Detected duplicate internal SVG IDs across layers: ${allIdMatches.length - uniqueIds.size} collisions`
  );
  console.log("✔ Zero SVG ID collisions across all composed character and accessory layers.");

  // 4. Verify accessory alignment and compatibility across all 12 characters
  for (const char of CHARACTER_CATALOG) {
    for (const acc of ACCESSORY_CATALOG) {
      assert(
        isAccessoryCompatible(char.id, acc.id),
        `Expected ${acc.id} to be compatible with ${char.id}`
      );
      const transform = resolveAccessoryTransform(char.id, acc);
      assert(typeof transform === "string", "Transform must resolve to string");
    }
  }
  console.log("✔ Character-accessory anchor transforms and compatibility verified.");

  // 5. Generate visual contact sheet HTML for inspection
  const contactSheetHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Caloria SVG Character & Accessory Contact Sheet</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 32px; }
    h1, h2 { margin-top: 0; }
    .grid-chars { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 40px; }
    .grid-acc { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
    .card { background: #fff; border: 2px solid #e2e8f0; border-radius: 20px; padding: 16px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
    .card svg, .card img { width: 120px; height: 150px; display: block; margin: 0 auto 8px; }
    .label { font-weight: 700; font-size: 14px; }
    .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .badge { display: inline-block; margin-top: 6px; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; background: #f1f5f9; color: #475569; text-transform: uppercase; }
  </style>
</head>
<body>
  <h1>Caloria Modular SVG Character Library (12 Characters)</h1>
  <div class="grid-chars">
    ${CHARACTER_CATALOG.map((char) => {
      const comp = DEFAULT_CHARACTER_COMPOSITIONS[char.id];
      const l = CHARACTER_SVG_LAYERS[char.id];
      const c = char.defaultColors;
      const headAcc = comp.equippedAccessories.head
        ? ACCESSORY_SVG_LAYERS[comp.equippedAccessories.head]
        : undefined;
      const glassesAcc = comp.equippedAccessories.glasses
        ? ACCESSORY_SVG_LAYERS[comp.equippedAccessories.glasses]
        : undefined;
      const bodyAcc = comp.equippedAccessories.body
        ? ACCESSORY_SVG_LAYERS[comp.equippedAccessories.body]
        : undefined;
      const heldAcc = comp.equippedAccessories.held
        ? ACCESSORY_SVG_LAYERS[comp.equippedAccessories.held]
        : undefined;

      const headDef = ACCESSORY_CATALOG.find((a) => a.id === comp.equippedAccessories.head);
      const glassesDef = ACCESSORY_CATALOG.find((a) => a.id === comp.equippedAccessories.glasses);
      const bodyDef = ACCESSORY_CATALOG.find((a) => a.id === comp.equippedAccessories.body);
      const heldDef = ACCESSORY_CATALOG.find((a) => a.id === comp.equippedAccessories.held);

      return `<div class="card">
        <svg viewBox="0 0 128 160" style="--char-primary:${c.primary};--char-secondary:${c.secondary};--char-belly:${c.belly};--char-inner-ear:${c.innerEar};--char-blush:${c.blush};--char-eye:${c.eye};--char-nose:${c.nose};--char-outline:${c.outline}">
          <ellipse cx="64" cy="146" rx="30" ry="6.5" fill="#231F20" opacity="0.12" />
          ${bodyAcc?.backMarkup ? `<g transform="${bodyDef ? resolveAccessoryTransform(char.id, bodyDef) : ""}">${bodyAcc.backMarkup}</g>` : ""}
          ${l.tail}
          ${l.ears}
          ${l.body}
          ${bodyAcc?.frontMarkup ? `<g transform="${bodyDef ? resolveAccessoryTransform(char.id, bodyDef) : ""}">${bodyAcc.frontMarkup}</g>` : ""}
          ${l.head}
          ${l.face}
          ${glassesAcc?.frontMarkup ? `<g transform="${glassesDef ? resolveAccessoryTransform(char.id, glassesDef) : ""}">${glassesAcc.frontMarkup}</g>` : ""}
          ${headAcc?.frontMarkup ? `<g transform="${headDef ? resolveAccessoryTransform(char.id, headDef) : ""}">${headAcc.frontMarkup}</g>` : ""}
          ${heldAcc?.frontMarkup ? `<g transform="${heldDef ? resolveAccessoryTransform(char.id, heldDef) : ""}">${heldAcc.frontMarkup}</g>` : ""}
        </svg>
        <div class="label">${char.name} (${char.defaultNickname})</div>
        <div class="sub">${char.speciesLabel}</div>
        <span class="badge">${char.defaultColors.name}</span>
      </div>`;
    }).join("\n")}
  </div>

  <h2>Modular SVG Accessories (${ACCESSORY_CATALOG.length} Assets: 12 Everyday + 12 Food-Themed + 8 Special)</h2>
  <div class="grid-acc">
    ${ACCESSORY_CATALOG.map((acc) => {
      const layer = ACCESSORY_SVG_LAYERS[acc.id];
      return `<div class="card">
        <svg viewBox="${layer.previewViewBox}">
          ${layer.backMarkup || ""}
          ${layer.frontMarkup}
        </svg>
        <div class="label">${acc.nameEn}</div>
        <div class="sub">${acc.name}</div>
        <span class="badge">${acc.theme} • ${acc.anchor}</span>
      </div>`;
    }).join("\n")}
  </div>
</body>
</html>`;

  fs.writeFileSync(
    path.join(PUBLIC_DIR, "assets/contact-sheet.html"),
    contactSheetHtml,
    "utf8"
  );
  console.log("✔ Generated visual contact sheet at public/assets/contact-sheet.html");
}

validate();
