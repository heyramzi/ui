// The one source of UpSys deck tokens. A slide reads `var(--deck-*)`, never a hex, so one
// `data-deck-theme` attribute flips the whole deck.

import { BRAND_HEX } from "#src/brand/index.js";

// =============================================================================
// THEMES
// =============================================================================

export type DeckTheme = "light" | "dark";

export const DECK_THEME_DEFAULT: DeckTheme = "light";

/**
 * The two palettes. Flat hex, not oklch: Chromium's print pipeline shifts oklch
 * on the way to PDF. Only the colours change between themes, never a size.
 */
export const DECK_THEMES = {
  light: {
    ground: "#FCFAF8",
    /** Every tile, the eyebrow pill and the image frame. */
    tile: "#F1EEEA",
    heading: "#000515",
    text: "#565E75",
    accent: "#414FD2",
    /** The one filled tile a slide may carry. */
    accentTile: "#414FD2",
    onAccent: "#FCFAF8",
  },
  dark: {
    ground: "#000515",
    tile: "#0B1428",
    heading: "#FCFAF8",
    text: "#9AA8C6",
    accent: "#B2C2F9",
    accentTile: "#414FD2",
    onAccent: "#FCFAF8",
  },
} as const satisfies Record<DeckTheme, Record<string, string>>;

export type DeckColorName = keyof (typeof DECK_THEMES)["light"];

// WHY: the slides package owns `--deck-accent` and `--deck-on-accent`, so the text and tile pair use their own names.
const VAR_NAMES: Record<DeckColorName, string> = {
  ground: "--deck-ground",
  tile: "--deck-tile",
  heading: "--deck-heading",
  text: "--deck-text",
  accent: "--deck-accent-text",
  accentTile: "--deck-accent-tile",
  onAccent: "--deck-accent-tile-text",
};

/** What a slide paints with: `style:color={DECK_VARS.heading}`. Resolves under the theme root. */
export const DECK_VARS = {
  ground: "var(--deck-ground)",
  tile: "var(--deck-tile)",
  heading: "var(--deck-heading)",
  text: "var(--deck-text)",
  accent: "var(--deck-accent-text)",
  accentTile: "var(--deck-accent-tile)",
  onAccent: "var(--deck-accent-tile-text)",
} as const satisfies Record<DeckColorName, string>;

/** The palette as an inline `style` string: `--deck-ground:#FCFAF8;...`. */
export function deckThemeStyle(theme: DeckTheme): string {
  const palette = DECK_THEMES[theme];
  return (Object.keys(VAR_NAMES) as DeckColorName[])
    .map((name) => `${VAR_NAMES[name]}:${palette[name]}`)
    .join(";");
}

/** A deck's theme from `presentations.metadata`. Anything but "dark" is light. */
export function resolveDeckTheme(
  metadata: { deckTheme?: string | null } | null | undefined,
): DeckTheme {
  return metadata?.deckTheme === "dark" ? "dark" : DECK_THEME_DEFAULT;
}

// =============================================================================
// GEOMETRY
// =============================================================================

/** Design pixels on a 960x540 slide. */
export const DECK_GEOMETRY = {
  /** Stat, price and tier tiles, the eyebrow pill's cousin chips. */
  tileRadius: 16,
  /** The image frame around a 3D tile or a screenshot. */
  frameRadius: 20,
  /** Left and right edge, and the footer's inset. */
  margin: 48,
  /** Between tiles and between columns. */
  gap: 16,
  columns: 12,
  /** The eyebrow pill's top edge, and the footer's distance from the bottom. */
  top: 40,
  bottom: 32,
  /** Space inside a tile. */
  tilePad: 24,
  /** Icons are Phosphor regular at this size, in the accent colour. */
  icon: 20,
} as const;

// =============================================================================
// TYPE
// =============================================================================

/**
 * Manrope at weight 500 in these four sizes and nothing else on a slide, with
 * hero kept for stat numbers only.
 */
export const DECK_SIZES = {
  hero: { size: 64, weight: 500, tracking: "-0.025em", leading: 1.2 },
  display: { size: 40, weight: 500, tracking: "-0.025em", leading: 1.1 },
  text: { size: 16, weight: 500, tracking: "0", leading: 1.45 },
  small: { size: 13, weight: 500, tracking: "0", leading: 1.4 },
} as const;

