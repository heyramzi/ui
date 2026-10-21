// The pen layer's node shapes. A stroke, a text and a shape are ordinary xyflow
// nodes, so undo, copy and save come from the node diffing the editor already does.

export const STROKE_NODE = "stroke";
export const TEXT_NODE = "text";
export const SHAPE_NODE = "shape";

/** Colours are token names, never hex, so a board drawn in light reads in dark. */
export const PEN_COLORS = [
  "ink",
  "red",
  "blue",
  "green",
  "amber",
  "violet",
  "indigo",
  "terra",
] as const;
export type PenColor = (typeof PEN_COLORS)[number];

export type PenTool =
  | "pen"
  | "highlighter"
  | "eraser"
  | "text"
  | "rectangle"
  | "ellipse"
  | "diamond";

export const SHAPE_KINDS = ["rectangle", "ellipse", "diamond"] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];

/** x, y, then pressure from 0 to 1 when the device reported one. */
export type StrokePoint = readonly [number, number, number?];

/** A point as it arrives, from a pointer or a file. Anything past x, y and pressure is ignored. */
export type StrokeSample = StrokePoint | readonly number[];

export interface StrokeData extends Record<string, unknown> {
  /** Relative to the node's position, already simplified. */
  points: StrokePoint[];
  color: PenColor;
  /** Brush width in flow units. */
  size: number;
  /** The highlighter draws wide, flat and see-through. */
  tool: "pen" | "highlighter";
  /** False when real pen pressure is in the points. */
  simulatePressure: boolean;
}

export interface TextData extends Record<string, unknown> {
  text: string;
  color: PenColor;
  /** Font size in flow units. */
  fontSize: number;
  /** Bold, or the face's own weight when unset. */
  fontWeight?: "regular" | "bold";
  /** The node's width is a column the words wrap in, as on a board, not the width of the words. */
  fixedWidth?: boolean;
  align?: "left" | "center";
  /** A hand rule under the text, as under a board title. */
  underline?: boolean;
}

export interface ShapeData extends Record<string, unknown> {
  shape: ShapeKind;
  color: PenColor;
  /** Line width in flow units. */
  strokeWidth: number;
  /** A faint wash inside the outline. */
  filled: boolean;
  /** The wash's own colour. Unset, it takes the outline's. */
  fill?: PenColor;
  label: string;
}

/** A node as the pen layer writes it, which is the addNode op's node field. */
export interface PenNodeInput<D extends Record<string, unknown>> {
  id?: string;
  type: string;
  position: { x: number; y: number };
  data: D;
  width: number;
  height: number;
}

export const PEN_DEFAULTS = {
  pen: { size: 4 },
  highlighter: { size: 20 },
  strokeWidth: 3,
  fontSize: 20,
  color: "ink",
} as const satisfies { color: PenColor; [key: string]: unknown };

/** Highlighter ink is drawn at this opacity so what's under it still shows. */
export const HIGHLIGHTER_OPACITY = 0.38;
