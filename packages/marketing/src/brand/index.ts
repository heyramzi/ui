// ── Design Tokens ──────────────────────────────────────────────

export const TOKENS = {
  ink: "oklch(0.12 0.04 258)",
  night: "oklch(0.18 0.05 262)",
  veil: "oklch(0.28 0.06 264)",
  indigo: "oklch(0.50 0.20 272)",
  sand: "oklch(0.78 0.08 40)",
  terra: "oklch(0.65 0.20 30)",
  cream: "oklch(0.97 0.01 55)",
  linen: "oklch(0.985 0.003 55)",
  mist: "oklch(0.90 0.006 55)",
  text: "oklch(0.96 0 0)",
  textStrong: "oklch(0.88 0 0)",
  textBody: "oklch(0.70 0 0)",
  textMuted: "oklch(0.50 0 0)",
  textSubtle: "oklch(0.52 0 0)",
  textFaint: "oklch(0.48 0 0)",
  borderInner: "oklch(0.22 0.04 262)",
} as const;

// ── Colors ─────────────────────────────────────────────────────

export const COLORS = {
  indigo: "oklch(0.50 0.20 272)",
  sand: "oklch(0.78 0.08 40)",
  terra: "oklch(0.65 0.20 30)",
  cream: "oklch(0.97 0.01 55)",
  white: "oklch(0.96 0 0)",
  black: "oklch(0.12 0 0)",
} as const;

export const BRAND_HEX = {
  indigo: "#414fd2",
  sand: "#e5a691",
  terra: "#f0503d",
  cream: "#fbf3ef",
  white: "#f2f2f2",
  black: "#060606",
  ink: "#000515",
  night: "#051027",
  veil: "#192846",
  linen: "#fcfaf8",
  mist: "#e1ddda",
  text: "#f4f4f4",
  textStrong: "#e0e0e0",
  textBody: "#b3b3b3",
  textMuted: "#808080",
  textFaint: "#858585",
  borderInner: "#1a2038",
} as const;

export const COLORS_HEX = BRAND_HEX;

// ── Font Families ──────────────────────────────────────────────

export const FONT = {
  heading: "'Manrope', sans-serif",
  body: "var(--font-satoshi), sans-serif",
  mono: "var(--font-space-grotesk), monospace",
  /**
   * The serif, and the only italic the brand owns.
   */

  /*
   * Added 31 Aug 2026 for the carousel surface, where a heading is two voices: the first line names the position in Manrope and the second names the thing in this.
   */

  /*
   * Ramzi's call that day: "having an italic display font as a 4th font in our design system could make sense."
   */

  /*
   * WHY THE KEY IS `serif` AND NOT `display`.
   */

  /*
   * The other three are named for what the face IS, not for the job it does, and a role name sitting among category names reads as a fourth category nobody
   */

  /*
   * can place. Ramzi, 31 Aug 2026: "maybe instead of naming it display we should name it serif".
   */

  /*
   * WHY Fraunces and not the obvious ones. It was picked against six other Google Fonts italics rendered at 84px on the real ground: Playfair Display is the archetypal editorial default,
   */

  /*
   * Instrument Serif is the current startup default, Bodoni Moda's hairlines go quiet next to Manrope 800, and EB Garamond and Lora are text faces that read soft at display size.
   */

  /*
   * Fraunces is the one that holds equal weight against the line above it.
   */

  /*
   * Hairline survival was measured through a JPEG q75 re-encode and separated none of them, so the choice is character rather than robustness.
   */

  /*
   * IT IS ONLY EVER SET AT `opsz` 144.
   */

  /*
   * Fraunces is variable and its optical size axis is the whole face: at the text end the letterforms are wide and soft and a three-word line wraps to two rows;
   */

  /*
   * at 144 they narrow into a display cut with the contrast the role needs. `font-variation-settings: 'opsz' 144, 'wght' 700`, and nothing else.
   */

  /*
   * WONK moves lowercase and this line is caps, so setting it is noise.
   */

  /*
   * It is on Google Fonts on purpose, so the same face is available in the tools that only offer a Google list rather than only in what we render ourselves.
   */
  serif: "'Fraunces', Georgia, serif",
} as const;

