# Design Doc: AR Label Scanner & Evaluasi Gizi (Draft Jobdesk #4)

> **Status:** Menunggu persetujuan user  
> **Tanggal:** 2026-11-19  
> **Branch lokal:** `local/ar-scanner-draft` (tidak di-push ke remote)  
> **Pendekatan terpilih:** Opsi A — AR Camera Overlay Modal + Fast Single-Pass Vision API + Rule-Based Nutrition Engine

---

## 1. Latar Belakang & Tujuan

Halaman tambah makanan (`/diary/add`) saat ini sudah memiliki tombol **Scan Label AI**, namun masih berupa `<input type="file">` polos dengan UX yang lambat, tanpa tampilan kamera AR, tanpa evaluasi apakah produk tersebut baik atau berisiko, tanpa saran alternatif, dan tanpa kehadiran Calpal.

**Tujuan:**
1. Menghadirkan **pengalaman kamera AR dengan HUD overlay** saat memindai label Informasi Nilai Gizi (dengan fallback otomatis ke upload galeri bila kamera tidak tersedia/ditolak).
2. Membuat **AI Vision jauh lebih responsif** tanpa melatih model ML sendiri (memakai API Vision yang ada + payload gambar lebih ramping + feedback progres bertahap).
3. Menampilkan **tanda peringatan gizi** *(draft standar Permenkes GGL + UK FSA traffic-light, siap direview oleh Hima)*, **ringkasan produk baik/tidak**, dan **saran alternatif** yang kontekstual.
4. Menghadirkan **Calpal** (pet aktif user) yang mengintip di modal AR dengan ekspresi mengikuti hasil evaluasi produk.
5. Menyelaraskan tampilan modal dengan **General Update APSA** (kurangi teks mikro, ganti border berlebih dengan fill berwarna lembut) serta menutup celah keamanan di endpoint scan.

---

## 2. Scope, Non-Goals & Anti-Goals

### In Scope
- Komponen live camera viewfinder (`ArScannerOverlay`) dengan AR HUD overlay, reticle bidik label, guide Calpal, kontrol kamera (flip/torch jika didukung, tutup, ambil foto), dan fallback galeri.
- Optimalisasi & pengamanan endpoint `POST /api/nutrition/scan` (urutan model Gemini yang valid & cepat, auth check, validasi ukuran/MIME, rate limit ringan, ekstraksi `saturatedFatG`, `sodiumMg`, `productCategory`).
- Engine evaluasi gizi deterministik (`src/lib/nutrition/product-assessment.ts`) dengan satu tabel konstanta terpusat (`NUTRITION_THRESHOLDS`) berlabel **DRAFT — review Hima**.
- Upgrade `ReviewScanModal`:
  - Calpal mengintip di atas/kiri modal (`PeekingCalpal` memakai pet aktif dari `usePetStore`, tetap terlihat di layar sentuh tanpa harus hover).
  - Card ringkasan verdict (Baik / Perlu Dibatasi / Kurang Baik) dengan ikon + label (tidak mengandalkan warna saja).
  - Chip/tanda warning untuk nutrien bermasalah (gula, natrium/garam, lemak, lemak jenuh, kepadatan kalori) + persentase batas harian.
  - Blok saran alternatif sesuai kategori produk & konteks sisa kalori user hari ini (`useFoodStore`).
  - Form edit angka hasil scan, porsi, staging ke piring, dan simpan ke diary tetap bekerja seperti semula.
- Integrasi tombol AR Scanner di `/diary/add` (tetap mempertahankan flow staging & catat langsung).

### Non-Goals
- **Tidak** melatih, men-deploy, atau menjalankan model ML custom (ONNX/TF.js/Python service).
- **Tidak** membangun WebAR 3D (`<model-viewer>` / `.glb` / `.usdz`) karena aset pet saat ini masih SVG 2D.
- **Tidak** mengubah struktur navigasi utama (`nav-config.ts` / `bottom-nav.tsx`) atau merombak halaman lain di luar komponen scanner & modal hasil.
- **Tidak** mengubah skema database PostgreSQL / Drizzle migration (data tambahan seperti `saturatedFatG` & `sodiumMg` dipakai untuk evaluasi di modal tanpa memecahkan tabel `food_logs` yang sudah ada).

### Anti-Goals
- Auto-capture agresif yang memicu banyak request AI berulang dari frame kamera buram dan memboroskan kuota API.
- Teks mikro (`10px`) yang berdesakan atau card penuh garis border tipis yang melelahkan mata.
- Menyembunyikan angka hasil scan sehingga user tidak bisa mengoreksi salah baca OCR.

---

## 3. Pendekatan yang Dipertimbangkan

