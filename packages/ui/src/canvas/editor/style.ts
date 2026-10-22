// The style panel model: what a selection takes, and the ops that restyle it.
// A change is one patchNode per card, so it is one undo step.

import type { CanvasOp } from "#src/canvas/ops/ops.js";
import {
  PEN_COLORS,
  SHAPE_NODE,
  STROKE_NODE,
  TEXT_NODE,
  type PenColor,
} from "#src/canvas/pen/types.js";

export type FillValue = PenColor | "none";
export type FontWeight = "regular" | "bold";
/** Thin, regular, thick. A level maps to a different width on a stroke, a shape and a frame. */
export type WidthLevel = 0 | 1 | 2;

export interface StyleValues {
  fill: FillValue;
  stroke: PenColor;
  width: WidthLevel;
  fontSize: number;
  fontWeight: FontWeight;
}

export type StyleControl = keyof StyleValues;

export const FONT_SIZES = [16, 20, 28, 40] as const;

export interface StyleNode {
  id: string;
  type?: string;
  data: Record<string, unknown>;
}

const SHAPE_WIDTHS = [2, 3, 5] as const;
const PEN_WIDTHS = [2, 4, 8] as const;
const HIGHLIGHTER_WIDTHS = [12, 20, 32] as const;
const FRAME_WIDTHS = [1, 2, 4] as const;

type Kind = "shape" | "text" | "stroke" | "frame";

const CONTROLS: Record<Kind, readonly StyleControl[]> = {
  shape: ["fill", "stroke", "width"],
  text: ["stroke", "fontSize", "fontWeight"],
  stroke: ["stroke", "width"],
  frame: ["fill", "stroke", "width"],
};

function kindOf(node: StyleNode, frameType: string): Kind | null {
  if (node.type === SHAPE_NODE) return "shape";
  if (node.type === TEXT_NODE) return "text";
  if (node.type === STROKE_NODE) return "stroke";
  // Only a frame from the F tool wears a fill and a line; a group draws its own colour.
  return node.type === frameType && node.data.frame === true ? "frame" : null;
}

function widthsOf(kind: Kind, node: StyleNode): readonly number[] {
  if (kind === "shape") return SHAPE_WIDTHS;
  if (kind === "frame") return FRAME_WIDTHS;
  return node.data.tool === "highlighter" ? HIGHLIGHTER_WIDTHS : PEN_WIDTHS;
}

function widthKey(kind: Kind): string {
  if (kind === "stroke") return "size";
  return "strokeWidth";
}

function colorOf(value: unknown): PenColor | undefined {
  return PEN_COLORS.find((color) => color === value);
}

function levelOf(kind: Kind, node: StyleNode): WidthLevel {
  const widths = widthsOf(kind, node);
  // A frame nobody styled draws the thinnest line, and a pen mark its middle one.
  const stored = Number(node.data[widthKey(kind)]);
  if (!Number.isFinite(stored)) return kind === "frame" ? 0 : 1;
  let nearest = 0;
  for (let at = 1; at < widths.length; at += 1) {
    if (Math.abs(widths[at] - stored) < Math.abs(widths[nearest] - stored)) nearest = at;
  }
  return nearest as WidthLevel;
}

/** What a card of each kind shows, given the colour it draws in. */
const VALUES: Record<Kind, (node: StyleNode, color: PenColor) => Partial<StyleValues>> = {
  shape: (node, color) => ({
    fill: node.data.filled ? (colorOf(node.data.fill) ?? color) : "none",
    stroke: color,
    width: levelOf("shape", node),
  }),
  text: (node, color) => ({
    stroke: color,
    fontSize: Number(node.data.fontSize) || 20,
    fontWeight: node.data.fontWeight === "bold" ? "bold" : "regular",
  }),
  stroke: (node, color) => ({ stroke: color, width: levelOf("stroke", node) }),
  frame: (node) => ({
    fill: colorOf(node.data.fill) ?? "none",
    stroke: colorOf(node.data.stroke) ?? "ink",
    width: levelOf("frame", node),
  }),
};

function valuesOf(kind: Kind, node: StyleNode): Partial<StyleValues> {
  return VALUES[kind](node, colorOf(node.data.color) ?? "ink");
}

export interface StyleSummary {
  /** Every control some selected card answers to. */
  controls: ReadonlySet<StyleControl>;
  /** A value every card that has the control agrees on. Missing where they differ. */
  values: Partial<StyleValues>;
  /** The widths a control shows, in px, for the first card that has one. */
  widths: readonly number[];
}

/** What the panel shows for a selection, or null when nothing in it takes a style. */
export function summarizeStyle(
  nodes: readonly StyleNode[],
  frameType: string,
): StyleSummary | null {
  const controls = new Set<StyleControl>();
  const seen = new Map<StyleControl, Set<unknown>>();
  let widths: readonly number[] = [];
  for (const node of nodes) {
    const kind = kindOf(node, frameType);
    if (!kind) continue;
    const values = valuesOf(kind, node);
    for (const control of CONTROLS[kind]) {
      controls.add(control);
      const set = seen.get(control) ?? new Set();
      set.add(values[control]);
      seen.set(control, set);
    }
    if (widths.length === 0 && CONTROLS[kind].includes("width")) widths = widthsOf(kind, node);
  }
  if (controls.size === 0) return null;
  const values: Partial<StyleValues> = {};
  for (const [control, set] of seen) {
    if (set.size === 1) Object.assign(values, { [control]: [...set][0] });
  }
  return { controls, values, widths };
}

/** A frame keeps its fill as is; a shape's fill also says whether it is filled. */
function fillData(kind: Kind, fill: FillValue): Record<string, unknown> {
  if (kind === "frame") return { fill };
  return fill === "none" ? { filled: false } : { filled: true, fill };
}

function textData(change: Partial<StyleValues>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (change.fontSize !== undefined) data.fontSize = change.fontSize;
  if (change.fontWeight !== undefined) data.fontWeight = change.fontWeight;
  return data;
}

function dataFor(
  kind: Kind,
  node: StyleNode,
  change: Partial<StyleValues>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (change.stroke) data[kind === "frame" ? "stroke" : "color"] = change.stroke;
  if (change.fill !== undefined && (kind === "shape" || kind === "frame")) {
    Object.assign(data, fillData(kind, change.fill));
  }
  if (change.width !== undefined && kind !== "text") {
    data[widthKey(kind)] = widthsOf(kind, node)[change.width];
  }
  if (kind === "text") Object.assign(data, textData(change));
  return data;
}

/** One patch per card the change applies to. All of them are one undo step when dispatched together. */
export function styleOps(
  nodes: readonly StyleNode[],
  change: Partial<StyleValues>,
  frameType: string,
): CanvasOp[] {
  const ops: CanvasOp[] = [];
  for (const node of nodes) {
    const kind = kindOf(node, frameType);
    if (!kind) continue;
    const data = dataFor(kind, node, change);
    if (Object.keys(data).length > 0) ops.push({ kind: "patchNode", nodeId: node.id, data });
  }
  return ops;
}
