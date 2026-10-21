// One pen gesture, pointer down to up, in flow coordinates. It talks to the
// editor through a host, so the overlay stays thin.

import { strokesAlong, type ErasableNode } from "#src/canvas/pen/eraser.js";
import { buildStrokeNode, type Box, type Pt } from "#src/canvas/pen/geometry.js";
import { addPenNode, removePenNode, type PenOp } from "#src/canvas/pen/ops.js";
import { buildShapeNode, buildTextNode, dragBox } from "#src/canvas/pen/shapes.js";
import { strokePath } from "#src/canvas/pen/stroke-path.js";
import {
  PEN_DEFAULTS,
  type PenColor,
  type PenTool,
  type ShapeKind,
  type StrokePoint,
} from "#src/canvas/pen/types.js";

export interface PenSettings {
  tool: PenTool;
  color: PenColor;
  /** Brush width in flow units. Falls back to the tool's default. */
  size?: number;
  zoom: number;
}

export interface PenHost {
  getNodes: () => readonly ErasableNode[];
  /** Apply ops to the board. Called inside an open gesture. */
  commit: (ops: PenOp[]) => void;
  /** Open an undo transaction and hand back its commit. */
  startGesture: () => () => void;
  /** A text node was dropped. The editor opens it for typing. */
  onTextPlaced?: (nodeId: string) => void;
  onPreview?: (preview: PenPreview | null) => void;
}

/** What the overlay draws while the pointer is down, in flow coordinates. */
export type PenPreview =
  | { kind: "stroke"; d: string; color: PenColor; tool: "pen" | "highlighter" }
  | { kind: "shape"; shape: ShapeKind; box: Box; color: PenColor }
  | { kind: "eraser"; at: Pt; radius: number };

const ERASER_RADIUS = 10;
/** Samples closer than this, in screen pixels, add nothing to a stroke. */
const MIN_SAMPLE = 1;

function isShapeTool(tool: PenTool): tool is ShapeKind {
  return tool === "rectangle" || tool === "ellipse" || tool === "diamond";
}

export function createPenSession(host: PenHost, getSettings: () => PenSettings) {
  let endGesture: (() => void) | null = null;
  let start: Pt | null = null;
  let last: Pt | null = null;
  let samples: StrokePoint[] = [];
  const erased = new Set<string>();

  function settingsNow() {
    const settings = getSettings();
    const fallback =
      settings.tool === "highlighter" ? PEN_DEFAULTS.highlighter.size : PEN_DEFAULTS.pen.size;
    return { ...settings, size: settings.size ?? fallback };
  }

  function reset() {
    endGesture = null;
    start = null;
    last = null;
    samples = [];
    erased.clear();
    host.onPreview?.(null);
  }

  function erase(from: Pt, to: Pt, radius: number) {
    const remaining = host.getNodes().filter((node) => !erased.has(node.id));
    const ids = strokesAlong(remaining, from, to, radius);
    if (ids.length === 0) return;
    for (const id of ids) erased.add(id);
    host.commit(ids.map(removePenNode));
  }

  function placeText(at: Pt, color: PenColor) {
    const op = addPenNode(buildTextNode(at, { color }));
    host.commit([op]);
    if (op.kind === "addNode" && op.node.id) host.onTextPlaced?.(op.node.id);
  }

  function sampleOf(at: Pt, pressure?: number): StrokePoint {
    return pressure === undefined ? [at.x, at.y] : [at.x, at.y, pressure];
  }

  function previewStroke(pointerDown: boolean) {
    const { tool, color, size } = settingsNow();
    if (tool !== "pen" && tool !== "highlighter") return;
    const hasPressure = samples.some((point) => point[2] !== undefined);
    const d = strokePath(samples, { size, tool, simulatePressure: !hasPressure }, !pointerDown);
    host.onPreview?.({ kind: "stroke", d, color, tool });
  }

  return {
    /** True while a gesture is open, so the overlay knows to keep capturing. */
    get active() {
      return start !== null;
    },

    down(at: Pt, pressure?: number) {
      if (start) return;
      const { tool, color, zoom } = settingsNow();

      if (tool === "text") {
        placeText(at, color);
        return;
      }

      endGesture = host.startGesture();
      start = at;
      last = at;
      if (tool === "eraser") {
        const radius = ERASER_RADIUS / zoom;
        host.onPreview?.({ kind: "eraser", at, radius });
        erase(at, at, radius);
        return;
      }
      if (tool === "pen" || tool === "highlighter") {
        samples = [sampleOf(at, pressure)];
        previewStroke(true);
      }
    },

    move(at: Pt, pressure?: number) {
      if (!start || !last) return;
      const { tool, color, zoom } = settingsNow();
      if (tool === "eraser") {
        const radius = ERASER_RADIUS / zoom;
        host.onPreview?.({ kind: "eraser", at, radius });
        erase(last, at, radius);
        last = at;
        return;
      }
      if (isShapeTool(tool)) {
        host.onPreview?.({ kind: "shape", shape: tool, box: dragBox(start, at), color });
        last = at;
        return;
      }
      if (Math.hypot(at.x - last.x, at.y - last.y) * zoom < MIN_SAMPLE) return;
      samples.push(sampleOf(at, pressure));
      last = at;
      previewStroke(true);
    },

    /** Pointer up. Writes the node, then closes the gesture so it's one undo step. */
    up(at: Pt, options: { square?: boolean } = {}) {
      if (!start || !endGesture) return;
      const { tool, color, size, zoom } = settingsNow();
      const close = endGesture;
      try {
        if (tool === "pen" || tool === "highlighter") {
          const node = buildStrokeNode(samples, { color, size, tool, zoom });
          if (node) host.commit([addPenNode(node)]);
        } else if (isShapeTool(tool)) {
          const box = dragBox(start, at, options.square);
          host.commit([addPenNode(buildShapeNode(tool, box, { color }))]);
        }
      } finally {
        close();
        reset();
      }
    },

    /** Escape or a lost pointer. Whatever the eraser already removed stays removed. */
    cancel() {
      if (!endGesture) return;
      const close = endGesture;
      close();
      reset();
    },
  };
}