| Opsi | Ringkasan | Trade-off | Keputusan |
|---|---|---|---|
| **Opsi A (Dipilih)** | Live Camera HUD Overlay Modal + Fast Single-Pass Vision API + Rule Engine | Ringkas (`ponytail`), zero library berat baru, langsung jalan di mobile & desktop (ada fallback galeri), biaya API terkontrol karena trigger per jepretan | **Dipilih user** |
| **Opsi B** | Route khusus `/scanner` + auto-capture frame stabil | Mengubah arsitektur navigasi & berisiko spam request AI dari frame buram | Ditolak |
| **Opsi C** | Hybrid `BarcodeDetector` + Vision | `BarcodeDetector` tidak didukung di Safari iOS & tabel `foods` belum punya kolom barcode/EAN | Ditolak untuk tahap ini |

---

## 4. Arsitektur & Alur Data

```text
User klik "AR Scan Label" di /diary/add
  │
  ├─► [ArScannerOverlay]
  │     ├─ getUserMedia(facingMode: "environment") → live video + AR reticle + Calpal hint
  │     ├─ Fallback otomatis → <input type="file" accept="image/*"> (jika kamera ditolak/desktop tanpa kamera)
  │     └─ Capture frame / pilih file → kompres client (max 960px, JPEG 0.75) + cache SHA-256 ringan
  │
  ├─► [POST /api/nutrition/scan]
  │     ├─ Guard: cek session Supabase (fallback dev-local hanya jika Supabase belum dikonfigurasi),
  │     │         cek MIME image/* & max 4 MB, rate limit per user/IP
  │     ├─ Vision API: langsung ke "gemini-2.5-flash" (atau "gemini-2.5-flash-lite" fallback),
  │     │              tanpa loop ke nama model non-eksisten (3.5/3.8/3.1-flash-image)
  │     └─ Output tervalidasi Zod (NutritionLabelSchema):
  │        macro lama + saturatedFatG, sodiumMg, productCategory
  │
  ├─► [assessProduct(data, personalContext)]  (< 1 ms, deterministik, unit-tested)
  │     ├─ Evaluasi per 100g (makanan) / per 100ml (minuman), fallback % batas harian/sajian
  │     ├─ Verdict: "good" | "moderate" | "poor"
  │     ├─ Warnings: daftar nutrien medium/high + % batas harian
  │     ├─ Positives: sumber serat, protein baik, rendah gula/garam
  │     └─ Suggestions: alternatif produk sesuai kategori + catatan sisa kalori hari ini
  │
  └─► [ReviewScanModal (Redesigned)]
        ├─ PeekingCalpal (pet aktif user, ekspresi happy/idle/waspada sesuai verdict)
        ├─ Ringkasan Verdict + Warning Signs + Saran Alternatif (surface fill, minim border, font >= 12px)
        └─ Form koreksi nilai gizi + multiplier porsi + "Tambahkan ke Piring" / "Catat Langsung (+10 XP)"
```

---

## 5. Detail Teknis & Keputusan Desain

### 5.1 AI Lebih Responsif (`src/app/api/nutrition/scan/route.ts` & Client)
1. **Hapus dead model loop:** Ganti `candidateModels` dari `["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-image", "gemini-2.5-flash"]` menjadi model yang valid dan cepat: `["gemini-2.5-flash", "gemini-2.5-flash-lite"]` (plus OpenAI `gpt-4o-mini` fallback jika `OPENAI_API_KEY` diset).
2. **Payload lebih ringan:** Kompresi canvas di client diturunkan dari `1200px / 0.8` menjadi `960px / 0.75` JPEG (~40–55% lebih kecil, tetap tajam untuk teks label gizi).
3. **Cache hasil scan di client (in-memory Map per sesi):** Jika gambar identik (SHA-256 dari blob) di-scan ulang, hasil langsung muncul instan tanpa memanggil API.
4. **Progres bertahap di UI:** Indikator status 3 langkah (*Menyiapkan gambar → Membaca label gizi → Menganalisis kandungan...*) dengan tombol batal/scan ulang (`AbortController`).

### 5.2 Keamanan Endpoint (`security-audit`)
- Cek `supabase.auth.getUser()` saat `NEXT_PUBLIC_SUPABASE_URL` terkonfigurasi nyata (konsisten dengan `src/lib/supabase/middleware.ts` agar mode dummy lokal tetap bisa dites, tetapi production selalu wajib login — mengembalikan `401 Unauthorized`).
- Tolak payload bukan gambar atau ukuran > 4 MB (`413 Payload Too Large` / `400 Bad Request`).
- Rate limiter in-memory sederhana per user/IP (misal max 15 scan/menit) agar kuota API tidak bocor akibat double-click/abuse. *(Catatan: untuk multi-instance serverless, perlu ditingkatkan ke store terdistribusi di fase berikutnya — diberi komentar `shortcut:`).*

