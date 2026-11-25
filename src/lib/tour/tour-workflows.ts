import type { TourId, TourStepDef } from "./types";

export const TOUR_DEFS: Record<TourId, TourStepDef[]> = {
  dashboard: [
    {
      id: "dashboard-nav",
      target: 'a[href="/diary"]',
      title: "Menu Navigasi",
      content:
        "Pindah cepat ke Diary, Wardrobe, Sosial, dan Profil lewat menu navigasi ini.",
      placement: "bottom",
    },
    {
      id: "dashboard-pet",
      target: '[data-tour="dashboard-pet"]',
      title: "Halo, Ini CalPal-mu",
      content:
        "Dia makin senang dan naik level kalau kamu rajin mencatat makan setiap hari. ✨",
      placement: "right",
    },
    {
      id: "dashboard-calendar",
      target: '[data-tour="dashboard-calendar"]',
      title: "Kalender Mingguan",
      content:
        "Lihat konsistensi catatan makanmu minggu ini serta status pelindung streak-mu.",
      placement: "top",
    },
    {
      id: "dashboard-macro",
      target: '[data-tour="dashboard-macro"]',
      title: "Ringkasan Gizi Harian",
      content:
        "Pantau sisa kalori harian serta asupan protein, karbohidrat, dan lemakmu di sini.",
      placement: "left",
    },
    {
      id: "dashboard-quick-log",
      target: '[data-tour="dashboard-quick-log"]',
      title: "Catat Makanan Cepat",
      content:
        "Tekan tombol ini untuk langsung mencatat makananmu tanpa pindah halaman.",
      placement: "top",
    },
    {
      id: "dashboard-quests",
      target: '[data-tour="dashboard-quests"]',
      title: "Misi Harian Kamu",
      content:
        "Selesaikan misi harian di sini untuk mengumpulkan hadiah XP dan koin tambahan.",
      placement: "top",
    },
  ],

  diary: [
    {
      id: "diary-filter",
      target: '[data-tour="diary-filter"]',
      title: "Filter Waktu Makan",
      content:
        "Saring daftar catatanmu berdasarkan Sarapan, Makan Siang, Makan Malam, atau Camilan.",
      placement: "bottom",
    },
    {
      id: "diary-add-btn",
      target: '[data-tour="diary-add-btn"]',
      title: "Tambah Makanan Baru",
      content:
        "Tekan tombol ini untuk mencari menu dari katalog atau memindai label gizi. 🍽️",
      placement: "bottom",
    },
    {
      id: "diary-meal-add",
      target: '[data-tour="diary-meal-add"]',
      title: "Catat per Jadwal",
      content:
        "Kamu juga bisa langsung menambah makanan ke waktu makan tertentu lewat tombol ini.",
      placement: "left",
    },
    {
      id: "diary-archive-btn",
      target: '[data-tour="diary-archive-btn"]',
      title: "Arsip Kalender",
      content:
        "Buka kalender untuk melihat riwayat asupan harian dan rekap mingguanmu.",
      placement: "bottom",
    },
  ],

  "diary-add": [
    {
      id: "diary-add-search",
      target: '[data-tour="diary-add-search"]',
      title: "Cari Menu Makanan",
      content:
        "Ketik nama makanan atau minuman yang ingin kamu catat di kolom pencarian ini.",
      placement: "bottom",
    },
    {
      id: "diary-add-tabs",
      target: '[data-tour="diary-add-tabs"]',
      title: "Tab Sumber Makanan",
      content:
        "Temukan menu yang baru dimakan, paling sering kamu pilih, atau resep tersimpan.",
      placement: "bottom",
    },
    {
      id: "diary-add-scan",
      target: '[data-tour="diary-add-scan"]',
      title: "Scan Label Nutrisi",
      content:
        "Foto kemasan makananmu supaya kalori dan gizinya terisi otomatis. 📸",
      placement: "bottom",
    },
    {
      id: "diary-add-staging",
      target: '[data-tour="diary-add-staging"]',
      title: "Pilih & Simpan Menu",
      content:
        "Centang makanan ke piring pilihanmu, atur porsinya, lalu tekan tombol Catat.",
      placement: "top",
    },
  ],

  "diary-archive": [
    {
      id: "diary-archive-calendar",
      target: '[data-tour="diary-archive-calendar"]',
      title: "Kalender Riwayat Gizi",
      content:
        "Pilih tanggal mana saja untuk melihat ringkasan kalori dan catatan makanmu.",
      placement: "right",
    },
    {
      id: "diary-archive-wrapped",
      target: '[data-tour="diary-archive-wrapped"]',
      title: "Rekap Caloria Wrapped",
      content:
        "Putar cerita evaluasi mingguan dan bulananmu yang dirangkum otomatis di sini. ✨",
      placement: "bottom",
    },
    {
      id: "diary-archive-detail",
      target: '[data-tour="diary-archive-detail"]',
      title: "Rincian Catatan Harian",
      content:
        "Lihat daftar lengkap makanan yang kamu catat pada tanggal yang sedang dipilih.",
      placement: "left",
    },
  ],

  quests: [
    {
      id: "quests-roadmap",
      target: '[data-tour="quests-roadmap"]',
      title: "Level & Peta Progres",
      content:
        "Penuhi target mingguanmu untuk naik level dan membuka tahap program berikutnya. 🏆",
      placement: "bottom",
    },
    {
      id: "quests-main",
      target: '[data-tour="quests-main"]',
      title: "Misi Utama Harian",
      content:
        "Selesaikan misi gizi utama setiap hari untuk mendapatkan XP dan koin bagi CalPal.",
      placement: "right",
    },
    {
      id: "quests-side",
      target: '[data-tour="quests-side"]',
      title: "Misi Tambahan & Air",
      content:
        "Catat minum air harian dan tantangan tambahan di sini saat levelmu meningkat.",
      placement: "left",
    },
  ],

  wardrobe: [
    {
      id: "wardrobe-preview",
      target: '[data-tour="wardrobe-preview"]',
      title: "Preview CalPal Kamu",
      content:
        "Lihat gaya CalPal-mu secara langsung, elus, atau tidurkan dia di panggung ini. ✨",
      placement: "right",
    },
    {
      id: "wardrobe-accessories",
      target: '[data-tour="wardrobe-accessories"]',
      title: "Kategori & Warna",
      content:
        "Pasang topi, kacamata, pakaian, dekorasi ruangan, hingga warna tubuh favoritmu.",
      placement: "left",
    },
    {
      id: "wardrobe-save",
      target: 'button[aria-label="Simpan perubahan"]',
      title: "Simpan Penampilan",
      content:
        "Setelah selesai mendandani CalPal, tekan tombol centang ini untuk menyimpan.",
      placement: "top",
    },
    {
      id: "wardrobe-shop",
      target: 'a[href="/pet-customization/shop"]',
      title: "Menu Toko CalPal",
      content:
        "Ingin menambah koleksi aksesori baru? Buka Toko CalPal lewat tombol ini.",
      placement: "bottom",
    },
  ],

  shop: [
    {
      id: "shop-catalog",
      target: '[data-tour="shop-catalog"]',
      title: "Daftar Item Toko",
      content:
        "Jelajahi berbagai aksesori dan dekorasi ruangan seru untuk mempercantik CalPal-mu. 🛍️",
      placement: "top",
    },
    {
      id: "shop-categories",
      target: '[data-tour="shop-categories"]',
      title: "Kategori Aksesori",
      content:
        "Pilih tab kategori untuk menyaring jenis item yang ingin kamu lihat.",
      placement: "bottom",
    },
    {
      id: "shop-powerups",
      target: '[data-tour="shop-powerups"]',
      title: "Koin & Pelindung Streak",
      content:
        "Cek saldo koinmu dan beli item atau pelindung streak supaya progresmu tetap aman.",
      placement: "bottom",
    },
  ],

  social: [
    {
      id: "social-coop-card",
      target: '[data-tour="social-coop-card"]',
      title: "Kartu Streak Co-op",
      content:
        "Jaga streak bersama teman satu squad dengan rajin mencatat makan setiap hari. 🔥",
      placement: "bottom",
    },
    {
      id: "social-party-code",
      target: '[data-tour="social-party-code"]',
      title: "Kode Party & Salin",
      content:
        "Salin kode squad atau link undangan ini untuk mengajak temanmu bergabung.",
      placement: "bottom",
    },
    {
      id: "social-add-friend",
      target: '[data-tour="social-add-friend"]',
      title: "Tambah Teman Baru",
      content:
        "Cari username temanmu atau bergabung ke squad teman lewat tombol ini.",
      placement: "bottom",
    },
    {
      id: "social-requests-tab",
      target: '[data-tour="social-requests-tab"]',
      title: "Tab Undangan Teman",
      content:
        "Lihat dan terima undangan pertemanan yang masuk ke akunmu di tab ini.",
      placement: "bottom",
    },
    {
      id: "social-poke",
      target: '[data-tour="social-poke"]',
      title: "Senggol Teman Squad",
      content:
        "Pantau progres temanmu dan kirim senggolan kalau mereka belum mencatat makan hari ini.",
      placement: "top",
    },
  ],

  profile: [
    {
      id: "profile-weight-chart",
      target: '[data-tour="profile-weight-chart"]',
      title: "Grafik Berat Badan",
      content:
        "Pantau grafik perkembangan berat badan dan riwayat timbangan mingguanmu di sini. 📈",
      placement: "top",
    },
    {
      id: "profile-log-weight",
      target: '[data-tour="profile-log-weight"]',
      title: "Tombol Catat Berat",
      content:
        "Tekan tombol ini untuk mencatat berat badan terbarumu secara berkala.",
      placement: "left",
    },
    {
      id: "profile-progress",
      target: '[data-tour="profile-progress"]',
      title: "BMI & Progres Program",
      content:
        "Lihat kategori BMI terkini serta progres harimu menuju target berat badan.",
      placement: "bottom",
    },
  ],

  settings: [
    {
      id: "settings-notifications",
      target: '[data-tour="settings-notifications"]',
      title: "Bagian Notifikasi",
      content:
        "Aktifkan pengingat di browser atau email supaya kamu tidak melewatkan waktu makan. 🔔",
      placement: "bottom",
    },
    {
      id: "settings-schedule",
      target: '[data-tour="settings-schedule"]',
      title: "Jadwal Jam Makan",
      content:
        "Atur jam pengingat sarapan, makan siang, dan makan malam sesuai kebiasaanmu.",
      placement: "top",
    },
    {
      id: "settings-guide",
      target: '[data-tour="settings-guide"]',
      title: "Panduan Aplikasi",
      content:
        "Kamu bisa mengulang panduan halaman ini atau semua halaman kapan saja dari kartu ini.",
      placement: "top",
    },
  ],
};
