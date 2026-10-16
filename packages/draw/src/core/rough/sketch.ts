// Hand-drawn layer, server-safe: palette, geometry, seeding. The seed comes from
// the shape id, so a server render and the client draw the same wobble.

import rough from "roughjs";
import type { Options } from "roughjs/bin/core";

// =========================
// PALETTE
// =========================

/** The accents a shape ships with. An app can add its own with registerAccent. */
export const SKETCH_ACCENTS = ["ink", "red", "green", "blue", "violet", "amber", "teal"] as const;

/** An accent name: one of the built-ins, or anything an app registered. */
export type SketchAccent = string;

export type SketchColors = {
  /** The rough stroke around a card, and the rule under a title. */
  stroke: string;
  /** The card's wash. Light enough that body text stays black on it. */
  fill: string;
  /** Section headings and card titles. */
  heading: string;
  /** Body lines inside a card. Never pure black: it reads as printed, not drawn. */
  body: string;
};

/** A whiteboard palette: a strong stroke per hue, its lightest wash, and text
 *  colors that stay readable on it. */
const PALETTE: Record<string, SketchColors> = {
  ink: { stroke: "#1e1e1e", fill: "#ffffff", heading: "#1e1e1e", body: "#343a40" },
  red: { stroke: "#c92a2a", fill: "#fff5f5", heading: "#a61e4d", body: "#3b3b46" },
  green: { stroke: "#2f9e44", fill: "#f4fce3", heading: "#2b8a3e", body: "#3b3b46" },
  blue: { stroke: "#1971c2", fill: "#e7f5ff", heading: "#1864ab", body: "#3b3b46" },
  violet: { stroke: "#6741d9", fill: "#f3f0ff", heading: "#5f3dc4", body: "#3b3b46" },
  amber: { stroke: "#e8a33d", fill: "#fff9db", heading: "#b8860b", body: "#3b3b46" },
  teal: { stroke: "#0c8599", fill: "#e3fafc", heading: "#0b7285", body: "#3b3b46" },
};

/** The same hues lifted for a dark board: light strokes, a dark wash, and text
 *  that stays readable on it. */
const DARK_PALETTE: Record<string, SketchColors> = {
  ink: { stroke: "#e9ecef", fill: "#151b30", heading: "#f1f3f5", body: "#ced4da" },
  red: { stroke: "#ff8787", fill: "#2a1822", heading: "#ffa8c5", body: "#ced4da" },
  green: { stroke: "#69db7c", fill: "#132a20", heading: "#8ce99a", body: "#ced4da" },
  blue: { stroke: "#74c0fc", fill: "#12253d", heading: "#a5d8ff", body: "#ced4da" },
  violet: { stroke: "#b197fc", fill: "#211c3d", heading: "#d0bfff", body: "#ced4da" },
  amber: { stroke: "#ffd43b", fill: "#2b2612", heading: "#ffe066", body: "#ced4da" },
  teal: { stroke: "#66d9e8", fill: "#112a30", heading: "#99e9f2", body: "#ced4da" },
};

/** Add an accent. `light` paints the default board and `dark` the dark one;
 *  leave `dark` off to use `light` for both. */
export function registerAccent(
  name: string,
  light: SketchColors,
  dark: SketchColors = light,
): void {
  PALETTE[name] = { ...light };
  DARK_PALETTE[name] = { ...dark };
}

/** The colors for an accent. An unknown name falls back to ink. A server render
 *  uses the light palette; the editor passes its theme. */
export function sketchColors(accent: SketchAccent | undefined, dark = false): SketchColors {
  const palette = dark ? DARK_PALETTE : PALETTE;
  return palette[accent ?? "ink"] ?? palette.ink;
}

export function isSketchAccent(value: unknown): value is SketchAccent {
  return typeof value === "string" && value in PALETTE;
}

// =========================
// SEEDING
// =========================

/** A stable 31-bit seed (FNV-1a): unseeded calls reshuffle the wobble, so a card
 *  would redraw on every render. */
export function seedFrom(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 2147483647;
}

// =========================
// GEOMETRY
// =========================

export type SketchPath = { d: string; stroke: string; fill: string; strokeWidth: number };

const generator = rough.generator();

/** Shared feel. Low roughness reads as a careful hand; high reads as a scribble. */
function baseOptions(seed: number, colors: SketchColors, overrides?: Options): Options {
  return {
    seed,
    roughness: 1.1,
    bowing: 1.4,
    stroke: colors.stroke,
    strokeWidth: 1.6,
    // WHY solid, not hachure: a hatched fill behind three lines of body copy
    // makes the text unreadable at the zoom a card is actually read at.
    fillStyle: "solid",
    ...overrides,
  };
}

