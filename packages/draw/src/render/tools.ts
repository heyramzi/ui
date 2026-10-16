// The built-in tools and the shortcut that picks each. The renderer owns both
// so a host that only mounts <Draw> still gets a working toolbar and keyboard.

import {
  createArrowTool,
  createEraserTool,
  createHandTool,
  createPenTool,
  createSelectTool,
  createShapeTool,
  createTextTool,
  type Editor,
} from "../core";

/** Tools a toolbar button or a letter key can switch to. */
export const TOOL_SHORTCUTS: Record<string, string> = {
  v: "select",
  h: "hand",
  p: "pen",
  r: "rect",
  o: "ellipse",
  d: "diamond",
  l: "line",
  a: "arrow",
  t: "text",
  e: "eraser",
  n: "note",
  f: "frame",
};

/** Box-drawing tools: one factory per shape type. */
const SHAPE_TOOLS = ["rect", "ellipse", "diamond", "line", "note", "frame"];

/** Editors already set up, so mounting two components never double-registers. */
const registered = new WeakSet<Editor>();

/**
 * Register every built-in tool and start on `select` when no tool is active.
 * Safe to call from more than one component: it runs once per editor.
 */
export function registerDefaultTools(editor: Editor): void {
  if (registered.has(editor)) return;
  registered.add(editor);

  editor.registerTool("select", createSelectTool);
  editor.registerTool("hand", createHandTool);
  editor.registerTool("pen", createPenTool);
  editor.registerTool("arrow", createArrowTool);
  editor.registerTool("text", createTextTool);
  editor.registerTool("eraser", createEraserTool);
  for (const type of SHAPE_TOOLS) editor.registerTool(type, createShapeTool(type));

  if (editor.getActivePath() === "") editor.setTool("select");
}
