# Desain Dual-Mode AR Scanner: Label Kemasan + Makanan Real (Pendekatan A)

**Tanggal:** 2026-11-25
**Branch:** `mahdi`
**Status:** Draft menunggu persetujuan sebelum implementasi

---

## 1. Tujuan & Konteks

Memperluas AR Scanner Caloria yang ada agar mendukung **2 mode dalam 1 antarmuka kamera** untuk kebutuhan demo/lomba:
1. **Label Gizi (Kemasan):** mempertahankan akurasi OCR tabel Informasi Nilai Gizi dan guard anti-halusinasi (`422`) yang sudah ada.
2. **Makanan Real (Estimasi Visual AI):** memindai makanan/minuman non-kemasan (piring, mangkuk, lauk, camilan, minuman) dengan tampilan jujur (**Estimasi Visual AI**), rincian komponen yang terlihat, peringatan bahan tersembunyi (minyak/santan/gula), pengatur porsi & makro editable, evaluasi kecocokan terhadap target harian, dan tombol **"Tanyakan Ahli Gizi"**.

Pemisahan build/branch antara versi dosen dan versi lomba ditangani terpisah oleh tim; implementasi ini langsung mengaktifkan kedua mode di AR Scanner tanpa feature flag tambahan.

---

## 2. Batasan & Non-Goals

- **Tidak mengubah skema PostgreSQL / Drizzle migration** (memakai `logScannedNutritionAction` dan `StagedFoodItem` yang ada).
- **Tidak menyimpan hasil estimasi makanan real ke tabel `foods` global** (`saveToCatalog` disembunyikan & dikunci `false` pada mode `food`).
- **Tidak memaksakan grading UK FSA kemasan per-100g** (`assessProduct`) pada makanan real; makanan real memakai evaluator tersendiri (`assessRealFood`) berbasis beban kalori terhadap sisa budget harian dan keseimbangan makro per porsi.
- **Batas latensi tetap 5–10 detik:** tetap 1 panggilan Vision API (`gemini-3.5-flash-lite` + `ThinkingLevel.MINIMAL`, timeout attempt 7.5 dtk / total 10 dtk / client abort 12 dtk).
- **UI tetap bebas `text-xs` dan bebas drop shadow pada tombol** sesuai standar Sprint Frontend Caloria.

---

## 3. Pendekatan yang Dipilih

**Pendekatan A: 1 AR Scanner + Toggle Mode (`Label Gizi` | `Makanan Real`) + Smart Switch.**

Alasan memilih Pendekatan A dibanding auto-detect tanpa toggle:
- Framing kamera berbeda: **Label Gizi** butuh reticle sempit + auto-crop agar teks tabel kecil tetap tajam, sedangkan **Makanan Real** butuh frame lebar (full-frame) agar seluruh piring/mangkuk tidak terpotong.
- Guard anti-halusinasi mode Label tetap 100% utuh (foto kemasan buram tetap ditolak dengan HTTP `422`, tidak berubah menjadi tebakan kalori asal).
- **Smart Switch** menjaga kelancaran demo: jika user memfoto nasi goreng saat masih di mode `Label Gizi` (atau memfoto tabel gizi saat di mode `Makanan Real`), error state menampilkan tombol 1-klik untuk langsung menganalisis ulang foto yang sama di mode yang sesuai tanpa perlu foto ulang.

---

## 4. Keputusan Desain per Modul

*(Keputusan di bawah merupakan usulan teknis yang dapat dikoreksi sebelum implementasi.)*

### 4.1 Skema Data (`src/lib/schemas/nutrition-scan.ts`)
- Tambah `SCAN_MODES = ["label", "food"] as const` dan tipe `ScanMode`.
- Tambah field opsional/default (100% backward-compatible dengan payload label lama):
  - `scanMode`: `"label" | "food"` (default `"label"`)
  - `detectedItems`: `string[]` (default `[]`), mis. `["Nasi putih (~1 centong)", "Ayam goreng (~1 potong)", "Telur dadar (~1 butir)"]`
  - `hiddenCalorieNotes`: `string[]` (default `[]`), mis. `["Minyak goreng dan kecap manis dapat menambah kalori di luar yang terlihat"]`
  - `portionNote`: `string | null` (opsional), mis. `"1 piring standar (~300 g)"`
  - `suggestedMode`: `"label" | "food" | null` (opsional, dipakai saat respons `422 WRONG_MODE`)

