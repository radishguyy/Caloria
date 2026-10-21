/**
 * Caloria Goal-Based Communities Catalog
 * 
 * Groups organized by primary nutrition focus:
 * - Diet Warriors (Defisit Kalori & Pemotongan Lemak)
 * - Healthy Bulking Club (Surplus Kalori & Massa Otot)
 * - Maintenance & Balance Squad (Gizi Seimbang & Konsistensi Pola Hidup)
 * 
 * (Note: Per specifications, Caloria Plaza, public pet showcases, and public feeds are excluded)
 */

export interface CommunityGroup {
  id: string;
  name: string;
  focusGoal: "diet" | "bulking" | "maintenance";
  memberCount: number;
  tagline: string;
  description: string;
  rules: string[];
  recommendedMenus: string[];
  pinnedTips: {
    author: string;
    role: string;
    tip: string;
  }[];
}

export const COMMUNITIES_DATA: CommunityGroup[] = [
  {
    id: "community-diet-warriors",
    name: "Komunitas Pejuang Diet",
    focusGoal: "diet",
    memberCount: 1420,
    tagline: "Turunkan Berat Badan Sehat Tanpa Tersiksa",
    description:
      "Grup bagi pejuang defisit kalori terukur (-500 kkal/hari). Berbagi resep rendah minyak, strategi mengendalikan rasa lapar di malam hari, dan saling menguatkan proses transformasi.",
    rules: [
      "Fokus pada penurunan berat badan bertahap (0.5 kg/minggu).",
      "Dilarang mempromosikan diet ekstrim tanpa pengawasan medis.",
      "Saling memberikan motivasi positif.",
    ],
    recommendedMenus: [
      "Dada Ayam Panggang + Tumis Kangkung Bawang Putih (343 kcal, 49g Protein)",
      "Oatmeal Susu Rendah Lemak + Irisan Pisang (320 kcal, 12g Protein)",
      "Gado-Gado Tanpa Lontong + Telur Rebus (315 kcal, 18g Protein)",
    ],
    pinnedTips: [
      {
        author: "dr. Andini, Sp.GK",
        role: "Nutrition Advisor",
        tip: "Perbanyak asupan serat dan air putih 30 menit sebelum makan siang untuk membantu rasa kenyang alami lebih lama.",
      },
      {
        author: "Budi Santoso",
        role: "Community Lead",
        tip: "Gunakan semprotan minyak (oil spray) saat menumis untuk memangkas hingga 100 kalori lemak tersembunyi.",
      },
    ],
  },
  {
    id: "community-bulking-club",
    name: "Klub Bulking Sehat",
    focusGoal: "bulking",
    memberCount: 890,
    tagline: "Tingkatkan Massa Otot dengan Asupan Protein Berkualitas",
    description:
      "Wadah bagi anggota yang fokus menambah berat badan dan massa otot dengan surplus kalori bersih (+300 hingga +500 kkal/hari) dan target protein 1.8-2.2g per kg berat badan.",
    rules: [
      "Prioritaskan lean bulking daripada dirty bulking.",
      "Imbangi asupan makanan dengan latihan beban teratur.",
      "Catat asupan protein harian secara konsisten.",
    ],
    recommendedMenus: [
      "Nasi Merah 2 Centong + 200g Dada Ayam + Tahu Tempe (650 kcal, 62g Protein)",
      "Smoothie Pisang + Selai Kacang + Susu Protein (520 kcal, 38g Protein)",
      "Sate Ayam Daging Penuh Tanpa Kulit + Nasi Putih (544 kcal, 48g Protein)",
    ],
    pinnedTips: [
      {
        author: "Coach Rizky",
        role: "Strength Trainer",
        tip: "Jangan lewati sarapan berprotein tinggi. Telur rebus dan oatmeal adalah kombinasi bahan bakar optimal sebelum beraktivitas.",
      },
      {
        author: "Afza Pratama",
        role: "Senior Member",
        tip: "Bagi asupan makan menjadi 4-5 porsi kecil sehari jika kamu merasa begah menghabiskan kalori surplus dalam 3 kali makan.",
      },
    ],
  },
  {
    id: "community-balance-squad",
    name: "Squad Hidup Seimbang",
    focusGoal: "maintenance",
    memberCount: 1150,
    tagline: "Pertahankan Berat Ideal & Nikmati Hubungan Harmonis dengan Makanan",
    description:
      "Tempat berkumpul bagi mereka yang telah mencapai berat badan ideal atau berfokus pada kualitas mikronutrisi, energi harian, serta perbaikan pola makan berkelanjutan.",
    rules: [
      "Tidak perlu menghitung kalori dengan cemas, cukup perhatikan batas wajar.",
      "Utamakan piring gizi seimbang: 1/2 sayur buah, 1/4 karbohidrat, 1/4 protein.",
      "Konsistensi kebiasaan adalah kunci utama.",
    ],
    recommendedMenus: [
      "Ikan Bakar Gurame + Sayur Asem + Nasi Putih Porsi Sedang (430 kcal, 35g Protein)",
      "Capcay Seafood Kuah Bening + Telur Mata Sapi (380 kcal, 28g Protein)",
      "Salad Buah Segar dengan Dressing Yoghurt Yunani (260 kcal, 14g Protein)",
    ],
    pinnedTips: [
      {
        author: "Rina Wijaya, S.Gz",
        role: "Dietitian",
        tip: "Pola makan 80/20 sangat efektif untuk jangka panjang: 80% makanan bernutrisi utuh dan 20% makanan favorit untuk kepuasan mental.",
      },
    ],
  },
];

