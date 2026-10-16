import type { EditorApi, Id, PointerInfo, ShapeRecord, ToolFactory, Vec } from "../../types";
import { anchorFromPoint, resolveArrowEnds } from "../../bindings";
import { arrowUtil, fitArrowEnds, type ArrowShape } from "../../shapes/arrow";

/** Below this many screen pixels a press is a click, not a drag. */
const DRAG_THRESHOLD_PX = 4;
/** Shift keeps the arrow on the 15 degree spokes. */
const ANGLE_STEP = Math.PI / 12;
/** How near a shape the pointer counts as over it, in screen pixels. */
const BIND_MARGIN_PX = 8;

/** Draws one arrow per gesture: pressing on a shape binds the tail, a tip landing on one binds on release, Shift snaps to 15 degrees, one undo step. */
export const createArrowTool: ToolFactory = (editor) => {
  let arrowId: Id | null = null;
  let downScreen: Vec | null = null;
  let dragging = false;
  let endTargetId: Id | null = null;
  let endAnchor: Vec | null = null;

  function reset(): void {
    arrowId = null;
    downScreen = null;
    dragging = false;
    endTargetId = null;
    endAnchor = null;
  }

  const currentArrow = (): ArrowShape | undefined => {
    if (!arrowId) return undefined;
    return editor.getShape(arrowId) as ArrowShape | undefined;
  };

  /** The frontmost non-arrow shape under a page point, ignoring the one being drawn. */
  function targetUnder(point: Vec): ShapeRecord | undefined {
    const zoom = editor.getCamera().zoom || 1;
    const shapes = editor.getShapes();
    for (let i = shapes.length - 1; i >= 0; i -= 1) {
      const shape = shapes[i];
      if (shape.type === "arrow") continue;
      if (editor.getShapeUtil(shape.type).hitTest(shape, point, BIND_MARGIN_PX / zoom)) {
        return shape;
      }
    }
    return undefined;
  }

  function snapAngle(origin: Vec, point: Vec): Vec {
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return point;
    const angle = Math.round(Math.atan2(dy, dx) / ANGLE_STEP) * ANGLE_STEP;
    return { x: origin.x + Math.cos(angle) * length, y: origin.y + Math.sin(angle) * length };
  }

  function updateArrow(point: Vec, shift: boolean): void {
    const arrow = currentArrow();
    if (!arrow) return;

    const ends = resolveArrowEnds(arrow, editor.getBindingsFor(arrow.id), (id) =>
      editor.getShape(id),
    );
    const end = shift ? snapAngle(ends.start, point) : point;

    const target = targetUnder(point);
    if (target) {
      endTargetId = target.id;
      endAnchor = anchorFromPoint(target, point);
    } else {
      endTargetId = null;
      endAnchor = null;
    }

    editor.updateShapes([{ id: arrow.id, ...fitArrowEnds(arrow, ends.start, end) }]);
  }

  function onPointerDown(e: PointerInfo): void {
    editor.beginGesture("arrow:create");
    reset();

    downScreen = e.screen;
    const candidate = e.targetId ? editor.getShape(e.targetId) : undefined;
    const startTarget = candidate && candidate.type !== "arrow" ? candidate : undefined;

    const defaults = arrowUtil.defaults();
    const id = editor.createShape({
      type: "arrow",
      x: e.point.x,
      y: e.point.y,
      w: 0,
      h: 0,
      props: { ...defaults.props, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
    });
    arrowId = id;

    if (startTarget) {
      editor.createBinding({
        arrowId: id,
        targetId: startTarget.id,
        terminal: "start",
        anchor: anchorFromPoint(startTarget, e.point),
      });
    }
    editor.select([id]);
  }

  function onPointerMove(e: PointerInfo): void {
    if (!arrowId || !downScreen) return;
    if (!dragging) {
      if (Math.hypot(e.screen.x - downScreen.x, e.screen.y - downScreen.y) < DRAG_THRESHOLD_PX) {
        return;
      }
      dragging = true;
    }
    updateArrow(e.point, e.shift);
  }

  function onPointerUp(e: PointerInfo): void {
    const id = arrowId;
    if (!id) return;

    if (!dragging) {
      editor.cancelGesture();
      reset();
      editor.setTool("select");
      return;
    }

    updateArrow(e.point, e.shift);
    if (endTargetId && endAnchor) {
      editor.createBinding({
        arrowId: id,
        targetId: endTargetId,
        terminal: "end",
        anchor: endAnchor,
      });
      const arrow = currentArrow();
      if (arrow) {
        const ends = resolveArrowEnds(arrow, editor.getBindingsFor(arrow.id), (sid) =>
          editor.getShape(sid),
        );
        editor.updateShapes([{ id, ...fitArrowEnds(arrow, ends.start, ends.end) }]);
      }
    }

    editor.commitGesture();
    editor.select([id]);
    reset();
    editor.setTool("select");
  }

  function onCancel(): void {
    if (arrowId) editor.cancelGesture();
    reset();
    editor.setTool("select");
  }

  return {
    id: "arrow",
    onEnter: () => editor.setCursor("crosshair"),
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onCancel,
  };
};
