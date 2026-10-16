// The one source of UpSys deck tokens. The app's Svelte layouts and the
// standalone proposal deck both read these, so the two cannot drift.

import { BRAND_HEX } from "#src/brand/index.js";

// Flat hex, not oklch: Chromium's print pipeline shifts oklch on the way to PDF.
// A colour the brand palette already holds comes from BRAND_HEX, never a second literal.
export const DECK_COLORS = {
  /** Page ground for every slide except the cover and the close. */
  ink: BRAND_HEX.ink,
  /** The cover and the close sit a step lighter so the deck bookends. */
  night: BRAND_HEX.night,
  /** Hairlines and the rules under a section. */
  veil: BRAND_HEX.veil,
  /** Row separators, quieter than veil. */
  dusk: "#0d1a32",
  /** Body text on ink. */
  cream: BRAND_HEX.cream,
  /** Headlines and anything that has to read first. */
  linen: BRAND_HEX.linen,
  indigo: BRAND_HEX.indigo,
  /** Links and the sub-line under a cover title. */
  indigo200: "#b2c2f9",
  /** Lede paragraphs and the say column beside a screenshot. */
  indigo100: "#dbe4ff",
  /** Prices, and the heading of the left column in a two-column slide. */
  sand: BRAND_HEX.sand,
  /** The accent rule. One per slide, never decoration. */
  terra: BRAND_HEX.terra,
  terra200: "#feac9e",
  /** The positive green, from `--success-600`, within 0.3 of terra's contrast on ink. */
  moss: "#2f9f3d",
  /** Captions. */
  dim: "#8fa0c0",
  /** Source lines, the smallest type on any slide. */
  dimmer: "#5d6d8c",
} as const;

/**
 * The type ramp, in design pixels on a 960x540 slide. The standalone deck uses
 * these times 5/3. Keep the ratios; don't invent a size.
 */
export const DECK_TYPE = {
  coverTitle: { size: 66, weight: 800, tracking: "-0.03em", leading: 1.02 },
  coverSub: { size: 20, weight: 600, tracking: "-0.02em", leading: 1.2 },
  statement: { size: 42, weight: 800, tracking: "-0.03em", leading: 1.05 },
  slideTitle: { size: 32, weight: 800, tracking: "-0.03em", leading: 1.05 },
  sayTitle: { size: 22, weight: 700, tracking: "-0.02em", leading: 1.2 },
  figure: { size: 35, weight: 800, tracking: "-0.04em", leading: 1 },
  price: { size: 40, weight: 800, tracking: "-0.04em", leading: 1 },
  /** One sentence that is the slide. `body` stays at 14 because narrow boxes are measured against it. */
  claim: { size: 18, weight: 400, tracking: "0", leading: 1.45 },
  lede: { size: 17, weight: 400, tracking: "0", leading: 1.5 },
  body: { size: 14, weight: 400, tracking: "0", leading: 1.5 },
  caption: { size: 11, weight: 400, tracking: "0", leading: 1.45 },
  label: { size: 10, weight: 400, tracking: "0.08em", leading: 1.4 },
} as const;

export type DeckTypeToken = keyof typeof DECK_TYPE;

/**
 * The cover lockup: the client's mark beside the UpSys logo. Design pixels on a
 * 960x540 slide.
 */
export const DECK_LOCKUP = {
  /** The tile under the client mark. Client logos ship on white; night eats them. */
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
 * Slide margins in design pixels on a 960x540 slide. One gutter for every
 * slide, so headlines sit on the same vertical line across the deck.
 */
export const DECK_SPACE = {
  gutter: 78,
  top: 53,
  bottom: 35,
  /** The accent rule above a slide title. One per slide, never decoration. */
  ruleWidth: 72,
  ruleHeight: 3,
} as const;

/** The UpSys wordmark's ink on the cover ground. The in-app cover and the PDF both draw it. */
export const DECK_AGENCY_LOGO_FILL = "#F3F3F3";

export const DECK_FONTS = {
  heading: "Manrope, system-ui, sans-serif",
  body: "Satoshi, system-ui, sans-serif",
  mono: '"Space Grotesk", ui-monospace, monospace',
} as const;

/** Inline style string for a type token, for `style={...}` on an element. */
export function deckType(token: DeckTypeToken, family: keyof typeof DECK_FONTS) {
  const t = DECK_TYPE[token];
  return [
    `font-family:${DECK_FONTS[family]}`,
    `font-size:${t.size}px`,
    `font-weight:${t.weight}`,
    `letter-spacing:${t.tracking}`,
    `line-height:${t.leading}`,
  ].join(";");
}
