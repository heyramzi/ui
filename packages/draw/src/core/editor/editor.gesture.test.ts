import { it, expect, describe } from "vitest";
import type { ShapeRecord, Snapshot } from "../types";
import { createEditor } from "./editor";
import { down, move, up, scriptPointer } from "./testing";

function filled(id: string, over: Partial<ShapeRecord> = {}): Partial<ShapeRecord> & { type: string } {
  return { id, type: "rect", x: 0, y: 0, w: 100, h: 100, props: { fill: true }, ...over };
}

// A drag tool is the smallest thing that exercises a gesture end to end:
// pointer down grabs a shape, moves apply live, up commits.
function dragTool(editor: ReturnType<typeof createEditor>) {
  let start = { x: 0, y: 0 };
  let origins: { id: string; x: number; y: number }[] = [];
  return () => ({
    id: "drag",
    initial: "idle",
    children: {
      idle: {
        id: "idle",
        onPointerDown(e: { point: { x: number; y: number }; targetId: string | null }) {
          if (!e.targetId) return;
          if (!editor.getSelectedIds().includes(e.targetId)) editor.select([e.targetId]);
          start = e.point;
          origins = editor
            .getSelectedIds()
            .map((id) => editor.getShape(id))
            .filter((s): s is ShapeRecord => !!s)
            .map((s) => ({ id: s.id, x: s.x, y: s.y }));
          editor.beginGesture("drag");
          editor.transition("drag.dragging");
        },
      },
      dragging: {
        id: "dragging",
        onPointerMove(e: { point: { x: number; y: number } }) {
          const dx = e.point.x - start.x;
          const dy = e.point.y - start.y;
          editor.updateShapes(origins.map((o) => ({ id: o.id, x: o.x + dx, y: o.y + dy })));
        },
        onPointerUp() {
          editor.commitGesture();
          editor.transition("drag.idle");
        },
        onCancel() {
          editor.cancelGesture();
          editor.transition("drag.idle");
        },
      },
    },
  });
}

function threeUp() {
  const editor = createEditor();
  editor.createShape(filled("a", { x: 0, y: 0 }));
  editor.createShape(filled("b", { x: 200, y: 0 }));
  editor.createShape(filled("c", { x: 400, y: 0 }));
  editor.registerTool("drag", dragTool(editor));
  editor.setTool("drag");
  editor.select(["a", "b", "c"]);
  return editor;
}

describe("scripted gesture", () => {
  it("moves three shapes and undoes in one step", () => {
    const editor = threeUp();
    scriptPointer(editor, [down([250, 50]), move([260, 60]), move([290, 90]), up([290, 90])]);
    expect(editor.getShapes().map((s) => s.x)).toEqual([40, 240, 440]);
    editor.undo();
    expect(editor.getShapes().map((s) => s.x)).toEqual([0, 200, 400]);
  });

  it("cancels a scripted drag back to a byte-equal snapshot", () => {
    const editor = threeUp();
    const before = JSON.stringify(editor.getStore().snapshot());
    scriptPointer(editor, [down([250, 50]), move([300, 80]), move([450, 120]), { type: "cancel" }]);
    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
  });
});

describe("editor performance", () => {
  function buildSnapshot(): Snapshot {
    const columns = 40;
    const shapes: Record<string, ShapeRecord> = {};
    for (let i = 0; i < 1000; i += 1) {
      const id = `shape:${i}`;
      shapes[id] = {
        id,
        type: "rect",
        x: (i % columns) * 120,
        y: Math.floor(i / columns) * 120,
        w: 100,
        h: 100,
        rotation: 0,
        parentId: null,
        index: String(i).padStart(5, "0"),
        props: { fill: true },
      };
    }
    return { schema: 1, shapes, bindings: {}, camera: { x: 0, y: 0, zoom: 1 } };
  }

  it("hit tests and box-selects 1,000 shapes in under 5 ms each", () => {
    const editor = createEditor({ snapshot: buildSnapshot() });
    const point = { x: (500 % 40) * 120 + 50, y: Math.floor(500 / 40) * 120 + 50 };
    const box = { x: 0, y: 0, w: 4800, h: 100 };
    // Warm both paths, then time them.
    editor.getTopShapeAt(point);
    editor.getShapesInBox(box, "intersect");

    const hitStart = performance.now();
    const hit = editor.getTopShapeAt(point);
    const hitMs = performance.now() - hitStart;

    const boxStart = performance.now();
    const inBox = editor.getShapesInBox(box, "intersect");
    const boxMs = performance.now() - boxStart;

    expect(hit).toBe("shape:500");
    expect(inBox.length).toBe(40);
    expect(hitMs).toBeLessThan(5);
    expect(boxMs).toBeLessThan(5);
  });
});