/**
 * The old ramp the sales and support layouts still set in. A rebuilt
 * layout moves to DECK_SIZES, and this goes with the last of them.
 */
const LEGACY_TYPE = {
  coverTitle: { size: 66, weight: 800, tracking: "-0.03em", leading: 1.02 },
  coverSub: { size: 20, weight: 600, tracking: "-0.02em", leading: 1.2 },
  statement: { size: 42, weight: 800, tracking: "-0.03em", leading: 1.05 },
  slideTitle: { size: 32, weight: 800, tracking: "-0.03em", leading: 1.05 },
  sayTitle: { size: 22, weight: 700, tracking: "-0.02em", leading: 1.2 },
  figure: { size: 35, weight: 800, tracking: "-0.04em", leading: 1 },
  price: { size: 40, weight: 800, tracking: "-0.04em", leading: 1 },
  claim: { size: 18, weight: 400, tracking: "0", leading: 1.45 },
  lede: { size: 17, weight: 400, tracking: "0", leading: 1.5 },
  body: { size: 14, weight: 400, tracking: "0", leading: 1.5 },
  caption: { size: 11, weight: 400, tracking: "0", leading: 1.45 },
  label: { size: 10, weight: 400, tracking: "0.08em", leading: 1.4 },
} as const;

/** Every token a layout may name: the four of the new design, then the legacy ones. */
export const DECK_TYPE = { ...DECK_SIZES, ...LEGACY_TYPE } as const;

export type DeckTypeToken = keyof typeof DECK_TYPE;
export type DeckSizeToken = keyof typeof DECK_SIZES;

export const DECK_FONTS = {
  heading: "Manrope, system-ui, sans-serif",
  body: "Satoshi, system-ui, sans-serif",
  mono: '"Space Grotesk", ui-monospace, monospace',
} as const;

/**
 * Inline style string for a type token, for `style={...}` on an element. The
 * four DECK_SIZES tokens are always Manrope, whatever `family` says.
 * `family` exists for the legacy layouts.
 */
export function deckType(token: DeckTypeToken, family: keyof typeof DECK_FONTS = "heading") {
  const t = DECK_TYPE[token];
  const face = token in DECK_SIZES ? DECK_FONTS.heading : DECK_FONTS[family];
  return [
    `font-family:${face}`,
    `font-size:${t.size}px`,
    `font-weight:${t.weight}`,
    `letter-spacing:${t.tracking}`,
    `line-height:${t.leading}`,
  ].join(";");
}

// =============================================================================
// LEGACY: sales, support and the standalone sheets
// =============================================================================

/**
 * The dark-only palette the old layouts and print sheets still read.
 * A rebuilt layout reads DECK_VARS and gets both themes.
 */
export const DECK_COLORS = {
  ink: BRAND_HEX.ink,
  night: BRAND_HEX.night,
  veil: BRAND_HEX.veil,
  dusk: "#0d1a32",
  cream: BRAND_HEX.cream,
  linen: BRAND_HEX.linen,
  indigo: BRAND_HEX.indigo,
  indigo200: "#b2c2f9",
  indigo100: "#dbe4ff",
  sand: BRAND_HEX.sand,
  terra: BRAND_HEX.terra,
  terra200: "#feac9e",
  moss: "#2f9f3d",
  dim: "#8fa0c0",
  dimmer: "#5d6d8c",
} as const;

/**
 * The cover lockup: the client's mark beside the UpSys logo. Design pixels on a
 * 960x540 slide.
 */
export const DECK_LOCKUP = {
  /** The tile under the client mark. Client logos ship on white, so the tile stays white in both themes. */
  clientTile: 96,
  clientPad: 14,
  clientRadius: 16,
  /** Wordmark height. The mark's own ratio makes the width 4.3x this. */
  agencyLogo: 30,
  /** Between the tile, the rule, and the wordmark. */
  gap: 26,
  /** The hairline that separates the two marks. */
  ruleHeight: 52,
} as const;

/**
 * Slide margins of the legacy layouts. Rebuilt layouts use
 * DECK_GEOMETRY and DeckFrame.
 */
export const DECK_SPACE = {
  gutter: 78,
  top: 53,
  bottom: 35,
  ruleWidth: 72,
  ruleHeight: 3,
} as const;

/** The UpSys wordmark's ink on a dark ground. The PDF sheets draw it. */
export const DECK_AGENCY_LOGO_FILL = "#F3F3F3";
