/**
 * A brand replaces only the token roles it names. Put `brandStyle(brand)` on the server's
 * `<html style>`, or the first paint shows the neutral look.
 */

/** Any CSS colour: oklch(), hex, a named colour or a var(). */
export type CssColor = string;

export type BrandColors = {
  /** The signature colour: focus ring, links, active states, the mark. */
  brand: CssColor;
  /** The same colour lifted for a dark page. Falls back to the neutral default. */
  brandOnDark?: CssColor;
  /** Warmth: badges, highlights, soft accents. */
  highlight?: CssColor;
  /** Attention: warnings, errors, energy. */
  signal?: CssColor;
  /** The dark page background. */
  ink?: CssColor;
  /** Cards and panels on a dark page. */
  surface?: CssColor;
  /** Borders and dividers on a dark page. */
  line?: CssColor;
  /** Hover surfaces and inputs on a dark page. */
  raised?: CssColor;
  /** Text on a dark page, and a light page's background tone. */
  paper?: CssColor;
  /** Cards on a light page. */
  surfaceLight?: CssColor;
  /** Borders on a light page. */
  lineLight?: CssColor;
};

export type BrandFonts = {
  /** The body family, as CSS: `"Satoshi", system-ui, sans-serif`. */
  sans?: string;
  /** Headings. Falls back to the body family. */
  heading?: string;
  /** Code and figures. */
  mono?: string;
  /** Quotes. Falls back to the mono family. */
  quote?: string;
};

export type Brand = {
  colors: BrandColors;
  fonts?: BrandFonts;
  /** Extra custom properties the brand owns, such as a logo size. Each key starts with `--`. */
  vars?: Record<`--${string}`, string>;
};

const COLOR_VARS = {
  brand: "--brand",
  brandOnDark: "--brand-on-dark",
  highlight: "--brand-highlight",
  signal: "--brand-signal",
  ink: "--brand-ink",
  surface: "--brand-surface",
  line: "--brand-line",
  raised: "--brand-raised",
  paper: "--brand-paper",
  surfaceLight: "--brand-surface-light",
  lineLight: "--brand-line-light",
} as const satisfies Record<keyof BrandColors, string>;

const FONT_VARS = {
  sans: "--font-sans",
  heading: "--font-heading",
  mono: "--font-mono",
  quote: "--font-quote",
} as const satisfies Record<keyof BrandFonts, string>;

/** The custom property each colour role sets. The tokens read these and nothing else. */
export const BRAND_COLOR_VARS: Readonly<Record<keyof BrandColors, string>> = COLOR_VARS;

/** Keeps a typed brand typed at the call site. It returns the object unchanged. */
export function defineBrand<const B extends Brand>(brand: B): B {
  return brand;
}

function checked(name: string, value: string): string {
  if (/[;{}<>]/.test(value))
    throw new Error(`brand: ${name} holds a character CSS would read as more than a value`);
  return value;
}

/** The custom properties a brand sets, by name. Roles the brand leaves out keep the neutral default. */
export function brandVars(brand: Brand): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, name] of Object.entries(COLOR_VARS)) {
    const value = brand.colors[key as keyof BrandColors];
    if (value !== undefined) out[name] = checked(name, value);
  }
  for (const [key, name] of Object.entries(FONT_VARS)) {
    const value = brand.fonts?.[key as keyof BrandFonts];
    if (value !== undefined) out[name] = checked(name, value);
  }
  for (const [name, value] of Object.entries(brand.vars ?? {})) out[name] = checked(name, value);
  return out;
}

/** The brand as a `style` attribute value: put it on `<html>` in `app.html` or a layout. */
export function brandStyle(brand: Brand): string {
  return Object.entries(brandVars(brand))
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
}

/** The brand as a rule, for a stylesheet or a `<style>` in `<svelte:head>`. */
export function brandCss(brand: Brand, selector = ":root"): string {
  const body = Object.entries(brandVars(brand))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}\n`;
}

/** Sets the brand on the page in the browser. Returns a function that puts the neutral look back. */
export function applyBrand(brand: Brand, root: HTMLElement = document.documentElement): () => void {
  const vars = brandVars(brand);
  const before = new Map<string, string>();
  for (const [name, value] of Object.entries(vars)) {
    before.set(name, root.style.getPropertyValue(name));
    root.style.setProperty(name, value);
  }
  return () => {
    for (const [name, value] of before) {
      if (value) root.style.setProperty(name, value);
      else root.style.removeProperty(name);
    }
  };
}
