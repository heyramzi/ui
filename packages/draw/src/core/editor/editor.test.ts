import { it, expect, describe } from "vitest";
import type { ShapeRecord, Snapshot } from "../types";
import { createEditor, type Editor } from "./editor";
import { down, move, up, scriptPointer } from "./testing";

function filled(id: string, over: Partial<ShapeRecord> = {}): Partial<ShapeRecord> & { type: string } {
  return { id, type: "rect", x: 0, y: 0, w: 100, h: 100, props: { fill: true }, ...over };
}

function add(editor: Editor, id: string, over: Partial<ShapeRecord> = {}): string {
  return editor.createShape(filled(id, over));
}

describe("editor reads", () => {
  it("creates a shape with the util defaults and puts it on top", () => {
    const editor = createEditor();
    const a = add(editor, "a");
    const b = add(editor, "b");
    const shape = editor.getShape(a);
    expect(shape?.w).toBe(100);
    expect(shape?.type).toBe("rect");
    expect(shape?.parentId).toBeNull();
    expect(editor.getShapes().map((s) => s.id)).toEqual([a, b]);
    expect((editor.getShape(b)?.index ?? "") > (editor.getShape(a)?.index ?? "")).toBe(true);
  });

  it("generates an id when none is given", () => {
    const editor = createEditor();
    const id = editor.createShape({ type: "rect" });
    expect(id.startsWith("shape:")).toBe(true);
    expect(editor.getShape(id)).toBeDefined();
  });

  it("returns children and cascades a delete to them", () => {
    const editor = createEditor();
    add(editor, "frame", { type: "frame", w: 400, h: 300 });
    add(editor, "child", { parentId: "frame" });
    expect(editor.getChildren("frame").map((s) => s.id)).toEqual(["child"]);
    editor.select(["child"]);
    editor.deleteShapes(["frame"]);
    expect(editor.getShape("frame")).toBeUndefined();
    expect(editor.getShape("child")).toBeUndefined();
    expect(editor.getSelectedIds()).toEqual([]);
  });

  it("reads bindings on both the arrow and the target side", () => {
    const editor = createEditor();
    add(editor, "arrow");
    add(editor, "box");
    const id = editor.createBinding({
      arrowId: "arrow",
      targetId: "box",
      terminal: "end",
      anchor: { x: 0.5, y: 0.5 },
    });
    expect(editor.getBindingsFor("arrow").map((b) => b.id)).toEqual([id]);
    expect(editor.getBindingsFor("box").map((b) => b.id)).toEqual([id]);
    editor.deleteBinding(id);
    expect(editor.getBindingsFor("box")).toEqual([]);
  });

  it("reads page bounds with rotation applied", () => {
    const editor = createEditor();
    add(editor, "a", { x: 0, y: 0, w: 100, h: 50, rotation: Math.PI / 2 });
    const bounds = editor.getPageBounds("a");
    expect(bounds.w).toBeCloseTo(50);
    expect(bounds.h).toBeCloseTo(100);
  });
});

describe("editor hit testing", () => {
  it("returns the topmost shape, front to back", () => {
    const editor = createEditor();
    add(editor, "under", { x: 0, y: 0, w: 100, h: 100 });
    add(editor, "over", { x: 10, y: 10, w: 100, h: 100 });
    expect(editor.getTopShapeAt({ x: 50, y: 50 })).toBe("over");
    expect(editor.getTopShapeAt({ x: 5, y: 5 })).toBe("under");
    expect(editor.getTopShapeAt({ x: 500, y: 500 })).toBeNull();
  });

  it("divides the hit margin by zoom", () => {
    const editor = createEditor();
    add(editor, "a", { x: 0, y: 0, w: 100, h: 100 });
    editor.setCamera({ x: 0, y: 0, zoom: 1 });
    expect(editor.getTopShapeAt({ x: 100 + 7, y: 50 }, 10)).toBe("a");
    editor.setCamera({ x: 0, y: 0, zoom: 2 });
    expect(editor.getTopShapeAt({ x: 100 + 7, y: 50 }, 10)).toBeNull();
  });

  it("selects by contain and by intersect", () => {
    const editor = createEditor();
    add(editor, "in", { x: 10, y: 10, w: 20, h: 20 });
    add(editor, "overlap", { x: 90, y: 90, w: 20, h: 20 });
    add(editor, "out", { x: 500, y: 500, w: 20, h: 20 });
    const box = { x: 0, y: 0, w: 100, h: 100 };
    expect(editor.getShapesInBox(box, "contain")).toEqual(["in"]);
    expect(editor.getShapesInBox(box, "intersect")).toEqual(["in", "overlap"]);
  });
});

