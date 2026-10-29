/**
 * Modular SVG Layer Definitions for the 12 Caloria Chibi Anthropomorphic Characters.
 *
 * Coordinate System: `viewBox="0 0 128 160"`
 * Every layer uses CSS custom properties (`--char-primary`, `--char-secondary`,
 * `--char-belly`, `--char-inner-ear`, `--char-blush`, `--char-eye`, `--char-nose`,
 * `--char-outline`) with character-specific fallback hex values so standalone `.svg`
 * files render in full color and inline compositions can be dynamically recolored.
 */

import { CharacterId, CharacterLayerType } from "./types";

export interface CharacterSvgLayers {
  ears: string;
  tail: string;
  body: string;
  head: string;
  face: string;
}

export const CHARACTER_SVG_LAYERS: Record<CharacterId, CharacterSvgLayers> = {
  // 1. FLAMELING — Coral-Orange Fox Kit (Large tufted fox ears, fluffy cheek tufts, waving paw, bushy flame-tip tail)
  flameling: {
    ears: `<g data-layer="ears" data-character="flameling">
  <!-- Left Fox Ear -->
  <path d="M 38 46 C 24 30, 18 14, 24 8 C 30 4, 48 16, 54 38 Z" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 24 8 C 21 12, 22 20, 27 26 C 32 22, 37 18, 39 14 C 33 9, 27 6, 24 8 Z" fill="var(--char-secondary, #FF9F43)" />
  <path d="M 39 42 C 31 31, 27 20, 30 16 C 34 14, 44 23, 48 38 Z" fill="var(--char-inner-ear, #FFB5A7)" />
  <path d="M 24 8 C 30 4, 48 16, 54 38" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" />
  <!-- Right Fox Ear -->
  <path d="M 90 46 C 104 30, 110 14, 104 8 C 98 4, 80 16, 74 38 Z" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 104 8 C 107 12, 106 20, 101 26 C 96 22, 91 18, 89 14 C 95 9, 101 6, 104 8 Z" fill="var(--char-secondary, #FF9F43)" />
  <path d="M 89 42 C 97 31, 101 20, 98 16 C 94 14, 84 23, 80 38 Z" fill="var(--char-inner-ear, #FFB5A7)" />
  <path d="M 104 8 C 98 4, 80 16, 74 38" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" />
</g>`,
    tail: `<g data-layer="tail" data-character="flameling">
  <!-- Bushy Flame-Tipped Fox Tail -->
  <path d="M 76 126 C 96 130, 116 116, 118 94 C 118 86, 111 84, 107 90 C 105 83, 98 84, 96 92 C 92 104, 82 112, 72 116 Z" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 102 102 C 110 98, 115 92, 115 88 C 112 86, 108 90, 106 92 C 104 87, 100 88, 98 94 C 97 98, 99 101, 102 102 Z" fill="var(--char-belly, #FFF3E2)" />
  <path d="M 76 126 C 96 130, 116 116, 118 94" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" />
</g>`,
    body: `<g data-layer="body" data-character="flameling">
  <!-- Compact Upright Torso & Stubby Legs -->
  <path d="M 48 96 C 42 104, 40 120, 43 132 L 42 142 C 42 147, 55 147, 56 141 L 58 134 L 70 134 L 72 141 C 73 147, 86 147, 86 142 L 85 132 C 88 120, 86 104, 80 96 Z" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Warm Belly Patch -->
  <path d="M 52 102 C 49 112, 51 126, 64 128 C 77 126, 79 112, 76 102 Z" fill="var(--char-belly, #FFF3E2)" />
  <!-- Left Resting Arm -->
  <path d="M 44 103 C 33 107, 29 116, 34 121 C 38 124, 44 119, 46 113" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Right Cheerful Waving Arm -->
  <path d="M 83 104 C 93 100, 102 92, 99 86 C 96 81, 88 87, 82 96" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    head: `<g data-layer="head" data-character="flameling">
  <!-- Fox Head with Fluffy Cheek Tufts -->
  <path d="M 64 35 C 86 35, 101 49, 102 68 L 110 73 L 101 79 L 106 85 C 97 96, 82 101, 64 101 C 46 101, 31 96, 22 85 L 27 79 L 18 73 L 26 68 C 27 49, 42 35, 64 35 Z" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Cream Fox Muzzle & Cheek Mask -->
  <path d="M 27 81 C 36 74, 48 76, 64 76 C 80 76, 92 74, 101 81 C 94 94, 80 99, 64 99 C 48 99, 34 94, 27 81 Z" fill="var(--char-belly, #FFF3E2)" />
  <!-- Crown Flame Hair Tuft -->
  <path d="M 59 36 C 58 26, 65 21, 67 28 C 71 24, 74 30, 70 36" fill="var(--char-secondary, #FF9F43)" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Subtle Crown Highlight -->
  <path d="M 44 43 C 52 39, 64 39, 74 42" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.35" />
</g>`,
    face: `<g data-layer="face" data-character="flameling">
  <!-- Cheek Blush -->
  <ellipse cx="35" cy="80" rx="6.5" ry="4" fill="var(--char-blush, #FF8FA3)" opacity="0.75" />
  <ellipse cx="93" cy="80" rx="6.5" ry="4" fill="var(--char-blush, #FF8FA3)" opacity="0.75" />
  <!-- Expressive Big Shiny Oval Eyes -->
  <ellipse cx="46" cy="67" rx="10.5" ry="12" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3.4" />
  <ellipse cx="48" cy="67" rx="7" ry="9" fill="var(--char-eye, #2B1E1A)" />
  <circle cx="45" cy="63" r="3.2" fill="#FFFFFF" />
  <circle cx="51" cy="71" r="1.5" fill="#FFFFFF" />
  <ellipse cx="82" cy="67" rx="10.5" ry="12" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3.4" />
  <ellipse cx="80" cy="67" rx="7" ry="9" fill="var(--char-eye, #2B1E1A)" />
  <circle cx="77" cy="63" r="3.2" fill="#FFFFFF" />
  <circle cx="83" cy="71" r="1.5" fill="#FFFFFF" />
  <!-- Confident Eyebrows -->
  <path d="M 37 51 Q 46 48 54 53" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linecap="round" />
  <path d="M 91 51 Q 82 48 74 53" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linecap="round" />
  <!-- Cute Nose & Fang Smile -->
  <ellipse cx="64" cy="75" rx="3" ry="2.2" fill="var(--char-nose, #231F20)" />
  <path d="M 55 81 Q 64 93 73 81 Z" fill="#E05263" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linejoin="round" />
  <path d="M 67 82 L 69 86 L 71 82 Z" fill="#FFFFFF" />
</g>`,
  },

  // 2. BLOOMIE — Mint-Lime Lop Bunny (One upright ear + one lopped ear, sprout leaf, sparkly doe eyes, buck-tooth w smile)
  bloomie: {
    ears: `<g data-layer="ears" data-character="bloomie">
  <!-- Left Upright Rabbit Ear -->
  <path d="M 41 42 C 35 22, 37 6, 46 6 C 55 6, 57 22, 54 42 Z" fill="var(--char-primary, #4ADE80)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 44 38 C 40 24, 42 12, 46 12 C 50 12, 52 24, 50 38 Z" fill="var(--char-inner-ear, #FDA4AF)" />
  <!-- Right Playfully Lopped/Tipped Rabbit Ear -->
  <path d="M 74 41 C 74 21, 82 10, 94 12 C 105 14, 112 26, 105 33 C 99 38, 92 29, 89 25 C 86 29, 86 36, 85 42 Z" fill="var(--char-primary, #4ADE80)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 79 36 C 80 23, 86 16, 94 18 C 100 19, 104 26, 100 29 C 96 31, 91 24, 86 22 Z" fill="var(--char-inner-ear, #FDA4AF)" />
</g>`,
    tail: `<g data-layer="tail" data-character="bloomie">
  <!-- Fluffy Cotton-Puff Bunny Tail -->
  <path d="M 80 120 C 86 114, 96 116, 97 124 C 102 128, 99 137, 91 137 C 87 141, 78 138, 78 130 Z" fill="var(--char-belly, #F0FDF4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    body: `<g data-layer="body" data-character="bloomie">
  <!-- Plump Pear-Shaped Bunny Body -->
  <path d="M 47 96 C 40 105, 38 122, 42 134 L 41 142 C 41 147, 56 147, 57 141 L 58 135 L 70 135 L 71 141 C 72 147, 87 147, 87 142 L 86 134 C 90 122, 88 105, 81 96 Z" fill="var(--char-primary, #4ADE80)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Soft Mint-Cream Belly -->
  <ellipse cx="64" cy="117" rx="14" ry="13" fill="var(--char-belly, #F0FDF4)" />
  <!-- Paws Tucked Kindly at Chest -->
  <path d="M 44 105 C 37 110, 42 120, 52 117 C 56 115, 55 109, 50 107" fill="var(--char-primary, #4ADE80)" stroke="var(--char-outline, #231F20)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 84 105 C 91 110, 86 120, 76 117 C 72 115, 73 109, 78 107" fill="var(--char-primary, #4ADE80)" stroke="var(--char-outline, #231F20)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    head: `<g data-layer="head" data-character="bloomie">
  <!-- Soft Mochi-Shaped Bunny Head -->
  <path d="M 64 36 C 88 36, 104 52, 104 73 C 104 91, 88 101, 64 101 C 40 101, 24 91, 24 73 C 24 52, 40 36, 64 36 Z" fill="var(--char-primary, #4ADE80)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Crown Sprout Leaves -->
  <path d="M 64 36 C 63 27, 53 23, 51 28 C 49 33, 58 36, 64 36 Z" fill="var(--char-secondary, #16A34A)" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linejoin="round" />
  <path d="M 64 36 C 66 26, 76 23, 77 28 C 78 33, 70 36, 64 36 Z" fill="var(--char-secondary, #16A34A)" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linejoin="round" />
  <path d="M 43 44 C 52 40, 65 40, 75 43" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.4" />
</g>`,
    face: `<g data-layer="face" data-character="bloomie">
  <!-- Rosy Cheeks -->
  <ellipse cx="34" cy="78" rx="6.5" ry="4.2" fill="var(--char-blush, #FB7185)" opacity="0.7" />
  <ellipse cx="94" cy="78" rx="6.5" ry="4.2" fill="var(--char-blush, #FB7185)" opacity="0.7" />
  <!-- Big Doe Eyes with Starry Highlights -->
  <circle cx="46" cy="68" r="10.5" fill="var(--char-eye, #1E3A2F)" stroke="var(--char-outline, #231F20)" stroke-width="3.2" />
  <circle cx="43" cy="64" r="3.8" fill="#FFFFFF" />
  <circle cx="50" cy="72" r="2" fill="#FFFFFF" />
  <circle cx="82" cy="68" r="10.5" fill="var(--char-eye, #1E3A2F)" stroke="var(--char-outline, #231F20)" stroke-width="3.2" />
  <circle cx="79" cy="64" r="3.8" fill="#FFFFFF" />
  <circle cx="86" cy="72" r="2" fill="#FFFFFF" />
  <!-- Soft Brows -->
  <path d="M 39 53 Q 46 50 52 53" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="2.8" stroke-linecap="round" />
  <path d="M 76 53 Q 82 50 89 53" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="2.8" stroke-linecap="round" />
  <!-- Bunny Nose, Buck Tooth & W Mouth -->
  <ellipse cx="64" cy="75" rx="3.2" ry="2.3" fill="var(--char-inner-ear, #FDA4AF)" stroke="var(--char-outline, #231F20)" stroke-width="2.4" />
  <rect x="61.5" y="81" width="5" height="6" rx="1.5" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="2.6" />
  <path d="M 54 80 Q 59 85 64 80 Q 69 85 74 80" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
  },

  // 3. DROPLET — Cyan-Blue Sea-Otter Cat (Low fold ears, curved tail, big joyful open mouth with tongue out)
  droplet: {
    ears: `<g data-layer="ears" data-character="droplet">
  <!-- Pointed-Round Otter-Cat Ears -->
  <path d="M 38 44 C 32 24, 42 12, 50 14 C 56 16, 60 28, 58 40 Z" fill="var(--char-primary, #22D3EE)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 42 38 C 39 26, 44 19, 49 20 C 53 21, 55 29, 54 37 Z" fill="var(--char-inner-ear, #7DD3FC)" />
  <path d="M 90 44 C 96 24, 86 12, 78 14 C 72 16, 68 28, 70 40 Z" fill="var(--char-primary, #22D3EE)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 86 38 C 89 26, 84 19, 79 20 C 75 21, 73 29, 74 37 Z" fill="var(--char-inner-ear, #7DD3FC)" />
</g>`,
    tail: `<g data-layer="tail" data-character="droplet">
  <!-- Curling Otter-Cat Tail (like Ref 1 bottom-second) -->
  <path d="M 73 134 C 88 137, 106 135, 110 126 C 113 120, 106 117, 101 122 C 96 127, 84 128, 74 126 Z" fill="var(--char-primary, #22D3EE)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    body: `<g data-layer="body" data-character="droplet">
  <!-- Compact Joyful Torso & Arms -->
  <path d="M 48 97 C 43 106, 42 122, 45 133 L 44 142 C 44 147, 57 147, 58 141 L 60 135 L 68 135 L 70 141 C 71 147, 84 147, 84 142 L 83 133 C 86 122, 85 106, 80 97 Z" fill="var(--char-primary, #22D3EE)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <ellipse cx="64" cy="117" rx="12" ry="12" fill="var(--char-belly, #ECFEFF)" />
  <!-- Left & Right Stubby Paws -->
  <path d="M 46 105 C 34 108, 30 117, 36 122 C 41 125, 46 119, 48 113" fill="var(--char-primary, #22D3EE)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 82 105 C 94 108, 98 117, 92 122 C 87 125, 82 119, 80 113" fill="var(--char-primary, #22D3EE)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    head: `<g data-layer="head" data-character="droplet">
  <!-- Smooth Round Pebble Head -->
  <path d="M 64 36 C 89 36, 104 51, 104 71 C 104 90, 88 101, 64 101 C 40 101, 24 90, 24 71 C 24 51, 39 36, 64 36 Z" fill="var(--char-primary, #22D3EE)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 44 43 C 54 39, 66 39, 76 42" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.45" />
</g>`,
    face: `<g data-layer="face" data-character="droplet">
  <!-- Happy Upturned Half-Moon Eyes (Ref 1 bottom-second) -->
  <path d="M 34 66 C 36 55, 52 55, 54 66 Z" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linejoin="round" />
  <path d="M 39 66 C 40 58, 50 58, 51 66 Z" fill="var(--char-eye, #1E3A8A)" />
  <path d="M 74 66 C 76 55, 92 55, 94 66 Z" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linejoin="round" />
  <path d="M 77 66 C 78 58, 88 58, 89 66 Z" fill="var(--char-eye, #1E3A8A)" />
  <!-- Blush -->
  <ellipse cx="32" cy="74" rx="5.5" ry="3.5" fill="var(--char-blush, #F472B6)" opacity="0.65" />
  <ellipse cx="96" cy="74" rx="5.5" ry="3.5" fill="var(--char-blush, #F472B6)" opacity="0.65" />
  <!-- Big Laughing Mouth with Bright Tongue Out -->
  <path d="M 47 73 L 77 73 C 78 88, 69 97, 59 97 C 49 97, 46 86, 47 73 Z" fill="#1E1B18" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linejoin="round" />
  <path d="M 50 82 C 54 78, 68 78, 73 84 C 71 94, 64 98, 57 97 C 50 96, 48 89, 50 82 Z" fill="#FF3B30" stroke="var(--char-outline, #231F20)" stroke-width="3" stroke-linejoin="round" />
</g>`,
  },

  // 4. SUNNY — Golden-Yellow Notched-Ear Hamster (Bite-notched right ear, huge glossy navy eyes, buck tooth)
  sunny: {
    ears: `<g data-layer="ears" data-character="sunny">
  <!-- Left Rounded Ear -->
  <path d="M 39 42 C 34 22, 42 10, 52 10 C 60 10, 63 24, 60 40 Z" fill="var(--char-primary, #FBBF24)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 44 37 C 41 24, 46 16, 52 16 C 56 16, 58 25, 56 36 Z" fill="var(--char-inner-ear, #FDE68A)" />
  <!-- Right Ear with Double Bite Notch (Ref 1 top-right) -->
  <path d="M 67 40 C 66 22, 74 10, 86 12 C 92 13, 96 17, 94 22 C 88 23, 88 30, 95 31 C 91 34, 91 40, 97 41 C 95 45, 88 46, 82 44 Z" fill="var(--char-primary, #FBBF24)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    tail: `<g data-layer="tail" data-character="sunny">
  <!-- Tiny Round Hamster Nubbin Tail -->
  <circle cx="83" cy="129" r="7.5" fill="var(--char-primary, #FBBF24)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" />
</g>`,
    body: `<g data-layer="body" data-character="sunny">
  <!-- Ultra-Compact Peanut Body (Ref 1 top-right) -->
  <path d="M 49 98 C 45 106, 45 120, 48 130 L 47 139 C 47 145, 60 145, 61 139 L 63 134 L 65 134 L 67 139 C 68 145, 81 145, 81 139 L 80 130 C 83 120, 83 106, 79 98 Z" fill="var(--char-primary, #FBBF24)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <ellipse cx="64" cy="117" rx="11" ry="10" fill="var(--char-belly, #FEF3C7)" />
  <!-- Short Little Outstretched Nubbin Arms -->
  <path d="M 48 108 C 37 108, 34 115, 40 119 C 44 121, 48 118, 50 114" fill="var(--char-primary, #FBBF24)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 80 108 C 91 108, 94 115, 88 119 C 84 121, 80 118, 78 114" fill="var(--char-primary, #FBBF24)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    head: `<g data-layer="head" data-character="sunny">
  <!-- Extra-Chubby Cheek Hamster Head -->
  <path d="M 64 36 C 88 36, 106 50, 106 72 C 106 91, 89 102, 64 102 C 39 102, 22 91, 22 72 C 22 50, 40 36, 64 36 Z" fill="var(--char-primary, #FBBF24)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Notch Ear Overlap Connection -->
  <path d="M 96 40 C 102 46, 106 56, 106 68" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" />
  <path d="M 42 44 C 52 40, 64 40, 74 43" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.4" />
</g>`,
    face: `<g data-layer="face" data-character="sunny">
  <!-- Warm Cheek Blush -->
  <ellipse cx="32" cy="79" rx="6" ry="3.8" fill="var(--char-blush, #FB923C)" opacity="0.7" />
  <ellipse cx="96" cy="79" rx="6" ry="3.8" fill="var(--char-blush, #FB923C)" opacity="0.7" />
  <!-- Huge Glossy Navy Eyes with Lower-Left Shine (Ref 1 top-right) -->
  <ellipse cx="45" cy="67" rx="13" ry="12.5" fill="var(--char-eye, #1E3A8A)" stroke="var(--char-outline, #231F20)" stroke-width="3.4" />
  <ellipse cx="40" cy="65" rx="5.5" ry="6.5" fill="#FFFFFF" />
  <ellipse cx="47" cy="74" rx="4.5" ry="2.2" fill="#93C5FD" />
  <ellipse cx="83" cy="67" rx="13" ry="12.5" fill="var(--char-eye, #1E3A8A)" stroke="var(--char-outline, #231F20)" stroke-width="3.4" />
  <ellipse cx="78" cy="65" rx="5.5" ry="6.5" fill="#FFFFFF" />
  <ellipse cx="85" cy="74" rx="4.5" ry="2.2" fill="#93C5FD" />
  <!-- Single Buck-Tooth Smile -->
  <path d="M 55 83 L 73 83" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linecap="round" />
  <rect x="60.5" y="83" width="7" height="6.5" rx="1.2" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3" />
</g>`,
  },

  // 5. MOCHI — Blossom-Pink Kawaii Kitten (Pointed cat ears, huge concentric ringed eyes, tiny pout mouth)
  mochi: {
    ears: `<g data-layer="ears" data-character="mochi">
  <!-- Symmetrical Pointed Kitten Ears (Ref 1 middle-third) -->
  <path d="M 38 44 C 36 26, 44 10, 50 8 C 56 10, 61 24, 62 39 Z" fill="var(--char-primary, #F9A8D4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 43 38 C 42 26, 47 16, 50 15 C 53 16, 56 26, 57 37 Z" fill="var(--char-inner-ear, #F472B6)" />
  <path d="M 90 44 C 92 26, 84 10, 78 8 C 72 10, 67 24, 66 39 Z" fill="var(--char-primary, #F9A8D4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 85 38 C 86 26, 81 16, 78 15 C 75 16, 72 26, 71 37 Z" fill="var(--char-inner-ear, #F472B6)" />
</g>`,
    tail: `<g data-layer="tail" data-character="mochi">
  <!-- Slender S-Curved Kitty Tail -->
  <path d="M 74 128 C 90 132, 104 120, 102 106 C 100 96, 108 92, 110 99 C 113 110, 102 136, 74 135 Z" fill="var(--char-primary, #F9A8D4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    body: `<g data-layer="body" data-character="mochi">
  <!-- Petite Standing Chibi Body (Ref 1 middle-third) -->
  <path d="M 50 97 C 46 105, 45 120, 47 132 L 45 141 C 44 146, 57 147, 59 141 L 61 134 L 67 134 L 69 141 C 71 147, 84 146, 83 141 L 81 132 C 83 120, 82 105, 78 97 Z" fill="var(--char-primary, #F9A8D4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <ellipse cx="64" cy="117" rx="11" ry="11" fill="var(--char-belly, #FFF1F2)" />
  <!-- Delicate Outward Arms -->
  <path d="M 48 106 C 38 108, 35 116, 40 120 C 44 123, 48 118, 50 113" fill="var(--char-primary, #F9A8D4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 80 106 C 90 108, 93 116, 88 120 C 84 123, 80 118, 78 113" fill="var(--char-primary, #F9A8D4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    head: `<g data-layer="head" data-character="mochi">
  <!-- Wide-Cheeked Kawaii Kitty Head -->
  <path d="M 64 37 C 87 37, 104 52, 104 73 C 104 90, 87 101, 64 101 C 41 101, 24 90, 24 73 C 24 52, 41 37, 64 37 Z" fill="var(--char-primary, #F9A8D4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 44 44 C 54 40, 66 40, 76 43" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.45" />
</g>`,
    face: `<g data-layer="face" data-character="mochi">
  <!-- Soft Pink Blush -->
  <ellipse cx="32" cy="79" rx="5.5" ry="3.5" fill="var(--char-blush, #FB7185)" opacity="0.65" />
  <ellipse cx="96" cy="79" rx="5.5" ry="3.5" fill="var(--char-blush, #FB7185)" opacity="0.65" />
  <!-- Enormous Concentric Kawaii Eyes (Ref 1 middle-third) -->
  <circle cx="46" cy="68" r="13.5" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3.4" />
  <circle cx="46" cy="68" r="10.5" fill="#334155" />
  <circle cx="46" cy="68" r="6.8" fill="var(--char-eye, #0F172A)" />
  <circle cx="42" cy="64" r="2.8" fill="#FFFFFF" />
  <circle cx="82" cy="68" r="13.5" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3.4" />
  <circle cx="82" cy="68" r="10.5" fill="#334155" />
  <circle cx="82" cy="68" r="6.8" fill="var(--char-eye, #0F172A)" />
  <circle cx="78" cy="64" r="2.8" fill="#FFFFFF" />
  <!-- Minimalist Tiny Dash Mouth -->
  <path d="M 60 84 L 67 84" fill="none" stroke="var(--char-secondary, #EC4899)" stroke-width="3.4" stroke-linecap="round" />
</g>`,
  },

  // 6. KUMA — Tangerine-Orange Peace-Sign Bear Cub (Pointed-round cub ears, bead eyes, V peace-sign paw raised by cheek)
  kuma: {
    ears: `<g data-layer="ears" data-character="kuma">
  <!-- Cub Ears (Ref 1 middle-left) -->
  <path d="M 38 42 C 34 24, 42 10, 50 10 C 56 10, 61 24, 61 38 Z" fill="var(--char-primary, #FB923C)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 43 36 C 41 25, 45 17, 50 17 C 53 17, 56 25, 56 35 Z" fill="var(--char-inner-ear, #FDBA74)" />
  <path d="M 88 42 C 92 24, 84 10, 76 10 C 70 10, 65 24, 65 38 Z" fill="var(--char-primary, #FB923C)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 83 36 C 85 25, 81 17, 76 17 C 73 17, 70 25, 70 35 Z" fill="var(--char-inner-ear, #FDBA74)" />
</g>`,
    tail: `<g data-layer="tail" data-character="kuma">
  <!-- Round Bear Pom-Pom Tail -->
  <circle cx="80" cy="128" r="8" fill="var(--char-primary, #FB923C)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" />
</g>`,
    body: `<g data-layer="body" data-character="kuma">
  <!-- Sturdy Little Cub Torso (Ref 1 middle-left) -->
  <path d="M 48 98 C 44 107, 43 122, 46 133 L 45 142 C 45 147, 57 147, 58 141 L 60 135 L 66 135 L 68 141 C 69 147, 81 147, 81 142 L 80 133 C 83 122, 82 107, 78 98 Z" fill="var(--char-primary, #FB923C)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <ellipse cx="63" cy="118" rx="11" ry="11" fill="var(--char-belly, #FFEDD5)" />
  <!-- Left Resting Arm -->
  <path d="M 47 107 C 37 110, 35 120, 41 123 C 45 125, 48 120, 49 114" fill="var(--char-primary, #FB923C)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    head: `<g data-layer="head" data-character="kuma">
  <!-- Plump Bear Head with Raised Peace-Sign Paw at Right Cheek (Ref 1 middle-left) -->
  <path d="M 62 36 C 86 36, 102 51, 102 72 C 102 90, 86 101, 62 101 C 38 101, 20 88, 22 70 C 23 51, 38 36, 62 36 Z" fill="var(--char-primary, #FB923C)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Chubby Peace-Sign Paw on Right Cheek -->
  <path d="M 84 85 C 78 78, 82 69, 88 72 L 86 62 C 86 58, 92 58, 93 63 L 94 68 L 98 62 C 100 58, 105 61, 103 66 L 100 73 C 107 77, 107 90, 96 93 C 89 95, 86 90, 84 85 Z" fill="var(--char-primary, #FB923C)" stroke="var(--char-outline, #231F20)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 42 44 C 52 40, 64 40, 74 43" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.38" />
</g>`,
    face: `<g data-layer="face" data-character="kuma">
  <!-- Cute Bead-Dot Eyes & Smug Dimpled Smile (Ref 1 middle-left) -->
  <circle cx="42" cy="68" r="3.8" fill="var(--char-eye, #271C19)" />
  <circle cx="71" cy="66" r="3.8" fill="var(--char-eye, #271C19)" />
  <ellipse cx="32" cy="76" rx="5.5" ry="3.5" fill="var(--char-blush, #F87171)" opacity="0.6" />
  <!-- Dimpled Crooked Smile -->
  <path d="M 49 77 Q 58 84 65 76" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linecap="round" />
  <path d="M 47 74 Q 49 78 46 80" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3" stroke-linecap="round" />
  <path d="M 64 73 Q 67 76 66 80" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3" stroke-linecap="round" />
</g>`,
  },

  // 7. NYX — Lavender-Purple Smug Loaf Cat-Dog (Whisker bristles, half-lidded horizontal eyes, 4-legged loaf body)
  nyx: {
    ears: `<g data-layer="ears" data-character="nyx">
  <!-- Broad Hybrid Cat-Dog Ears (Ref 1 top-third) -->
  <path d="M 35 44 C 33 24, 41 10, 50 10 C 57 10, 62 22, 63 38 Z" fill="var(--char-primary, #C084FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 41 38 C 40 26, 45 17, 50 17 C 54 17, 57 25, 58 36 Z" fill="var(--char-inner-ear, #E9D5FF)" />
  <path d="M 91 44 C 95 24, 88 12, 77 12 C 68 12, 64 24, 64 38 Z" fill="var(--char-primary, #C084FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 85 38 C 87 26, 83 18, 77 18 C 72 18, 69 26, 69 36 Z" fill="var(--char-inner-ear, #E9D5FF)" />
</g>`,
    tail: `<g data-layer="tail" data-character="nyx">
  <!-- Perky Loaf Tail on Right -->
  <path d="M 90 120 C 102 118, 111 114, 110 122 C 109 128, 100 130, 92 129 Z" fill="var(--char-primary, #C084FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    body: `<g data-layer="body" data-character="nyx">
  <!-- Quadruped Loaf Body with 4 Adorable Stubby Legs in a Row (Ref 1 top-third) -->
  <path d="M 45 96 C 38 106, 35 120, 36 132 C 36 142, 49 143, 50 135 C 51 143, 64 143, 65 135 C 66 143, 79 143, 80 135 C 82 143, 96 142, 96 131 C 96 118, 86 112, 76 96 Z" fill="var(--char-primary, #C084FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <ellipse cx="62" cy="118" rx="14" ry="9" fill="var(--char-belly, #F3E8FF)" />
</g>`,
    head: `<g data-layer="head" data-character="nyx">
  <!-- Rounded Whiskered Cat-Dog Head (Ref 1 top-third) -->
  <path d="M 63 36 C 88 36, 102 51, 102 72 C 102 89, 86 99, 63 99 C 40 99, 24 89, 24 72 C 24 51, 38 36, 63 36 Z" fill="var(--char-primary, #C084FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Left & Right Cheek Whisker Bristles -->
  <path d="M 17 70 L 25 72 M 16 77 L 25 78 M 19 85 L 27 83" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linecap="round" />
  <path d="M 101 69 L 109 67 M 101 76 L 110 76 M 99 83 L 107 85" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linecap="round" />
  <path d="M 43 43 C 53 39, 65 39, 75 42" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.38" />
</g>`,
    face: `<g data-layer="face" data-character="nyx">
  <!-- Smug Horizontal Half-Lidded Eyes (Ref 1 top-third) -->
  <rect x="34" y="62" width="21" height="8" rx="4" fill="#F5D0FE" stroke="var(--char-secondary, #7E22CE)" stroke-width="2.8" />
  <rect x="43" y="63" width="10" height="6" rx="2.5" fill="var(--char-eye, #581C87)" />
  <rect x="69" y="62" width="21" height="8" rx="4" fill="#F5D0FE" stroke="var(--char-secondary, #7E22CE)" stroke-width="2.8" />
  <rect x="78" y="63" width="10" height="6" rx="2.5" fill="var(--char-eye, #581C87)" />
  <!-- Skeptical Wavy Mouth -->
  <path d="M 56 80 Q 62 75 68 80" fill="none" stroke="var(--char-secondary, #7E22CE)" stroke-width="3.4" stroke-linecap="round" />
</g>`,
  },

  // 8. BAMBI — Cobalt-Blue Side-Eye Pup (Close-set pointer ears, side-eye + boxy toothy grin, flared tunic body)
  bambi: {
    ears: `<g data-layer="ears" data-character="bambi">
  <!-- Tall Close-Set Pointer Pup Ears (Ref 1 top-second) -->
  <path d="M 46 40 C 48 22, 56 8, 63 8 C 67 8, 68 22, 66 39 Z" fill="var(--char-primary, #60A5FA)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 66 40 C 70 22, 78 10, 84 10 C 89 10, 89 26, 85 42 Z" fill="var(--char-primary, #60A5FA)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    tail: `<g data-layer="tail" data-character="bambi">
  <!-- Short Wagging Pup Tail -->
  <path d="M 78 124 C 90 122, 98 126, 94 132 C 90 136, 82 133, 76 130 Z" fill="var(--char-primary, #60A5FA)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    body: `<g data-layer="body" data-character="bambi">
  <!-- Tunic / Cloak Flared Compact Body with Tiny Feet (Ref 1 top-second) -->
  <path d="M 52 96 L 34 131 C 38 135, 45 136, 50 136 L 50 142 C 50 146, 59 146, 60 141 L 61 136 L 66 136 L 67 141 C 68 146, 77 146, 77 142 L 77 136 C 83 136, 89 135, 92 131 L 74 96 Z" fill="var(--char-primary, #60A5FA)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 48 106 C 54 122, 72 122, 78 106" fill="var(--char-belly, #DBEAFE)" opacity="0.65" />
</g>`,
    head: `<g data-layer="head" data-character="bambi">
  <!-- Asymmetric Expressive Teardrop Head (Ref 1 top-second) -->
  <path d="M 64 36 C 88 36, 102 52, 102 72 C 102 88, 84 99, 62 99 C 38 99, 20 88, 22 70 C 24 52, 42 36, 64 36 Z" fill="var(--char-primary, #60A5FA)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 45 43 C 55 39, 67 39, 77 42" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.4" />
</g>`,
    face: `<g data-layer="face" data-character="bambi">
  <!-- Hilarious Side-Eye & Boxy Clenched-Teeth Grin (Ref 1 top-second) -->
  <!-- Flat Eyebrows -->
  <path d="M 30 55 L 49 55" fill="none" stroke="var(--char-eye, #1E1B4B)" stroke-width="3.4" stroke-linecap="round" />
  <path d="M 56 55 L 79 56" fill="none" stroke="var(--char-eye, #1E1B4B)" stroke-width="3.4" stroke-linecap="round" />
  <!-- Side-Glancing Eyes -->
  <ellipse cx="38" cy="62" rx="10" ry="4.2" fill="#FFFFFF" stroke="var(--char-eye, #1E1B4B)" stroke-width="2.8" />
  <ellipse cx="33" cy="62" rx="5.5" ry="3.5" fill="var(--char-eye, #1E1B4B)" />
  <ellipse cx="67" cy="62" rx="11" ry="4.2" fill="#FFFFFF" stroke="var(--char-eye, #1E1B4B)" stroke-width="2.8" />
  <ellipse cx="61" cy="62" rx="6" ry="3.5" fill="var(--char-eye, #1E1B4B)" />
  <!-- Boxy Toothy Grin -->
  <rect x="36" y="71" width="28" height="9" rx="2.5" fill="#FFFFFF" stroke="var(--char-eye, #1E1B4B)" stroke-width="2.8" />
  <path d="M 43 71 L 43 80 M 50 71 L 50 80 M 57 71 L 57 80" fill="none" stroke="var(--char-eye, #1E1B4B)" stroke-width="2.4" />
</g>`,
  },

  // 9. PIPPIN — Soft-Teal Sleepy Tanuki (Close-set ears, forehead wisdom lines, heavy-lidded sleepy eyes, deadpan mouth)
  pippin: {
    ears: `<g data-layer="ears" data-character="pippin">
  <!-- Tall Close-Set Tanuki-Rabbit Ears (Ref 1 middle-second) -->
  <path d="M 44 41 C 43 22, 48 10, 55 10 C 61 10, 63 23, 62 39 Z" fill="var(--char-primary, #5EEAD4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 49 36 C 48 24, 51 17, 55 17 C 58 17, 59 24, 58 35 Z" fill="var(--char-inner-ear, #99F6E4)" />
  <path d="M 64 39 C 64 23, 68 10, 75 10 C 81 10, 84 22, 82 41 Z" fill="var(--char-primary, #5EEAD4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 68 35 C 68 24, 71 17, 74 17 C 77 17, 79 24, 78 36 Z" fill="var(--char-inner-ear, #99F6E4)" />
</g>`,
    tail: `<g data-layer="tail" data-character="pippin">
  <!-- Plump Striped Tanuki Tail -->
  <path d="M 75 124 C 96 122, 110 132, 104 142 C 97 148, 81 142, 74 133 Z" fill="var(--char-primary, #5EEAD4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 90 125 C 94 131, 94 139, 90 144" fill="none" stroke="var(--char-secondary, #0D9488)" stroke-width="5" stroke-linecap="round" />
</g>`,
    body: `<g data-layer="body" data-character="pippin">
  <!-- Relaxed Upright Chibi Body (Ref 1 middle-second) -->
  <path d="M 49 97 C 45 106, 45 121, 47 133 L 44 142 C 43 146, 57 146, 59 141 L 61 135 L 67 135 L 69 141 C 71 146, 85 146, 84 142 L 81 133 C 83 121, 83 106, 79 97 Z" fill="var(--char-primary, #5EEAD4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <ellipse cx="64" cy="117" rx="11" ry="11" fill="var(--char-belly, #CCFBF1)" />
  <!-- Relaxed Hanging Stubby Arms -->
  <path d="M 48 106 C 39 110, 36 119, 41 123 C 45 125, 48 120, 49 114" fill="var(--char-primary, #5EEAD4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 80 106 C 89 110, 92 119, 87 123 C 83 125, 80 120, 79 114" fill="var(--char-primary, #5EEAD4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    head: `<g data-layer="head" data-character="pippin">
  <!-- Round Head with Forehead Wisdom Lines (Ref 1 middle-second) -->
  <path d="M 64 36 C 88 36, 102 52, 102 74 C 102 91, 86 101, 64 101 C 42 101, 26 91, 26 74 C 26 52, 40 36, 64 36 Z" fill="var(--char-primary, #5EEAD4)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Curved Forehead Worry/Wisdom Lines -->
  <path d="M 55 49 Q 64 46 73 49" fill="none" stroke="var(--char-secondary, #0D9488)" stroke-width="2.8" stroke-linecap="round" />
  <path d="M 51 54 Q 64 50 77 54" fill="none" stroke="var(--char-secondary, #0D9488)" stroke-width="2.8" stroke-linecap="round" />
</g>`,
    face: `<g data-layer="face" data-character="pippin">
  <!-- Heavy-Lidded Sleepy Droopy Eyes (Ref 1 middle-second) -->
  <path d="M 33 65 L 55 61 C 57 71, 49 77, 42 76 C 35 75, 31 70, 33 65 Z" fill="var(--char-secondary, #0D9488)" stroke="var(--char-secondary, #0D9488)" stroke-width="2.6" stroke-linejoin="round" />
  <path d="M 43 64 L 53 62 C 54 68, 50 73, 45 73 Z" fill="var(--char-inner-ear, #99F6E4)" />
  <path d="M 95 65 L 73 61 C 71 71, 79 77, 86 76 C 93 75, 97 70, 95 65 Z" fill="var(--char-secondary, #0D9488)" stroke="var(--char-secondary, #0D9488)" stroke-width="2.6" stroke-linejoin="round" />
  <path d="M 85 64 L 75 62 C 74 68, 78 73, 83 73 Z" fill="var(--char-inner-ear, #99F6E4)" />
  <!-- Flat Deadpan Mouth -->
  <path d="M 54 85 L 72 85" fill="none" stroke="var(--char-secondary, #0D9488)" stroke-width="3.2" stroke-linecap="round" />
</g>`,
  },

  // 10. ZIGGY — Golden-Lime Onigiri-Head Fennec (Seamless tall triangle ears & head, smug half-lidded eyes, :3 mouth)
  ziggy: {
    ears: `<g data-layer="ears" data-character="ziggy">
  <!-- Tall Sharp Triangular Fennec Ears (Ref 1 middle-right) -->
  <path d="M 36 46 L 52 8 L 63 36 Z" fill="var(--char-primary, #EAB308)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 42 42 L 52 17 L 59 36 Z" fill="var(--char-inner-ear, #FDE047)" />
  <path d="M 92 46 L 76 8 L 65 36 Z" fill="var(--char-primary, #EAB308)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 86 42 L 76 17 L 69 36 Z" fill="var(--char-inner-ear, #FDE047)" />
</g>`,
    tail: `<g data-layer="tail" data-character="ziggy">
  <!-- Sleek Angular Fennec Tail -->
  <path d="M 78 126 L 112 114 L 106 128 L 80 133 Z" fill="var(--char-primary, #EAB308)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 98 119 L 112 114 L 107 125 L 96 126 Z" fill="var(--char-secondary, #A16207)" />
</g>`,
    body: `<g data-layer="body" data-character="ziggy">
  <!-- Trapezoid A-Line Body with Wide Splayed Flat Cartoon Feet (Ref 1 middle-right) -->
  <path d="M 53 94 L 40 135 L 88 135 L 75 94 Z" fill="var(--char-primary, #EAB308)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 56 102 L 49 128 L 79 128 L 72 102 Z" fill="var(--char-belly, #FEF9C3)" />
  <!-- Splayed Outward Flat Feet -->
  <path d="M 49 135 L 28 144 C 26 146, 36 147, 46 143 L 58 135 Z" fill="var(--char-primary, #EAB308)" stroke="var(--char-outline, #231F20)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 79 135 L 100 144 C 102 146, 92 147, 82 143 L 70 135 Z" fill="var(--char-primary, #EAB308)" stroke="var(--char-outline, #231F20)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    head: `<g data-layer="head" data-character="ziggy">
  <!-- Iconic Triangular / Onigiri Head Silhouette (Ref 1 middle-right) -->
  <path d="M 41 34 L 20 92 C 36 97, 92 97, 108 92 L 87 34 C 74 34, 54 34, 41 34 Z" fill="var(--char-primary, #EAB308)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Seamless Ear-to-Cheek Slope Cover -->
  <path d="M 39 39 L 59 38 L 64 46 L 69 38 L 89 39 L 98 66 L 30 66 Z" fill="var(--char-primary, #EAB308)" />
</g>`,
    face: `<g data-layer="face" data-character="ziggy">
  <!-- Vertical Brow Lines, Half-Lidded Smug Eyes & :3 Mouth (Ref 1 middle-right) -->
  <path d="M 60 58 L 60 72 M 66 61 L 66 72" fill="none" stroke="var(--char-secondary, #A16207)" stroke-width="2.8" stroke-linecap="round" />
  <!-- Left Half-Lidded Eye -->
  <path d="M 33 70 L 58 72 C 57 81, 47 84, 39 82 C 34 80, 32 75, 33 70 Z" fill="#FDE68A" stroke="var(--char-secondary, #A16207)" stroke-width="2.8" stroke-linejoin="round" />
  <ellipse cx="46" cy="76" rx="6" ry="4.5" fill="var(--char-eye, #78350F)" />
  <!-- Right Half-Lidded Eye -->
  <path d="M 68 72 L 93 70 C 94 75, 92 80, 87 82 C 79 84, 69 81, 68 72 Z" fill="#FDE68A" stroke="var(--char-secondary, #A16207)" stroke-width="2.8" stroke-linejoin="round" />
  <ellipse cx="79" cy="76" rx="6" ry="4.5" fill="var(--char-eye, #78350F)" />
  <!-- Smug :3 Cat Mouth -->
  <path d="M 57 85 Q 60 90 63 85 Q 66 90 69 85" fill="none" stroke="var(--char-secondary, #A16207)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
  },

  // 11. CLOVER — Periwinkle Fluffy Spiky Kitten (Jagged cloud-fur cheek tufts, diamond slit eyes, 4-paw crouch)
  clover: {
    ears: `<g data-layer="ears" data-character="clover">
  <!-- Pointed Fluffy Kitten Ears (Ref 1 bottom-third) -->
  <path d="M 46 38 C 48 22, 58 10, 64 10 C 68 10, 68 24, 66 38 Z" fill="var(--char-primary, #A5B4FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 65 38 C 68 24, 76 12, 82 12 C 86 12, 86 28, 82 42 Z" fill="var(--char-primary, #A5B4FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    tail: `<g data-layer="tail" data-character="clover">
  <!-- Upturned Fluffy Tail -->
  <path d="M 84 126 C 98 122, 110 112, 112 117 C 114 123, 102 132, 86 134 Z" fill="var(--char-primary, #A5B4FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    body: `<g data-layer="body" data-character="clover">
  <!-- Fluffy Four-Pawed Crouch Body (Ref 1 bottom-third) -->
  <path d="M 48 96 C 42 108, 37 120, 35 129 C 33 137, 44 139, 46 132 C 47 141, 59 142, 61 134 C 63 142, 75 142, 77 134 C 79 142, 91 141, 91 131 C 91 120, 84 108, 78 96 Z" fill="var(--char-primary, #A5B4FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <ellipse cx="63" cy="118" rx="13" ry="9" fill="var(--char-belly, #EEF2FF)" />
</g>`,
    head: `<g data-layer="head" data-character="clover">
  <!-- Spiky Cloud-Fur Cheek Silhouette (Ref 1 bottom-third) -->
  <path d="M 56 34 C 68 32, 78 35, 84 40 L 96 38 L 90 48 L 105 53 L 95 62 L 107 70 L 94 77 L 101 86 L 85 90 C 76 98, 52 98, 42 92 L 30 96 L 35 84 L 20 80 L 30 71 L 16 62 L 31 55 L 25 45 L 40 45 C 45 38, 50 35, 56 34 Z" fill="var(--char-primary, #A5B4FC)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    face: `<g data-layer="face" data-character="clover">
  <!-- Diamond-Shaped Cat Eyes with Slit Pupils & Blep Mouth (Ref 1 bottom-third) -->
  <path d="M 35 61 L 47 55 L 57 64 L 44 70 Z" fill="#93C5FD" stroke="var(--char-eye, #1E3A8A)" stroke-width="3" stroke-linejoin="round" />
  <ellipse cx="46" cy="62.5" rx="2.3" ry="5" fill="var(--char-eye, #1E3A8A)" />
  <path d="M 65 67 L 77 61 L 89 68 L 76 75 Z" fill="#93C5FD" stroke="var(--char-eye, #1E3A8A)" stroke-width="3" stroke-linejoin="round" />
  <ellipse cx="77" cy="68" rx="2.3" ry="5" fill="var(--char-eye, #1E3A8A)" />
  <!-- Cute Nose & Blep -->
  <path d="M 52 74 L 64 76 M 55 75 C 55 81, 61 81, 61 75" fill="var(--char-eye, #1E3A8A)" stroke="var(--char-eye, #1E3A8A)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
  },

  // 12. BISCUIT — Electric-Lime Shocked Whisker Cat (Right-swept long ears, whisker marks, triangle eyes, shocked O mouth)
  biscuit: {
    ears: `<g data-layer="ears" data-character="biscuit">
  <!-- Dynamic Right-Swept Long Ears (Ref 1 bottom-right) -->
  <path d="M 62 38 C 66 22, 76 8, 84 8 C 88 8, 86 24, 80 38 Z" fill="var(--char-primary, #A3E635)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 76 41 C 84 26, 98 12, 106 12 C 109 14, 102 30, 92 45 Z" fill="var(--char-primary, #A3E635)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    tail: `<g data-layer="tail" data-character="biscuit">
  <!-- Perky Left-Side Tail (Ref 1 bottom-right) -->
  <path d="M 42 126 C 30 120, 22 110, 26 106 C 30 103, 38 112, 46 120 Z" fill="var(--char-primary, #A3E635)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
    body: `<g data-layer="body" data-character="biscuit">
  <!-- Energetic Forward-Leaning 4-Pawed Body (Ref 1 bottom-right) -->
  <path d="M 52 96 C 42 108, 34 118, 32 130 C 31 138, 42 140, 44 133 C 45 141, 56 141, 58 134 C 60 141, 70 141, 72 134 C 74 141, 84 140, 84 131 C 84 118, 80 106, 76 96 Z" fill="var(--char-primary, #A3E635)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <ellipse cx="60" cy="118" rx="12" ry="8.5" fill="var(--char-belly, #ECFCCB)" />
</g>`,
    head: `<g data-layer="head" data-character="biscuit">
  <!-- Dynamic Rounded Head with Cheek Whisker Stripes (Ref 1 bottom-right) -->
  <path d="M 64 37 C 88 37, 102 53, 102 74 C 102 91, 86 101, 64 101 C 42 101, 28 90, 28 73 C 28 53, 42 37, 64 37 Z" fill="var(--char-primary, #A3E635)" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Left & Right Cheek Whisker Marks -->
  <path d="M 21 71 L 29 72 M 21 79 L 29 79 M 23 87 L 31 85" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linecap="round" />
  <path d="M 88 76 L 96 76 M 87 83 L 95 85 M 84 90 L 92 92" fill="none" stroke="var(--char-secondary, #4D7C0F)" stroke-width="3.2" stroke-linecap="round" />
</g>`,
    face: `<g data-layer="face" data-character="biscuit">
  <!-- Triangle-Arch Green Eyes & Tall Shocked O Mouth (Ref 1 bottom-right) -->
  <path d="M 34 68 C 36 54, 48 54, 53 68 Z" fill="#BBF7D0" stroke="var(--char-secondary, #4D7C0F)" stroke-width="3" stroke-linejoin="round" />
  <circle cx="43" cy="63" r="4.5" fill="#22C55E" />
  <path d="M 65 68 C 68 54, 80 54, 86 68 Z" fill="#BBF7D0" stroke="var(--char-secondary, #4D7C0F)" stroke-width="3" stroke-linejoin="round" />
  <circle cx="74" cy="63" r="4.5" fill="#22C55E" />
  <!-- Tall Surprised / Singing O Mouth -->
  <path d="M 52 75 C 58 74, 64 81, 64 90 C 64 96, 56 97, 52 94 C 49 91, 49 76, 52 75 Z" fill="var(--char-secondary, #4D7C0F)" stroke="var(--char-outline, #231F20)" stroke-width="2.6" />
</g>`,
  },
};

/**
 * Dynamic animation state facial overlays (sleeping, eating, happy) that preserve
 * the character's chibi style when interacting in PetRenderer.
 */
export const ANIMATION_STATE_FACE_OVERLAYS: Record<"sleeping" | "eating" | "happy" | "complaining", string> = {
  sleeping: `<g data-layer="face-sleeping">
  <ellipse cx="34" cy="79" rx="6" ry="3.8" fill="var(--char-blush, #FF8FA3)" opacity="0.65" />
  <ellipse cx="94" cy="79" rx="6" ry="3.8" fill="var(--char-blush, #FF8FA3)" opacity="0.65" />
  <path d="M 36 68 Q 46 76 56 68" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" />
  <path d="M 72 68 Q 82 76 92 68" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.8" stroke-linecap="round" />
  <circle cx="64" cy="83" r="3.5" fill="#F43F5E" stroke="var(--char-outline, #231F20)" stroke-width="2.6" />
  <path d="M 94 48 L 102 48 L 94 56 L 102 56" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 105 35 L 115 35 L 105 45 L 115 45" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</g>`,
  eating: `<g data-layer="face-eating">
  <ellipse cx="34" cy="79" rx="6.5" ry="4" fill="var(--char-blush, #FF8FA3)" opacity="0.8" />
  <ellipse cx="94" cy="79" rx="6.5" ry="4" fill="var(--char-blush, #FF8FA3)" opacity="0.8" />
  <circle cx="46" cy="66" r="8.5" fill="var(--char-eye, #231F20)" />
  <circle cx="43.5" cy="63.5" r="3" fill="#FFFFFF" />
  <circle cx="82" cy="66" r="8.5" fill="var(--char-eye, #231F20)" />
  <circle cx="79.5" cy="63.5" r="3" fill="#FFFFFF" />
  <path d="M 51 77 C 51 92, 77 92, 77 77 Z" fill="#E11D48" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linejoin="round" />
  <path d="M 56 85 Q 64 80 72 85 C 70 90, 58 90, 56 85 Z" fill="#FDA4AF" />
</g>`,
  happy: `<g data-layer="face-happy">
  <ellipse cx="33" cy="78" rx="7" ry="4.5" fill="var(--char-blush, #FF8FA3)" opacity="0.85" />
  <ellipse cx="95" cy="78" rx="7" ry="4.5" fill="var(--char-blush, #FF8FA3)" opacity="0.85" />
  <path d="M 36 69 Q 46 57 56 69" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="4" stroke-linecap="round" />
  <path d="M 72 69 Q 82 57 92 69" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="4" stroke-linecap="round" />
  <path d="M 52 78 Q 64 92 76 78 Z" fill="#FB7185" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linejoin="round" />
</g>`,
  complaining: `<g data-layer="face-complaining">
  <!-- Sluggish, weary, droopy eyes (half-lidded, weary downcast glance, NO blush) -->
  <ellipse cx="46" cy="71" rx="9" ry="6" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3.2" />
  <path d="M 37 70 C 37 66, 55 66, 55 70 Z" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="2.6" />
  <ellipse cx="46" cy="73" rx="4.5" ry="3.5" fill="var(--char-eye, #231F20)" />
  <circle cx="44.5" cy="71.5" r="1.3" fill="#FFFFFF" />
  <path d="M 38 64 Q 46 62 54 66" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linecap="round" />

  <ellipse cx="82" cy="71" rx="9" ry="6" fill="#FFFFFF" stroke="var(--char-outline, #231F20)" stroke-width="3.2" />
  <path d="M 73 70 C 73 66, 91 66, 91 70 Z" fill="var(--char-primary, #FF6B5B)" stroke="var(--char-outline, #231F20)" stroke-width="2.6" />
  <ellipse cx="82" cy="73" rx="4.5" ry="3.5" fill="var(--char-eye, #231F20)" />
  <circle cx="80.5" cy="71.5" r="1.3" fill="#FFFFFF" />
  <path d="M 90 64 Q 82 62 74 66" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.2" stroke-linecap="round" />

  <!-- Pouting / Complaining Droopy Mouth -->
  <ellipse cx="64" cy="76" rx="2.8" ry="2" fill="var(--char-nose, #231F20)" />
  <path d="M 57 85 Q 64 80 71 85" fill="none" stroke="var(--char-outline, #231F20)" stroke-width="3.4" stroke-linecap="round" />
  <!-- Weary Sweat Droplet -->
  <path d="M 97 73 C 97 71, 99.5 68, 99.5 68 C 99.5 68, 102 71, 102 73 C 102 74.8, 100.8 76, 99.5 76 C 98.2 76, 97 74.8, 97 73 Z" fill="#60A5FA" opacity="0.9" />
</g>`,
};

/**
 * Helper to wrap inner SVG layer markup into a complete standalone `.svg` file string.
 */
export function buildStandaloneCharacterSvg(
  innerMarkup: string,
  colors?: {
    primary: string;
    secondary: string;
    belly: string;
    innerEar: string;
    blush: string;
    eye: string;
    nose: string;
    outline: string;
  }
): string {
  const styleAttr = colors
    ? ` style="--char-primary: ${colors.primary}; --char-secondary: ${colors.secondary}; --char-belly: ${colors.belly}; --char-inner-ear: ${colors.innerEar}; --char-blush: ${colors.blush}; --char-eye: ${colors.eye}; --char-nose: ${colors.nose}; --char-outline: ${colors.outline};"`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 160" fill="none"${styleAttr}>
${innerMarkup}
</svg>
`;
}

export function getCharacterLayerMarkup(
  characterId: CharacterId,
  layer: CharacterLayerType
): string {
  const charLayers = CHARACTER_SVG_LAYERS[characterId] || CHARACTER_SVG_LAYERS.flameling;
  return charLayers[layer];
}

