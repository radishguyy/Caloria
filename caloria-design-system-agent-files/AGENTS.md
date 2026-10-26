# Caloria Design System for Agents

## Purpose
Implement Caloria using these reusable tokens. Keep the design spacious, playful, rounded, and illustration-friendly. Prefer semantic tokens over arbitrary one-off values.

## Files
- `design-tokens.css`: CSS variables and baseline semantic component rules.
- `design-tokens.json`: machine-readable token data.
- `AGENTS.md`: implementation rules for coding agents.

## Surface and color semantics
- Canvas `#FFF6DB`: page background.
- Surface `#FFFCF2`: primary cards and containers.
- Raised surface `#FFFDF8`: inputs, menus, tiles that need to lift.
- Sunken surface `#FFF1CE`: nested panels, secondary tiles, muted areas.
- Highlight `#F6E58D`: secondary buttons, chips, gentle emphasis.
- Ink `#4E3B2A`: primary text and icons.
- Muted ink `#7A6448`: secondary text.
- Brown `#B07B4B`: decorative accents and coin/reward details.
- Green `#6AB04C`: progress, success, focus, and brand accents.
- Light green `#BADC58`: hover surfaces and primary action backgrounds.
- Dark green `#4F7A2A`: CTA shadow and strong green accents.
- Green ink `#3F6420`: text and icons on light green.
- Orange `#F0932B`: selected/active navigation and limited badges. Never use orange as a hover color.
- Warm borders `#F0DFB0` and `#D9B879`: use these instead of grey borders.

## Interaction rules
- Primary action: light green background, green-ink text, `0 9px 0 #4F7A2A` shadow. Hover uses a white-to-light-green gradient. Active removes the shadow and translates 9px down.
- Secondary action: pale yellow background with a 5px warm shadow. Hover turns light green with green-ink text.
- Navigation and tabs: selected items use orange with ink text. Unselected hover uses light green with green-ink text.
- Links, icon buttons, and secondary controls: green hover treatment, never orange.
- Focus rings: green, not orange.
- Disabled controls: warm surface or border, muted ink, no hover elevation.

## Approximate color proportions
These are visual targets based on the selected frames, not pixel-area measurements:
- 65-75% warm cream canvas, near-white surfaces, and whitespace.
- 12-20% sunken and highlight surfaces; card-heavy screens may use more.
- 8-12% green family, including actions, progress, and interaction accents.
- 2-5% orange highlights, usually one selected navigation item and a few small details.

Do not distribute orange across all cards. Preserve it as a selection signal. Hovering a non-selected navigation item uses light green; the selected item remains orange.

## Typography
- H1/H2: Secuela.
- H3/body/caption: Open Runde.
- Desktop reference sizes: H1 60px, H2 48px, H3 40px, body 20px, caption 16px.
- The app bundles both fonts at `src/app/fonts/` and exposes them via `next/font/local`: Open Runde as `--font-open-runde` (body/UI) and Secuela as `--font-secuela` (headings).
- Use the Tailwind utilities `font-sans` (Open Runde) and `font-heading` (Secuela) instead of adding `@font-face` or extra font files.
- `public/fonts/` is retained only for `public/wireframes/caloria-wireframe.css`; do not use it for app screens.

## Spacing and layout
Use the provided 4px/8px-based spacing tokens. Target 80-96px between major desktop sections, 24-32px card padding, and 24px card gaps. Maintain readable line lengths and a maximum content width. Reduce gutters and section gaps on tablet/mobile.

## Shape and effects
- Navigation radius: 999px.
- Button radius: 20px.
- Outer card radius: 33px.
- Nested card/panel radius: 28px.
- Input radius: 16px.
- Primary button shadow: `0 9px 0 #4F7A2A`.
- Secondary button shadow: `0 5px 0 #D9B879`.
- Input shadow: `inset 0 0 0 1.5px #F0DFB0, 0 2px 0 rgba(176, 123, 75, 0.1)`.
- Card shadow: `0 12px 32px rgba(176, 123, 75, 0.12)`.
- Apply `corner-shape: squircle` only inside `@supports (corner-shape: squircle)`.

## Agent implementation rules
1. Inspect the target repository and follow its framework and styling conventions.
2. Reuse tokens and components instead of duplicating hardcoded styles.
3. Do not add Tailwind or another styling dependency unless explicitly requested.
4. Implement selected, hover, focus, pressed, disabled, loading, and error states separately.
5. Keep orange reserved for selected/active UI and limited emphasis; avoid large orange surfaces and all orange hover states.
6. Use warm borders everywhere; avoid grey borders.
7. Preserve artwork and icons when available.
8. Responsive adjustments should preserve hierarchy and generous spacing.
9. Proportions are approximate qualitative guidance, not strict quotas.
