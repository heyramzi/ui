// The select tool: a state machine for picking, moving, resizing and rotating,
// where a 4 pixel drag leaves idle and each gesture is one undo step.

import type {
  Box,
  EditorApi,
  Handle,
  Id,
  PointerInfo,
  ShapeRecord,
  ToolFactory,
  ToolState,
  Vec,
} from "../../types";
import { boxCenter } from "../../math/box";
import { dist, rotate } from "../../math/vec";
import { computeSnap, SNAP_THRESHOLD, type SnapGuide } from "../../geometry/snap";
import {
  findHandleAt,
  getSelectionBox,
  handleCursor,
  selectedShapes,
  type HandleHit,
} from "./handles";

/** A move shorter than this many screen pixels is still a click. */
export const DRAG_THRESHOLD = 4;

/** A shape never shrinks past this many page units in a resize. */
const MIN_SIZE = 1;

/** The angular step a shift-held rotation snaps to: fifteen degrees. */
const ROTATE_SNAP = Math.PI / 12;

/** Which edges a handle drags: -1 is the low edge, 1 the high edge, 0 neither. */
const MOVES: Record<Handle, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
};

/** Lock a drag box to a reference ratio for a shift-held resize: a corner keeps the dominant axis, an edge derives the other, and the dragged edge follows the pointer. */
function lockAspect(
  refW: number,
  refH: number,
  moves: { x: -1 | 0 | 1; y: -1 | 0 | 1 },
  to: Box,
): Box {
  const ratio = refH === 0 ? 1 : refW / refH;
  const out = { ...to };
  if (moves.x !== 0 && moves.y !== 0) {
    if (Math.abs(out.w) > Math.abs(out.h) * ratio) {
      const h = Math.sign(out.h || 1) * (Math.abs(out.w) / ratio);
      if (moves.y === -1) out.y = to.y + to.h - h;
      out.h = h;
    } else {
      const w = Math.sign(out.w || 1) * (Math.abs(out.h) * ratio);
      if (moves.x === -1) out.x = to.x + to.w - w;
      out.w = w;
    }
  } else if (moves.x !== 0) {
    out.h = Math.sign(out.h || 1) * (Math.abs(out.w) / ratio);
  } else if (moves.y !== 0) {
    out.w = Math.sign(out.w || 1) * (Math.abs(out.h) * ratio);
  }
  return out;
}

/** The corner holding the same edges fixed as an edge handle, so a shift-held edge drag can use the corner resize path; the unmoved axis keeps its low edge. */
function edgeToCorner(handle: Handle): Handle {
  switch (handle) {
    case "e":
      return "se";
    case "w":
      return "sw";
    case "n":
      return "ne";
    case "s":
      return "se";
    default:
      return handle;
  }
}

/** Types whose double click opens the text editor. */
const EDITABLE_TYPES = new Set(["text", "note", "frame"]);

type SelectContext = {
  down: PointerInfo | null;
  moved: boolean;
  finished: boolean;
  targetId: Id | null;
  wasSelected: boolean;
  shift: boolean;
  alt: boolean;
  origin: Vec;
  lastPoint: Vec;
  shapes: ShapeRecord[];
  bounds: Box;
  rotation: number;
  initialSelection: Id[];
  handleHit: HandleHit | null;
  center: Vec;
  startAngle: number;
};

function angleBetween(center: Vec, point: Vec): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

/** True once the pointer has travelled far enough on screen to be a drag. */
function pastThreshold(down: PointerInfo | null, e: PointerInfo): boolean {
  if (!down) return true;
  return dist(down.screen, e.screen) >= DRAG_THRESHOLD;
}

function boxFromPoints(a: Vec, b: Vec): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

function unique(ids: Id[]): Id[] {
  return [...new Set(ids)];
}

/** Snapshot of the current selection, taken when a gesture starts. */
function snapshot(editor: EditorApi): ShapeRecord[] {
  return selectedShapes(editor);
}

/** Copy the selection, offset in page units, and return the new ids. */
function duplicateSelection(editor: EditorApi, offset: number): Id[] {
  const ids: Id[] = [];
  for (const shape of selectedShapes(editor)) {
    ids.push(
      editor.createShape({
        type: shape.type,
        x: shape.x + offset,
        y: shape.y + offset,
        w: shape.w,
        h: shape.h,
        rotation: shape.rotation,
        parentId: shape.parentId,
        props: { ...shape.props },
      }),
    );
  }
  return ids;
}

