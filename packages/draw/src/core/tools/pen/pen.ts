// The pen tool: one freehand stroke per gesture, simplified on release, a press
// with no move leaves a dot, and Escape throws the stroke away.

import type { EditorApi, Id, ShapeRecord, ToolFactory, ToolState, Vec } from "../../types";
import { addPoint, finish, freehandUtil, type FreehandShape } from "../../shapes/freehand";

/** The patch fields an in-progress stroke changes as it grows. */
function strokePatch(shape: FreehandShape): Partial<ShapeRecord> & { id: Id } {
  return { id: shape.id, x: shape.x, y: shape.y, w: shape.w, h: shape.h, props: shape.props };
}

export const createPenTool: ToolFactory = (editor: EditorApi): ToolState => {
  let shapeId: Id | null = null;
  let lastPoint: Vec | null = null;

  const current = (): FreehandShape | undefined => {
    if (!shapeId) return undefined;
    return editor.getShape(shapeId) as FreehandShape | undefined;
  };

  function reset(): void {
    shapeId = null;
    lastPoint = null;
  }

  /** Append a page point unless it repeats the last one, so a still pointer adds nothing. */
  function append(point: Vec, pressure: number): void {
    const shape = current();
    if (!shape) return;
    if (lastPoint && lastPoint.x === point.x && lastPoint.y === point.y) return;
    lastPoint = point;
    editor.updateShapes([strokePatch(addPoint(shape, { ...point, pressure }))]);
  }

  function start(point: Vec, pressure: number): void {
    editor.beginGesture("pen:draw");
    const defaults = freehandUtil.defaults();
    const id = editor.createShape({
      type: "freehand",
      x: point.x,
      y: point.y,
      w: 0,
      h: 0,
      props: { ...defaults.props, points: [{ x: 0, y: 0, pressure }] },
    });
    shapeId = id;
    lastPoint = point;
  }

  const idle: ToolState = {
    id: "idle",
    onPointerDown(e) {
      start(e.point, e.pressure);
      editor.transition("pen.drawing");
    },
  };

  const drawing: ToolState = {
    id: "drawing",
    onPointerMove(e) {
      append(e.point, e.pressure);
    },
    onPointerUp(e) {
      append(e.point, e.pressure);
      const shape = current();
      if (shape) editor.updateShapes([strokePatch(finish(shape))]);
      editor.commitGesture();
      reset();
      editor.transition("pen.idle");
    },
    onCancel() {
      if (shapeId) editor.cancelGesture();
      reset();
      editor.transition("pen.idle");
    },
  };

  return {
    id: "pen",
    initial: "idle",
    onEnter() {
      reset();
      editor.setCursor("crosshair");
    },
    onExit() {
      editor.setCursor("default");
    },
    children: { idle, drawing },
  };
};