// ── Gradient Helpers ───────────────────────────────────────────

function rg(size: string, pos: string, color: string, alpha: number) {
  return `radial-gradient(ellipse ${size} at ${pos}, ${color.slice(0, -1)} / ${alpha}) 0%, transparent 100%)`;
}

export const GRADIENT_LAYERS = [
  { pos: "32% 38%", size: "110% 75%", color: COLORS.indigo, alpha: 1, name: "Indigo" },
  { pos: "80% 95%", size: "80% 75%", color: COLORS.sand, alpha: 1, name: "Sand" },
  { pos: "65% 75%", size: "50% 45%", color: COLORS.terra, alpha: 1, name: "Terra" },
] as const;

export const GRADIENT_MAIN_CSS = GRADIENT_LAYERS.map((l) =>
  rg(l.size, l.pos, l.color, l.alpha),
).join(", ");

export const FLUTED_GRADIENT = `repeating-linear-gradient(90deg, oklch(1 0 0 / 0.04) 0px, oklch(1 0 0 / 0.04) 2px, transparent 2px, transparent 18px), ${GRADIENT_MAIN_CSS}`;

export const GRADIENT_LAYER_CSS = GRADIENT_LAYERS.map((l) => ({
  name: l.name,
  color: l.color,
  css: rg(l.size, l.pos, l.color, l.alpha),
  meta: `${l.size} at ${l.pos}, α ${l.alpha}`,
}));

export const GRADIENT_BL = [
  "radial-gradient(ellipse 110% 75% at 20% 75%, oklch(0.50 0.20 272 / 0.92) 0%, transparent 100%)",
  "radial-gradient(ellipse 64% 72% at 80% 40%, oklch(0.78 0.08 40 / 0.70) 0%, transparent 100%)",
  "radial-gradient(ellipse 36% 40% at 90% 10%, oklch(0.65 0.20 30 / 0.60) 0%, transparent 100%)",
  "oklch(0.12 0.04 258)",
].join(", ");

export const GRADIENT_TR = [
  "radial-gradient(ellipse 110% 75% at 80% 25%, oklch(0.50 0.20 272 / 0.92) 0%, transparent 100%)",
  "radial-gradient(ellipse 64% 72% at 20% 60%, oklch(0.78 0.08 40 / 0.70) 0%, transparent 100%)",
  "radial-gradient(ellipse 36% 40% at 10% 90%, oklch(0.65 0.20 30 / 0.60) 0%, transparent 100%)",
  "oklch(0.12 0.04 258)",
].join(", ");

// ── Accent Colors ──────────────────────────────────────────────

export type AccentColor = {
  name: string;
  value: string;
  hex: string;
  role: string;
  weight: string;
};

export const ACCENT_COLORS: AccentColor[] = [
  { name: "Indigo", value: "oklch(0.50 0.20 272)", hex: "#414fd2", role: "Primary", weight: "60%" },
  { name: "Sand", value: "oklch(0.78 0.08 40)", hex: "#e5a691", role: "Warmth", weight: "30%" },
  { name: "Terra", value: "oklch(0.65 0.20 30)", hex: "#f0503d", role: "Signal", weight: "10%" },
];

// ── Surface Pairs ──────────────────────────────────────────────

export type SurfacePair = {
  role: string;
  dark: { name: string; value: string; hex: string; description: string };
  light: { name: string; value: string; hex: string; description: string };
};

export const SURFACE_PAIRS: SurfacePair[] = [
  {
    role: "Base · Page bg",
    dark: {
      name: "Ink",
      value: "oklch(0.12 0.04 258)",
      hex: "#000515",
      description: "Page background",
    },
    light: {
      name: "Cream",
      value: "oklch(0.97 0.01 55)",
      hex: "#fbf3ef",
      description: "Page background",
    },
  },
  {
    role: "Surface · Cards",
    dark: {
      name: "Night",
      value: "oklch(0.18 0.05 262)",
      hex: "#051027",
      description: "Cards, panels",
    },
    light: {
      name: "Linen",
      value: "oklch(0.985 0.003 55)",
      hex: "#fcfaf8",
      description: "Cards, panels",
    },
  },
  {
    role: "Borders · Dividers",
    dark: {
      name: "Veil",
      value: "oklch(0.28 0.06 264)",
      hex: "#192846",
      description: "Borders, dividers",
    },
    light: {
      name: "Mist",
      value: "oklch(0.90 0.006 55)",
      hex: "#e1ddda",
      description: "Borders, dividers",
    },
  },
];

