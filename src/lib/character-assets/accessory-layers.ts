/**
 * Modular SVG Artwork for All 24+ Accessories (12 Everyday + 12 Food-Themed + 8 Legacy).
 *
 * Shared Coordinate System: `viewBox="0 0 128 160"`
 * Every accessory is drawn in genuine editable SVG with thick organic dark outlines
 * (`#231F20`) matching the chibi character collection.
 */

export interface AccessorySvgLayerData {
  id: string;
  /** Primary foreground SVG markup */
  frontMarkup: string;
  /** Optional rear layer SVG markup (e.g. backpack pack behind torso, hero cape behind body) */
  backMarkup?: string;
  /** Preview viewBox for zoomed-in shop/wardrobe card thumbnails */
  previewViewBox: string;
}

export const ACCESSORY_SVG_LAYERS: Record<string, AccessorySvgLayerData> = {
  // ============================================================================
  // EVERYDAY ACCESSORIES (12)
  // ============================================================================

  "acc-round-glasses": {
    id: "acc-round-glasses",
    previewViewBox: "16 44 96 48",
    frontMarkup: `<g data-accessory="acc-round-glasses">
  <!-- Temple Arms -->
  <path d="M 24 65 L 33 67 M 95 67 L 104 65" stroke="#231F20" stroke-width="3.6" stroke-linecap="round" />
  <!-- Left & Right Lenses -->
  <circle cx="46" cy="68" r="14" fill="#E0F2FE" fill-opacity="0.38" stroke="#231F20" stroke-width="3.8" />
  <circle cx="82" cy="68" r="14" fill="#E0F2FE" fill-opacity="0.38" stroke="#231F20" stroke-width="3.8" />
  <!-- Inner Gold Rim Accent -->
  <circle cx="46" cy="68" r="11.8" fill="none" stroke="#F59E0B" stroke-width="1.6" opacity="0.85" />
  <circle cx="82" cy="68" r="11.8" fill="none" stroke="#F59E0B" stroke-width="1.6" opacity="0.85" />
  <!-- Nose Bridge -->
  <path d="M 60 67 Q 64 63 68 67" fill="none" stroke="#231F20" stroke-width="3.6" stroke-linecap="round" />
  <!-- Lens Glint Highlights -->
  <path d="M 38 61 L 43 57 M 74 61 L 79 57" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity="0.9" />
</g>`,
  },

  "acc-rectangular-glasses": {
    id: "acc-rectangular-glasses",
    previewViewBox: "16 44 96 48",
    frontMarkup: `<g data-accessory="acc-rectangular-glasses">
  <!-- Temple Arms -->
  <path d="M 23 64 L 31 65 M 97 65 L 105 64" stroke="#231F20" stroke-width="3.8" stroke-linecap="round" />
  <!-- Rectangular Frames -->
  <rect x="31" y="58" width="29" height="19" rx="4" fill="#38BDF8" fill-opacity="0.28" stroke="#231F20" stroke-width="4" />
  <rect x="68" y="58" width="29" height="19" rx="4" fill="#38BDF8" fill-opacity="0.28" stroke="#231F20" stroke-width="4" />
  <!-- Bridge -->
  <path d="M 60 65 L 68 65" stroke="#231F20" stroke-width="4" stroke-linecap="round" />
  <!-- Glints -->
  <path d="M 36 62 L 42 62 M 73 62 L 79 62" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" opacity="0.85" />
</g>`,
  },

  "acc-star-glasses": {
    id: "acc-star-glasses",
    previewViewBox: "14 40 100 54",
    frontMarkup: `<g data-accessory="acc-star-glasses">
  <!-- Temple Arms -->
  <path d="M 23 66 L 32 67 M 96 67 L 105 66" stroke="#231F20" stroke-width="3.4" stroke-linecap="round" />
  <!-- Bridge -->
  <path d="M 58 67 Q 64 63 70 67" fill="none" stroke="#231F20" stroke-width="3.6" stroke-linecap="round" />
  <!-- Left Star Frame -->
  <polygon points="46,51 50,61 61,62 53,69 55,80 46,74 37,80 39,69 31,62 42,61" fill="#F472B6" fill-opacity="0.65" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <!-- Right Star Frame -->
  <polygon points="82,51 86,61 97,62 89,69 91,80 82,74 73,80 75,69 67,62 78,61" fill="#F472B6" fill-opacity="0.65" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <!-- Sparkle Highlights -->
  <circle cx="43" cy="63" r="2.2" fill="#FEF08A" />
  <circle cx="79" cy="63" r="2.2" fill="#FEF08A" />
</g>`,
  },

  "acc-beanie": {
    id: "acc-beanie",
    previewViewBox: "20 4 88 54",
    frontMarkup: `<g data-accessory="acc-beanie">
  <!-- Pom-Pom -->
  <circle cx="64" cy="14" r="7.5" fill="#FDE68A" stroke="#231F20" stroke-width="3.6" />
  <!-- Knit Dome -->
  <path d="M 32 42 C 32 22, 46 16, 64 16 C 82 16, 96 22, 96 42 Z" fill="#F97316" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Knit Seam Curves -->
  <path d="M 50 18 C 46 25, 45 33, 45 40 M 64 16 L 64 40 M 78 18 C 82 25, 83 33, 83 40" stroke="#EA580C" stroke-width="2.4" stroke-linecap="round" />
  <!-- Folded Ribbed Cuff -->
  <rect x="29" y="36" width="70" height="12" rx="6" fill="#FB923C" stroke="#231F20" stroke-width="3.8" />
  <path d="M 41 37 L 41 47 M 52 37 L 52 47 M 64 37 L 64 47 M 76 37 L 76 47 M 87 37 L 87 47" stroke="#231F20" stroke-width="2.4" stroke-linecap="round" />
</g>`,
  },

  "acc-baseball-cap": {
    id: "acc-baseball-cap",
    previewViewBox: "18 8 98 48",
    frontMarkup: `<g data-accessory="acc-baseball-cap">
  <!-- Cap Top Button -->
  <circle cx="62" cy="16" r="3.5" fill="#1D4ED8" stroke="#231F20" stroke-width="3" />
  <!-- Cap Crown -->
  <path d="M 31 42 C 31 21, 45 16, 63 16 C 81 16, 93 22, 94 40 Z" fill="#3B82F6" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Front Panel Seam -->
  <path d="M 62 16 C 54 24, 52 33, 52 40 M 62 16 C 72 24, 75 33, 75 40" fill="none" stroke="#1D4ED8" stroke-width="2.4" />
  <!-- Emblem Patch -->
  <circle cx="64" cy="29" r="5" fill="#FEF08A" stroke="#231F20" stroke-width="2.4" />
  <!-- Curved Visor Brim -->
  <path d="M 30 40 C 48 36, 78 36, 108 42 C 111 46, 102 50, 86 48 C 68 45, 46 45, 30 43 Z" fill="#1D4ED8" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
</g>`,
  },

  "acc-bucket-hat": {
    id: "acc-bucket-hat",
    previewViewBox: "14 8 100 50",
    frontMarkup: `<g data-accessory="acc-bucket-hat">
  <!-- Bucket Crown -->
  <path d="M 38 18 C 48 15, 80 15, 90 18 L 95 37 L 33 37 Z" fill="#FDE047" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Accent Band -->
  <path d="M 34 32 L 94 32 L 95 37 L 33 37 Z" fill="#F97316" stroke="#231F20" stroke-width="3" stroke-linejoin="round" />
  <!-- Wide Sloping Ruffled Brim -->
  <path d="M 33 37 L 20 46 C 34 51, 50 47, 64 49 C 78 47, 94 51, 108 46 L 95 37 Z" fill="#FACC15" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
</g>`,
  },

  "acc-beret": {
    id: "acc-beret",
    previewViewBox: "18 6 92 48",
    frontMarkup: `<g data-accessory="acc-beret">
  <!-- Stem Tip -->
  <path d="M 62 17 L 65 11" stroke="#231F20" stroke-width="3.8" stroke-linecap="round" />
  <!-- Tilted French Beret Cushion -->
  <path d="M 27 36 C 22 24, 38 14, 64 16 C 90 17, 104 28, 96 39 C 89 44, 42 42, 27 36 Z" fill="#E11D48" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Snug Headband Rim -->
  <path d="M 34 37 C 50 35, 76 36, 90 40 L 88 44 C 74 41, 50 40, 35 42 Z" fill="#881337" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <path d="M 42 22 C 54 19, 70 20, 82 24" fill="none" stroke="#FDA4AF" stroke-width="2.6" stroke-linecap="round" opacity="0.6" />
</g>`,
  },

  "acc-bow": {
    id: "acc-bow",
    previewViewBox: "56 16 58 46",
    frontMarkup: `<g data-accessory="acc-bow">
  <!-- Ribbon Tails -->
  <path d="M 82 40 L 75 53 L 81 51 L 85 55 L 88 42 Z" fill="#EC4899" stroke="#231F20" stroke-width="3.2" stroke-linejoin="round" />
  <path d="M 90 40 L 97 53 L 91 51 L 87 55 L 84 42 Z" fill="#EC4899" stroke="#231F20" stroke-width="3.2" stroke-linejoin="round" />
  <!-- Left Bow Loop -->
  <path d="M 85 36 C 74 24, 64 26, 65 37 C 66 47, 76 46, 85 39 Z" fill="#F472B6" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <!-- Right Bow Loop -->
  <path d="M 87 36 C 98 24, 108 26, 107 37 C 106 47, 96 46, 87 39 Z" fill="#F472B6" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <!-- Inner Pleat Creases -->
  <path d="M 74 35 L 81 37 M 98 35 L 91 37" stroke="#231F20" stroke-width="2.6" stroke-linecap="round" />
  <!-- Center Knot -->
  <ellipse cx="86" cy="37.5" rx="4.8" ry="5.5" fill="#DB2777" stroke="#231F20" stroke-width="3.4" />
</g>`,
  },

  "acc-headphones": {
    id: "acc-headphones",
    previewViewBox: "8 20 112 72",
    frontMarkup: `<g data-accessory="acc-headphones">
  <!-- Over-Head Arch Band -->
  <path d="M 21 66 C 18 24, 110 24, 107 66" fill="none" stroke="#231F20" stroke-width="7.5" stroke-linecap="round" />
  <path d="M 21 66 C 18 24, 110 24, 107 66" fill="none" stroke="#6366F1" stroke-width="3.8" stroke-linecap="round" />
  <!-- Left Earcup -->
  <rect x="13" y="56" width="14" height="24" rx="7" fill="#4F46E5" stroke="#231F20" stroke-width="3.6" />
  <rect x="22" y="59" width="5" height="18" rx="2.5" fill="#A5B4FC" stroke="#231F20" stroke-width="2.6" />
  <!-- Right Earcup -->
  <rect x="101" y="56" width="14" height="24" rx="7" fill="#4F46E5" stroke="#231F20" stroke-width="3.6" />
  <rect x="101" y="59" width="5" height="18" rx="2.5" fill="#A5B4FC" stroke="#231F20" stroke-width="2.6" />
</g>`,
  },

  "acc-scarf": {
    id: "acc-scarf",
    previewViewBox: "28 84 72 52",
    frontMarkup: `<g data-accessory="acc-scarf">
  <!-- Draped Scarf Tail with Stripes & Fringe -->
  <path d="M 68 102 L 65 126 L 79 126 L 78 102 Z" fill="#EF4444" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <path d="M 66 114 L 78 114 M 66 119 L 78 119" stroke="#FDE047" stroke-width="3" />
  <path d="M 67 126 L 66 131 M 72 126 L 72 131 M 77 126 L 78 131" stroke="#231F20" stroke-width="2.6" stroke-linecap="round" />
  <!-- Snug Wrapped Neck Collar -->
  <rect x="41" y="94" width="46" height="12" rx="6" fill="#DC2626" stroke="#231F20" stroke-width="3.8" />
  <path d="M 52 94 L 52 106 M 64 94 L 64 106 M 76 94 L 76 106" stroke="#FCA5A5" stroke-width="2.4" />
</g>`,
  },

  "acc-backpack": {
    id: "acc-backpack",
    previewViewBox: "22 86 84 56",
    backMarkup: `<g data-accessory="acc-backpack-back">
  <!-- Rounded Daypack Visible Behind Shoulders -->
  <rect x="29" y="96" width="70" height="36" rx="12" fill="#0D9488" stroke="#231F20" stroke-width="3.8" />
  <rect x="33" y="102" width="62" height="14" rx="6" fill="#14B8A6" stroke="#231F20" stroke-width="3" />
  <!-- Top Grab Loop -->
  <path d="M 56 96 C 56 88, 72 88, 72 96" fill="none" stroke="#231F20" stroke-width="3.6" stroke-linecap="round" />
</g>`,
    frontMarkup: `<g data-accessory="acc-backpack-front">
  <!-- Front Shoulder Straps & Chest Buckle -->
  <path d="M 49 99 C 47 109, 47 121, 50 128" fill="none" stroke="#0F766E" stroke-width="6.5" stroke-linecap="round" />
  <path d="M 49 99 C 47 109, 47 121, 50 128" fill="none" stroke="#231F20" stroke-width="3" stroke-linecap="round" />
  <path d="M 79 99 C 81 109, 81 121, 78 128" fill="none" stroke="#0F766E" stroke-width="6.5" stroke-linecap="round" />
  <path d="M 79 99 C 81 109, 81 121, 78 128" fill="none" stroke="#231F20" stroke-width="3" stroke-linecap="round" />
  <line x1="49" y1="114" x2="79" y2="114" stroke="#231F20" stroke-width="3.4" stroke-linecap="round" />
  <rect x="60" y="111" width="8" height="6" rx="1.5" fill="#FACC15" stroke="#231F20" stroke-width="2.4" />
</g>`,
  },

  "acc-hoodie": {
    id: "acc-hoodie",
    previewViewBox: "24 88 80 54",
    frontMarkup: `<g data-accessory="acc-hoodie">
  <!-- Pullover Chibi Hoodie Torso & Sleeves -->
  <path d="M 45 97 L 33 114 L 40 120 L 44 112 L 43 134 L 85 134 L 84 112 L 88 120 L 95 114 L 83 97 Z" fill="#8B5CF6" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Kangaroo Pocket -->
  <path d="M 50 119 L 54 113 L 74 113 L 78 119 L 78 130 L 50 130 Z" fill="#7C3AED" stroke="#231F20" stroke-width="3" stroke-linejoin="round" />
  <!-- Hood Collar Fold -->
  <path d="M 44 97 Q 64 106 84 97" fill="none" stroke="#231F20" stroke-width="3.8" stroke-linecap="round" />
  <!-- Drawstrings -->
  <path d="M 58 101 L 57 112 M 70 101 L 71 112" stroke="#FEF08A" stroke-width="2.8" stroke-linecap="round" />
</g>`,
  },

  // ============================================================================
  // FOOD-THEMED ACCESSORIES (12)
  // ============================================================================

  "acc-lettuce-leaf-hat": {
    id: "acc-lettuce-leaf-hat",
    previewViewBox: "18 10 92 44",
    frontMarkup: `<g data-accessory="acc-lettuce-leaf-hat">
  <!-- Ruffled Fresh Lettuce Leaf Canopy -->
  <path d="M 26 40 C 22 30, 34 18, 64 18 C 94 18, 106 30, 102 40 C 96 45, 88 38, 82 42 C 75 46, 70 39, 64 43 C 58 39, 53 46, 46 42 C 40 38, 32 45, 26 40 Z" fill="#4ADE80" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Leaf Veins -->
  <path d="M 64 19 L 64 38 M 64 25 L 48 34 M 64 25 L 80 34 M 64 31 L 36 36 M 64 31 L 92 36" stroke="#BBF7D0" stroke-width="2.6" stroke-linecap="round" />
  <!-- Dewdrop -->
  <circle cx="81" cy="27" r="2.8" fill="#E0F2FE" stroke="#231F20" stroke-width="2" />
</g>`,
  },

  "acc-strawberry-hair-clip": {
    id: "acc-strawberry-hair-clip",
    previewViewBox: "60 18 48 44",
    frontMarkup: `<g data-accessory="acc-strawberry-hair-clip">
  <!-- Hair Clip Pin Bar -->
  <rect x="72" y="40" width="22" height="5.5" rx="2.7" transform="rotate(18 83 42)" fill="#FDE047" stroke="#231F20" stroke-width="2.8" />
  <!-- Plump Strawberry Body -->
  <path d="M 88 26 C 96 26, 99 35, 93 44 C 88 50, 81 50, 78 43 C 75 35, 80 26, 88 26 Z" fill="#F43F5E" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <!-- Green Leafy Calyx -->
  <path d="M 81 27 L 86 22 L 89 27 L 94 23 L 95 29 L 88 30 Z" fill="#22C55E" stroke="#231F20" stroke-width="2.8" stroke-linejoin="round" />
  <!-- Seeds -->
  <circle cx="85" cy="35" r="1.2" fill="#FEF08A" />
  <circle cx="91" cy="36" r="1.2" fill="#FEF08A" />
  <circle cx="87" cy="41" r="1.2" fill="#FEF08A" />
</g>`,
  },

  "acc-orange-slice": {
    id: "acc-orange-slice",
    previewViewBox: "58 14 52 46",
    frontMarkup: `<g data-accessory="acc-orange-slice">
  <!-- Half Citrus Wheel Slice -->
  <path d="M 72 42 A 15 15 0 1 1 98 27 Z" fill="#FB923C" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <path d="M 75 40 A 11.5 11.5 0 1 1 95 29 Z" fill="#FDE68A" />
  <path d="M 77 39 A 9.5 9.5 0 1 1 93 30 Z" fill="#F97316" />
  <!-- Segment Lines -->
  <path d="M 85 34 L 78 26 M 85 34 L 85 23 M 85 34 L 92 27" stroke="#FDE68A" stroke-width="2.2" stroke-linecap="round" />
  <line x1="72" y1="42" x2="98" y2="27" stroke="#231F20" stroke-width="3.4" stroke-linecap="round" />
</g>`,
  },

  "acc-chef-hat": {
    id: "acc-chef-hat",
    previewViewBox: "22 2 84 48",
    frontMarkup: `<g data-accessory="acc-chef-hat">
  <!-- Puffy White Toque Cloud -->
  <path d="M 38 34 C 28 31, 28 16, 41 15 C 44 6, 57 5, 64 11 C 71 5, 84 6, 87 15 C 100 16, 100 31, 90 34 Z" fill="#FFFFFF" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Pleat Lines -->
  <path d="M 50 22 L 52 33 M 64 19 L 64 33 M 78 22 L 76 33" stroke="#CBD5E1" stroke-width="2.6" stroke-linecap="round" />
  <!-- Chef Hat Base Band -->
  <rect x="37" y="32" width="54" height="9" rx="3.5" fill="#F8FAFC" stroke="#231F20" stroke-width="3.8" />
</g>`,
  },

  "acc-mini-burger": {
    id: "acc-mini-burger",
    previewViewBox: "72 86 48 44",
    frontMarkup: `<g data-accessory="acc-mini-burger">
  <!-- Bottom Bun -->
  <path d="M 82 115 L 110 115 C 110 121, 82 121, 82 115 Z" fill="#F59E0B" stroke="#231F20" stroke-width="3.2" stroke-linejoin="round" />
  <!-- Burger Patty -->
  <rect x="80" y="109" width="32" height="6" rx="3" fill="#78350F" stroke="#231F20" stroke-width="3.2" />
  <!-- Melted Cheese Triangle -->
  <polygon points="83,109 96,114 108,109" fill="#FACC15" stroke="#231F20" stroke-width="2.4" stroke-linejoin="round" />
  <!-- Ruffled Lettuce -->
  <path d="M 80 108 Q 85 104 90 108 Q 96 104 102 108 Q 107 104 112 108" fill="none" stroke="#22C55E" stroke-width="4" stroke-linecap="round" />
  <!-- Sesame Top Bun -->
  <path d="M 81 106 C 81 94, 111 94, 111 106 Z" fill="#F59E0B" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <circle cx="91" cy="99" r="1.2" fill="#FEF3C7" />
  <circle cx="97" cy="98" r="1.2" fill="#FEF3C7" />
  <circle cx="102" cy="100" r="1.2" fill="#FEF3C7" />
</g>`,
  },

  "acc-apple": {
    id: "acc-apple",
    previewViewBox: "72 84 48 44",
    frontMarkup: `<g data-accessory="acc-apple">
  <!-- Stem & Leaf -->
  <path d="M 96 98 Q 97 91 101 90" fill="none" stroke="#78350F" stroke-width="3.2" stroke-linecap="round" />
  <path d="M 97 94 C 103 89, 110 92, 105 97 C 101 99, 98 96, 97 94 Z" fill="#22C55E" stroke="#231F20" stroke-width="2.8" stroke-linejoin="round" />
  <!-- Crisp Red Apple Body -->
  <path d="M 96 99 C 89 95, 81 101, 82 110 C 83 119, 90 123, 96 120 C 102 123, 109 119, 110 110 C 111 101, 103 95, 96 99 Z" fill="#EF4444" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <!-- Gloss Highlight -->
  <path d="M 86 105 C 86 102, 89 100, 91 100" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity="0.85" />
</g>`,
  },

  "acc-carrot": {
    id: "acc-carrot",
    previewViewBox: "72 82 48 48",
    frontMarkup: `<g data-accessory="acc-carrot">
  <!-- Leafy Green Tops -->
  <path d="M 101 97 C 101 88, 107 86, 107 93 C 112 89, 115 95, 106 99 Z" fill="#22C55E" stroke="#231F20" stroke-width="3" stroke-linejoin="round" />
  <!-- Tapered Orange Carrot Body -->
  <path d="M 96 95 C 102 93, 107 98, 104 104 L 89 124 C 86 126, 83 123, 85 119 Z" fill="#F97316" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <!-- Texture Ridges -->
  <path d="M 95 102 L 99 104 M 91 109 L 95 111 M 88 115 L 91 117" stroke="#C2410C" stroke-width="2.2" stroke-linecap="round" />
</g>`,
  },

  "acc-rice-bowl": {
    id: "acc-rice-bowl",
    previewViewBox: "70 84 50 44",
    frontMarkup: `<g data-accessory="acc-rice-bowl">
  <!-- Chopsticks -->
  <line x1="82" y1="95" x2="113" y2="90" stroke="#92400E" stroke-width="3" stroke-linecap="round" />
  <line x1="82" y1="99" x2="114" y2="96" stroke="#92400E" stroke-width="3" stroke-linecap="round" />
  <!-- Steamed White Rice Mound -->
  <path d="M 82 106 C 82 95, 110 95, 110 106 Z" fill="#FFFFFF" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <!-- Sesame Seeds -->
  <circle cx="93" cy="100" r="1.2" fill="#231F20" />
  <circle cx="98" cy="99" r="1.2" fill="#231F20" />
  <circle cx="101" cy="102" r="1.2" fill="#231F20" />
  <!-- Ceramic Bowl -->
  <path d="M 80 106 L 112 106 C 111 118, 104 122, 96 122 C 88 122, 81 118, 80 106 Z" fill="#3B82F6" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <path d="M 83 111 L 109 111" stroke="#FEF08A" stroke-width="2.6" />
</g>`,
  },

  "acc-milk-carton": {
    id: "acc-milk-carton",
    previewViewBox: "72 82 48 48",
    frontMarkup: `<g data-accessory="acc-milk-carton">
  <!-- Striped Bendy Straw -->
  <path d="M 99 95 L 103 86 L 110 87" fill="none" stroke="#F43F5E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Carton Body -->
  <rect x="84" y="100" width="22" height="23" rx="2.5" fill="#FFFFFF" stroke="#231F20" stroke-width="3.4" />
  <rect x="84" y="107" width="22" height="9" fill="#38BDF8" />
  <!-- Gable Roof Top -->
  <polygon points="84,100 95,92 106,100" fill="#E0F2FE" stroke="#231F20" stroke-width="3.4" stroke-linejoin="round" />
  <!-- Milk Drop Icon -->
  <circle cx="95" cy="111.5" r="2.5" fill="#FFFFFF" />
</g>`,
  },

  "acc-water-bottle": {
    id: "acc-water-bottle",
    previewViewBox: "72 80 48 50",
    frontMarkup: `<g data-accessory="acc-water-bottle">
  <!-- Bottle Spout & Cap -->
  <rect x="92" y="87" width="6" height="5" rx="1.5" fill="#0284C7" stroke="#231F20" stroke-width="2.8" />
  <rect x="88" y="91" width="14" height="5" rx="2" fill="#0EA5E9" stroke="#231F20" stroke-width="3.2" />
  <!-- Aqua Hydro Bottle Body -->
  <rect x="86" y="96" width="18" height="27" rx="5" fill="#38BDF8" stroke="#231F20" stroke-width="3.4" />
  <!-- Water Level & Measurement Ticks -->
  <path d="M 88 106 Q 95 104 102 106 L 102 120 C 102 121, 88 121, 88 120 Z" fill="#0284C7" opacity="0.55" />
  <path d="M 99 102 L 102 102 M 99 108 L 102 108 M 99 114 L 102 114" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
</g>`,
  },

  "acc-leafy-headband": {
    id: "acc-leafy-headband",
    previewViewBox: "20 8 88 46",
    frontMarkup: `<g data-accessory="acc-leafy-headband">
  <!-- Headband Arch -->
  <path d="M 28 48 C 36 31, 92 31, 100 48" fill="none" stroke="#15803D" stroke-width="4.2" stroke-linecap="round" />
  <path d="M 28 48 C 36 31, 92 31, 100 48" fill="none" stroke="#231F20" stroke-width="2.2" stroke-linecap="round" />
  <!-- Center Sprout Stem & Twin Leaves -->
  <path d="M 64 35 L 64 23" stroke="#231F20" stroke-width="3.4" stroke-linecap="round" />
  <path d="M 64 24 C 54 14, 43 18, 49 27 C 53 31, 60 28, 64 24 Z" fill="#4ADE80" stroke="#231F20" stroke-width="3.2" stroke-linejoin="round" />
  <path d="M 64 24 C 74 14, 85 18, 79 27 C 75 31, 68 28, 64 24 Z" fill="#22C55E" stroke="#231F20" stroke-width="3.2" stroke-linejoin="round" />
  <!-- Berry Blossoms -->
  <circle cx="46" cy="37" r="3.5" fill="#FEF08A" stroke="#231F20" stroke-width="2.4" />
  <circle cx="82" cy="37" r="3.5" fill="#FEF08A" stroke="#231F20" stroke-width="2.4" />
</g>`,
  },

  "acc-fruit-hat": {
    id: "acc-fruit-hat",
    previewViewBox: "20 6 88 46",
    frontMarkup: `<g data-accessory="acc-fruit-hat">
  <!-- Cherry / Berry Topper -->
  <path d="M 64 17 Q 68 9 74 10" fill="none" stroke="#15803D" stroke-width="3.2" stroke-linecap="round" />
  <circle cx="64" cy="16" r="5" fill="#E11D48" stroke="#231F20" stroke-width="3.2" />
  <!-- Melon-Berry Dome Hat -->
  <path d="M 30 41 C 30 21, 46 17, 64 17 C 82 17, 98 21, 98 41 Z" fill="#FB7185" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Green Rind Brim -->
  <path d="M 28 38 C 48 35, 80 35, 100 38 L 99 43 C 80 40, 48 40, 29 43 Z" fill="#22C55E" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <!-- Watermelon Seeds -->
  <circle cx="50" cy="28" r="1.8" fill="#231F20" />
  <circle cx="64" cy="26" r="1.8" fill="#231F20" />
  <circle cx="78" cy="28" r="1.8" fill="#231F20" />
</g>`,
  },

  // ============================================================================
  // LEGACY / SPECIAL CATALOG ITEMS (8 — ensuring 100% SVG coverage across app)
  // ============================================================================

  "head-explorer-hat": {
    id: "head-explorer-hat",
    previewViewBox: "14 10 100 44",
    frontMarkup: `<g data-accessory="head-explorer-hat">
  <!-- Safari Pith Helmet Dome -->
  <path d="M 35 38 C 35 20, 48 16, 64 16 C 80 16, 93 20, 93 38 Z" fill="#EAB308" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Leather Hatband -->
  <rect x="35" y="32" width="58" height="6" fill="#78350F" stroke="#231F20" stroke-width="3" />
  <!-- Wide Explorer Brim -->
  <path d="M 19 38 C 42 34, 86 34, 109 38 C 111 42, 96 44, 64 43 C 32 44, 17 42, 19 38 Z" fill="#CA8A04" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
</g>`,
  },

  "head-golden-crown": {
    id: "head-golden-crown",
    previewViewBox: "24 6 80 42",
    frontMarkup: `<g data-accessory="head-golden-crown">
  <!-- Royal Gold Crown -->
  <polygon points="38,38 34,18 50,27 64,12 78,27 94,18 90,38" fill="#FACC15" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
  <!-- Crown Jewels -->
  <circle cx="64" cy="28" r="3.5" fill="#EF4444" stroke="#231F20" stroke-width="2.2" />
  <circle cx="48" cy="31" r="2.5" fill="#3B82F6" stroke="#231F20" stroke-width="2" />
  <circle cx="80" cy="31" r="2.5" fill="#3B82F6" stroke="#231F20" stroke-width="2" />
</g>`,
  },

  "head-red-ribbon": {
    id: "head-red-ribbon",
    previewViewBox: "56 16 58 46",
    frontMarkup: `<g data-accessory="head-red-ribbon">
  <path d="M 85 36 C 73 23, 63 26, 65 37 C 66 47, 76 46, 85 39 Z" fill="#EF4444" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <path d="M 87 36 C 99 23, 109 26, 107 37 C 106 47, 96 46, 87 39 Z" fill="#EF4444" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <circle cx="86" cy="37.5" r="5" fill="#B91C1C" stroke="#231F20" stroke-width="3.4" />
</g>`,
  },

  "glasses-cool-shades": {
    id: "glasses-cool-shades",
    previewViewBox: "16 44 96 48",
    frontMarkup: `<g data-accessory="glasses-cool-shades">
  <path d="M 23 62 L 105 62" stroke="#231F20" stroke-width="4.2" stroke-linecap="round" />
  <path d="M 29 61 L 59 61 L 56 76 C 53 79, 35 79, 32 75 Z" fill="#1E293B" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <path d="M 69 61 L 99 61 L 96 75 C 93 79, 75 79, 72 76 Z" fill="#1E293B" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <path d="M 36 65 L 43 73 M 76 65 L 83 73" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity="0.75" />
</g>`,
  },

  "glasses-nerd-specs": {
    id: "glasses-nerd-specs",
    previewViewBox: "16 44 96 48",
    frontMarkup: `<g data-accessory="glasses-nerd-specs">
  <circle cx="46" cy="68" r="13.5" fill="#DBEAFE" fill-opacity="0.35" stroke="#1E3A8A" stroke-width="4" />
  <circle cx="82" cy="68" r="13.5" fill="#DBEAFE" fill-opacity="0.35" stroke="#1E3A8A" stroke-width="4" />
  <rect x="59" y="64" width="10" height="5" rx="1.5" fill="#FEF3C7" stroke="#231F20" stroke-width="2.4" />
</g>`,
  },

  "body-chef-apron": {
    id: "body-chef-apron",
    previewViewBox: "28 88 72 54",
    frontMarkup: `<g data-accessory="body-chef-apron">
  <path d="M 52 98 L 47 134 L 81 134 L 76 98 Z" fill="#FFFFFF" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <rect x="54" y="114" width="20" height="11" rx="3" fill="#FFEDD5" stroke="#231F20" stroke-width="2.8" />
  <path d="M 54 98 C 54 92, 74 92, 74 98" fill="none" stroke="#231F20" stroke-width="3" />
</g>`,
  },

  "body-hero-cape": {
    id: "body-hero-cape",
    previewViewBox: "18 86 92 60",
    backMarkup: `<g data-accessory="body-hero-cape-back">
  <path d="M 44 98 L 24 139 C 44 145, 84 145, 104 139 L 84 98 Z" fill="#DC2626" stroke="#231F20" stroke-width="3.8" stroke-linejoin="round" />
</g>`,
    frontMarkup: `<g data-accessory="body-hero-cape-front">
  <path d="M 46 98 Q 64 105 82 98" fill="none" stroke="#B91C1C" stroke-width="5" stroke-linecap="round" />
  <circle cx="64" cy="101" r="4.5" fill="#FACC15" stroke="#231F20" stroke-width="2.8" />
</g>`,
  },

  "body-sport-jersey": {
    id: "body-sport-jersey",
    previewViewBox: "28 88 72 54",
    frontMarkup: `<g data-accessory="body-sport-jersey">
  <path d="M 47 98 L 43 133 L 85 133 L 81 98 L 73 98 C 70 104, 58 104, 55 98 Z" fill="#10B981" stroke="#231F20" stroke-width="3.6" stroke-linejoin="round" />
  <path d="M 45 127 L 83 127" stroke="#FEF08A" stroke-width="3.2" />
  <circle cx="64" cy="114" r="6" fill="#FFFFFF" stroke="#231F20" stroke-width="2.4" />
</g>`,
  },
};

export function buildStandaloneAccessorySvg(accessoryId: string): string {
  const layer = ACCESSORY_SVG_LAYERS[accessoryId];
  if (!layer) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 160" fill="none"></svg>\n`;
  }
  const combined = layer.backMarkup
    ? `${layer.backMarkup}\n${layer.frontMarkup}`
    : layer.frontMarkup;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 160" fill="none">
${combined}
</svg>
`;
}

