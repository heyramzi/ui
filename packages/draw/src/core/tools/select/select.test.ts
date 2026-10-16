import { describe, expect, it } from "vitest";
import { createEditor, down, move, scriptPointer, up, type Editor } from "../../editor";
import { boxCenter } from "../../math/box";
import { rotate } from "../../math/vec";
import { getSelectionHandles } from "./handles";
import { createSelectTool } from "./select";

function setup(): Editor {
  const editor = createEditor();
  editor.registerTool("select", createSelectTool);
  editor.setTool("select");
  return editor;
}

function filled(id: string, over: Record<string, unknown> = {}) {
  return { id, type: "rect", x: 0, y: 0, w: 100, h: 100, props: { fill: true }, ...over };
}

describe("select clicks", () => {
  it("selects a shape on click and toggles with shift", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.createShape(filled("b", { x: 200 }));

    scriptPointer(editor, [down([50, 50]), up([50, 50])]);
    expect(editor.getSelectedIds()).toEqual(["a"]);

    scriptPointer(editor, [down([250, 50], { shift: true }), up([250, 50], { shift: true })]);
    expect(editor.getSelectedIds()).toEqual(["a", "b"]);

    scriptPointer(editor, [down([50, 50], { shift: true }), up([50, 50], { shift: true })]);
    expect(editor.getSelectedIds()).toEqual(["b"]);
  });

  it("clears the selection on an empty canvas click", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    scriptPointer(editor, [down([500, 500]), up([500, 500])]);
    expect(editor.getSelectedIds()).toEqual([]);
  });

  it("opens the text editor on a double click", () => {
    const editor = setup();
    editor.createShape({ id: "n", type: "note", x: 0, y: 0, w: 100, h: 100 });
    scriptPointer(editor, [down([50, 50], { clicks: 2 }), up([50, 50])]);
    expect(editor.getEditingId()).toBe("n");
  });
});

describe("select drag threshold", () => {
  it("does nothing on a move below four pixels", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    scriptPointer(editor, [down([50, 50]), move([52, 50]), up([52, 50])]);
    expect(editor.getShape("a")).toMatchObject({ x: 0, y: 0 });
    expect(editor.getActivePath()).toBe("select.idle");
  });
});

describe("translate", () => {
  it("moves the selection and commits one undo step", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    scriptPointer(editor, [down([50, 50]), move([80, 50]), move([100, 60]), up([100, 60])]);
    expect(editor.getShape("a")).toMatchObject({ x: 50, y: 10 });
    editor.undo();
    expect(editor.getShape("a")).toMatchObject({ x: 0, y: 0 });
    editor.redo();
    expect(editor.getShape("a")).toMatchObject({ x: 50, y: 10 });
  });

  it("restores everything when Escape cancels mid-drag", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    const before = JSON.stringify(editor.getStore().snapshot());
    scriptPointer(editor, [down([50, 50]), move([100, 100]), { type: "cancel" }]);
    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
    expect(editor.getActivePath()).toBe("select.idle");
  });

  it("publishes snap guides and clears them on release", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.createShape(filled("b", { x: 300 }));
    editor.select(["a"]);
    scriptPointer(editor, [down([50, 50]), move([248, 50])]);
    expect(editor.getGuides().length).toBeGreaterThan(0);
    scriptPointer(editor, [up([248, 50])]);
    expect(editor.getGuides()).toEqual([]);
    expect(editor.getShape("a")?.x).toBe(200);
  });

  it("duplicates first on an alt drag", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    scriptPointer(editor, [
      down([50, 50], { alt: true }),
      move([54, 50], { alt: true }),
      move([104, 50], { alt: true }),
      up([104, 50], { alt: true }),
    ]);
    expect(editor.getShapes()).toHaveLength(2);
    expect(editor.getShape("a")).toMatchObject({ x: 0, y: 0 });
    editor.undo();
    expect(editor.getShapes()).toHaveLength(1);
    expect(editor.getShape("a")).toMatchObject({ x: 0, y: 0 });
  });
});

describe("resize", () => {
  it("keeps the far corner fixed on a rotated shape", () => {
    const editor = setup();
    editor.createShape(filled("a", { x: 100, y: 100, w: 100, h: 50, rotation: Math.PI / 4 }));
    editor.select(["a"]);
    const before = editor.getShape("a")!;
    const beforeCorner = rotate(
      { x: before.x, y: before.y },
      boxCenter(before),
      before.rotation,
    );
    const se = getSelectionHandles(editor).resize.find((h) => h.handle === "se")!.point;
    scriptPointer(editor, [
      down(se),
      move([se.x + 40, se.y + 30]),
      up([se.x + 40, se.y + 30]),
    ]);
    const after = editor.getShape("a")!;
    const afterCorner = rotate({ x: after.x, y: after.y }, boxCenter(after), after.rotation);
    expect(afterCorner.x).toBeCloseTo(beforeCorner.x);
    expect(afterCorner.y).toBeCloseTo(beforeCorner.y);
  });

  it("cancels a resize with Escape", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    const before = JSON.stringify(editor.getStore().snapshot());
    const se = getSelectionHandles(editor).resize.find((h) => h.handle === "se")!.point;
    scriptPointer(editor, [down(se), move([se.x + 40, se.y + 40]), { type: "cancel" }]);
    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
  });
});

