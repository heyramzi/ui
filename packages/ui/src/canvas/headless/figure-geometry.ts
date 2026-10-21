// A drawn figure as numbers: its parsed SVG tree and the box each element takes up.

/** One SVG element. Text between tags is a plain string child. */
export type FigureEl = { tag: string; attrs: Record<string, string>; children: FigureChild[] };
export type FigureChild = FigureEl | string;

export type Box = { x1: number; y1: number; x2: number; y2: number };
export type Pt = { x: number; y: number };

const FALLBACK_FONT = 16;
const ORIGIN: Pt = { x: 0, y: 0 };

export function isEl(child: FigureChild): child is FigureEl {
  return typeof child !== "string";
}

export function num(value: string | undefined, fallback = 0): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** A paint that draws: set, and not `none`. */
export function solid(value: string | undefined): boolean {
  return Boolean(value) && value !== "none";
}

export function plus(a: Pt, b: Pt): Pt {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** `translate(a b)` and nothing else. Any other transform makes the geometry unreadable: null. */
export function translateOf(el: FigureEl): Pt | null {
  const raw = el.attrs.transform?.trim();
  if (!raw) return { x: 0, y: 0 };
  const match = raw.match(/^translate\(\s*(-?[\d.]+)[\s,]*(-?[\d.]+)?\s*\)$/);
  return match ? { x: Number(match[1]), y: Number(match[2] ?? 0) } : null;
}

export function union(a: Box | null, b: Box | null): Box | null {
  if (!a) return b;
  if (!b) return a;
  return {
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
    x2: Math.max(a.x2, b.x2),
    y2: Math.max(a.y2, b.y2),
  };
}

export function boxOf(points: Pt[]): Box | null {
  if (points.length === 0) return null;
  return {
    x1: Math.min(...points.map((p) => p.x)),
    y1: Math.min(...points.map((p) => p.y)),
    x2: Math.max(...points.map((p) => p.x)),
    y2: Math.max(...points.map((p) => p.y)),
  };
}

export function within(inner: Box, outer: Box, tolerance = 1): boolean {
  return (
    inner.x1 >= outer.x1 - tolerance &&
    inner.y1 >= outer.y1 - tolerance &&
    inner.x2 <= outer.x2 + tolerance &&
    inner.y2 <= outer.y2 + tolerance
  );
}

export function contains(box: Box, point: Pt, tolerance: number): boolean {
  return (
    point.x >= box.x1 - tolerance &&
    point.x <= box.x2 + tolerance &&
    point.y >= box.y1 - tolerance &&
    point.y <= box.y2 + tolerance
  );
}

export const areaOf = (b: Box) => (b.x2 - b.x1) * (b.y2 - b.y1);
export const centerOf = (b: Box): Pt => ({ x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 });

export function distanceToBox(box: Box, p: Pt): number {
  return Math.hypot(
    Math.max(box.x1 - p.x, 0, p.x - box.x2),
    Math.max(box.y1 - p.y, 0, p.y - box.y2),
  );
}

export function distanceToSegment(a: Pt, b: Pt, p: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// Numbers per path command; the last two (or the one for H and V) are the end point.
const PATH_ARITY: Record<string, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

/** Where one command ends, given its arguments and where the pen was. */
function pathEnd(upper: string, rel: boolean, args: number[], cur: Pt): Pt {
  const at = (from: number, value: number) => (rel ? from + value : value);
  if (upper === "H") return { x: at(cur.x, args[0]), y: cur.y };
  if (upper === "V") return { x: cur.x, y: at(cur.y, args[0]) };
  return { x: at(cur.x, args[args.length - 2]), y: at(cur.y, args[args.length - 1]) };
}

/** The vertices a path passes through. Curve control points are skipped: the ends bound it well enough. */
export function pathPoints(d: string): Pt[] {
  const out: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  let start: Pt = { x: 0, y: 0 };
  for (const part of d.matchAll(/([a-zA-Z])([^a-zA-Z]*)/g)) {
    const cmd = part[1];
    const upper = cmd.toUpperCase();
    const size = PATH_ARITY[upper];
    if (size === undefined) continue;
    const nums = (part[2].match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []).map(Number);
    if (upper === "Z") {
      cur = start;
      out.push(cur);
      continue;
    }
    for (let i = 0; i + size <= nums.length; i += size) {
      cur = pathEnd(upper, cmd !== upper, nums.slice(i, i + size), cur);
      if (upper === "M" && i === 0) start = cur;
      out.push(cur);
    }
  }
  return out;
}

export function pointList(raw: string | undefined): Pt[] {
  const nums = (raw ?? "").match(/-?(?:\d+\.?\d*|\.\d+)/g)?.map(Number) ?? [];
  const out: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push({ x: nums[i], y: nums[i + 1] });
  return out;
}

export function textLines(el: FigureEl): string[] {
  const lines: string[] = [];
  let line = "";
  const flush = () => {
    const clean = line.replace(/\s+/g, " ").trim();
    if (clean) lines.push(clean);
    line = "";
  };
  for (const child of el.children) {
    if (typeof child === "string") line += child;
    else if (child.tag === "tspan") {
      if ("dy" in child.attrs || "y" in child.attrs) flush();
      line += child.children.map((c) => (typeof c === "string" ? c : "")).join("");
    }
  }
  flush();
  return lines;
}

export function isBold(el: FigureEl): boolean {
  const weight = el.attrs["font-weight"];
  return num(weight) >= 600 || weight === "bold";
}

export function fontSize(el: FigureEl): number {
  return num(el.attrs["font-size"], FALLBACK_FONT);
}

function rectBox({ attrs: a }: FigureEl): Box {
  return { x1: num(a.x), y1: num(a.y), x2: num(a.x) + num(a.width), y2: num(a.y) + num(a.height) };
}

function ellipseBox({ attrs: a }: FigureEl): Box {
  const rx = num(a.rx, num(a.r));
  const ry = num(a.ry, num(a.r));
  return { x1: num(a.cx) - rx, y1: num(a.cy) - ry, x2: num(a.cx) + rx, y2: num(a.cy) + ry };
}

function lineBox({ attrs: a }: FigureEl): Box | null {
  return boxOf([
    { x: num(a.x1), y: num(a.y1) },
    { x: num(a.x2), y: num(a.y2) },
  ]);
}

function polyBox({ attrs: a }: FigureEl): Box | null {
  return boxOf(pointList(a.points));
}

function pathBox({ attrs: a }: FigureEl): Box | null {
  return boxOf(pathPoints(a.d ?? ""));
}

function textLeft(x: number, width: number, anchor: string | undefined): number {
  if (anchor === "middle") return x - width / 2;
  return anchor === "end" ? x - width : x;
}

function textBox(el: FigureEl): Box {
  const lines = textLines(el);
  const size = fontSize(el);
  const width = Math.max(0, ...lines.map((l) => l.length)) * size * (isBold(el) ? 0.6 : 0.55);
  const left = textLeft(num(el.attrs.x), width, el.attrs["text-anchor"]);
  const y = num(el.attrs.y);
  return {
    x1: left,
    y1: y - size * 0.8,
    x2: left + width,
    y2: y + size * 0.2 + Math.max(0, lines.length - 1) * size * 1.2,
  };
}

function groupBox(el: FigureEl): Box | null {
  let box: Box | null = null;
  for (const child of el.children) {
    if (isEl(child)) box = union(box, boxOfEl(child, ORIGIN));
  }
  return box;
}

const MEASURE = new Map<string, (el: FigureEl) => Box | null>([
  ["rect", rectBox],
  ["circle", ellipseBox],
  ["ellipse", ellipseBox],
  ["line", lineBox],
  ["polyline", polyBox],
  ["polygon", polyBox],
  ["path", pathBox],
  ["text", textBox],
  ["g", groupBox],
  ["svg", groupBox],
]);

/** The ink a shape takes, in the figure's own units. Text is estimated: no DOM here to measure it. */
export function boxOfEl(el: FigureEl, offset: Pt): Box | null {
  const box = MEASURE.get(el.tag)?.(el);
  if (!box) return null;
  const at = plus(offset, translateOf(el) ?? ORIGIN);
  return { x1: box.x1 + at.x, y1: box.y1 + at.y, x2: box.x2 + at.x, y2: box.y2 + at.y };
}

export function visible(el: FigureEl): boolean {
  const fill = el.attrs.fill;
  const stroke = el.attrs.stroke;
  return (fill !== undefined && fill !== "none") || (stroke !== undefined && stroke !== "none");
}

export function viewBoxOf(root: FigureEl): Box | null {
  const raw = root.attrs.viewBox ?? root.attrs.viewbox;
  if (raw) {
    const [x, y, w, h] = raw
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (w > 0 && h > 0) return { x1: x, y1: y, x2: x + w, y2: y + h };
  }
  const w = num(root.attrs.width);
  const h = num(root.attrs.height);
  return w > 0 && h > 0 ? { x1: 0, y1: 0, x2: w, y2: h } : null;
}

export function hasText(el: FigureEl): boolean {
  return el.tag === "text" && textLines(el).length > 0;
}

/** Where a line, polyline or path starts and stops, on the figure. Null for one with a transform we can't read. */
export function strokeEnds(el: FigureEl, offset: Pt): [Pt, Pt] | null {
  const shift = translateOf(el);
  if (!shift) return null;
  const a = el.attrs;
  let pts: Pt[] = [];
  if (el.tag === "line") {
    pts = [
      { x: num(a.x1), y: num(a.y1) },
      { x: num(a.x2), y: num(a.y2) },
    ];
  } else if (el.tag === "polyline") pts = pointList(a.points);
  else if (el.tag === "path") pts = pathPoints(a.d ?? "");
  if (pts.length < 2) return null;
  const at = plus(offset, shift);
  const first = pts[0];
  const last = pts[pts.length - 1];
  return [plus(first, at), plus(last, at)];
}
