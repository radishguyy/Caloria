# AR Label Scanner & Evaluasi Gizi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended in-session) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah fitur "Scan Label AI" di `/diary/add` menjadi pengalaman kamera AR dengan HUD overlay, AI Vision yang lebih responsif dan aman, evaluator gizi deterministik tanpa ML (siap direview Hima), serta modal hasil dengan Calpal mengintip, tanda warning, ringkasan baik/buruk, dan saran alternatif.

**Architecture:** Client menangkap frame kamera lewat `ArScannerOverlay` (`getUserMedia` + fallback galeri), mengompres gambar (`960px`, JPEG `0.75`) dengan cache hash SHA-256 sesi, lalu mengirim ke `POST /api/nutrition/scan` (auth + size/MIME/rate-limit guard + model Gemini valid `gemini-2.5-flash`). Hasil terstruktur dievaluasi secara deterministik oleh `assessProduct()` (<1 ms) dan ditampilkan di `ReviewScanModal` bersama `PeekingCalpal` dari pet aktif user.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, Zod 4, `@google/genai`, Supabase SSR auth, Zustand, Lucide React, `tsx` (test runner).

**Spec:** [2026-11-19-ar-scanner-design.md](../../specs/2026-11-19-ar-scanner-design.md)

## Global Constraints
- **Git safety:** Hanya bekerja di branch lokal `local/ar-scanner-draft`; DILARANG push ke remote atau mengubah branch `main`/`dev`/`apsa`/`pasha`.
- **No ML training:** Semua ekstraksi label memakai API Vision; penilaian gizi murni rule-based.
- **Draft Hima:** Semua ambang batas gizi berada di satu konstanta `NUTRITION_THRESHOLDS` bertanda draft untuk divalidasi Hima.
- **Visual & Accessibility (`General Update #2` + `ui-ux-pro-max`):** Minimalkan border (gunakan background fill berwarna lembut), hindari teks mikro `< 12px` pada konten utama, setiap warning/verdict wajib punya ikon + label teks (bukan warna saja), touch target kontrol kamera `>= 44×44px` dengan gap `>= 8px`, dukung `prefers-reduced-motion`.
- **Backward Compatibility:** Flow staging (`onAddToStaging`) dan catat langsung (`logScannedNutritionAction`) serta tampilan `PeekingCalpal` di `/login` dan `/register` tidak boleh rusak.

## Review Focus
1. **Kamera ditolak / tidak ada webcam (desktop atau browser headless):** `ArScannerOverlay` wajib menampilkan fallback "Pilih Foto dari Galeri" tanpa stuck loading atau uncaught error.
2. **Label nutrisi tidak mencantumkan natrium atau lemak jenuh, atau memakai satuan `keping`/`bungkus`:** `assessProduct()` harus tetap memberi evaluasi aman tanpa `NaN` dan mencatat `missing` dengan rapi.
3. **OpenAI strict JSON schema drift:** `additionalProperties: false` dan array `required` di OpenAI fallback harus sinkron 100% dengan `NutritionLabelSchema` (field opsional bertipe `["number", "null"]` / `["string", "null"]`).
4. **Calpal terpotong di modal:** `PeekingCalpal` harus dirender di wrapper luar kartu yang `overflow-hidden`, dan terlihat tanpa perlu hover di layar sentuh.
5. **Spam/double-submit & memory leak:** `ObjectURL` harus di-revoke saat unmount/ganti gambar, dan request scan harus mendukung `AbortController` saat modal ditutup atau user menekan Scan Ulang.

---

### Task 1: Finalisasi & Unit Test Evaluator Gizi (`assessProduct`)

**Files:**
- Modify/Verify: `src/lib/nutrition/product-assessment.ts`
- Test: `src/lib/nutrition/__tests__/product-assessment.test.ts`

**Interfaces:**
- Produces:
  - `PRODUCT_CATEGORIES`, `ProductCategory`, `NUTRITION_THRESHOLDS`
  - `assessProduct(input: ProductNutritionInput, ctx?: PersonalContext): ProductAssessment`
  - `servingToBaseUnits(servingSize: number | null, servingUnit: string): { amount: number; isVolume: boolean } | null`