function toGuide(guide: SnapGuide): { axis: "x" | "y"; at: number; from: number; to: number } {
  return { axis: guide.axis, at: guide.position, from: guide.start, to: guide.end };
}

function topLevelIds(editor: EditorApi): Id[] {
  return editor
    .getShapes()
    .filter((shape) => !shape.parentId)
    .map((shape) => shape.id);
}

/** Root of the select tool. Shared context keeps the child states in sync. */
export function createSelectTool(editor: EditorApi): ToolState {
  const ctx: SelectContext = {
    down: null,
    moved: false,
    finished: false,
    targetId: null,
    wasSelected: false,
    shift: false,
    alt: false,
    origin: { x: 0, y: 0 },
    lastPoint: { x: 0, y: 0 },
    shapes: [],
    bounds: { x: 0, y: 0, w: 0, h: 0 },
    rotation: 0,
    initialSelection: [],
    handleHit: null,
    center: { x: 0, y: 0 },
    startAngle: 0,
  };

  function go(path: string): void {
    editor.transition(`select.${path}`);
  }

  /** True once the pointer has moved off the point the gesture started at. */
  function movedFromOrigin(): boolean {
    return ctx.lastPoint.x !== ctx.origin.x || ctx.lastPoint.y !== ctx.origin.y;
  }

  /* ------------------------------ translating ------------------------------ */

  function translateApply(): void {
    const zoom = editor.getCamera().zoom || 1;
    let dx = ctx.lastPoint.x - ctx.origin.x;
    let dy = ctx.lastPoint.y - ctx.origin.y;
    if (ctx.shift) {
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
      else dx = 0;
    }

    const held = new Set(ctx.shapes.map((shape) => shape.id));
    const others = editor
      .getShapes()
      .filter((shape) => !held.has(shape.id) && !shape.parentId)
      .map((shape) => editor.getPageBounds(shape.id));
    const dragged = {
      x: ctx.bounds.x + dx,
      y: ctx.bounds.y + dy,
      w: ctx.bounds.w,
      h: ctx.bounds.h,
    };
    const snap = computeSnap(dragged, others, SNAP_THRESHOLD / zoom);
    const snapDx = dx + (snap.x - dragged.x);
    const snapDy = dy + (snap.y - dragged.y);

    editor.setGuides(snap.guides.map(toGuide));
    editor.updateShapes(
      ctx.shapes.map((shape) => ({ id: shape.id, x: shape.x + snapDx, y: shape.y + snapDy })),
    );
  }

  /* ------------------------------- resizing -------------------------------- */

  function resizeApply(): void {
    const hit = ctx.handleHit;
    if (!hit || hit.kind !== "resize") return;
    const handle = hit.handle;
    const moves = MOVES[handle];
    const dx = ctx.lastPoint.x - ctx.origin.x;
    const dy = ctx.lastPoint.y - ctx.origin.y;

    if (ctx.shapes.length === 1) {
      const shape = ctx.shapes[0];
      const local = rotate({ x: dx, y: dy }, { x: 0, y: 0 }, -shape.rotation);
      const to = { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
      if (moves.x === -1) {
        to.x = shape.x + local.x;
        to.w = shape.w - local.x;
      } else if (moves.x === 1) {
        to.w = shape.w + local.x;
      }
      if (moves.y === -1) {
        to.y = shape.y + local.y;
        to.h = shape.h - local.y;
      } else if (moves.y === 1) {
        to.h = shape.h + local.y;
      }

      if (ctx.alt) {
        const cx = shape.x + shape.w / 2;
        const cy = shape.y + shape.h / 2;
        let w = shape.w;
        let h = shape.h;
        if (moves.x !== 0) w = Math.max(MIN_SIZE, shape.w + moves.x * 2 * local.x);
        if (moves.y !== 0) h = Math.max(MIN_SIZE, shape.h + moves.y * 2 * local.y);
        if (ctx.shift) {
          const locked = lockAspect(shape.w, shape.h, moves, {
            x: cx - w / 2,
            y: cy - h / 2,
            w,
            h,
          });
          w = Math.max(MIN_SIZE, Math.abs(locked.w));
          h = Math.max(MIN_SIZE, Math.abs(locked.h));
        }
        editor.updateShapes([{ id: shape.id, x: cx - w / 2, y: cy - h / 2, w, h }]);
        return;
      }

      const locked = ctx.shift ? lockAspect(shape.w, shape.h, moves, to) : to;
      // A shift-held edge runs through the corner path: the plain edge path
      // would drop the derived axis, since an edge resize only takes its own.
      const target = ctx.shift && (moves.x === 0 || moves.y === 0) ? edgeToCorner(handle) : handle;
      const patch = editor.getShapeUtil(shape.type).resize(shape, target, locked);
      editor.updateShapes([{ id: shape.id, ...patch }]);
      return;
    }

    const initial = ctx.bounds;
    let to = { ...initial };
    if (moves.x === -1) {
      to.x = initial.x + dx;
      to.w = initial.w - dx;
    } else if (moves.x === 1) {
      to.w = initial.w + dx;
    }
    if (moves.y === -1) {
      to.y = initial.y + dy;
      to.h = initial.h - dy;
    } else if (moves.y === 1) {
      to.h = initial.h + dy;
    }
    if (ctx.shift) to = lockAspect(initial.w, initial.h, moves, to);
    if (ctx.alt) {
      if (moves.x !== 0) {
        to.w = Math.max(MIN_SIZE, Math.abs(to.w) * 2);
        to.x = initial.x + initial.w / 2 - to.w / 2;
      }
      if (moves.y !== 0) {
        to.h = Math.max(MIN_SIZE, Math.abs(to.h) * 2);
        to.y = initial.y + initial.h / 2 - to.h / 2;
      }
    }
    const sx = initial.w === 0 ? 1 : to.w / initial.w;
    const sy = initial.h === 0 ? 1 : to.h / initial.h;
    editor.updateShapes(
      ctx.shapes.map((shape) => ({
        id: shape.id,
        x: to.x + (shape.x - initial.x) * sx,
        y: to.y + (shape.y - initial.y) * sy,
        w: Math.abs(shape.w * sx),
        h: Math.abs(shape.h * sy),
      })),
    );
  }

  /* ------------------------------- rotating -------------------------------- */

  function rotateApply(shift: boolean): void {
    const delta = angleBetween(ctx.center, ctx.lastPoint) - ctx.startAngle;
    let rotation = ctx.rotation + delta;
    if (shift) rotation = Math.round(rotation / ROTATE_SNAP) * ROTATE_SNAP;
    const applied = rotation - ctx.rotation;

    if (ctx.shapes.length === 1) {
      editor.updateShapes([{ id: ctx.shapes[0].id, rotation }]);
      return;
    }
    editor.updateShapes(
      ctx.shapes.map((shape) => {
        const center = boxCenter({ x: shape.x, y: shape.y, w: shape.w, h: shape.h });
        const moved = rotate(center, ctx.center, applied);
        return {
          id: shape.id,
          x: moved.x - shape.w / 2,
          y: moved.y - shape.h / 2,
          rotation: shape.rotation + applied,
        };
      }),
    );
  }

  /* -------------------------------- states --------------------------------- */

  const idle: ToolState = {
    id: "idle",
    onEnter() {
      editor.setCursor("default");
      ctx.moved = false;
      ctx.finished = false;
    },
    onPointerMove(e) {
      editor.setCursor(e.targetId ? "move" : "default");
    },
    onPointerDown(e) {
      ctx.down = e;
      ctx.moved = false;
      ctx.finished = false;
      ctx.targetId = e.targetId;
      ctx.shift = e.shift;
      ctx.alt = e.alt;
      ctx.origin = e.point;
      ctx.lastPoint = e.point;

      if (e.clicks === 2 && e.targetId) {
        const shape = editor.getShape(e.targetId);
        if (shape && EDITABLE_TYPES.has(shape.type)) {
          editor.select([shape.id]);
          editor.setEditingId(shape.id);
          return;
        }
      }

      if (editor.getSelectedIds().length > 0) {
        const hit = findHandleAt(editor, e.point);
        if (hit) {
          ctx.handleHit = hit;
          go("pointing_handle");
          return;
        }
      }

      go(e.targetId ? "pointing_shape" : "pointing_canvas");
    },
    onKeyDown(key, mods) {
      const lower = key.length === 1 ? key.toLowerCase() : key;
      if (key === "Delete" || key === "Backspace") {
        const ids = editor.getSelectedIds();
        if (ids.length) editor.deleteShapes(ids);
        return;
      }
      if (key === "Escape") {
        editor.select([]);
        return;
      }
      if (mods.meta && lower === "a") {
        editor.select(topLevelIds(editor));
        return;
      }
      if (mods.meta && lower === "z") {
        if (mods.shift) editor.redo();
        else editor.undo();
        return;
      }
      if (mods.meta && lower === "d") {
        const ids = duplicateSelection(editor, 16);
        if (ids.length) editor.select(ids);
        return;
      }
      const step = mods.shift ? 10 : 1;
      const nudge = arrowDelta(key, step);
      if (!nudge) return;
      const ids = editor.getSelectedIds();
      if (!ids.length) return;
      editor.updateShapes(
        ids.flatMap((id) => {
          const shape = editor.getShape(id);
          return shape ? [{ id, x: shape.x + nudge.x, y: shape.y + nudge.y }] : [];
        }),
      );
    },
    onCancel() {
      editor.select([]);
    },
  };

  const pointingCanvas: ToolState = {
    id: "pointing_canvas",
    onEnter() {
      if (!(ctx.shift || ctx.alt) && editor.getSelectedIds().length > 0) editor.select([]);
      editor.setCursor("default");
    },
    onPointerMove(e) {
      if (!pastThreshold(ctx.down, e)) return;
      ctx.origin = ctx.down ? ctx.down.point : e.point;
      ctx.lastPoint = e.point;
      go("brushing");
    },
    onPointerUp() {
      go("idle");
    },
    onCancel() {
      go("idle");
    },
  };

  const pointingShape: ToolState = {
    id: "pointing_shape",
    onEnter() {
      const target = ctx.targetId;
      if (!target) return;
      const selected = editor.getSelectedIds();
      ctx.wasSelected = selected.includes(target);
      if (ctx.shift && !ctx.alt) {
        // A toggle that was off comes on now and off again on release.
        if (!ctx.wasSelected) editor.select([...selected, target]);
      } else if (!ctx.wasSelected) {
        // A fresh shape becomes the whole selection; an old one keeps the rest
        // so a drag moves the whole group.
        editor.select([target]);
      }
    },
    onPointerMove(e) {
      if (!pastThreshold(ctx.down, e)) return;
      ctx.moved = true;
      ctx.alt = e.alt;
      ctx.shift = e.shift;
      ctx.lastPoint = e.point;
      go("translating");
    },
    onPointerUp() {
      if (ctx.moved) return;
      const target = ctx.targetId;
      if (!target) {
        go("idle");
        return;
      }
      const selected = editor.getSelectedIds();
      if (ctx.shift && !ctx.alt) {
        // Toggle: only a shape that was already selected comes off on release.
        if (ctx.wasSelected) editor.select(selected.filter((id) => id !== target));
      } else if (selected.length > 1 && selected.includes(target)) {
        editor.select([target]);
      }
      go("idle");
    },
    onCancel() {
      go("idle");
    },
  };

  const pointingHandle: ToolState = {
    id: "pointing_handle",
    onEnter() {
      const hit = ctx.handleHit;
      editor.setCursor(hit && hit.kind === "resize" ? handleCursor(hit.handle) : "grabbing");
    },
    onPointerMove(e) {
      if (!pastThreshold(ctx.down, e)) return;
      ctx.lastPoint = e.point;
      ctx.shift = e.shift;
      ctx.alt = e.alt;
      go(ctx.handleHit?.kind === "rotate" ? "rotating" : "resizing");
    },
    onPointerUp() {
      go("idle");
    },
    onCancel() {
      go("idle");
    },
  };

  const brushing: ToolState = {
    id: "brushing",
    onEnter() {
      editor.setCursor("default");
      ctx.origin = ctx.down ? ctx.down.point : ctx.origin;
      ctx.lastPoint = ctx.origin;
      ctx.initialSelection = ctx.shift || ctx.alt ? editor.getSelectedIds() : [];
      brushingUpdate();
    },
    onPointerMove(e) {
      ctx.lastPoint = e.point;
      ctx.shift = e.shift;
      ctx.alt = e.alt;
      brushingUpdate();
    },
    onKeyDown(_key, mods) {
      ctx.shift = mods.shift;
      ctx.alt = mods.alt;
      brushingUpdate();
    },
    onPointerUp() {
      editor.setBrush(null);
      go("idle");
    },
    onCancel() {
      editor.setBrush(null);
      editor.select(ctx.initialSelection);
      go("idle");
    },
  };

  function brushingUpdate(): void {
    const box = boxFromPoints(ctx.origin, ctx.lastPoint);
    editor.setBrush(box);
    const mode = ctx.alt ? "contain" : "intersect";
    const hits = editor.getShapesInBox(box, mode);
    editor.select(ctx.shift ? unique([...ctx.initialSelection, ...hits]) : hits);
  }

  const translating: ToolState = {
    id: "translating",
    onEnter() {
      editor.setCursor("move");
      ctx.origin = ctx.down ? ctx.down.point : ctx.origin;
      ctx.bounds = getSelectionBox(editor).box;
      ctx.shapes = snapshot(editor);
      editor.beginGesture("translating");
      if (ctx.alt) {
        const ids = duplicateSelection(editor, 0);
        if (ids.length) {
          editor.select(ids);
          ctx.shapes = snapshot(editor);
          ctx.bounds = getSelectionBox(editor).box;
        }
      }
      // The move that crossed the threshold is the first frame of the drag.
      if (movedFromOrigin()) translateApply();
    },
    onPointerMove(e) {
      ctx.lastPoint = e.point;
      ctx.shift = e.shift;
      translateApply();
    },
    onKeyDown(_key, mods) {
      ctx.shift = mods.shift;
      ctx.alt = mods.alt;
      translateApply();
    },
    onKeyUp() {
      translateApply();
    },
    onPointerUp() {
      editor.setGuides([]);
      editor.commitGesture();
      go("idle");
    },
    onCancel() {
      if (ctx.finished) return;
      ctx.finished = true;
      editor.setGuides([]);
      editor.cancelGesture();
      go("idle");
    },
    onExit() {
      editor.setGuides([]);
    },
  };

  const resizing: ToolState = {
    id: "resizing",
    onEnter() {
      ctx.origin = ctx.down ? ctx.down.point : ctx.origin;
      const geometry = getSelectionBox(editor);
      ctx.bounds = geometry.box;
      ctx.rotation = geometry.rotation;
      ctx.shapes = snapshot(editor);
      if (ctx.handleHit?.kind === "resize") editor.setCursor(handleCursor(ctx.handleHit.handle));
      editor.beginGesture("resizing");
      if (movedFromOrigin()) resizeApply();
    },
    onPointerMove(e) {
      ctx.lastPoint = e.point;
      ctx.shift = e.shift;
      ctx.alt = e.alt;
      resizeApply();
    },
    onKeyDown(_key, mods) {
      ctx.shift = mods.shift;
      ctx.alt = mods.alt;
      resizeApply();
    },
    onKeyUp() {
      resizeApply();
    },
    onPointerUp() {
      editor.commitGesture();
      go("idle");
    },
    onCancel() {
      if (ctx.finished) return;
      ctx.finished = true;
      editor.cancelGesture();
      go("idle");
    },
  };

  const rotating: ToolState = {
    id: "rotating",
    onEnter() {
      const geometry = getSelectionBox(editor);
      ctx.bounds = geometry.box;
      ctx.rotation = geometry.rotation;
      ctx.center = boxCenter(geometry.box);
      ctx.startAngle = angleBetween(ctx.center, ctx.down ? ctx.down.point : ctx.origin);
      ctx.shapes = snapshot(editor);
      editor.setCursor("grabbing");
      editor.beginGesture("rotating");
      if (movedFromOrigin()) rotateApply(ctx.shift);
    },
    onPointerMove(e) {
      ctx.lastPoint = e.point;
      ctx.shift = e.shift;
      rotateApply(e.shift);
    },
    onKeyDown(_key, mods) {
      ctx.shift = mods.shift;
      rotateApply(mods.shift);
    },
    onKeyUp() {
      rotateApply(ctx.shift);
    },
    onPointerUp(e) {
      ctx.lastPoint = e.point;
      rotateApply(e.shift);
      editor.commitGesture();
      go("idle");
    },
    onCancel() {
      if (ctx.finished) return;
      ctx.finished = true;
      editor.cancelGesture();
      go("idle");
    },
  };

  return {
    id: "select",
    initial: "idle",
    children: {
      idle,
      pointing_canvas: pointingCanvas,
      pointing_shape: pointingShape,
      pointing_handle: pointingHandle,
      brushing,
      translating,
      resizing,
      rotating,
    },
  };
}

/** Page delta for an arrow key, or null for any other key. */
function arrowDelta(key: string, step: number): Vec | null {
  switch (key) {
    case "ArrowLeft":
      return { x: -step, y: 0 };
    case "ArrowRight":
      return { x: step, y: 0 };
    case "ArrowUp":
      return { x: 0, y: -step };
    case "ArrowDown":
      return { x: 0, y: step };
    default:
      return null;
  }
}
