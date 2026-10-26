/**
 * Caloria Achievements & Milestone Badges Catalog
 * 
 * Categories:
 * - consistency: Consecutive tracking streaks (3, 7, 30, 100 days)
 * - nutrition: Nutrition compliance milestones (Protein Champion, Calorie Sniper, Goal Finisher)
 * - social: Co-op streak and friend accountability milestones (Co-op Starter, Duo Unstoppable, Senggol Master)
 */

export type AchievementCategory = "consistency" | "nutrition" | "social";

export interface AchievementBadge {
  id: string;
  name: string;
  category: AchievementCategory;
  description: string;
  requirementText: string;
  iconEmoji: string;
  colorBorder: string;
  rewardCoins: number;
}

export const ACHIEVEMENTS_DATA: AchievementBadge[] = [
  // Consistency
  {
    id: "badge-consistency-3",
    name: "Langkah Pertama",
    category: "consistency",
    description: "Mencatat makanan selama 3 hari berturut-turut tanpa jeda.",
    requirementText: "Streak minimal 3 hari",
    iconEmoji: "🌱",
    colorBorder: "border-brand-green",
    rewardCoins: 30,
  },
  {
    id: "badge-consistency-7",
    name: "Konsistensi Mingguan",
    category: "consistency",
    description: "Menjaga komitmen pencatatan gizi selama 7 hari penuh.",
    requirementText: "Streak minimal 7 hari",
    iconEmoji: "🔥",
    colorBorder: "border-brand-orange",
    rewardCoins: 75,
  },
  {
    id: "badge-consistency-30",
    name: "Pejuang Disiplin",
    category: "consistency",
    description: "Membangun kebiasaan hidup sehat tanpa henti selama 30 hari.",
    requirementText: "Streak minimal 30 hari",
    iconEmoji: "🛡️",
    colorBorder: "border-warm-border-strong",
    rewardCoins: 200,
  },
  {
    id: "badge-consistency-100",
    name: "Legenda Caloria",
    category: "consistency",
    description: "Pencapaian monumental 100 hari berturut-turut menjaga nutrisi tubuh.",
    requirementText: "Streak minimal 100 hari",
    iconEmoji: "👑",
    colorBorder: "border-brown",
    rewardCoins: 500,
  },

  // Nutrition Missions
  {
    id: "badge-protein-champion",
    name: "Protein Champion",
    category: "nutrition",
    description: "Memenuhi target protein harian sebanyak 7 kali berturut-turut.",
    requirementText: "Penuhi target protein 7 hari berturut-turut",
    iconEmoji: "🥩",
    colorBorder: "border-brown",
    rewardCoins: 100,
  },
  {
    id: "badge-calorie-sniper",
    name: "Calorie Sniper",
    category: "nutrition",
    description: "Menjaga total kalori tepat di zona target (+/- 10%) selama satu minggu.",
    requirementText: "Total kalori harian ideal 7 hari beruntun",
    iconEmoji: "🎯",
    colorBorder: "border-brand-green",
    rewardCoins: 120,
  },
  {
    id: "badge-goal-finisher",
    name: "Goal Finisher",
    category: "nutrition",
    description: "Berhasil menuntaskan proyeksi N hari dan mencapai target berat badan.",
    requirementText: "Mencapai berat badan target program",
    iconEmoji: "🏆",
    colorBorder: "border-brown",
    rewardCoins: 350,
  },

  // Social & Co-op
  {
    id: "badge-coop-starter",
    name: "Rekan Seperjuangan",
    category: "social",
    description: "Bergabung atau membentuk party Co-op Streak pertama bersama teman.",
    requirementText: "Bergabung dalam Co-op Party",
    iconEmoji: "🤝",
    colorBorder: "border-brand-green-dark",
    rewardCoins: 50,
  },
  {
    id: "badge-duo-unstoppable",
    name: "Duo Unstoppable",
    category: "social",
    description: "Mencapai 14 hari Co-op Streak bersama seluruh anggota squad.",
    requirementText: "Co-op Streak 14 hari bersama squad",
    iconEmoji: "⚡",
    colorBorder: "border-warm-border",
    rewardCoins: 150,
  },
  {
    id: "badge-senggol-master",
    name: "Sahabat Perhatian",
    category: "social",
    description: "Menyenggol teman untuk mengingatkan pencatatan makanan sebanyak 5 kali.",
    requirementText: "Senggol teman 5 kali sebelum waktu makan berakhir",
    iconEmoji: "👋",
    colorBorder: "border-brand-green-light",
    rewardCoins: 60,
  },
];

