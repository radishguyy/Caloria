# Caloria

Aplikasi web pencatat nutrisi bergamifikasi dengan Virtual Pet, Daily Missions, dan Co-op Streak.

## Tech stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 + shadcn/ui
- Zustand untuk state management
- Supabase (auth) + Drizzle ORM (database)

## Getting started

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | Jalankan ESLint |
| `npm run db:generate` | Generate migrasi Drizzle |
| `npm run db:migrate` | Jalankan migrasi |
| `npm run db:push` | Push schema ke database |
| `npm run db:studio` | Buka Drizzle Studio |

## Design system

Referensi desain disimpan terpisah dari kode aplikasi:

- `Grand Design - Caloria (Gamified Nutrition & Virtual Pet Web App).md` — dokumen desain utama.
- `caloria-design-system-agent-files/` — token desain (`design-tokens.css`, `design-tokens.json`) dan aturan implementasi untuk agent (`AGENTS.md`).
- `public/wireframes/` — wireframe HTML untuk referensi layout per halaman.

## Fonts

Kedua font brand sudah tersedia di dalam repo dan dimuat otomatis lewat `next/font/local`.

| Font | Peran | File | CSS variable | Tailwind |
| --- | --- | --- | --- | --- |
| Open Runde | Body, UI, caption | `src/app/fonts/OpenRunde-{Regular,Medium,Semibold,Bold}.woff2` | `--font-open-runde` | `font-sans` |
| Secuela | Heading (H1/H2) | `src/app/fonts/Secuela-{Regular,Medium,Bold,ExtraBold}.woff2` | `--font-secuela` | `font-heading` |

Keduanya dimuat di `src/app/layout.tsx`. Gunakan `font-sans` untuk body dan `font-heading` untuk heading — tidak perlu menambahkan file font lain atau `@font-face` manual.

Secuela dilisensikan under SIL Open Font License 1.1; lihat `src/app/fonts/Secuela-FONTLOG.txt`.