- [ ] **Step 1: Tulis unit test lengkap untuk evaluator gizi**
  Buat `src/lib/nutrition/__tests__/product-assessment.test.ts` dengan `node:assert/strict` menguji:
  - Minuman manis (`250 ml`, `sugarG: 26`, `category: "beverage"`) -> `verdict === "poor"` atau `"moderate"`, `isBeverage === true`, ada flag `sugar` level `"high"`, dan `suggestions` berisi alternatif minuman.
  - Mie instan tinggi natrium (`85 g`, `sodiumMg: 1100`, `fatG: 14`, `saturatedFatG: 6`, `category: "instant_noodle"`) -> `verdict === "poor"`, flag `sodium` & `saturatedFat` `"high"`, ada saran bumbu/sayur.
  - Produk sehat/seimbang (`40 g`, `sugarG: 1`, `fatG: 1`, `fiberG: 4`, `proteinG: 8`, `sodiumMg: 30`) -> `verdict === "good"`, `warnings.length === 0`, `positives` berisi `"Tinggi serat"` & `"Sumber protein yang baik"`.
  - Label tanpa `saturatedFatG`/`sodiumMg` dan satuan `"keping"` (`servingSize: 3`) -> `basis === "perServing"`, `missing` berisi `["saturatedFat", "sodium"]`, tidak ada `NaN`.
  - Konteks personal diet (`remainingCalories: 300`, `caloriesKcal: 250`, `goalType: "diet"`) -> `personalNote` menyebut persentase sisa kalori & saran porsi muncul.
- [ ] **Step 2: Jalankan test dan pastikan berjalan (tangkap kegagalan jika ada ketidaksesuaian)**
  Run: `npx tsx src/lib/nutrition/__tests__/product-assessment.test.ts`
- [ ] **Step 3: Perbaiki edge-case pada `src/lib/nutrition/product-assessment.ts` jika ada test yang gagal**
  Pastikan pembagian nol, nilai negatif, dan fallback kategori `"other"` aman.
- [ ] **Step 4: Jalankan ulang test hingga semua kasus lulus**
  Run: `npx tsx src/lib/nutrition/__tests__/product-assessment.test.ts`
  Expected: exit code 0, semua assertion PASS.
- [ ] **Step 5: Commit lokal**
  ```bash
  git add src/lib/nutrition/product-assessment.ts src/lib/nutrition/__tests__/product-assessment.test.ts
  git commit -m "feat(scanner): add deterministic product nutrition evaluator with Hima draft thresholds"
  ```

---

### Task 2: Perluas Schema Label Nutrisi (`NutritionLabelSchema`)

**Files:**
- Modify: `src/lib/schemas/nutrition-scan.ts`
- Test: `src/lib/nutrition/__tests__/product-assessment.test.ts` (atau file test schema terpisah `src/lib/schemas/__tests__/nutrition-scan.test.ts`)

**Interfaces:**
- Produces:
  - `NutritionLabelSchema` dengan field tambahan opsional/nullable:
    - `saturatedFatG: z.number().nullable().optional()`
    - `sodiumMg: z.number().nullable().optional()`
    - `productCategory: z.enum(PRODUCT_CATEGORIES).nullable().optional()`
  - `NutritionLabelData`

- [ ] **Step 1: Tulis test untuk `NutritionLabelSchema` di `src/lib/schemas/__tests__/nutrition-scan.test.ts`**
  Uji bahwa payload minimal lama (tanpa 3 field baru) tetap valid, payload lengkap dengan `saturatedFatG`, `sodiumMg`, `productCategory` valid, dan `productCategory` ngawur jatuh ke fallback atau ditolak sesuai schema.
- [ ] **Step 2: Jalankan test dan pastikan gagal sebelum schema diperbarui**
  Run: `npx tsx src/lib/schemas/__tests__/nutrition-scan.test.ts`
  Expected: FAIL (field baru belum ada di hasil parse).
- [ ] **Step 3: Perbarui `src/lib/schemas/nutrition-scan.ts`**
  Tambahkan `saturatedFatG`, `sodiumMg`, `productCategory` (memakai `PRODUCT_CATEGORIES` dari `product-assessment.ts`).
- [ ] **Step 4: Jalankan ulang test**
  Run: `npx tsx src/lib/schemas/__tests__/nutrition-scan.test.ts`
  Expected: PASS.
- [ ] **Step 5: Commit lokal**
  ```bash
  git add src/lib/schemas/nutrition-scan.ts src/lib/schemas/__tests__/nutrition-scan.test.ts
  git commit -m "feat(scanner): extend NutritionLabelSchema with saturated fat, sodium, and category"
  ```

