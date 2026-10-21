// Pen colours as CSS variables. pen.css gives each variable a light and a dark
// value, and a hex fallback keeps the node readable when that file isn't loaded.

import type { PenColor } from "#src/canvas/pen/types.js";

export const PEN_HEX: Record<PenColor, { light: string; dark: string }> = {
  ink: { light: "#1e1e1e", dark: "#e9ecef" },
  red: { light: "#e03131", dark: "#ff8787" },
  blue: { light: "#1971c2", dark: "#74c0fc" },
  green: { light: "#2f9e44", dark: "#69db7c" },
  amber: { light: "#e8a33d", dark: "#ffd43b" },
  violet: { light: "#6741d9", dark: "#b197fc" },
  // The brand pair the email lesson figures are drawn in (headless/sketch.ts PALETTE).
  indigo: { light: "#414fd2", dark: "#8b96ff" },
  terra: { light: "#f0503d", dark: "#ff8a78" },
};

export function penColorVar(color: string): string {
  const known = color in PEN_HEX ? (color as PenColor) : "ink";
  return `var(--pen-${known}, ${PEN_HEX[known].light})`;
}

/** The `:root` block pen.css carries, built from the table so the two can't drift. */
export function penCssTokens(mode: "light" | "dark"): string {
  return (Object.keys(PEN_HEX) as PenColor[])
    .map((name) => `--pen-${name}: ${PEN_HEX[name][mode]};`)
    .join(" ");
}
