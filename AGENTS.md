<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Caloria Design System & Agent Rules

### Runtime Source of Truth
- `src/app/globals.css` is the runtime implementation of the design system.
- `caloria-design-system-agent-files/design-tokens.css` and `design-tokens.json` provide documentation, canonical recipes, and token values.
- Never use `bg-surface-raised`, `bg-surface-sunken`, or `bg-surface-subtle` Tailwind utilities in application code; they resolve to legacy tinted tokens. Use `bg-surface` or `bg-card` for all containers.

### Core Visual Principles
- **One Container Fill**: Use one solid fill `--surface` (`#FFF6DB`) or `bg-card`. Cards, panels, banners, modals, and nested containers must not alternate surface shades.
- **Flat UI / No Container Strokes**: Do not add borders, rings, dividers, outlines, or drop shadows to app containers or rectangular controls. The only exceptions are existing navbar/bottom-nav chrome (strokes, logo depth, badge ring), chart SVG strokes, and the primary CTA's hard 3D depth.
- **Actions & Buttons**:
  - `.btn-cta` is the **only 3D action** (9px green depth; 5px on `text-sm`, 3px on `text-xs`). Hover gradient on `.btn-cta` is the **only gradient** allowed in the app.
  - `.btn-secondary` is a flat pale-yellow highlight action (`bg-highlight`, hover green).
  - `.btn-ghost` is a flat surface action (`bg-surface`, hover green).
  - `.btn-icon` is a 42px squircle surface button (radius 20px). Do not add custom height/width overrides.
  - Sizing modifiers: use `.text-xs` or `.text-sm` on button classes. Do not use custom height/padding overrides (`h-*`, `px-*`, `py-*`).
  - Do NOT use `.button-primary` (deprecated legacy style).
- **Inputs & Fields**:
  - Regular inputs use `.field` (borderless canvas fill `#FFFCF2`, 16px radius, soft green focus tint).
  - Inline numeric editors (e.g. nutrition review macro cells) use `.field-inline` (transparent background, 16px radius, soft green focus tint).
  - Do not add border or shadow utilities to inputs.
- **Shapes & Radii**:
  - Squircle radii (`rounded-lg` 20px / `rounded-2xl` 28px / `rounded-3xl` 33px) for containers, action buttons, cards, and tabs.
  - Reserve full pills (`rounded-full`) strictly for badges, chips, toggles, avatars, and navigation bars.
  - Selected cards use `bg-brand-orange/15` (15% orange tint; no borders).
  - Selected filter/category tabs use `bg-brand-orange text-ink font-bold rounded-lg`.
- **Protected Chrome**:
  - Do not alter `src/components/shared/navbar.tsx` or `src/components/shared/bottom-nav.tsx` during broad design passes.
  - Leave data-visualization SVG strokes and colors intact.

### Canonical UI Recipes
```tsx
// 1. Outer Container / Card
<div className="bg-surface rounded-3xl p-5 space-y-4">...</div>

// 2. Nested Panel / Inner Card
<div className="bg-surface rounded-2xl p-4 space-y-2">...</div>

// 3. Primary CTA (3D Action)
<button type="submit" className="btn-cta w-full">Simpan</button>
<button type="button" className="btn-cta text-xs">Aksi Cepat</button>

// 4. Secondary Action (Flat Highlight)
<button type="button" className="btn-secondary">Batal</button>

// 5. Ghost Action (Flat Surface)
<button type="button" className="btn-ghost">Detail</button>

// 6. Back / Icon Button
<button type="button" className="btn-icon" aria-label="Kembali"><ArrowLeft className="h-4 w-4" /></button>

// 7. Input Field
<input type="text" className="field w-full px-3.5 py-2.5 text-sm font-semibold" placeholder="Nama..." />

// 8. Filter / Category Tab
<button className={cn("px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors", isActive ? "bg-brand-orange text-ink font-bold" : "bg-card text-ink-muted hover:bg-brand-green-light hover:text-brand-green-ink")}>
  Kategori
</button>
```

### Verification
- Run `npm run lint`
- Run `npx tsc --noEmit`
- Run `npm run build`
- Run `npm run design:check` (when automated guard is installed)
- Perform desktop and mobile visual verification. Do not commit unless explicitly requested.