---

### Task 3: Percepat & Amankan `POST /api/nutrition/scan`

**Files:**
- Create: `src/lib/nutrition/scan-guard.ts`
- Create: `src/lib/nutrition/__tests__/scan-guard.test.ts`
- Modify: `src/app/api/nutrition/scan/route.ts`

**Interfaces:**
- Consumes: `NutritionLabelSchema`, `PRODUCT_CATEGORIES`, `createClient` from `@/lib/supabase/server`
- Produces:
  - `validateScanFile(file: { size: number; type: string }): { ok: true } | { ok: false; status: number; error: string }`
  - `checkScanRateLimit(key: string, nowMs?: number): { allowed: boolean; retryAfterSec: number }`
  - `isSupabaseAuthEnforced(): boolean`

- [ ] **Step 1: Tulis failing test di `src/lib/nutrition/__tests__/scan-guard.test.ts`**
  Uji `validateScanFile` (tolak `> 4 * 1024 * 1024` dengan status 413, tolak `application/pdf` dengan status 400, terima `image/jpeg` <= 4 MB), dan `checkScanRateLimit` (15 kali dalam 60 detik diizinkan, ke-16 ditolak dengan `retryAfterSec > 0`, reset setelah jendela waktu lewat).
- [ ] **Step 2: Jalankan test dan pastikan gagal**
  Run: `npx tsx src/lib/nutrition/__tests__/scan-guard.test.ts`
  Expected: FAIL (modul belum ada).
- [ ] **Step 3: Implementasikan `src/lib/nutrition/scan-guard.ts`**
  Tambahkan komentar `shortcut: in-memory rate limit resets per serverless cold start; upgrade to Redis/Upstash for multi-instance prod`.
- [ ] **Step 4: Jalankan test dan pastikan lulus**
  Run: `npx tsx src/lib/nutrition/__tests__/scan-guard.test.ts`
  Expected: PASS.
- [ ] **Step 5: Perbarui `src/app/api/nutrition/scan/route.ts`**
  - Tambah auth check `supabase.auth.getUser()` saat `isSupabaseAuthEnforced()` bernilai `true` (mengembalikan `401` jika tidak ada user).
  - Panggil `validateScanFile` dan `checkScanRateLimit`.
  - Ganti `candidateModels` menjadi `["gemini-2.5-flash", "gemini-2.5-flash-lite"]`.
  - Perbarui `SYSTEM_PROMPT`, `geminiResponseSchema`, dan OpenAI strict `json_schema` agar mengekstrak `saturatedFatG`, `sodiumMg`, dan `productCategory` (sesuai `PRODUCT_CATEGORIES`).
- [ ] **Step 6: Commit lokal**
  ```bash
  git add src/lib/nutrition/scan-guard.ts src/lib/nutrition/__tests__/scan-guard.test.ts src/app/api/nutrition/scan/route.ts
  git commit -m "feat(api): speed up Gemini nutrition scan and add auth, file, and rate-limit guards"
  ```

---

### Task 4: Perluas `PeekingCalpal` untuk Modal AR (Backward-Compatible)

**Files:**
- Modify: `src/components/auth/PeekingCalpal.tsx`

**Interfaces:**
- Produces: `PeekingCalpal` tetap mempertahankan props lama (`characterId`, `position`, `title`, `expression`) dan menambah props opsional:
  - `alwaysVisible?: boolean`
  - `colors?: Partial<CharacterColorPalette>`
  - `earsVariant?: CharacterId`
  - `tailVariant?: CharacterId`
  - `faceVariant?: CharacterId`
  - `moodStatus?: "happy" | "neutral" | "complaining"`
  - `bubbleText?: string`
  - `bubbleTone?: "good" | "moderate" | "poor"`

- [ ] **Step 1: Perbarui `src/components/auth/PeekingCalpal.tsx`**
  - Jika `alwaysVisible` bernilai `true`, Calpal langsung tampil di posisi mengintip (`-translate-y-8` / `-translate-x-4`) tanpa menunggu `:hover` (penting untuk mobile & modal).
  - Teruskan `colors`, `earsVariant`, `tailVariant`, `faceVariant`, `moodStatus` ke `AvatarRenderer`.
  - Jika `bubbleText` ada, tampilkan speech bubble kecil yang terbaca (`>= 12px`, tanpa border berat, pakai fill warna sesuai `bubbleTone`).
