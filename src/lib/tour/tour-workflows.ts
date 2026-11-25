import type { TourId, TourStepDef } from "./types";

export const TOUR_DEFS: Record<TourId, TourStepDef[]> = {
  dashboard: [
    {
      id: "dashboard-nav",
      target: 'a[href="/diary"]',
      title: "Menu Navigasi",
      content: "Buka Diary, Wardrobe, Sosial, atau Profil kapan saja.",
      placement: "bottom",
    },
    {
      id: "dashboard-pet",
      target: '[data-tour="dashboard-pet"]',
      title: "CalPal-mu",
      content: "CalPal naik level jika kamu rutin mencatat makan harian.",
      placement: "right",
    },
    {
      id: "dashboard-calendar",
      target: '[data-tour="dashboard-calendar"]',
      title: "Kalender Bulan",
      content: "Pantau konsistensi catatan makan dan status pelindung streak.",
      placement: "top",
    },
    {
      id: "dashboard-macro",
      target: '[data-tour="dashboard-macro"]',
      title: "Ringkasan Gizi",
      content: "Cek sisa kalori, protein, karbohidrat, dan lemak harianmu.",
      placement: "left",
    },
    {
      id: "dashboard-quick-log",
      target: '[data-tour="dashboard-quick-log"]',
      title: "Catat Cepat",
      content: "Catat makanan langsung tanpa pindah halaman.",
      placement: "top",
    },
    {
      id: "dashboard-quests",
      target: '[data-tour="dashboard-quests"]',
      title: "Misi Harian",
      content: "Selesaikan misi untuk meraih XP dan koin tambahan.",
      placement: "top",
    },
  ],

  diary: [
    {
      id: "diary-filter",
      target: '[data-tour="diary-filter"]',
      title: "Filter Waktu Makan",
      content:
        "Saring catatan menurut Sarapan, Makan Siang, Malam, atau Camilan.",
      placement: "bottom",
    },
    {
      id: "diary-add-btn",
      target: '[data-tour="diary-add-btn"]',
      title: "Tambah Makanan",
      content: "Cari menu katalog atau pindai label gizi kemasan.",
      placement: "bottom",
    },
    {
      id: "diary-meal-add",
      target: '[data-tour="diary-meal-add"]',
      title: "Catat per Jadwal",
      content: "Tambah makanan langsung ke waktu makan pilihanmu.",
      placement: "left",
    },
    {
      id: "diary-archive-btn",
      target: '[data-tour="diary-archive-btn"]',
      title: "Kalender",
      content: "Tinjau riwayat asupan harian dan rekap mingguanmu.",
      placement: "bottom",
    },
  ],

  "diary-add": [
    {
      id: "diary-add-search",
      target: '[data-tour="diary-add-search"]',
      title: "Cari Menu",
      content: "Ketik nama makanan atau minuman yang ingin dicatat.",
      placement: "bottom",
    },
    {
      id: "diary-add-tabs",
      target: '[data-tour="diary-add-tabs"]',
      title: "Sumber Makanan",
      content: "Pilih menu terbaru, favorit, atau resep tersimpan.",
      placement: "bottom",
    },
    {
      id: "diary-add-scan",
      target: '[data-tour="diary-add-scan"]',
      title: "Scan Label Nutrisi",
      content: "Foto kemasan makanan agar kalori dan gizi terisi otomatis.",
      placement: "bottom",
    },
    {
      id: "diary-add-staging",
      target: '[data-tour="diary-add-staging"]',
      title: "Simpan Menu",
      content: "Pilih menu, atur porsi, lalu tekan tombol Catat.",
      placement: "top",
    },
  ],

  "diary-archive": [
    {
      id: "diary-archive-calendar",
      target: '[data-tour="diary-archive-calendar"]',
      title: "Kalender Gizi",
      content: "Ketuk tanggal dan cek ringkasan kalori harianmu.",
      placement: "right",
    },
    {
      id: "diary-archive-wrapped",
      target: '[data-tour="diary-archive-wrapped"]',
      title: "Caloria Wrapped",
      content: "Putar rangkuman evaluasi mingguan dan bulananmu.",
      placement: "bottom",
    },
    {
      id: "diary-archive-detail",
      target: '[data-tour="diary-archive-detail"]',
      title: "Catatan Harian",
      content: "Daftar lengkap makanan tercatat pada tanggal pilihan.",
      placement: "left",
    },
  ],

  quests: [
    {
      id: "quests-roadmap",
      target: '[data-tour="quests-roadmap"]',
      title: "Peta Progres",
      content: "Penuhi target mingguan untuk naik level berikutnya.",
      placement: "bottom",
    },
    {
      id: "quests-main",
      target: '[data-tour="quests-main"]',
      title: "Misi Utama",
      content: "Selesaikan misi gizi setiap hari demi XP dan koin.",
      placement: "right",
    },
    {
      id: "quests-side",
      target: '[data-tour="quests-side"]',
      title: "Misi Tambahan",
      content: "Catat minum air dan tantangan ekstra sesuai levelmu.",
      placement: "left",
    },
  ],

  wardrobe: [
    {
      id: "wardrobe-preview",
      target: '[data-tour="wardrobe-preview"]',
      title: "CalPal-mu",
      content: "Ubah gaya, elus, atau tidurkan CalPal langsung.",
      placement: "right",
    },
    {
      id: "wardrobe-accessories",
      target: '[data-tour="wardrobe-accessories"]',
      title: "Aksesori & Warna",
      content: "Padukan topi, kacamata, pakaian, dekorasi, dan warna tubuh.",
      placement: "left",
    },
    {
      id: "wardrobe-save",
      target: 'button[aria-label="Simpan perubahan"]',
      title: "Simpan Gaya",
      content: "Tekan tombol centang setelah selesai mendandani CalPal.",
      placement: "top",
    },
    {
      id: "wardrobe-shop",
      target: 'a[href="/pet-customization/shop"]',
      title: "Toko CalPal",
      content: "Buka toko dan tambah koleksi aksesori baru.",
      placement: "bottom",
    },
  ],

  shop: [
    {
      id: "shop-catalog",
      target: '[data-tour="shop-catalog"]',
      title: "Katalog Toko",
      content: "Jelajahi aksesori dan dekorasi untuk mempercantik CalPal-mu.",
      placement: "top",
    },
    {
      id: "shop-categories",
      target: '[data-tour="shop-categories"]',
      title: "Kategori Item",
      content: "Pilih tab kategori guna menyaring jenis item.",
      placement: "bottom",
    },
    {
      id: "shop-powerups",
      target: '[data-tour="shop-powerups"]',
      title: "Power-Up",
      content: "Cek saldo koin dan beli pelindung streak harianmu.",
      placement: "bottom",
    },
  ],

  social: [
    {
      id: "social-coop-card",
      target: '[data-tour="social-coop-card"]',
      title: "Streak Co-op",
      content: "Jaga streak bersama squad dengan rutin mencatat makan.",
      placement: "bottom",
    },
    {
      id: "social-party-code",
      target: '[data-tour="social-party-code"]',
      title: "Kode Party",
      content: "Salin kode atau tautan undangan agar teman bergabung.",
      placement: "bottom",
    },
    {
      id: "social-add-friend",
      target: '[data-tour="social-add-friend"]',
      title: "Tambah Teman",
      content: "Cari username teman atau gabung ke squad lain.",
      placement: "bottom",
    },
    {
      id: "social-requests-tab",
      target: '[data-tour="social-requests-tab"]',
      title: "Undangan Teman",
      content: "Tinjau dan terima permintaan pertemanan yang masuk.",
      placement: "bottom",
    },
    {
      id: "social-poke",
      target: '[data-tour="social-poke"]',
      title: "Senggol Squad",
      content: "Kirim pengingat ke teman yang belum mencatat makan.",
      placement: "top",
    },
  ],

  profile: [
    {
      id: "profile-weight-chart",
      target: '[data-tour="profile-weight-chart"]',
      title: "Grafik Berat",
      content: "Pantau tren berat badan dan riwayat timbangan mingguan.",
      placement: "top",
    },
    {
      id: "profile-log-weight",
      target: '[data-tour="profile-log-weight"]',
      title: "Catat Berat",
      content: "Perbarui angka berat badanmu secara berkala.",
      placement: "left",
    },
    {
      id: "profile-progress",
      target: '[data-tour="profile-progress"]',
      title: "Progres Program",
      content: "Cek kategori BMI dan progres menuju target berat.",
      placement: "bottom",
    },
  ],

  settings: [
    {
      id: "settings-notifications",
      target: '[data-tour="settings-notifications"]',
      title: "Notifikasi",
      content:
        "Aktifkan pengingat browser atau email agar jadwal makan terjaga.",
      placement: "bottom",
    },
    {
      id: "settings-schedule",
      target: '[data-tour="settings-schedule"]',
      title: "Jadwal Makan",
      content: "Atur jam pengingat sarapan, makan siang, dan malam.",
      placement: "top",
    },
    {
      id: "settings-guide",
      target: '[data-tour="settings-guide"]',
      title: "Panduan Aplikasi",
      content: "Putar ulang panduan halaman kapan saja.",
      placement: "top",
    },
  ],
};
