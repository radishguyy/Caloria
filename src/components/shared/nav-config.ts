import {
  LayoutDashboard,
  PawPrint,
  Target,
  UtensilsCrossed,
  Users,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Path prefixes (segment-aware) that mark this destination as active. */
  matchPrefixes: string[];
  /** Show the streak badge on this destination. */
  showStreak?: boolean;
}

/**
 * Primary navigation shared by the desktop navbar and the mobile bottom nav.
 * Hrefs point at the existing routes; only the labels are user-facing names.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    matchPrefixes: ["/dashboard"],
  },
  {
    href: "/diary",
    label: "Food Diary",
    icon: UtensilsCrossed,
    matchPrefixes: ["/diary"],
  },
  {
    href: "/quests",
    label: "Misi",
    icon: Target,
    matchPrefixes: ["/quests"],
  },
  {
    href: "/pet-customization/wardrobe",
    label: "CalPal",
    icon: PawPrint,
    matchPrefixes: ["/pet-customization", "/pet"],
  },
  {
    href: "/social",
    label: "Social",
    icon: Users,
    matchPrefixes: ["/social"],
    showStreak: true,
  },
  {
    href: "/consult",
    label: "Konsultasi",
    icon: Stethoscope,
    matchPrefixes: ["/consult"],
  },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return item.matchPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}