describe("editor selection", () => {
  it("never enters history", () => {
    const editor = createEditor();
    add(editor, "a");
    const diffs: unknown[] = [];
    editor.onDiff((diff) => diffs.push(diff));
    editor.select(["a"]);
    expect(editor.getSelectedIds()).toEqual(["a"]);
    expect(diffs).toEqual([]);
  });

  it("drops a shape from the selection when it is deleted through undo", () => {
    const editor = createEditor();
    add(editor, "a");
    editor.select(["a"]);
    editor.deleteShapes(["a"]);
    expect(editor.getSelectedIds()).toEqual([]);
    editor.undo();
    expect(editor.getShape("a")).toBeDefined();
    expect(editor.getSelectedIds()).toEqual([]);
  });
});

describe("editor history", () => {
  it("undoes and redoes a mutation", () => {
    const editor = createEditor();
    add(editor, "a", { x: 0, y: 0 });
    editor.updateShapes([{ id: "a", x: 40 }]);
    expect(editor.getShape("a")?.x).toBe(40);
    editor.undo();
    expect(editor.getShape("a")?.x).toBe(0);
    editor.redo();
    expect(editor.getShape("a")?.x).toBe(40);
  });

  it("keeps a create and a delete as separate steps", () => {
    const editor = createEditor();
    add(editor, "a");
    editor.deleteShapes(["a"]);
    editor.undo();
    expect(editor.getShape("a")).toBeDefined();
    editor.undo();
    expect(editor.getShape("a")).toBeUndefined();
  });
});

describe("editor gestures", () => {
  it("commits many mutations as one undo step", () => {
    const editor = createEditor();
    add(editor, "a", { x: 0 });
    add(editor, "b", { x: 0 });
    add(editor, "c", { x: 0 });
    editor.beginGesture("move");
    editor.updateShapes([{ id: "a", x: 10 }]);
    editor.updateShapes([{ id: "b", x: 20 }]);
    editor.updateShapes([{ id: "c", x: 30 }]);
    editor.commitGesture();
    expect(editor.getShapes().map((s) => s.x)).toEqual([10, 20, 30]);
    editor.undo();
    expect(editor.getShapes().map((s) => s.x)).toEqual([0, 0, 0]);
    editor.redo();
    expect(editor.getShapes().map((s) => s.x)).toEqual([10, 20, 30]);
  });

  it("cancels back to a byte-equal snapshot", () => {
    const editor = createEditor();
    add(editor, "a", { x: 0 });
    add(editor, "b", { x: 0 });
    const before = JSON.stringify(editor.getStore().snapshot());
    editor.beginGesture("move");
    editor.updateShapes([{ id: "a", x: 10 }]);
    editor.updateShapes([{ id: "b", x: 20, rotation: 1 }]);
    editor.createShape(filled("c"));
    editor.cancelGesture();
    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
  });

  it("throws on a nested begin and on a commit with no gesture", () => {
    const editor = createEditor();
    editor.beginGesture("one");
    expect(() => editor.beginGesture("two")).toThrow(/already open/);
    editor.commitGesture();
    expect(() => editor.commitGesture()).toThrow(/no gesture/);
  });

  it("reports diffs live inside a gesture and fires change", () => {
    const editor = createEditor();
    add(editor, "a");
    const diffs: unknown[] = [];
    let changes = 0;
    editor.onDiff((diff) => diffs.push(diff));
    editor.onChange(() => {
      changes += 1;
    });
    editor.beginGesture("move");
    editor.updateShapes([{ id: "a", x: 5 }]);
    editor.commitGesture();
    expect(diffs.length).toBe(1);
    expect(changes).toBeGreaterThan(0);
  });
});