### 5.3 Rule Engine & Draft Standar Gizi Hima (`src/lib/nutrition/product-assessment.ts`)
- Satu objek `NUTRITION_THRESHOLDS` di bagian atas file:
  - **Makanan padat (per 100g) & Minuman (per 100ml):** mengacu pada traffic-light FSA (gula, lemak total, lemak jenuh, natrium/garam) + kepadatan kalori.
  - **Batas harian per sajian:** mengacu pada Permenkes No. 30/2013 (Gula 50g, Natrium 2000mg, Lemak 67g, Lemak Jenuh 20g, Energi acuan 2150 kkal).
- Setiap field baru (`saturatedFatG`, `sodiumMg`, `productCategory`) bersifat opsional/nullable di Zod schema agar tidak mematahkan respons parser lama maupun input manual.

### 5.4 UI/UX Modal & Aksesibilitas (`impeccable` + `ui-ux-pro-max` + `General Update #2`)
- **PeekingCalpal:** Tambah prop opsional (`alwaysVisible`, `colors`, `earsVariant`, `tailVariant`, `faceVariant`, `badgeText`) tanpa mengubah perilaku default di `/login` dan `/register`. Di modal AR, Calpal selalu tampil mengintip di atas/kiri modal dengan ekspresi `happy` (produk baik), `idle` (sedang/dibatasi), atau `idle` dengan bubble/badge peringatan (produk kurang baik).
- **Minim border, pakai fill berwarna:** Card verdict, warning chips, kotak input makro, dan blok saran alternatif menggunakan background fill semantik (`bg-accent-green-light/25`, `bg-accent-yellow/40`, `bg-red-50`, `bg-surface-subtle`) tanpa border abu-abu tipis yang menumpuk.
- **Kurangi teks kecil:** Naikkan label utama & chip isi dari `10px–11px` ke `12px–14px` (`text-xs` / `text-sm`), minimal `4.5:1` kontras teks.
- **Status tidak hanya lewat warna:** Setiap tingkat warning (`good`, `moderate`, `poor`) wajib membawa ikon (`CheckCircle2`, `AlertTriangle`, `ShieldAlert`) dan teks label jelas.
- **Kontrol kamera aksesibel:** Tombol shutter, tutup, flip, dan galeri minimal `44×44px`, gap `>= 8px`, focus ring terlihat, dan animasi scanline menghormati `prefers-reduced-motion`.

---

## 6. Rencana Verifikasi
1. **Unit tests (`tsx --test` / Node assert):** Menguji `assessProduct()` untuk skenario minuman manis tinggi gula, mie instan tinggi natrium, snack seimbang, produk tanpa info natrium/lemak jenuh, satuan non-gram (`pcs`/`keping`), dan konteks sisa kalori diet/bulking; serta validasi `NutritionLabelSchema`.
2. **Type-check & Build:** `npx tsc --noEmit` dan `npm run lint` (plus `npm run build` jika env memungkinkan) harus bersih.
3. **Browser & Mobile Viewport Check:** Memverifikasi tampilan AR Overlay (termasuk fallback saat kamera tidak ada di browser headless/desktop) dan `ReviewScanModal` pada viewport mobile (`390px`) dan desktop (`1280px`) tanpa horizontal overflow atau elemen terpotong.

---

## 7. File yang Akan Tersentuh (Rencana)
1. `src/lib/schemas/nutrition-scan.ts` — tambah `saturatedFatG`, `sodiumMg`, `productCategory` (opsional/nullable).
2. `src/app/api/nutrition/scan/route.ts` — perbaiki urutan model Gemini, perluas prompt/schema, tambah auth guard, validasi file, dan rate limit.
3. `src/lib/nutrition/product-assessment.ts` — finalkan evaluator & tambah test di `src/lib/nutrition/__tests__/product-assessment.test.ts`.
4. `src/components/auth/PeekingCalpal.tsx` — tambah props opsional kustomisasi pet & `alwaysVisible` (backward-compatible).
5. `src/components/diary/ArScannerOverlay.tsx` *(baru)* — live camera viewfinder + AR HUD overlay + kompresi + cache + fallback galeri.
6. `src/components/diary/ReviewScanModal.tsx` — redesign dengan PeekingCalpal, verdict, warning chips, saran alternatif, fill berwarna, dan tipografi lebih lega.
7. `src/app/diary/add/page.tsx` — hubungkan tombol Scan Label AI ke `ArScannerOverlay` dan teruskan konteks sisa kalori/goal + status progres bertahap.