describe("rotate", () => {
  it("lands on fifteen degree steps with shift held", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    const zone = getSelectionHandles(editor).rotate.find((h) => h.corner === "ne")!.point;
    scriptPointer(editor, [
      down(zone),
      move([zone.x + 40, zone.y + 10], { shift: true }),
      up([zone.x + 40, zone.y + 10], { shift: true }),
    ]);
    const step = Math.PI / 12;
    const rotation = editor.getShape("a")!.rotation;
    expect(Math.abs(rotation / step - Math.round(rotation / step))).toBeLessThan(1e-9);
  });

  it("cancels a rotation with Escape", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    const zone = getSelectionHandles(editor).rotate.find((h) => h.corner === "ne")!.point;
    scriptPointer(editor, [down(zone), move([zone.x + 30, zone.y]), { type: "cancel" }]);
    expect(editor.getShape("a")?.rotation).toBe(0);
  });
});

describe("brush", () => {
  it("selects shapes the box touches, and only enclosed ones with alt", () => {
    const editor = setup();
    editor.createShape(filled("in", { x: 20, y: 20, w: 20, h: 20 }));
    editor.createShape(filled("overlap", { x: 90, y: 90, w: 40, h: 40 }));

    scriptPointer(editor, [down([0, 0]), move([30, 30]), move([110, 110]), up([110, 110])]);
    expect(editor.getSelectedIds()).toEqual(["in", "overlap"]);
    expect(editor.getBrush()).toBeNull();

    editor.select([]);
    scriptPointer(editor, [
      down([0, 0], { alt: true }),
      move([30, 30], { alt: true }),
      move([110, 110], { alt: true }),
      up([110, 110], { alt: true }),
    ]);
    expect(editor.getSelectedIds()).toEqual(["in"]);
  });
});

describe("cursors", () => {
  it("shows the resize cursor on a handle and default back in idle", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    scriptPointer(editor, [down([100, 100])]);
    expect(editor.getCursor()).toBe("nwse-resize");
    scriptPointer(editor, [up([100, 100])]);
    expect(editor.getCursor()).toBe("default");
  });
});

describe("keys", () => {
  it("undoes and redoes with meta+z", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    scriptPointer(editor, [down([50, 50]), move([100, 50]), up([100, 50])]);
    expect(editor.getShape("a")?.x).toBe(50);
    scriptPointer(editor, [{ type: "key_down", key: "z", mods: { meta: true } }]);
    expect(editor.getShape("a")?.x).toBe(0);
    scriptPointer(editor, [{ type: "key_down", key: "z", mods: { meta: true, shift: true } }]);
    expect(editor.getShape("a")?.x).toBe(50);
  });
});

describe("keys", () => {
  it("nudges by one and by ten with shift", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    scriptPointer(editor, [{ type: "key_down", key: "ArrowRight" }]);
    expect(editor.getShape("a")?.x).toBe(1);
    scriptPointer(editor, [{ type: "key_down", key: "ArrowRight", mods: { shift: true } }]);
    expect(editor.getShape("a")?.x).toBe(11);
  });

  it("deletes, clears and selects all", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.createShape(filled("b", { x: 200 }));
    editor.select(["a"]);
    scriptPointer(editor, [{ type: "key_down", key: "Delete" }]);
    expect(editor.getShape("a")).toBeUndefined();
    scriptPointer(editor, [{ type: "key_down", key: "a", mods: { meta: true } }]);
    expect(editor.getSelectedIds()).toEqual(["b"]);
    scriptPointer(editor, [{ type: "key_down", key: "Escape" }]);
    expect(editor.getSelectedIds()).toEqual([]);
  });

  it("duplicates with meta+d, offset by sixteen", () => {
    const editor = setup();
    editor.createShape(filled("a"));
    editor.select(["a"]);
    scriptPointer(editor, [{ type: "key_down", key: "d", mods: { meta: true } }]);
    const shapes = editor.getShapes();
    expect(shapes).toHaveLength(2);
    const copy = shapes.find((s) => s.id !== "a")!;
    expect(copy.x).toBe(16);
    expect(copy.y).toBe(16);
  });
});