### 4.2 Vision API (`src/app/api/nutrition/scan/route.ts`)
- Menerima field multipart `mode` (`"label"` default, atau `"food"`).
- **Mode `"label"`:** memakai `LABEL_SYSTEM_PROMPT` ketat yang sudah ada + menambahkan `suggestedMode: "food"` hanya jika foto jelas menampilkan makanan/minuman real tanpa tabel gizi. Jika `isReadableNutritionLabel === false`, kembalikan HTTP `422` dengan `code: suggestedMode === "food" ? "WRONG_MODE" : "UNREADABLE_LABEL"` dan `suggestedMode`.
- **Mode `"food"`:** memakai `FOOD_SYSTEM_PROMPT` + schema JSON khusus Gemini & OpenAI:
  - Mengenali hidangan Indonesia & umum, mengeluarkan `foodName`, `servingSize` (estimasi gram/ml), `servingUnit` (`"porsi"`, `"piring"`, `"mangkuk"`, `"gelas"`, dll.), `caloriesKcal`, `proteinG`, `carbsG`, `fatG`, `fiberG`, `sugarG`, `detectedItems` (1–6 item), `hiddenCalorieNotes` (1–3 catatan), `portionNote`, `confidenceScore`, `isRecognizableFood`, `unreadableReason`, `suggestedMode`.
  - Jika foto bukan makanan (meja kosong, objek acak, terlalu gelap/buram) -> HTTP `422` (`UNREADABLE_FOOD`, `suggestedMode: null`).
  - Jika foto jelas tabel Informasi Nilai Gizi kemasan -> HTTP `422` (`WRONG_MODE`, `suggestedMode: "label"`).
- Server menyisipkan `scanMode: mode` pada payload sukses.

### 4.3 Client Scan, Cache & Progress (`scan-client.ts`, `scan-progress.ts`)
- `ScanBlobOptions` menambah `mode?: ScanMode` (default `"label"`).
- Cache key diubah menjadi `${mode}:${sha256}` agar foto galeri yang sama tidak bertabrakan antar mode.
- Tambah `ScanApiError` (subclass `Error`) yang membawa `code` dan `suggestedMode` agar UI dapat menampilkan tombol Smart Switch secara akurat.
- `getScanWaitState(stage, elapsedMs, mode = "label")` menyesuaikan teks langkah tunggu untuk mode `"food"`.

### 4.4 Evaluasi Gizi Makanan Real (`src/lib/nutrition/product-assessment.ts`)
- `assessProduct(...)` dipertahankan utuh untuk `scanMode === "label"`.
- Tambah `assessRealFood(input, ctx)` untuk `scanMode === "food"`:
  - Menilai dampak total kalori terhadap `remainingCalories` dan `goalType` (`diet` / `bulking` / `maintenance`), serta keseimbangan makro per porsi (protein >= 18 g, serat >= 5 g, lemak tinggi > 25 g, gula tinggi > 25 g, atau porsi kalori tinggi > 650 kkal).
  - Menghasilkan `verdict`, `headline`, `actionFeedback`, `warnings`, `positives`, `suggestions` (saran makanan real, bukan saran kemasan), `personalNote`, dan `calpalReaction`.
- `formatNutritionistSummary(...)` menerima metadata opsional `{ scanMode, detectedItems, hiddenCalorieNotes }` agar ringkasan untuk ahli gizi pada mode makanan real menyebut eksplisit bahwa angka adalah estimasi visual AI, mencantumkan komponen terdeteksi, dan mengingatkan user melampirkan foto makanan asli saat berkonsultasi.

