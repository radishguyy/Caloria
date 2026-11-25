# Prompt Orang A: Mesin Tour (GlowTour.js)

> Kamu adalah **ORANG A**. Partnermu (**Orang B**) mengerjakan konten tour secara paralel. Ikuti kontrak di bagian "Kontrak A dan B" agar tidak saling menunggu.

---

## Konteks proyek

- Repo: `D:\Kuliah\Lomba\Caloria\Caloria` (Next.js 16, React 19, Tailwind 4, zustand).
- **SEBELUM menulis kode apa pun**, baca `AGENTS.md` di root dan panduan relevan di `node_modules/next/dist/docs/`. Next.js versi ini punya breaking changes.
- **Fitur:** walkthrough onboarding memakai GlowTour.js untuk pengguna yang **pertama kali** membuka tiap halaman. Bahasa Indonesia, nada ramah (pakai "kamu"), singkat, hanya fitur penting.
- **Library:** `npm i @glowhop/react-tour @glowhop/styles-tour`
- **Dokumentasi:**
  - https://glowtour.dev/docs/getting-started/
  - https://glowtour.dev/docs/guides/react/
- **API inti (React):**
  ```tsx
  const { tour, create, start } = useGlowTour();
  const wf = create("nama").step({ id, target, title, content }).build();
  void start(wf);
  // render <GlowTourDefault tour={tour} /> satu kali
  ```

## Keputusan yang sudah final

- Status "sudah lihat" disimpan di **localStorage** (zustand persist), bukan database.
- **JANGAN** ubah `src/components/shared/navbar.tsx` dan `src/components/shared/bottom-nav.tsx` (protected chrome). Menu disorot lewat selector `href` yang sudah ada, mis. `a[href="/diary"]`.
- Tidak ada tour untuk `/profile/achievements` dan `/social/coop`. `/pet` dan `/profile` hanya redirect.
- Alur `/onboarding/*` yang sudah ada tidak diubah. Tour mulai setelah itu, di `/dashboard`.
- Aturan design system di `AGENTS.md` wajib dipatuhi:
  - tanpa border/ring/shadow pada container
  - satu warna container (`bg-surface`)
  - radius squircle
  - `.btn-cta` satu-satunya tombol 3D
  - jangan membuat gradient baru

## Kontrak A dan B

Jangan diubah sepihak. Kalau perlu ubah, kabari partner.

### 1. `src/lib/tour/types.ts`

Dibuat oleh **A** dalam 10 menit pertama dan di-commit duluan. Kalau belum ada, B memakai salinan identik sementara.

```ts
export type TourId =
  | "dashboard" | "diary" | "diary-add" | "diary-archive" | "quests"
  | "wardrobe" | "shop" | "social" | "profile" | "settings";

export interface TourStepDef {
  id: string;            // unik per tour, mis. "dashboard-pet"
  target: string;        // CSS selector, mis. '[data-tour="dashboard-pet"]' atau 'a[href="/diary"]'
  title: string;         // maks 4 kata
  content: string;       // 1 kalimat, maks ~100 karakter
  placement?: "top" | "bottom" | "left" | "right";
}
```

### 2. `src/lib/tour/tour-workflows.ts`

Dimiliki **B**. Data murni, tanpa import GlowTour.

```ts
export const TOUR_DEFS: Record<TourId, TourStepDef[]>;
```

### 3. `src/components/tour/useAutoTour.ts`

Dimiliki **A**.

```ts
export function useAutoTour(id: TourId, opts?: { enabled?: boolean }): void;
```

Perilaku: jika `enabled !== false`, sudah hydrated, tour `id` belum dilihat, dan target pertama ada di DOM, maka mulai tour. Saat selesai atau di-skip, tandai sudah dilihat.

### 4. `src/components/tour/useTour.ts`

Dimiliki **A**.

```ts
export function useTour(): {
  startTour(id: TourId): void;
  resetTour(id: TourId): void;
  resetAll(): void;
  seen: Record<TourId, boolean>;
};
```

### 5. Konvensi target

Atribut `data-tour="<halaman>-<elemen>"`, mis. `data-tour="dashboard-pet"`.

Resolver target (milik **A**) harus:

- memilih elemen **pertama yang terlihat** bila selector cocok dengan banyak elemen (navbar desktop dan bottom nav mobile sama-sama ada di DOM)
- **melewati langkah** bila target tidak ditemukan, tanpa error