// ── Semantic Colors ────────────────────────────────────────────

export type SemanticColor = {
  name: string;
  value: string;
  hex: string;
  role: string;
};

export const SEMANTIC_COLORS: SemanticColor[] = [
  { name: "Info", value: "oklch(0.68 0.16 250)", hex: "#5b8af8", role: "Informational" },
  { name: "Warning", value: "oklch(0.78 0.14 75)", hex: "#d4a83c", role: "Caution" },
  { name: "Error", value: "oklch(0.60 0.20 25)", hex: "#d94040", role: "Destructive" },
  { name: "Success", value: "oklch(0.62 0.17 145)", hex: "#478416", role: "Positive" },
];

// ── Mesh Variants ─────────────────────────────────────────────

export const MESH_VARIANTS = [
  {
    name: "Bottom-left anchor",
    token: "--gradient-card-bl",
    css: `radial-gradient(ellipse 110% 75% at 20% 75%, oklch(0.50 0.20 272 / 0.92) 0%, transparent 100%), radial-gradient(ellipse 64% 72% at 80% 40%, oklch(0.78 0.08 40 / 0.70) 0%, transparent 100%), radial-gradient(ellipse 36% 40% at 90% 10%, oklch(0.65 0.20 30 / 0.60) 0%, transparent 100%)`,
  },
  {
    name: "Bottom-right anchor",
    token: "--gradient-card-br",
    css: `radial-gradient(ellipse 110% 75% at 80% 75%, oklch(0.50 0.20 272 / 0.92) 0%, transparent 100%), radial-gradient(ellipse 64% 72% at 20% 40%, oklch(0.78 0.08 40 / 0.70) 0%, transparent 100%), radial-gradient(ellipse 36% 40% at 10% 10%, oklch(0.65 0.20 30 / 0.35) 0%, transparent 100%)`,
  },
  {
    name: "Top-left anchor",
    token: "--gradient-card-tl",
    css: `radial-gradient(ellipse 110% 75% at 20% 25%, oklch(0.50 0.20 272 / 0.92) 0%, transparent 100%), radial-gradient(ellipse 64% 72% at 80% 60%, oklch(0.78 0.08 40 / 0.70) 0%, transparent 100%), radial-gradient(ellipse 36% 40% at 90% 90%, oklch(0.65 0.20 30 / 0.60) 0%, transparent 100%)`,
  },
  {
    name: "Top-right anchor",
    token: "--gradient-card-tr",
    css: `radial-gradient(ellipse 110% 75% at 80% 25%, oklch(0.50 0.20 272 / 0.92) 0%, transparent 100%), radial-gradient(ellipse 64% 72% at 20% 60%, oklch(0.78 0.08 40 / 0.70) 0%, transparent 100%), radial-gradient(ellipse 36% 40% at 10% 90%, oklch(0.65 0.20 30 / 0.60) 0%, transparent 100%)`,
  },
] as const;

