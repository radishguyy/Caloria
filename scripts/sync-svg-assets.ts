import fs from "node:fs";
import path from "node:path";
import {
  ACCESSORY_CATALOG,
  CHARACTER_CATALOG,
} from "../src/lib/character-assets/catalog";
import {
  CHARACTER_SVG_LAYERS,
  buildStandaloneCharacterSvg,
} from "../src/lib/character-assets/character-layers";
import { buildStandaloneAccessorySvg } from "../src/lib/character-assets/accessory-layers";
import { CharacterLayerType } from "../src/lib/character-assets/types";

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

function writeSvgFile(publicRelativePath: string, content: string) {
  const fullPath = path.join(PUBLIC_DIR, publicRelativePath.replace(/^\//, ""));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

function main() {
  let characterFileCount = 0;
  let accessoryFileCount = 0;

  const layerOrder: CharacterLayerType[] = ["tail", "ears", "body", "head", "face"];

  for (const char of CHARACTER_CATALOG) {
    const layers = CHARACTER_SVG_LAYERS[char.id];
    const colors = char.defaultColors;

    // Individual modular layer SVGs
    writeSvgFile(
      char.componentPaths.ears,
      buildStandaloneCharacterSvg(layers.ears, colors)
    );
    writeSvgFile(
      char.componentPaths.tail,
      buildStandaloneCharacterSvg(layers.tail, colors)
    );
    writeSvgFile(
      char.componentPaths.body,
      buildStandaloneCharacterSvg(layers.body, colors)
    );
    writeSvgFile(
      char.componentPaths.head,
      buildStandaloneCharacterSvg(layers.head, colors)
    );
    writeSvgFile(
      char.componentPaths.face,
      buildStandaloneCharacterSvg(layers.face, colors)
    );

    // Full assembled default character SVG
    const fullMarkup = [
      `<ellipse cx="64" cy="146" rx="30" ry="6.5" fill="#231F20" opacity="0.12" />`,
      ...layerOrder.map((l) => layers[l]),
    ].join("\n");

    writeSvgFile(
      char.componentPaths.full,
      buildStandaloneCharacterSvg(fullMarkup, colors)
    );

    characterFileCount += 6;
  }

  for (const acc of ACCESSORY_CATALOG) {
    const svgContent = buildStandaloneAccessorySvg(acc.id);
    writeSvgFile(acc.svgPath, svgContent);
    accessoryFileCount += 1;
  }

  console.log(
    `Synced ${characterFileCount} character SVG files (${CHARACTER_CATALOG.length} characters x 6 files) and ${accessoryFileCount} accessory SVG files.`
  );
}

main();
