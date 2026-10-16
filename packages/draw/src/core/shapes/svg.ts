import type { ShapeRecord, Vec } from "../types";
import { boxCenter } from "../math/box";

/** Trim a number to two decimals so the SVG stays short and stable. */
export function num(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value * 100) / 100);
}

/** Escape the five characters that would break an XML attribute or text node. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** The rotation transform around the shape's centre, or nothing when it is straight. */
export function rotationTransform(shape: ShapeRecord): string {
  if (!shape.rotation) return "";
  const center = boxCenter(shape);
  const degrees = (shape.rotation * 180) / Math.PI;
  return ` transform="rotate(${num(degrees)} ${num(center.x)} ${num(center.y)})"`;
}

/** Wrap rendered markup in a rotation group. */
export function wrapSvg(shape: ShapeRecord, inner: string): string {
  const transform = rotationTransform(shape);
  return transform ? `<g${transform}>${inner}</g>` : inner;
}

/** A path element from an SVG `d` string. */
export function pathEl(
  d: string,
  stroke: string,
  fill: string,
  strokeWidth: number
): string {
  return `<path d="${d}" stroke="${stroke}" fill="${fill}" stroke-width="${num(
    strokeWidth
  )}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/** An open polyline as an SVG `d` string. */
export function polylineToPath(points: Vec[]): string {
  if (points.length === 0) return "";
  return points
    .map((point, i) => `${i === 0 ? "M" : "L"} ${num(point.x)} ${num(point.y)}`)
    .join(" ");
}

/**
 * Turn a perfect-freehand outline into a smooth closed path. Surround each point with
 * quadratics through the midpoints, the recipe from perfect-freehand's own docs.
 */
export function strokeOutlineToPath(outline: number[][]): string {
  if (outline.length < 2) return "";
  const d: (string | number)[] = ["M", outline[0][0], outline[0][1], "Q"];
  for (let i = 0; i < outline.length; i += 1) {
    const current = outline[i];
    const next = outline[(i + 1) % outline.length];
    d.push(current[0], current[1], (current[0] + next[0]) / 2, (current[1] + next[1]) / 2);
  }
  d.push("Z");
  return d.join(" ");
}
