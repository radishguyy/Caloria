# Prompt Orang B: Konten Tour dan Pemasangan di Halaman (GlowTour.js)

> Kamu adalah **ORANG B**. Partnermu (**Orang A**) mengerjakan mesin tour secara paralel. Ikuti kontrak di bagian "Kontrak A dan B" agar tidak saling menunggu.

---

## Konteks proyek

- Repo: `D:\Kuliah\Lomba\Caloria\Caloria` (Next.js 16, React 19, Tailwind 4, zustand).
- **SEBELUM menulis kode apa pun**, baca `AGENTS.md` di root dan panduan relevan di `node_modules/next/dist/docs/`. Next.js versi ini punya breaking changes.
- **Fitur:** walkthrough onboarding memakai GlowTour.js untuk pengguna yang **pertama kali** membuka tiap halaman. Bahasa Indonesia, nada ramah (pakai "kamu"), singkat, hanya fitur penting.
- **Library:** `npm i @glowhop/react-tour @glowhop/styles-tour` (diinstal oleh A)
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

## Peran kamu: ORANG B (pemilik konten tour)

Kamu hanya boleh membuat atau mengubah:

- `src/lib/tour/tour-workflows.ts` (`TOUR_DEFS`, data murni sesuai kontrak)
- Atribut `data-tour` dan pemanggilan `useAutoTour(...)` di file berikut:
  - `src/app/dashboard/page.tsx`, `src/components/dashboard/*`, `src/components/diary/macro-bar.tsx`
  - `src/app/diary/page.tsx`, `src/app/diary/add/page.tsx`, `src/app/diary/archive/page.tsx`, `src/components/diary/archive/CalendarGrid.tsx`
  - `src/app/quests/page.tsx`
  - `src/app/pet-customization/wardrobe/page.tsx`, `src/app/pet-customization/shop/page.tsx`
  - `src/app/social/page.tsx`
  - `src/app/profile/overview/page.tsx`
  - `src/app/profile/settings/page.tsx` (hanya `data-tour`; A mengedit isinya)

**DILARANG:** `navbar.tsx`, `bottom-nav.tsx`, file milik A, mengubah logika bisnis, mengubah tampilan. Penambahan atribut tidak boleh mengubah styling atau layout apa pun.

Kamu belum bisa menjalankan tour sebelum A selesai. Kerjakan terhadap kontrak. Bila `src/lib/tour/types.ts` dan `useAutoTour` belum di-merge, gunakan salinan identik atau stub lokal dan **jangan** ikut di-commit. Setelah A merge, rebase dan uji.

### Tugas

1. Buka tiap halaman, tentukan elemen penting, tambahkan `data-tour="<halaman>-<elemen>"`. Pilih elemen yang selalu ada (hindari yang muncul bersyarat, kecuali memang perlu).
2. Tulis `TOUR_DEFS`: 3 sampai 5 langkah per tour, judul maks 4 kata, isi 1 kalimat ramah, tanpa istilah teknis, tanpa emoji berlebihan (maks 1 per tour). Contoh gaya:
   > "Halo! Ini CalPal-mu. Dia makin senang kalau kamu rajin mencatat makan."
3. Rencana langkah (sesuaikan bila elemen di kode berbeda; konfirmasi dengan membaca kode):

   | Tour | Langkah |
   |---|---|
   | `dashboard` | menu navigasi (`a[href="/diary"]` dll) → CalPal → kalender mingguan → ringkasan makro/kalori → tombol catat cepat (+) → widget misi harian |
   | `diary` | filter waktu makan → tombol Catat → tombol + per waktu makan → tombol Kalender |
   | `diary-add` | kolom cari → tab sumber (Terakhir/Sering/Tersimpan) → scan label nutrisi (kamera) → keranjang pilihan dan tombol simpan |
   | `diary-archive` | kalender riwayat → Caloria Wrapped |
   | `quests` | level dan roadmap → misi utama → misi tambahan dan air minum |
   | `wardrobe` | preview CalPal → kategori aksesori → tombol simpan → menu Shop |
   | `shop` | daftar item → saldo koin dan tombol beli |
   | `social` | kartu streak co-op → kode party dan salin → + Tambah Teman → tab Undangan → senggol teman |
   | `profile` | grafik berat → tombol catat berat → BMI dan progres program |
   | `settings` | bagian notifikasi → bagian "Panduan Aplikasi" (milik A) |

4. Pasang `useAutoTour("<id>")` di tiap halaman. Syarat khusus:
   - Dashboard punya kartu pengingat mengambang (notif in-app, push, co-op). Gunakan
     `useAutoTour("dashboard", { enabled: !(showInAppNotification || showPushReminder || showCoopReminder) })`
     supaya tour tidak bertabrakan dengan kartu itu.
   - Halaman yang memuat skeleton: jangan aktifkan sebelum `isHydrated` true.
   - Untuk pengguna baru dengan data kosong, pilih target yang tetap ada (header, tombol), bukan item data.
5. Pastikan selector yang dipakai di langkah navigasi memilih elemen valid di desktop **dan** mobile. Resolver milik A memilih yang terlihat; kamu cukup menulis selector `href`.

### Definisi selesai

- Semua `TourId` di kontrak punya entri di `TOUR_DEFS` dengan target yang benar-benar ada di kode.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run design:check` lolos.
- `git diff` hanya berisi `data-tour`, `useAutoTour`, dan `tour-workflows.ts` (tidak ada perubahan tampilan).
- Setelah merge dengan A: uji dengan akun baru (hapus localStorage key `caloria-tour`), telusuri setiap halaman di desktop dan mobile, catat langkah yang target-nya hilang atau teksnya terpotong.
