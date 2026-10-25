# Caloria Design System for Agents

## Purpose
Implement Caloria using these reusable tokens. Keep the design spacious, playful, rounded, and illustration-friendly. Prefer semantic tokens over arbitrary one-off values.

## Files
- `design-tokens.css`: CSS variables and baseline semantic component rules.
- `design-tokens.json`: machine-readable token data.
- `AGENTS.md`: implementation rules for coding agents.

## Color semantics
- Green `#6AB04C`: core action/progress accent.
- Light green `#BADC58`: hover state and secondary green navigation.
- Orange `#F0932B`: highlighted/selected navigation and limited emphasis.
- Pale yellow `#F6E58D`: large hero and review-card surfaces.
- White / near-white: dominant canvas and whitespace.

## Approximate color proportions
These are visual targets based on the selected frames, not pixel-area measurements:
- 65–75% white or near-white backgrounds and whitespace.
- 15–22% pale-yellow surfaces; card-heavy screens may use more.
- 7–12% green family, including brand text and interaction accents.
- 2–5% orange highlights, usually one selected navigation item and a few small details.

Do not distribute orange across all cards. Preserve it as a selection signal. Hovering a non-selected navigation item can use light green; the selected item remains orange.

## Typography
- H1/H2: Secuela.
- H3/body/caption: Open Runde.
- Desktop reference sizes: H1 60px, H2 48px, H3 40px, body 20px, caption 16px.
- Both fonts are already bundled in the app at `src/app/fonts/` and exposed via `next/font/local`: Open Runde as `--font-open-runde` (body/UI) and Secuela as `--font-secuela` (headings).
- Use the Tailwind utilities `font-sans` (Open Runde) and `font-heading` (Secuela) instead of adding `@font-face` or extra font files.

## Spacing and layout
Use the provided 4px/8px-based spacing tokens. Target 80–96px between major desktop sections, 24–32px card padding, and 24px card gaps. Maintain readable line lengths and a maximum content width. Reduce gutters and section gaps on tablet/mobile.

## Shape and effects
- Navigation radius: 14.022px.
- Button radius: 20px.
- Card radius: 33px.
- Input radius: 12px.
- Primary button shadow: `0 9px 0 #529028`.
- Input shadow: `0 1px 2px rgba(16, 24, 40, 0.05)`.

## Agent implementation rules
1. Inspect the target repository and follow its framework and styling conventions.
2. Reuse tokens and components instead of duplicating hardcoded styles.
3. Do not add Tailwind or another styling dependency unless explicitly requested.
4. Implement selected, hover, focus, pressed, disabled, loading, and error states separately.
5. Keep orange reserved for selected/highlighted UI; avoid large orange surfaces.
6. Preserve Figma artwork and icons when available.
7. Responsive adjustments should preserve hierarchy and generous spacing.
8. Proportions are approximate qualitative guidance, not strict quotas.
