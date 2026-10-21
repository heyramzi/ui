// Stroke geometry with no DOM and no xyflow, so it runs headless.

import type {
  PenColor,
  PenNodeInput,
  StrokeData,
  StrokePoint,
  StrokeSample,
} from "#src/canvas/pen/types.js";
import { PEN_DEFAULTS, STROKE_NODE } from "#src/canvas/pen/types.js";

export interface Pt {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How far, in screen pixels, a saved stroke may stray from what was drawn. */
const SIMPLIFY_TOLERANCE = 0.6;

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Distance from p to the segment a-b. */
export function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Ramer-Douglas-Peucker over x and y, run on an index stack so a long scribble
 * can't overflow the call stack. The first and last samples always stay.
 */
export function simplifyPoints<P extends StrokeSample>(
  points: readonly P[],
  tolerance: number,
): P[] {
  if (points.length <= 2) return [...points];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop() as [number, number];
    const a = { x: points[start][0], y: points[start][1] };
    const b = { x: points[end][0], y: points[end][1] };
    let farthest = -1;
    let farthestDistance = tolerance;
    for (let i = start + 1; i < end; i++) {
      const distance = distanceToSegment({ x: points[i][0], y: points[i][1] }, a, b);
      if (distance > farthestDistance) {
        farthest = i;
        farthestDistance = distance;
      }
    }
    if (farthest === -1) continue;
    keep[farthest] = 1;
    stack.push([start, farthest], [farthest, end]);
  }
  return points.filter((_, i) => keep[i] === 1);
}

export function pointsBounds(points: readonly StrokeSample[]): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export interface BuildStrokeOptions {
  color?: PenColor;
  size?: number;
  tool?: "pen" | "highlighter";
  /** Flow units per screen pixel is 1 / zoom, so a zoomed-out stroke keeps its detail. */
  zoom?: number;
  id?: string;
}

/** Points are saved relative to the node, padded by the brush so the selection box holds the whole outline. */
export function buildStrokeNode(
  samples: readonly StrokeSample[],
  options: BuildStrokeOptions = {},
): PenNodeInput<StrokeData> | null {
  if (samples.length === 0) return null;
  const tool = options.tool ?? "pen";
  const size = options.size ?? PEN_DEFAULTS[tool].size;
  const tolerance = SIMPLIFY_TOLERANCE / Math.max(options.zoom ?? 1, 0.1);
  // A tap is one sample. Doubling it gives the outline a segment, so it draws as a dot.
  const source = samples.length === 1 ? [samples[0], samples[0]] : samples;
  const simplified = simplifyPoints(source, tolerance);
  const hasPressure = simplified.some((point) => point[2] !== undefined);

  const pad = Math.ceil(size / 2) + 2;
  const box = pointsBounds(simplified);
  const origin = { x: box.x - pad, y: box.y - pad };
  const points: StrokePoint[] = simplified.map(([x, y, pressure]) => {
    const px = round(x - origin.x, 1);
    const py = round(y - origin.y, 1);
    return hasPressure ? [px, py, round(pressure ?? 0.5, 2)] : [px, py];
  });

  return {
    id: options.id,
    type: STROKE_NODE,
    position: { x: round(origin.x, 1), y: round(origin.y, 1) },
    data: {
      points,
      color: options.color ?? PEN_DEFAULTS.color,
      size,
      tool,
      simulatePressure: !hasPressure,
    },
    width: Math.ceil(box.width + pad * 2),
    height: Math.ceil(box.height + pad * 2),
  };
}

/** Smallest distance from p to the stroke's centre line, in the stroke's own coordinates. */
export function distanceToStroke(points: readonly StrokeSample[], p: Pt): number {
  if (points.length === 0) return Infinity;
  if (points.length === 1) return Math.hypot(p.x - points[0][0], p.y - points[0][1]);
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = { x: points[i - 1][0], y: points[i - 1][1] };
    const b = { x: points[i][0], y: points[i][1] };
    best = Math.min(best, distanceToSegment(p, a, b));
  }
  return best;
}
