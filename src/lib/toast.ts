import { toast } from "sonner";

/**
 * Caloria Standardized Tactile Toaster Dispatcher
 * Adheres strictly to design tokens:
 * - Rounded cards (`rounded-2xl`)
 * - High-contrast border (`border-2 border-[#1E293B]/10`)
 * - Subtle 3D shadow (`shadow-md`)
 * - Typography: Secuela for titles, Open Runde for descriptions
 */

export interface ToastOptions {
  description?: string;
  duration?: number;
}

export function toastSuccess(title: string, description?: string, options?: ToastOptions) {
  return toast.success(title, {
    description,
    duration: options?.duration ?? 3500,
    className:
      "!bg-surface !border-2 !border-[#5B8E55]/30 !rounded-2xl !shadow-md !font-sans !p-4 !text-text-primary",
  });
}

export function toastReward(title: string, exp: number, coins: number, description?: string) {
  const rewardDesc = description || `+${exp} EXP & +${coins} Koin didapatkan. Pet kamu kenyang!`;
  return toast.success(title, {
    description: rewardDesc,
    duration: 4000,
    className:
      "!bg-[#FAF8F5] !border-2 !border-[#5B8E55] !rounded-2xl !shadow-md !font-sans !p-4 !text-text-primary",
  });
}

export function toastInfo(title: string, description?: string, options?: ToastOptions) {
  return toast(title, {
    description,
    duration: options?.duration ?? 3000,
    className:
      "!bg-surface !border-2 !border-border-divider !rounded-2xl !shadow-md !font-sans !p-4 !text-text-primary",
  });
}

export function toastWarning(title: string, description?: string, options?: ToastOptions) {
  return toast.warning(title, {
    description,
    duration: options?.duration ?? 3500,
    className:
      "!bg-[#FCF8E3] !border-2 !border-[#FF9233]/40 !rounded-2xl !shadow-md !font-sans !p-4 !text-text-primary",
  });
}

// =========================================================================
// Standardized Action Triggers
// =========================================================================

/** 1. Food Logging Triggers */
export function toastFoodStaged(foodName: string) {
  return toastInfo("Ditambahkan ke Piring 🥣", `${foodName} siap dicatat.`);
}

export function toastMealsCommitted(exp: number = 25, coins: number = 10) {
  return toastReward(
    "Makanan Berhasil Dicatat! 🍽️✨",
    exp,
    coins,
    `+${exp} EXP & +${coins} Koin didapatkan. Pet kamu kenyang!`
  );
}

export function toastOcrSuccess() {
  return toastSuccess(
    "Label Nutrisi Terbaca! 📸",
    "Informasi kalori dan makro otomatis terisi."
  );
}

/** 2. Social & Co-op Triggers */
export function toastFriendRequestSent(username: string) {
  return toastInfo(
    "Undangan Dikirim! 🤝",
    `Menunggu persetujuan dari @${username.replace(/^@/, "")}.`
  );
}

export function toastFriendRequestAccepted(username: string) {
  return toastSuccess(
    "Teman Baru Ditambahkan! 🎉",
    `Kamu dan @${username.replace(/^@/, "")} sekarang berteman.`
  );
}

export function toastFriendRequestDeclined() {
  return toastInfo("Permintaan Ditolak", "Undangan telah dihapus.");
}

export function toastNudgeSent(username: string) {
  return toastSuccess(
    "Colekan Terkirim! ⚔️🔥",
    `Mengingatkan @${username.replace(/^@/, "")} untuk mencatat makan hari ini.`
  );
}

/** 3. Calpal Wardrobe & Customization Triggers */
export function toastLoadoutEquipped() {
  return toast.success("Gaya Calpal Diperbarui! 🐾✨", {
    description: "Aksesoris baru berhasil dipasang.",
    duration: 3500,
    className:
      "!bg-surface !border-2 !border-[#FF9233] !rounded-2xl !shadow-md !font-sans !p-4 !text-text-primary",
  });
}

export function toastPaletteSaved() {
  return toastSuccess(
    "Warna Calpal Disimpan! 🎨",
    "Tampilan palet baru Calpal-mu telah aktif."
  );
}

export function toastShopPurchased(price: number) {
  return toastSuccess(
    "Item Berhasil Dibeli! 🛍️",
    `-${price} Koin. Cek lemari untuk memakainya!`
  );
}

