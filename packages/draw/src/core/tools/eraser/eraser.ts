// The eraser tool deletes every shape the pointer path touches, sampling along
// each segment so a fast drag skips none; the sweep is one undo step and Escape
// restores it.

import type { EditorApi, Id, ToolFactory, ToolState, Vec } from "../../types";

/** How near the pointer path a shape counts as touched, in screen pixels. */
export const ERASER_MARGIN_PX = 8;

/** Points from `a` through to `b`, at most `step` apart, ending on `b`. */
function sampleSegment(a: Vec, b: Vec, step: number): Vec[] {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const count = Math.max(1, Math.ceil(length / step));
  const points: Vec[] = [];
  for (let i = 1; i <= count; i += 1) {
    points.push({ x: a.x + ((b.x - a.x) * i) / count, y: a.y + ((b.y - a.y) * i) / count });
  }
  return points;
}

export const createEraserTool: ToolFactory = (editor: EditorApi): ToolState => {
  const erased = new Set<Id>();
  let last: Vec | null = null;

  function reset(): void {
    erased.clear();
    last = null;
  }

  /** Delete every not-yet-erased shape the path to `point` runs over. */
  function eraseTo(point: Vec): void {
    const zoom = editor.getCamera().zoom || 1;
    const margin = ERASER_MARGIN_PX / zoom;
    const step = Math.max(margin / 2, 0.5);
    const points = last ? sampleSegment(last, point, step) : [point];
    last = point;

    const found: Id[] = [];
    for (const shape of editor.getShapes()) {
      if (erased.has(shape.id)) continue;
      const util = editor.getShapeUtil(shape.type);
      if (points.some((sample) => util.hitTest(shape, sample, margin))) found.push(shape.id);
    }
    if (found.length === 0) return;
    for (const id of found) erased.add(id);
    editor.deleteShapes(found);
  }

  const idle: ToolState = {
    id: "idle",
    onPointerDown(e) {
      editor.beginGesture("eraser:erase");
      reset();
      eraseTo(e.point);
      editor.transition("eraser.erasing");
    },
  };

  const erasing: ToolState = {
    id: "erasing",
    onPointerMove(e) {
      eraseTo(e.point);
    },
    onPointerUp() {
      editor.commitGesture();
      reset();
      editor.transition("eraser.idle");
    },
    onCancel() {
      editor.cancelGesture();
      reset();
      editor.transition("eraser.idle");
    },
  };

  return {
    id: "eraser",
    initial: "idle",
    onEnter() {
      reset();
      editor.setCursor("crosshair");
    },
    onExit() {
      editor.setCursor("default");
    },
    children: { idle, erasing },
  };
};