export const MESH_VARIANTS_LIGHT = [
  {
    name: "Bottom-left anchor",
    token: "--gradient-card-bl-light",
    css: `radial-gradient(ellipse 110% 75% at 20% 75%, oklch(0.50 0.20 272 / 0.45) 0%, transparent 100%), radial-gradient(ellipse 64% 72% at 80% 40%, oklch(0.78 0.08 40 / 0.40) 0%, transparent 100%), radial-gradient(ellipse 36% 40% at 90% 10%, oklch(0.65 0.20 30 / 0.35) 0%, transparent 100%)`,
  },
  {
    name: "Bottom-right anchor",
    token: "--gradient-card-br-light",
    css: `radial-gradient(ellipse 110% 75% at 80% 75%, oklch(0.50 0.20 272 / 0.45) 0%, transparent 100%), radial-gradient(ellipse 64% 72% at 20% 40%, oklch(0.78 0.08 40 / 0.40) 0%, transparent 100%), radial-gradient(ellipse 36% 40% at 10% 10%, oklch(0.65 0.20 30 / 0.35) 0%, transparent 100%)`,
  },
  {
    name: "Top-left anchor",
    token: "--gradient-card-tl-light",
    css: `radial-gradient(ellipse 110% 75% at 20% 25%, oklch(0.50 0.20 272 / 0.45) 0%, transparent 100%), radial-gradient(ellipse 64% 72% at 80% 60%, oklch(0.78 0.08 40 / 0.40) 0%, transparent 100%), radial-gradient(ellipse 36% 40% at 90% 90%, oklch(0.65 0.20 30 / 0.35) 0%, transparent 100%)`,
  },
  {
    name: "Top-right anchor",
    token: "--gradient-card-tr-light",
    css: `radial-gradient(ellipse 110% 75% at 80% 25%, oklch(0.50 0.20 272 / 0.45) 0%, transparent 100%), radial-gradient(ellipse 64% 72% at 20% 60%, oklch(0.78 0.08 40 / 0.40) 0%, transparent 100%), radial-gradient(ellipse 36% 40% at 10% 90%, oklch(0.65 0.20 30 / 0.35) 0%, transparent 100%)`,
  },
] as const;

// ── Scale Tokens ─────────────────────────────────────────────

export const RADIUS_SCALE = [
  { label: "sm", css: "4px", value: "0.25rem", use: "Badges, small elements" },
  { label: "md", css: "6px", value: "0.375rem", use: "Buttons, inputs" },
  { label: "lg", css: "8px", value: "0.5rem", use: "Cards, large elements" },
  { label: "xl", css: "12px", value: "0.75rem", use: "Cards (rounded-xl)" },
  { label: "2xl", css: "16px", value: "1rem", use: "Modals, dialogs" },
  { label: "full", css: "9999px", value: "9999px", use: "Avatars, pills" },
] as const;

export const SHADOW_SCALE = [
  {
    label: "soft-sm",
    value: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
    use: "Default cards",
  },
  {
    label: "soft",
    value: "0 1px 3px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.08)",
    use: "Elevated elements",
  },
  {
    label: "soft-md",
    value: "0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)",
    use: "Modals, popovers",
  },
  {
    label: "soft-hover",
    value: "0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
    use: "Hover lift effect",
  },
] as const;

export const SPACING_SCALE = [
  { label: "1", value: "4px", use: "Icon + text" },
  { label: "2", value: "8px", use: "Related items" },
  { label: "3", value: "12px", use: "Form field groups" },
  { label: "4", value: "16px", use: "Section spacing" },
  { label: "6", value: "24px", use: "Major sections" },
  { label: "8", value: "32px", use: "Page sections" },
  { label: "12", value: "48px", use: "Large gaps" },
] as const;

export const HEADING_SCALE = [
  {
    label: "H1",
    size: "32px",
    weight: 700,
    tracking: "-0.02em",
    text: "Page Title",
    family: FONT.heading,
  },
  {
    label: "H2",
    size: "24px",
    weight: 600,
    tracking: "-0.01em",
    text: "Section Heading",
    family: FONT.heading,
  },
  {
    label: "H3",
    size: "18px",
    weight: 600,
    tracking: "normal",
    text: "Card Title",
    family: FONT.heading,
  },
  {
    label: "H4",
    size: "14px",
    weight: 600,
    tracking: "normal",
    text: "Subsection",
    family: FONT.body,
  },
  {
    label: "Body",
    size: "14px",
    weight: 400,
    tracking: "normal",
    text: "Body text set in Satoshi for comfortable reading at length.",
    family: FONT.body,
  },
  {
    label: "Caption",
    size: "12px",
    weight: 400,
    tracking: "normal",
    text: "Caption and helper text",
    family: FONT.body,
  },
  {
    label: "Mono",
    size: "13px",
    weight: 500,
    tracking: "0.02em",
    text: "$42,800 pipeline · 7 active · 3.2d avg",
    family: FONT.mono,
  },
] as const;
