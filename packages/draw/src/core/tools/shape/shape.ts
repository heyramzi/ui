// The shape tool: drag sizes it from the press, Shift keeps it square (line
// snaps to 15 degrees), Alt grows from the centre, a click drops a default size.

import type { Box, EditorApi, Id, PointerInfo, ToolFactory, ToolState, Vec } from "../../types";
import { dist } from "../../math/vec";

/** A move shorter than this many screen pixels is still a click. */
export const DRAG_THRESHOLD = 4;

/** Shift keeps a line on the 15 degree spokes. */
const ANGLE_STEP = Math.PI / 12;

function boxFromPoints(a: Vec, b: Vec): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

function snapAngle(origin: Vec, point: Vec): Vec {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return point;
  const angle = Math.round(Math.atan2(dy, dx) / ANGLE_STEP) * ANGLE_STEP;
  return { x: origin.x + Math.cos(angle) * length, y: origin.y + Math.sin(angle) * length };
}

/** Draws one shape of `type` per gesture, from the press point to the pointer, or around the press point with Alt held. */
export function createShapeTool(type: string): ToolFactory {
  return (editor: EditorApi): ToolState => {
    let shapeId: Id | null = null;
    let downPoint: Vec | null = null;
    let downScreen: Vec | null = null;
    let dragging = false;

    function reset(): void {
      shapeId = null;
      downPoint = null;
      downScreen = null;
      dragging = false;
    }

    /** The box a line takes: two page points turned into a box and box-local points. */
    function applyLine(id: Id, origin: Vec, point: Vec, alt: boolean, shift: boolean): void {
      const tip = shift ? snapAngle(origin, point) : point;
      let tail = origin;
      if (alt) tail = { x: origin.x * 2 - tip.x, y: origin.y * 2 - tip.y };
      const box = boxFromPoints(tail, tip);
      const shape = editor.getShape(id);
      editor.updateShapes([
        {
          id,
          x: box.x,
          y: box.y,
          w: box.w,
          h: box.h,
          props: {
            ...(shape?.props ?? {}),
            points: [
              { x: tail.x - box.x, y: tail.y - box.y },
              { x: tip.x - box.x, y: tip.y - box.y },
            ],
          },
        },
      ]);
    }

    function applyBox(id: Id, down: Vec, point: Vec, alt: boolean, shift: boolean): void {
      let dx = point.x - down.x;
      let dy = point.y - down.y;
      if (shift) {
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        dx = (dx < 0 ? -1 : 1) * size;
        dy = (dy < 0 ? -1 : 1) * size;
      }
      let box: Box;
      if (alt) {
        box = {
          x: down.x - Math.abs(dx),
          y: down.y - Math.abs(dy),
          w: Math.abs(dx) * 2,
          h: Math.abs(dy) * 2,
        };
      } else {
        box = boxFromPoints(down, { x: down.x + dx, y: down.y + dy });
      }
      editor.updateShapes([{ id, x: box.x, y: box.y, w: box.w, h: box.h }]);
    }

    function applyDrag(e: PointerInfo): void {
      const id = shapeId;
      const down = downPoint;
      if (!id || !down) return;
      if (type === "line") {
        applyLine(id, down, e.point, e.alt, e.shift);
      } else {
        applyBox(id, down, e.point, e.alt, e.shift);
      }
    }

    /** Drop the default size centered on the click. */
    function applyDefault(): void {
      const id = shapeId;
      const down = downPoint;
      if (!id || !down) return;
      const defaults = editor.getShapeUtil(type).defaults();
      editor.updateShapes([
        {
          id,
          x: down.x - defaults.w / 2,
          y: down.y - defaults.h / 2,
          w: defaults.w,
          h: defaults.h,
          props: defaults.props,
        },
      ]);
    }

    const idle: ToolState = {
      id: "idle",
      onPointerDown(e) {
        editor.beginGesture(`shape:${type}`);
        shapeId = editor.createShape({ type, x: e.point.x, y: e.point.y, w: 0, h: 0 });
        downPoint = e.point;
        downScreen = e.screen;
        dragging = false;
        editor.transition(`${type}.drawing`);
      },
    };

    const drawing: ToolState = {
      id: "drawing",
      onPointerMove(e) {
        if (!shapeId || !downScreen || !downPoint) return;
        if (!dragging) {
          if (dist(downScreen, e.screen) < DRAG_THRESHOLD) return;
          dragging = true;
        }
        applyDrag(e);
      },
      onPointerUp(e) {
        const id = shapeId;
        if (!id) return;
        if (dragging) applyDrag(e);
        else applyDefault();
        editor.commitGesture();
        editor.select([id]);
        reset();
        editor.setTool("select");
      },
      onCancel() {
        if (shapeId) editor.cancelGesture();
        reset();
        editor.transition(`${type}.idle`);
      },
    };

    return {
      id: type,
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
}