- [ ] **Step 2: Verifikasi TypeScript & pemanggil lama**
  Run: `npx tsc --noEmit`
  Expected: Tidak ada error pada `src/app/login/page.tsx` maupun `src/app/register/page.tsx`.
- [ ] **Step 3: Commit lokal**
  ```bash
  git add src/components/auth/PeekingCalpal.tsx
  git commit -m "feat(ui): support always-visible custom pet and speech bubble in PeekingCalpal"
  ```

---

### Task 5: Buat Helper Kompresi/Cache Client & Komponen `ArScannerOverlay`

**Files:**
- Create: `src/lib/nutrition/scan-client.ts`
- Create: `src/lib/nutrition/__tests__/scan-client.test.ts`
- Create: `src/components/diary/ArScannerOverlay.tsx`

**Interfaces:**
- Consumes: `NutritionLabelData`, `PeekingCalpal`
- Produces:
  - `scan-client.ts`: `compressImageFile(file: Blob, maxDimension?: number, quality?: number)`, `hashBlobSha256(blob: Blob)`, `scanNutritionLabel(blob: Blob, signal?: AbortSignal)` (dengan cache sesi in-memory + callback stage `"compressing" | "scanning" | "analyzing"`).
  - `ArScannerOverlay.tsx`: props `{ isOpen, mealTime, onClose, onScanComplete: (data: NutritionLabelData, previewUrl: string) => void }`.

- [ ] **Step 1: Tulis unit test untuk cache & request helper di `src/lib/nutrition/__tests__/scan-client.test.ts`**
  Uji bahwa `scanNutritionLabelWithCache` (dependency-injected `fetchFn` & `hashFn`) memanggil `fetchFn` 1x untuk blob ber-hash sama dan mengembalikan hasil cache pada panggilan kedua, serta melempar error yang jelas saat response `!ok`.
- [ ] **Step 2: Jalankan test dan pastikan gagal**
  Run: `npx tsx src/lib/nutrition/__tests__/scan-client.test.ts`
  Expected: FAIL.
- [ ] **Step 3: Implementasikan `src/lib/nutrition/scan-client.ts`**
  Sertakan `compressImageFile` (default `960px`, `0.75`), SHA-256 hashing (`crypto.subtle.digest` dengan fallback aman), session cache Map (max 20 entri), dan `scanNutritionLabel`.
- [ ] **Step 4: Jalankan test dan pastikan lulus**
  Run: `npx tsx src/lib/nutrition/__tests__/scan-client.test.ts`
  Expected: PASS.
- [ ] **Step 5: Bangun `src/components/diary/ArScannerOverlay.tsx`**
  - Buka `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })` saat `isOpen === true`.
  - Render `<video playsInline muted autoPlay>` fullscreen + AR HUD overlay (reticle 4 sudut, panduan posisi label, animasi scanline dengan `motion-safe:`, Calpal mini hint di pojok).
  - Kontrol bawah dengan touch target `>= 44×44px` & `gap-3`: tombol **Galeri** (fallback `<input type="file" accept="image/*">`), tombol **Jepret & Cek Gizi**, tombol **Balik Kamera / Flash** (tampil bila didukung track).
  - Jika kamera ditolak / error / tidak tersedia: tampilkan panel ramah dengan alasan + tombol besar **Pilih Foto dari Galeri / Kamera HP**.
  - Saat memproses: tampilkan preview frame beku + progres 3 tahap + tombol **Batal** (`AbortController`). Pastikan `MediaStream` tracks dihentikan (`track.stop()`) saat tutup/unmount.
- [ ] **Step 6: Commit lokal**
  ```bash
  git add src/lib/nutrition/scan-client.ts src/lib/nutrition/__tests__/scan-client.test.ts src/components/diary/ArScannerOverlay.tsx
  git commit -m "feat(scanner): add ArScannerOverlay live camera HUD with gallery fallback and scan cache"
  ```

---

### Task 6: Redesign `ReviewScanModal` & Hubungkan ke `/diary/add`

**Files:**
- Modify: `src/components/diary/ReviewScanModal.tsx`
- Modify: `src/app/diary/add/page.tsx`

**Interfaces:**
- Consumes: `assessProduct`, `PeekingCalpal`, `ArScannerOverlay`, `usePetStore`, `useFoodStore`, `logScannedNutritionAction`
- Produces: `ReviewScanModal` (tambah prop opsional `onRescan?: () => void`) dan trigger `AR Scan Label` di `/diary/add`.

