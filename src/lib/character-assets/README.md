# Caloria Modular SVG Character & Accessory Asset Library

This directory defines the centralized modular SVG character and accessory system for **Caloria**.

## 1. Shared Coordinate System

- **Standard Canvas**: `viewBox="0 0 128 160"` (`128px` width × `160px` height)
- **Horizontal Center Axis**: `x = 64`
- **Chibi Proportions**:
  - **Crown / Ear Base**: `y = 34..42` (ears extend up into `y = 6..42` or outward)
  - **Oversized Expressive Head**: `x = 22..106`, `y = 35..102` (centered at `(64, 70)`)
  - **Eye Line**: `y = 67..72` (left eye `(46, 68)`, right eye `(82, 68)`)
  - **Cheek Blush**: left `(34, 79)`, right `(94, 79)`
  - **Neck Junction**: `(64, 97)`
  - **Compact Torso & Limbs**: `x = 38..90`, `y = 96..136`
  - **Feet & Ground Shadow**: `y = 140..147` (shadow centered at `(64, 146)`)

## 2. Composable Layer Order (Back to Front)

| Order | Layer ID | Description |
| ---: | :--- | :--- |
| `0` | `room` | Optional background/habitat theme aura |
| `5` | `shadow` | Ground drop shadow ellipse beneath the character |
| `15` | `backAccessory` | Rear portion of accessories (`acc-backpack` pack, `body-hero-cape` cloak) |
| `20` | `tail` | Character-specific tail SVG (`tail.svg`) |
| `30` | `ears` | Character ears and rear head details (`ears.svg`) |
| `40` | `body` | Character torso, belly patch, legs, and arms (`body.svg`) |
| `50` | `bodyAccessory` | Torso outfits (`acc-hoodie`, `body-chef-apron`, `body-sport-jersey`, `acc-backpack` straps) |
| `55` | `neckAccessory` | Neckwear (`acc-scarf`) |
| `60` | `head` | Character head silhouette, cheek tufts, muzzle mask, and whiskers (`head.svg`) |
| `70` | `face` | Eyes, pupils, highlights, eyebrows, nose, mouth, and blush (`face.svg`) |
| `80` | `eyeAccessory` | Eyewear (`acc-round-glasses`, `acc-rectangular-glasses`, `acc-star-glasses`, etc.) |
| `90` | `headAccessory` | Crown hats (`acc-beanie`, `acc-baseball-cap`, `acc-bucket-hat`, `acc-beret`, `acc-chef-hat`, `acc-lettuce-leaf-hat`, `acc-fruit-hat`, etc.) |
| `91` | `headSideAccessory` | Side clips and bows (`acc-bow`, `acc-strawberry-hair-clip`, `acc-orange-slice`, `head-red-ribbon`) |
| `92` | `foreheadAccessory` | Forehead bands and over-ear gear (`acc-headphones`, `acc-leafy-headband`) |
| `100` | `heldObject` | Held food and drink items (`acc-mini-burger`, `acc-apple`, `acc-carrot`, `acc-rice-bowl`, `acc-milk-carton`, `acc-water-bottle`) |

## 3. Named Color Tokens (CSS Custom Properties)

Every character SVG layer uses CSS custom properties with fallback values so that standalone `.svg` files render in full color and inline SVG compositions can be dynamically recolored without affecting eyes, teeth, or accessories:

- `--char-primary`: Main body, head, and outer ear fill
- `--char-secondary`: Secondary markings, ear tips, tail stripes, and accents
- `--char-belly`: Belly patch, muzzle mask, or chest fluff fill
- `--char-inner-ear`: Inner ear fill
- `--char-blush`: Cheek blush fill
- `--char-eye`: Eye iris/pupil fill
- `--char-nose`: Nose and mouth accent fill
- `--char-outline`: Thick organic dark outline stroke (default `#231F20`)

## 4. Anchor Points & Character-Specific Adjustments

| Anchor ID | Base `(x, y)` | Intended Accessories |
| :--- | :--- | :--- |
| `crown` | `(64, 36)` | Beanie, baseball cap, bucket hat, beret, lettuce-leaf hat, chef hat, fruit hat, explorer hat, golden crown |
| `headSide` | `(88, 42)` | Bow, strawberry hair clip, orange slice, red ribbon |
| `forehead` | `(64, 48)` | Headphones, leafy headband |
| `eyes` | `(64, 70)` | Round glasses, rectangular glasses, star glasses, cool shades, nerd specs |
| `neck` | `(64, 100)` | Scarf |
| `torso` | `(64, 118)` | Hoodie, chef apron, sport jersey |
| `back` | `(64, 114)` | Backpack, hero cape |
| `handRight` | `(96, 114)` | Mini burger, apple, carrot, rice bowl, milk carton, water bottle |

### Character-Specific Anchor Adjustments
- **`flameling`**: Raised waving right arm shifts `handRight` by `{ dx: 2, dy: -12, scale: 0.96 }`.
- **`kuma`**: Right paw is raised in a V peace sign by the cheek, so `handRight` shifts to the left paw `{ dx: -62, dy: 4, scale: 0.95 }` and `eyes` shifts `{ dx: -6, dy: -1, scale: 0.9 }`.
- **`bambi`**: Side-glancing eyes shift `eyes` by `{ dx: -8, dy: -5, scale: 0.9 }`.
- **`ziggy`**: Triangular/onigiri head narrows the crown (`crown: { dx: 0, dy: -2, scale: 0.86 }`, `headSide: { dx: -7, dy: 4, scale: 0.92 }`) and lowers the eye bridge (`eyes: { dx: 0, dy: 7, scale: 0.96 }`).
- **`clover` & `biscuit`**: Four-pawed crouch bodies and tilted/spiky heads apply subtle `eyes`, `crown`, and `torso` scale/position offsets via `resolveAccessoryTransform()`.

