import { migrate } from "../schema/migrate";
import { get as getUtil } from "../shapes/registry";
import { num } from "../shapes/svg";
import type { Box, Id, ShapeRecord, Snapshot } from "../types";

export type ExportOptions = {
  dark?: boolean;
  style?: "hand" | "clean";
  padding?: number;
  ids?: Id[];
};

/** The svg namespace every export carries, so the file stands alone. */
const XMLNS = "http://www.w3.org/2000/svg";

/** Shapes back to front. Index keys sort as strings, so a plain compare holds. */
function byIndex(a: ShapeRecord, b: ShapeRecord): number {
  if (a.index < b.index) return -1;
  if (a.index > b.index) return 1;
  return 0;
}

/** A shape's page bounds, or its plain box when its type never registered. */
function boundsOf(shape: ShapeRecord): Box {
  try {
    return getUtil(shape.type).bounds(shape);
  } catch {
    return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
  }
}

/** One shape's markup, or nothing when its type never registered. */
function svgOf(shape: ShapeRecord, dark: boolean, style: "hand" | "clean"): string {
  try {
    return getUtil(shape.type).toSvg(shape, { dark, style });
  } catch {
    return "";
  }
}

/** A snapshot as a standalone SVG string with no browser, migrated first so old files export like fresh ones; a node shape keeps a labeled placeholder box. */
export function exportSvg(snapshot: Snapshot, opts: ExportOptions = {}): string {
  const data = migrate(snapshot);
  const dark = opts.dark ?? false;
  const style = opts.style ?? "hand";
  const padding = opts.padding ?? 32;
  const only = opts.ids ? new Set(opts.ids) : null;

  const shapes = Object.values(data.shapes)
    .filter((shape) => !only || only.has(shape.id))
    .sort(byIndex);
  const parts = shapes.map((shape) => svgOf(shape, dark, style)).filter((part) => part.length > 0);

  if (shapes.length === 0) {
    return `<svg xmlns="${XMLNS}" viewBox="0 0 0 0" width="0" height="0"></svg>`;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const shape of shapes) {
    const box = boundsOf(shape);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.w);
    maxY = Math.max(maxY, box.y + box.h);
  }
  const x = minX - padding;
  const y = minY - padding;
  const w = maxX - minX + padding * 2;
  const h = maxY - minY + padding * 2;

  return (
    `<svg xmlns="${XMLNS}" viewBox="${num(x)} ${num(y)} ${num(w)} ${num(h)}" ` +
    `width="${num(w)}" height="${num(h)}">${parts.join("")}</svg>`
  );
}