### 4.5 Antarmuka AR Scanner (`ArScannerOverlay.tsx`, `ScanWaitingCard.tsx`)
- Toggle mode **`Label Gizi` | `Makanan Real`** di dalam HUD kamera (tap target `>= 44px`, tombol flat tanpa drop shadow).
- Framing & capture:
  - Mode `Label Gizi`: reticle kotak dengan corner bracket + `computeReticleCropRect` (maks `840px`, JPEG `0.72`).
  - Mode `Makanan Real`: panduan frame lebar (tanpa crop reticle ketat), capture seluruh area viewfinder (maks `1024px`, JPEG `0.78`) agar piring/mangkuk utuh dan lauk kecil tetap terbaca.
- Error state menyimpan `lastCapturedBlob` & `previewUrl` sementara:
  - Jika `err instanceof ScanApiError && err.suggestedMode`, tampilkan CTA utama 1-klik **"Analisis sebagai Makanan Real"** / **"Scan sebagai Label Gizi"** yang langsung memindai ulang blob yang sama di mode target.
  - Tambah aksi sekunder **"Tutup & Cari Manual"** agar user tidak terjebak di layar error.
- Prop opsional `initialMode?: ScanMode` agar `"Scan Ulang"` dari modal review kembali ke mode terakhir.

### 4.6 Modal Review & Pencatatan (`ReviewScanModal.tsx`, `NutritionistAskBox.tsx`, `diary/add/page.tsx`)
- Dicatat sebagai **1 entri hidangan** (dengan komponen terdeteksi ditampilkan di kartu review dan porsi/makro dapat diedit) agar alur demo cepat dan tidak memicu farming XP/koin.
- Ketika `initialData.scanMode === "food"`:
  - Badge eksplisit **"Estimasi Visual AI"** + catatan porsi (`portionNote`).
  - Kartu **Komponen Terdeteksi** (`detectedItems`) + kotak pengingat **Bahan Tersembunyi** (`hiddenCalorieNotes`).
  - Chip porsi cepat: `1/2 porsi`, `1 porsi`, `1.5 porsi`, `2 porsi` (menggantikan `1 kemasan` / `1/2 kemasan`).
  - Form koreksi diberi judul **"Sesuaikan Nama & Estimasi Gizi"**; checkbox `"Simpan ke katalog makanan"` disembunyikan (`saveToCatalog = false`).
  - `NutritionistAskBox` menampilkan panduan kontekstual untuk makanan real (anjuran kirim bersama foto makanan).
  - Tanggal log client diselaraskan ke tanggal lokal (`formatDateKey(new Date())`) agar konsisten dengan tanggal WIB di server.
- Tombol pemicu di `/diary/add` diperjelas untuk mencerminkan scan label & makanan, dan toast sukses menyesuaikan mode.

---

## 5. Rencana Pengujian (TDD + Verifikasi)

1. **Unit tests (`npx tsx`):**
   - `nutrition-scan.test.ts`: validasi skema `food`, `detectedItems`, `hiddenCalorieNotes`, `suggestedMode`, dan kompatibilitas balik payload `label`.
   - `product-assessment.test.ts`: uji `assessRealFood` (diet/bulking/maintenance, lemak/gula/kalori tinggi, protein/serat baik) & `formatNutritionistSummary` mode `food`.
   - `scan-client.test.ts`: uji cache terpisah `${mode}:${hash}`, pengiriman `mode` di FormData, dan `ScanApiError` (`code`, `suggestedMode`).
   - `scan-progress.test.ts`: uji label/step tunggu mode `food`.
2. **Validasi build & lint:** seluruh test suite (`src/**/*.test.ts`), `npx tsc --noEmit`, scoped `eslint`, `impeccable detect --json --changed`, `npm run build`.
3. **Verifikasi live:** probe langsung endpoint/Gemini dengan prompt `food` (memastikan latensi 5–10 dtk dan respons JSON valid) + inspeksi browser desktop & mobile untuk kedua mode, Smart Switch, dan `ReviewScanModal`.
