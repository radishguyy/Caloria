# Caloria - Mid-fi Wireframes (Iterasi 1-2)

Wireframe statis untuk sembilan layar sitemap Grand Design Caloria. Artefak ini
memakai token dari design system Caloria (warna, tipografi, radius, shadow) tetapi
**tidak** terhubung ke store, database, atau route aplikasi.

## Cara membuka

Jalankan dev server seperti biasa:

```bash
npm run dev
```

Lalu buka:

- Index & konvensi - <http://localhost:3000/wireframes/index.html>
- Page 1.1 · Tujuan Utama - <http://localhost:3000/wireframes/page-1-onboarding.html>
- Page 1.2 · Profil Fisik & BMI - <http://localhost:3000/wireframes/page-1-profile.html>
- Page 1.3 · Proyeksi N Hari - <http://localhost:3000/wireframes/page-1-projection.html>
- Page 1.4 · Adopsi Pet - <http://localhost:3000/wireframes/page-1-adopt.html>
- Page 4.1 · Pet Wardrobe - <http://localhost:3000/wireframes/page-4-pet.html>
- Page 4.2 · Pet Shop - <http://localhost:3000/wireframes/page-4-shop.html>
- Page 6.1 · Profile Overview - <http://localhost:3000/wireframes/page-6-profile.html>
- Page 6.2 · Galeri Achievement - <http://localhost:3000/wireframes/page-6-achievements.html>
- Page 6.3 · Pengaturan Notifikasi & Akun - <http://localhost:3000/wireframes/page-6-settings.html>

File berada di `public/wireframes/`, jadi Next.js menyajikannya sebagai aset statis.
Root layout, Navbar, dan BottomNav aplikasi tidak ikut dirender.

> Catatan: karena memakai font dari `/fonts/secuela/`, buka lewat dev server. Membuka
> file langsung dengan `file://` tetap bisa, tetapi font lokal tidak akan termuat.

## Cakupan

| Nomor | Layar | Route acuan | Status |
|---|---|---|---|
| 1.1 | Smart Onboarding - Tujuan Utama | `/onboarding/goal` | Selesai |
| 1.2 | Profil fisik & BMI | `/onboarding/profile-calculator` | Selesai |
| 1.3 | Proyeksi N hari | `/onboarding/projection` | Selesai |
| 1.4 | Adopsi pet | `/onboarding/adopt-pet` | Selesai |
| 4.1 | Pet Wardrobe | `/pet-customization/wardrobe` | Selesai |
| 4.2 | Pet Shop | `/pet-customization/shop` | Selesai |
| 6.1 | Profil & tracker berat | `/profile/overview` | Selesai |
| 6.2 | Galeri achievement | `/profile/achievements` | Selesai |
| 6.3 | Pengaturan notifikasi | `/profile/settings` | Selesai |

Fitur **Caloria Plaza tidak ditampilkan** pada wireframe ini sesuai keputusan produk.

## Iterasi 2

- Onboarding 2: form fisik dengan BMI, BMR, TDEE, target kalori, dan skala BMI.
- Onboarding 3: hero proyeksi 108 hari, rute 75 kg ke 68 kg, target 2.151 kkal,
  makro 161 g protein / 242 g karbo / 60 g lemak, serta serat, gula, dan air.
- Onboarding 4: tiga spesies pet (Flameling, Bloomie, Droplet), nama "Pyro",
  preview telur, dan kartu pet level 1.
- Pet Shop: kategori topi, saldo 1.240 koin, item dimiliki, item event yang belum
  terjangkau, modal konfirmasi, serta toast sukses/gagal.
- Achievement: 10 badge dengan 4 terbuka, ring progres 40%, filter kategori,
  state terkunci, modal detail, dan notifikasi badge baru.
- Pengaturan: Web Push, jadwal makan 08:00 / 12:30 / 19:00, Poke Nudge, evaluasi
  gizi, informasi akun, logout, toast tersimpan, dan state izin ditolak.

State modal/toast digambar sebagai kartu statis di bawah layar utama, bukan overlay
yang menutupi konten. Tidak ada JavaScript atau interaksi nyata.

## Konvensi

- **Mid-fi**: palet, font, radius, dan shadow mengikuti `src/app/globals.css`.
- **Oranye hanya untuk seleksi/aksen**, bukan surface besar. Hijau untuk aksi dan progres.
- **Placeholder ilustrasi** memakai blok bergaris dengan ikon; bukan aset final.
- **Pin oranye bernomor** menandai perilaku, state, atau aturan validasi. Penjelasannya
  ada di daftar anotasi bawah setiap layar.
- **Data dummy** diambil dari katalog aplikasi (mis. Flameling, Mahkota Emas Juara,
  target 68 kg, 10 badge) agar konteksnya konsisten.
- **Navigasi statis**: tab, CTA, dan kartu index saling terhubung ke file wireframe
  yang relevan.

## Struktur file

```
public/wireframes/
├── index.html                  # cover, legend, 9 layar dalam 3 grup
├── caloria-wireframe.css       # token Caloria + komponen wireframe
├── page-1-onboarding.html      # 1.1 tujuan utama
├── page-1-profile.html         # 1.2 profil fisik & BMI
├── page-1-projection.html      # 1.3 proyeksi N hari
├── page-1-adopt.html           # 1.4 adopsi pet
├── page-4-pet.html             # 4.1 wardrobe
├── page-4-shop.html            # 4.2 pet shop
├── page-6-profile.html         # 6.1 overview profil
├── page-6-achievements.html    # 6.2 galeri achievement
├── page-6-settings.html        # 6.3 pengaturan
└── README.md
```

## Export PDF

Setiap layar sudah memiliki aturan `@media print` (A4 landscape, satu layar per
halaman). Buka halaman lalu `Ctrl/Cmd + P` → **Save as PDF**. Aktifkan opsi
**Background graphics** agar warna tetap tercetak.

## Batasan

- Tidak ada JavaScript, state management, atau interaksi nyata.
- Tombol/tab hanya representasi visual; navigasi antar layar memakai anchor atau link
  ke halaman wireframe lain.
- Modal, toast, dan state error digambar sebagai contoh statis di bawah layar utama.
- Karena berada di `public/`, artefak ikut ter-build pada production. Hapus folder ini
  atau pindahkan ke tooling desain terpisah jika tidak ingin ikut deploy.
