/**
 * Caloria Design System — Typed Design Tokens & Semantic Variant Helpers
 * Source of truth: /caloria-design-system-agent-files/design-tokens.json & AGENTS.md
 */

export const CALORIA_DESIGN_TOKENS = {
  name: "Caloria Design System",
  color: {
    canvas: "#FFFFFF",
    surface: "#FFFFFF",
    "surface-subtle": "#F8FAFC",
    "text-primary": "#529028",
    "text-inverse": "#FFFFFF",
    "accent-green": "#6AB04C",
    "accent-green-light": "#BADC58",
    "accent-yellow": "#F6E58D",
    "accent-orange": "#F0932B",
    "accent-orange-dark": "#CD6731",
    "border-default": "#D9D9D9",
    "border-divider": "#D1D9E2",
    "text-muted": "#8CA2C0",
    "neutral-10": "#486284",
    "neutral-7": "#8CA2C0",
  },
  macro: {
    calories: "#6AB04C",
    protein: "#3B82F6",
    carbs: "#F0932B",
    fat: "#E11D48",
    fiber: "#529028",
    sugar: "#9333EA",
  },
  gamification: {
    xp: "#6AB04C",
    streak: "#F0932B",
    coin: "#F0932B",
    tier: {
      common: "#8CA2C0",
      rare: "#6AB04C",
      epic: "#F0932B",
      legendary: "#CD6731",
    },
  },
  typography: {
    "font-heading": "Secuela, sans-serif",
    "font-body": '"Open Runde", sans-serif',
    h1: {
      fontFamily: "Secuela",
      fontWeight: 800,
      fontSize: "60px",
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: "Secuela",
      fontWeight: 500,
      fontSize: "48px",
      lineHeight: 1.2,
    },
    h3: {
      fontFamily: "Open Runde",
      fontWeight: 600,
      fontSize: "40px",
      lineHeight: 1.2,
    },
    body: {
      fontFamily: "Open Runde",
      fontWeight: 400,
      fontSize: "20px",
      lineHeight: 1.4,
    },
    caption: {
      fontFamily: "Open Runde",
      fontWeight: 500,
      fontSize: "16px",
      lineHeight: 1.4,
    },
  },
  radius: {
    navigation: "14.022px",
    button: "20px",
    card: "33px",
    input: "12px",
    pill: "999px",
  },
  spacing: {
    "4": "4px",
    "8": "8px",
    "12": "12px",
    "16": "16px",
    "24": "24px",
    "32": "32px",
    "48": "48px",
    "64": "64px",
    "80": "80px",
    "96": "96px",
    "128": "128px",
  },
  shadow: {
    input: "0 1px 2px rgba(16, 24, 40, 0.05)",
    button: "0 9px 0 #529028",
  },
} as const;

export type CaloriaColorToken = keyof typeof CALORIA_DESIGN_TOKENS.color;
export type MacroNutrientType = keyof typeof CALORIA_DESIGN_TOKENS.macro;
export type BadgeRarityTier = keyof typeof CALORIA_DESIGN_TOKENS.gamification.tier;
export type CaloriaRadiusToken = keyof typeof CALORIA_DESIGN_TOKENS.radius;
export type CaloriaSpacingToken = keyof typeof CALORIA_DESIGN_TOKENS.spacing;

/**
 * Semantic Tailwind class mappings for Macro Nutrient badges, bars, and cards
 */
export const MACRO_STYLES: Record<
  MacroNutrientType,
  {
    label: string;
    unit: string;
    textClass: string;
    bgClass: string;
    subtleBgClass: string;
    borderClass: string;
    trackClass: string;
  }
> = {
  calories: {
    label: "Kalori",
    unit: "kcal",
    textClass: "text-text-primary",
    bgClass: "bg-accent-green",
    subtleBgClass: "bg-accent-green/10",
    borderClass: "border-accent-green/25",
    trackClass: "bg-accent-green/20",
  },
  protein: {
    label: "Protein",
    unit: "g",
    textClass: "text-macro-protein",
    bgClass: "bg-macro-protein",
    subtleBgClass: "bg-macro-protein/10",
    borderClass: "border-macro-protein/20",
    trackClass: "bg-macro-protein/20",
  },
  carbs: {
    label: "Karbo",
    unit: "g",
    textClass: "text-accent-orange-dark",
    bgClass: "bg-accent-orange",
    subtleBgClass: "bg-accent-yellow/40",
    borderClass: "border-accent-orange/25",
    trackClass: "bg-accent-orange/20",
  },
  fat: {
    label: "Lemak",
    unit: "g",
    textClass: "text-macro-fat",
    bgClass: "bg-macro-fat",
    subtleBgClass: "bg-macro-fat/10",
    borderClass: "border-macro-fat/20",
    trackClass: "bg-macro-fat/20",
  },
  fiber: {
    label: "Serat",
    unit: "g",
    textClass: "text-text-primary",
    bgClass: "bg-accent-green",
    subtleBgClass: "bg-accent-green/10",
    borderClass: "border-accent-green/20",
    trackClass: "bg-accent-green/20",
  },
  sugar: {
    label: "Gula",
    unit: "g",
    textClass: "text-macro-sugar",
    bgClass: "bg-macro-sugar",
    subtleBgClass: "bg-macro-sugar/10",
    borderClass: "border-macro-sugar/20",
    trackClass: "bg-macro-sugar/20",
  },
};