## Aturan git

- Kerja di branch masing-masing: `feat/tour-engine` untuk A, `feat/tour-content` untuk B.
- Jangan edit file milik partner.
- Jangan commit kecuali diminta.
- Urutan merge: A dulu, lalu B rebase.

---

## Peran kamu: ORANG A (pemilik mesin tour)

Kamu hanya boleh membuat atau mengubah file ini:

- `package.json` (+ lockfile)
- `src/lib/tour/types.ts`, `src/lib/tour/tour-ids.ts` (bila perlu)
- `src/store/use-tour-store.ts`
- `src/components/tour/*` (TourProvider, useAutoTour, useTour, resolver target)
- `src/app/layout.tsx` (hanya untuk memasang `<TourProvider>`)
- `src/app/globals.css` (hanya blok styling tour)
- `src/app/profile/settings/page.tsx` (hanya menambah bagian "Panduan Aplikasi")

### Tugas

1. Install `@glowhop/react-tour` dan `@glowhop/styles-tour`. Baca guides: react, theming, resuming, handling-errors, accessibility.
2. Segera buat dan commit `src/lib/tour/types.ts` persis seperti kontrak, supaya B tidak menunggu.
3. `use-tour-store.ts`: zustand persist (key `"caloria-tour"`), state `seen: Partial<Record<TourId, boolean>>`, aksi `markSeen`, `reset`, `resetAll`. Perhatikan hydration: gunakan `useHydrated()` yang sudah ada.
4. `TourProvider` (`"use client"`): memanggil `useGlowTour()` dan merender `<GlowTourDefault tour={tour} />` sekali. Menyediakan context untuk `useAutoTour` dan `useTour`. Pasang di `layout.tsx` di dalam `SessionProvider`. **Jangan** menyentuh Navbar atau BottomNav.
5. Konversi `TourStepDef[]` (dari `TOUR_DEFS` milik B) menjadi workflow via `create().step().build()`.
   - Resolver target sesuai poin 5 kontrak.
   - Bila GlowTour tidak menerima target berupa fungsi, beri elemen terpilih atribut sementara (mis. `data-tour-active`) dan targetkan itu, lalu bersihkan setelah tour.
   - Bila semua langkah terlewati, jangan mulai tour dan jangan tandai seen.
6. `useAutoTour` dan `useTour` sesuai kontrak.
   - Coba ulang cari target sekitar 5x dalam ~2 detik (halaman memuat skeleton dulu).
   - Tandai seen pada event selesai **dan** skip.
   - Satu tour = satu halaman, tidak perlu lanjut lewat navigasi.
7. Label bahasa Indonesia untuk popover: "Lanjut", "Kembali", "Lewati", "Selesai", dan indikator "Langkah 1 dari 4" bila didukung. Cek apakah ada opsi label bawaan di docs; kalau tidak ada, atasi lewat konfigurasi komponen.
8. Styling popover di `globals.css` agar sesuai design system:
   - `bg-surface`, radius squircle (`rounded-2xl`), **tanpa** border/shadow/ring, overlay lembut
   - tombol utama tampil seperti `.btn-cta` (atau pakai class itu), tombol lewati seperti `.btn-ghost`
   - cek `default.css` untuk stroke dan shadow, lalu netralkan
   - pastikan z-index di atas bottom nav (`z-40`) dan kartu pengingat dashboard (`z-50`)
   - pastikan terbaca di layar 360px
9. Settings: tambah kartu "Panduan Aplikasi" berisi tombol "Ulangi semua panduan" dan "Ulangi panduan halaman ini" (pakai class `.btn-secondary` / `.btn-ghost` sesuai `AGENTS.md`).
10. Tes mandiri tanpa menunggu B: buat tour uji sementara untuk satu elemen, lalu hapus sebelum selesai.

### Definisi selesai

- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run design:check` semuanya lolos.
- Tidak ada perubahan pada `navbar.tsx` dan `bottom-nav.tsx` (cek `git diff`).
- Verifikasi visual desktop dan mobile:
  - popover terbaca dan tidak tertutup nav
  - bisa dioperasikan dengan keyboard (Tab, Enter, Esc)
- Tulis ringkasan singkat untuk B: cara memakai `useAutoTour` dan hal yang perlu diperhatikan.