/** Every shape has two skins: drawn (the default here) or formal, the same
 *  outline with the hand taken out. */
export type SketchStyle = { formal?: boolean };
const FORMAL: Options = { roughness: 0, bowing: 0, disableMultiStroke: true, strokeWidth: 1.4 };

function toPaths(drawable: ReturnType<typeof generator.rectangle>): SketchPath[] {
  return generator.toPaths(drawable).map((p) => ({
    d: p.d,
    stroke: p.stroke,
    // An unfilled path comes back without a fill, and an unfilled path is the
    // same thing as one filled with nothing.
    fill: p.fill ?? "none",
    strokeWidth: p.strokeWidth,
  }));
}

/** The seed and colors every rough shape draws with. */
export type SketchPen = { seed: number; colors: SketchColors };

/** A card outline drawn as a rounded path, since a plain rectangle has corners
 *  that read as a box. */
export function roughCard(
  width: number,
  height: number,
  { seed, colors }: SketchPen,
  { radius = 14, formal = false }: SketchStyle & { radius?: number } = {},
): SketchPath[] {
  const w = Math.max(width, radius * 2 + 2);
  const h = Math.max(height, radius * 2 + 2);
  const r = Math.min(radius, w / 2 - 1, h / 2 - 1);
  const d = [
    `M ${r} 0`,
    `L ${w - r} 0`,
    `Q ${w} 0 ${w} ${r}`,
    `L ${w} ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `L ${r} ${h}`,
    `Q 0 ${h} 0 ${h - r}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0`,
    "Z",
  ].join(" ");
  return toPaths(
    generator.path(d, baseOptions(seed, colors, { fill: colors.fill, ...(formal ? FORMAL : {}) })),
  );
}

/** An ellipse card is drawn round its text, not through it: this much wider and
 *  taller than the box. */
export const ELLIPSE_CARD_SCALE = { x: 1.32, y: 1.42 };

/** The circle-this-bit annotation, drawn as one loose pass. */
export function roughEllipse(
  width: number,
  height: number,
  { seed, colors }: SketchPen,
  { formal = false }: SketchStyle = {},
): SketchPath[] {
  return toPaths(
    generator.ellipse(
      width / 2,
      height / 2,
      width,
      height,
      baseOptions(seed, colors, {
        roughness: 1.6,
        strokeWidth: 2.2,
        fill: undefined,
        ...(formal ? FORMAL : {}),
      }),
    ),
  );
}

/** A box with no rounding: the frame you draw around a whole column. */
export function roughRect(
  width: number,
  height: number,
  { seed, colors }: SketchPen,
  { filled = false, formal = false }: SketchStyle & { filled?: boolean } = {},
): SketchPath[] {
  return toPaths(
    generator.rectangle(
      1,
      1,
      Math.max(width - 2, 2),
      Math.max(height - 2, 2),
      baseOptions(seed, colors, {
        fill: filled ? colors.fill : undefined,
        ...(formal ? FORMAL : {}),
      }),
    ),
  );
}

/** The hand-drawn rule under a title, `y` down from the top. */
export function roughUnderline(
  width: number,
  { seed, colors }: SketchPen,
  { y = 4, formal = false }: SketchStyle & { y?: number } = {},
): SketchPath[] {
  return toPaths(
    generator.line(
      0,
      y,
      width,
      y,
      baseOptions(seed, colors, { strokeWidth: 2, bowing: 2.4, ...(formal ? FORMAL : {}) }),
    ),
  );
}

/** A straight-ish connector between two points, plus its arrow head. */
export function roughArrow(
  from: { x: number; y: number },
  to: { x: number; y: number },
  { seed, colors }: SketchPen,
  { formal = false }: SketchStyle = {},
): SketchPath[] {
  const hand = formal ? FORMAL : {};
  const shaft = toPaths(
    generator.line(
      from.x,
      from.y,
      to.x,
      to.y,
      baseOptions(seed, colors, { strokeWidth: 1.8, ...hand }),
    ),
  );
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const head = 11;
  const spread = 0.42;
  const wings = [angle + Math.PI - spread, angle + Math.PI + spread].map((a, i) =>
    generator.line(
      to.x,
      to.y,
      to.x + Math.cos(a) * head,
      to.y + Math.sin(a) * head,
      baseOptions(seed + i + 1, colors, { strokeWidth: 1.8, roughness: 0.8, ...hand }),
    ),
  );
  return [...shaft, ...wings.flatMap(toPaths)];
}