- [ ] **Step 1: Redesign `src/components/diary/ReviewScanModal.tsx`**
  - Bungkus kartu modal dengan container `relative pt-10 sm:pt-12` dan pasang `<PeekingCalpal alwaysVisible ... />` di atas/kiri modal memakai `species`, `customColors`, `earsVariant`, `tailVariant`, `faceVariant` dari `usePetStore`.
  - Hitung `assessment = assessProduct(...)` secara reaktif terhadap perubahan angka input dan `servingsConsumed`, serta konteks `goalPlan.goalType` + sisa kalori (`targets.calories - consumed.calories`) dari `useFoodStore`.
  - Tampilkan:
    1. **Kartu Ringkasan Verdict** (fill berwarna lembut tanpa border berat: hijau lembut untuk `good`, kuning lembut untuk `moderate`, merah lembut untuk `poor`), lengkap dengan ikon + headline + `summary` + `personalNote`.
    2. **Tanda Warning & Poin Positif** sebagai pill/chip berwarna dengan ikon dan teks minimal `12px` (`text-xs`), plus keterangan batas harian & tanda info jika natrium/lemak jenuh tidak terbaca di label.
    3. **Saran Alternatif** (blok fill berwarna dengan daftar saran kategori dari `assessment.suggestions`).
    4. **Input Editable & Ringkasan Total** (kotak makro & porsi memakai fill `bg-surface-subtle` tanpa border bertumpuk, font `>= 12px`) + tombol **Scan Ulang**, **Tambahkan ke Piring (Staging)**, dan **Catat Langsung (+10 XP)**.
- [ ] **Step 2: Hubungkan `ArScannerOverlay` di `src/app/diary/add/page.tsx`**
  - Ganti aksi klik tombol **Scan Label AI** (`Scan Label AR`) agar membuka `<ArScannerOverlay />`.
  - Saat `onScanComplete(data, previewUrl)` terpanggil, set `scannedData`, `scannedImagePreviewUrl`, buka `ReviewScanModal`, dan panggil `toastOcrSuccess()`.
  - Jika user klik **Scan Ulang** di `ReviewScanModal`, tutup review modal dan buka kembali `ArScannerOverlay`.
  - Pastikan `URL.revokeObjectURL` dipanggil bersih saat URL preview diganti/modal ditutup.
- [ ] **Step 3: Commit lokal**
  ```bash
  git add src/components/diary/ReviewScanModal.tsx src/app/diary/add/page.tsx
  git commit -m "feat(scanner): redesign ReviewScanModal with Calpal, warnings, alternatives, and AR trigger"
  ```

---

### Task 7: Verifikasi Menyeluruh (`verification-before-completion`)

**Files:**
- Tidak ada edit fitur baru; hanya perbaikan jika ada temuan dari test/lint/typecheck/browser check.

- [ ] **Step 1: Jalankan semua unit test (baru & lama)**
  Run:
  - `npx tsx src/lib/nutrition/__tests__/product-assessment.test.ts`
  - `npx tsx src/lib/schemas/__tests__/nutrition-scan.test.ts`
  - `npx tsx src/lib/nutrition/__tests__/scan-guard.test.ts`
  - `npx tsx src/lib/nutrition/__tests__/scan-client.test.ts`
  - `npx tsx src/lib/nutrition/__tests__/calculations.test.ts`
  - `npx tsx src/lib/pet/__tests__/decay-evaluator.test.ts`
- [ ] **Step 2: Jalankan TypeScript check & ESLint**
  Run: `npx tsc --noEmit` dan `npm run lint`
  Expected: 0 TypeScript errors, 0 ESLint errors.
- [ ] **Step 3: Jalankan Production Build check**
  Run: `npm run build`
  Expected: Build Next.js selesai tanpa error.
- [ ] **Step 4: Verifikasi UI lokal (Desktop & Mobile 390px)**
  Jalankan `npm run dev` lokal, buka `/diary/add` lewat browser / headless check, uji klik tombol AR Scanner (fallback galeri saat kamera tidak tersedia), cek tidak ada console error atau horizontal overflow, lalu hentikan dev server dan cek `git status` agar `package-lock.json` yang tidak perlu bisa dibersihkan (`git checkout -- package-lock.json`).