describe("editor overlays and camera", () => {
  it("stores and reports overlays", () => {
    const editor = createEditor();
    editor.setBrush({ x: 1, y: 2, w: 3, h: 4 });
    editor.setGuides([{ axis: "x", at: 5, from: 0, to: 10 }]);
    editor.setCursor("grabbing");
    editor.setEditingId("a");
    expect(editor.getBrush()).toEqual({ x: 1, y: 2, w: 3, h: 4 });
    expect(editor.getGuides()).toEqual([{ axis: "x", at: 5, from: 0, to: 10 }]);
    expect(editor.getCursor()).toBe("grabbing");
    expect(editor.getEditingId()).toBe("a");
  });

  it("fires change for camera, selection and overlays", () => {
    const editor = createEditor();
    let changes = 0;
    editor.onChange(() => {
      changes += 1;
    });
    editor.setCamera({ x: 1, y: 1, zoom: 2 });
    editor.select(["a"]);
    editor.setBrush(null);
    expect(changes).toBe(3);
  });

  it("returns an unsubscribe", () => {
    const editor = createEditor();
    let changes = 0;
    const off = editor.onChange(() => {
      changes += 1;
    });
    editor.select([]);
    off();
    editor.select([]);
    expect(changes).toBe(1);
  });
});

describe("editor options", () => {
  it("opens a snapshot", () => {
    const shape: ShapeRecord = {
      id: "shape:1",
      type: "rect",
      x: 5,
      y: 6,
      w: 10,
      h: 10,
      rotation: 0,
      parentId: null,
      index: "a0",
      props: { fill: true },
    };
    const snapshot: Snapshot = {
      schema: 1,
      shapes: { "shape:1": shape },
      bindings: {},
      camera: { x: 1, y: 2, zoom: 3 },
    };
    const editor = createEditor({ snapshot });
    expect(editor.getShape("shape:1")).toEqual(shape);
    expect(editor.getCamera()).toEqual({ x: 1, y: 2, zoom: 3 });
  });
});

describe("editor scripted pointer input", () => {
  it("drives a registered tool through dispatch", () => {
    const editor = createEditor();
    add(editor, "a", { x: 0, y: 0, w: 100, h: 100 });
    const log: string[] = [];
    editor.registerTool("probe", () => ({
      id: "probe",
      children: {
        idle: { id: "idle", onPointerDown: (e) => log.push(`down:${e.targetId}`) },
      },
      initial: "idle",
    }));
    editor.setTool("probe");
    scriptPointer(editor, [down([50, 50])]);
    expect(log).toEqual(["down:a"]);
  });
});

describe("editor reorder", () => {
  it("brings a shape to the front and back", () => {
    const editor = createEditor();
    add(editor, "a");
    add(editor, "b");
    add(editor, "c");
    editor.reorder(["a"], "front");
    expect(editor.getShapes().map((s) => s.id)).toEqual(["b", "c", "a"]);
    editor.reorder(["a"], "back");
    expect(editor.getShapes().map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("moves a shape forward one step", () => {
    const editor = createEditor();
    add(editor, "a");
    add(editor, "b");
    add(editor, "c");
    editor.reorder(["a"], "forward");
    expect(editor.getShapes().map((s) => s.id)).toEqual(["b", "a", "c"]);
  });
});
