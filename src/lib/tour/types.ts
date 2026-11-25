export type TourId =
  | "dashboard"
  | "diary"
  | "diary-add"
  | "diary-archive"
  | "quests"
  | "wardrobe"
  | "shop"
  | "social"
  | "profile"
  | "settings";

export interface TourStepDef {
  id: string; // unik per tour, mis. "dashboard-pet"
  target: string; // CSS selector, mis. '[data-tour="dashboard-pet"]' atau 'a[href="/diary"]'
  title: string; // maks 4 kata
  content: string; // 1 kalimat, maks ~100 karakter
  placement?: "top" | "bottom" | "left" | "right";
}
