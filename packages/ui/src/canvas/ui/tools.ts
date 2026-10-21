// The tool bar's tools, their keys and the shortcut list the help panel renders.
// Pure data and two lookups, so the keyboard, the bar and the panel can't disagree.

import { PEN_DEFAULTS, type PenTool, type ShapeKind } from "#src/canvas/pen/types.js";

export type CanvasTool = "select" | "hand" | "connect" | "frame" | PenTool;

export interface ToolDef {
  id: CanvasTool;
  key: string;
}

/** Every tool with its single-letter key. Shapes share one bar button but keep a key each. */
export const TOOLS: readonly ToolDef[] = [
  { id: "select", key: "V" },
  { id: "hand", key: "H" },
  { id: "connect", key: "L" },
  { id: "pen", key: "P" },
  { id: "highlighter", key: "M" },
  { id: "eraser", key: "E" },
  { id: "text", key: "T" },
  { id: "rectangle", key: "R" },
  { id: "ellipse", key: "O" },
  { id: "diamond", key: "D" },
  { id: "frame", key: "F" },
];

const TOOL_BY_KEY = new Map(TOOLS.map((tool) => [tool.key.toLowerCase(), tool.id]));

/** The tool a bare letter selects. Callers rule out modifiers and typing targets first. */
export function toolForKey(key: string): CanvasTool | null {
  return TOOL_BY_KEY.get(key.toLowerCase()) ?? null;
}

export function keyForTool(tool: CanvasTool): string {
  return TOOLS.find((entry) => entry.id === tool)?.key ?? "";
}

/** True for every tool the pen overlay handles. Select, hand and connect leave the pointer to xyflow, and frame has its own layer. */
export function isDrawingTool(tool: CanvasTool): tool is PenTool {
  return tool !== "select" && tool !== "hand" && tool !== "connect" && tool !== "frame";
}

/** The frame tool drags out a box rather than a mark, so it has its own layer. */
export function isFrameTool(tool: CanvasTool): tool is "frame" {
  return tool === "frame";
}

export function isShapeTool(tool: CanvasTool): tool is ShapeKind {
  return tool === "rectangle" || tool === "ellipse" || tool === "diamond";
}

// =========================
// BRUSH SIZES
// =========================

export type BrushLevel = 0 | 1 | 2;

const BRUSH_SIZES = {
  pen: [2, PEN_DEFAULTS.pen.size, 8],
  highlighter: [12, PEN_DEFAULTS.highlighter.size, 32],
} as const;

export const DEFAULT_BRUSH_LEVEL: BrushLevel = 1;

/** Flow-unit width for a tool at a level. Tools with no brush return undefined and take their default. */
export function brushSize(tool: CanvasTool, level: BrushLevel): number | undefined {
  if (tool === "pen" || tool === "highlighter") return BRUSH_SIZES[tool][level];
  return undefined;
}

export function hasBrush(tool: CanvasTool): boolean {
  return tool === "pen" || tool === "highlighter";
}

/** The three tools that share one rail button, the last one used. */
export type BrushTool = "pen" | "highlighter" | "eraser";

export function isBrushTool(tool: CanvasTool): tool is BrushTool {
  return tool === "pen" || tool === "highlighter" || tool === "eraser";
}

/** Colour applies to every drawing tool except the eraser. */
export function hasColor(tool: CanvasTool): boolean {
  return isDrawingTool(tool) && tool !== "eraser";
}

// =========================
// SHORTCUT LIST
// =========================

export type ShortcutGroup = "tools" | "edit" | "view";

export interface Shortcut {
  /** A stable id the app maps to a translated label. */
  id: string;
  group: ShortcutGroup;
  /** "mod" renders as Cmd or Ctrl, "shift" as the shift glyph. Anything else is shown as typed. */
  keys: readonly string[];
}

/** One row per key the canvas owns. The panel is built from this list and nothing else. */
export const SHORTCUTS: readonly Shortcut[] = [
  { id: "select", group: "tools", keys: ["V"] },
  { id: "hand", group: "tools", keys: ["H"] },
  { id: "connect", group: "tools", keys: ["L"] },
  { id: "pen", group: "tools", keys: ["P"] },
  { id: "highlighter", group: "tools", keys: ["M"] },
  { id: "eraser", group: "tools", keys: ["E"] },
  { id: "text", group: "tools", keys: ["T"] },
  { id: "rectangle", group: "tools", keys: ["R"] },
  { id: "ellipse", group: "tools", keys: ["O"] },
  { id: "diamond", group: "tools", keys: ["D"] },
  { id: "frame", group: "tools", keys: ["F"] },
  { id: "note", group: "tools", keys: ["N"] },
  { id: "cards", group: "tools", keys: ["C"] },
  { id: "comment", group: "tools", keys: ["B"] },
  { id: "panTemporarily", group: "tools", keys: ["Space"] },
  { id: "undo", group: "edit", keys: ["mod", "Z"] },
  { id: "redo", group: "edit", keys: ["mod", "shift", "Z"] },
  { id: "copy", group: "edit", keys: ["mod", "C"] },
  { id: "paste", group: "edit", keys: ["mod", "V"] },
  { id: "selectAll", group: "edit", keys: ["mod", "A"] },
  { id: "multiSelect", group: "edit", keys: ["shift", "Click"] },
  { id: "duplicate", group: "edit", keys: ["mod", "D"] },
  { id: "group", group: "edit", keys: ["mod", "G"] },
  { id: "ungroup", group: "edit", keys: ["mod", "shift", "G"] },
  { id: "bringForward", group: "edit", keys: ["]"] },
  { id: "sendBackward", group: "edit", keys: ["["] },
  { id: "bringToFront", group: "edit", keys: ["mod", "]"] },
  { id: "sendToBack", group: "edit", keys: ["mod", "["] },
  { id: "lock", group: "edit", keys: ["mod", "shift", "L"] },
  { id: "copyAsPng", group: "edit", keys: ["mod", "shift", "C"] },
  { id: "nudge", group: "edit", keys: ["Arrows"] },
  { id: "nudgeFar", group: "edit", keys: ["shift", "Arrows"] },
  { id: "delete", group: "edit", keys: ["Del"] },
  { id: "save", group: "edit", keys: ["mod", "S"] },
  { id: "zoomIn", group: "view", keys: ["+"] },
  { id: "zoomOut", group: "view", keys: ["-"] },
  { id: "zoom100", group: "view", keys: ["shift", "0"] },
  { id: "zoomFit", group: "view", keys: ["shift", "1"] },
  { id: "zoomSelection", group: "view", keys: ["shift", "2"] },
  { id: "present", group: "view", keys: ["mod", "Enter"] },
  { id: "shortcuts", group: "view", keys: ["?"] },
  { id: "escape", group: "view", keys: ["Esc"] },
];
