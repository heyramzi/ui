// Break apart, the look: which sketch accent or pen colour a drawn colour maps to, and how big a note sets.

import { SKETCH_ACCENTS, sketchColors } from "#src/canvas/headless/sketch.js";
import { PEN_HEX } from "#src/canvas/pen/colors.js";
import type { PenColor } from "#src/canvas/pen/types.js";
import type { Found } from "#src/canvas/headless/break-apart-find.js";

/** A note's type and spacing in px (sketch-note.svelte), for estimating how tall a card sets. */
export const NOTE_TITLE_PX = 19;
export const NOTE_BODY_PX = 15;
const NOTE_TITLE_LINE = 26;
const NOTE_BODY_LINE = 21.75;
const NOTE_PAD_X = 40;
const NOTE_PAD_Y = 32;
const NOTE_GAP = 10;
/** Average glyph width as a share of the type size. */
const NOTE_GLYPH = 0.55;
const NOTE_GLYPH_CAPS = 0.7;
/** Aim a little under the drawn height, since the estimate wraps by character count. */
const FIT_MARGIN = 0.92;

function channels(hex: string | undefined): [number, number, number] | null {
  const m = hex?.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!m) return null;
  const full = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** The sketch accent nearest the rect's stroke. A grey or an unknown colour reads as ink, the default. */
export function accentOf(stroke: string | undefined): string | undefined {
  const rgb = channels(stroke);
  if (!rgb) return undefined;
  const spread = Math.max(...rgb) - Math.min(...rgb);
  if (spread < 40) return undefined;
  let best: { name: string; distance: number } | null = null;
  for (const name of SKETCH_ACCENTS) {
    const target = channels(sketchColors(name).stroke);
    if (!target) continue;
    const distance = Math.hypot(...rgb.map((v, i) => v - target[i]));
    if (!best || distance < best.distance) best = { name, distance };
  }
  return best && best.name !== "ink" && best.distance < 90 ? best.name : undefined;
}

/** Card text is markdown: a stray `*` or a leading `-` would turn into formatting. */
export function escapeMarkdown(line: string): string {
  return line.replace(/([\\`*_~[\]])/g, "\\$1").replace(/^([#>+-]|\d+\.)/, "\\$1");
}

function hueOf([r, g, b]: [number, number, number]): number {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** The pen colour whose hue is nearest, or undefined for a grey, a white or a black. */
export function penColorOf(color: string | undefined): PenColor | undefined {
  const rgb = channels(color);
  if (!rgb || Math.max(...rgb) - Math.min(...rgb) < 40) return undefined;
  const hue = hueOf(rgb);
  let best: { name: PenColor; gap: number } | null = null;
  for (const name of Object.keys(PEN_HEX) as PenColor[]) {
    const target = channels(PEN_HEX[name].light);
    if (!target || name === "ink") continue;
    const diff = Math.abs(hue - hueOf(target));
    const gap = Math.min(diff, 360 - diff);
    if (!best || gap < best.gap) best = { name, gap };
  }
  return best?.name;
}

/** A solid colour, not white or paper. */
export function inked(color: string | undefined): boolean {
  const rgb = channels(color);
  return Boolean(rgb) && Math.min(...(rgb as number[])) < 240;
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** The share a note shows at: its title at the drawn size, or smaller until the copy fits the drawn box. */
export function fitScale(card: Found, matched: number, boxW: number, boxH: number): number {
  // Capitals run wide, and a word wider than the card breaks mid-word, so that counts as too tall.
  const glyph = (text: string) => (text === text.toUpperCase() ? NOTE_GLYPH_CAPS : NOTE_GLYPH);
  const lines = (text: string, px: number, inner: number) => {
    const widest = Math.max(...text.split(/\s+/).map((w) => w.length)) * px * glyph(text);
    if (widest > inner) return 99;
    return Math.max(1, Math.ceil((text.length * px * glyph(text)) / inner));
  };
  const heightAt = (z: number) => {
    const inner = Math.max(boxW / z - NOTE_PAD_X, 40);
    const title = lines([card.kicker, card.title].filter(Boolean).join(" "), NOTE_TITLE_PX, inner);
    const body = card.body.reduce((n, line) => n + lines(line, NOTE_BODY_PX, inner), 0);
    return (
      (NOTE_PAD_Y + title * NOTE_TITLE_LINE + (body ? NOTE_GAP + body * NOTE_BODY_LINE : 0)) * z
    );
  };
  let z = matched;
  for (let i = 0; i < 16 && z > 0.2 && heightAt(z) > boxH * FIT_MARGIN; i += 1) z *= 0.92;
  return Math.round(z * 1000) / 1000;
}
