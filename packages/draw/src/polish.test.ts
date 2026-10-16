// The polish bar, one proven line at a time: every test drives the editor
// through `dispatch` like the renderer, so it fails when its named behavior is
// missing.

import { describe, expect, it } from "vitest";
import {
  createEditor,
  down,
  finishEditing,
  move,
  outline,
  screenToPage,
  scriptPointer,
  up,
  type Editor,
  type FreehandShape,
} from "./core";
import { createPenTool } from "./core/tools/pen/pen";
import { createSelectTool } from "./core/tools/select/select";
import { getSelectionHandles } from "./core/tools/select/handles";
import { cullShapes, pageViewport } from "./render/cull";
import { applyWheel } from "./render/input";
import { selectionScreen } from "./render/overlay";

function selectSetup(): Editor {
  const editor = createEditor();
  editor.registerTool("select", createSelectTool);
  editor.setTool("select");
  return editor;
}

function penSetup(): Editor {
  const editor = createEditor();
  editor.registerTool("pen", createPenTool);
  editor.setTool("pen");
  return editor;
}

function rect(id: string, over: Record<string, unknown> = {}) {
  return { id, type: "rect", x: 0, y: 0, w: 100, h: 100, props: { fill: true }, ...over };
}

/** Outline thickness (max y minus min y) of points in an x range. */
function thickness(points: number[][], fromX: number, toX: number): number {
  let min = Infinity;
  let max = -Infinity;
  for (const [x, y] of points) {
    if (x! >= fromX && x! <= toX) {
      if (y! < min) min = y!;
      if (y! > max) max = y!;
    }
  }
  return max - min;
}

function lineShape(pressures: number[]): FreehandShape {
  return {
    id: "ink",
    type: "freehand",
    x: 0,
    y: -20,
    w: 200,
    h: 40,
    rotation: 0,
    parentId: null,
    index: "a0",
    props: {
      accent: "ink",
      size: 24,
      points: pressures.map((pressure, i) => ({ x: i * 10, y: 0, pressure })),
    },
  };
}

describe("1. pen pressure", () => {
  it("gives a varying width for varying pressure", () => {
    // Two identical paths, one pressed lightly and one hard, measured away
    // from the round end caps.
    const light = thickness(outline(lineShape(Array(21).fill(0.1))), 40, 160);
    const hard = thickness(outline(lineShape(Array(21).fill(1))), 40, 160);
    expect(hard).toBeGreaterThan(light * 2);
  });

  it("gives a constant width for constant pressure", () => {
    const points = outline(lineShape(Array(21).fill(0.5)));
    const mid = thickness(points, 75, 125);
    const end = thickness(points, 150, 200);
    expect(end / mid).toBeLessThan(1.5);
    expect(mid / end).toBeLessThan(1.5);
  });

  it("records pen pressure through dispatch while a mouse stays at 0.5", () => {
    const pen = penSetup();
    scriptPointer(pen, [
      down([0, 0], { pointerType: "pen", pressure: 0.2 }),
      move([50, 0], { pointerType: "pen", pressure: 0.9 }),
      up([50, 0], { pointerType: "pen", pressure: 0.9 }),
    ]);
    const ink = pen.getShapes()[0] as FreehandShape;
    expect(ink.props.points.map((p) => p.pressure)).toContain(0.9);

    const mouse = penSetup();
    scriptPointer(mouse, [down([0, 0]), move([50, 0]), up([50, 0])]);
    const flat = mouse.getShapes()[0] as FreehandShape;
    expect(flat.props.points.every((p) => p.pressure === 0.5)).toBe(true);
  });
});

describe("2. culling", () => {
  it("drops shapes outside the viewport from the cull step", () => {
    const editor = createEditor();
    editor.createShape(rect("near", { x: 110, y: 110, w: 10, h: 10 }));
    editor.createShape(rect("far", { x: 900, y: 900, w: 10, h: 10 }));
    const viewport = pageViewport({ x: 100, y: 100, zoom: 1 }, { w: 200, h: 200 });
    expect(cullShapes(editor, editor.getShapes(), viewport).map((s) => s.id)).toEqual(["near"]);
  });
});

describe("3. lost pointer", () => {
  it("a cancel mid-drag restores the store and parks in idle", () => {
    const editor = selectSetup();
    editor.createShape(rect("a"));
    editor.select(["a"]);
    const before = JSON.stringify(editor.getStore().snapshot());
    scriptPointer(editor, [down([50, 50]), move([120, 80]), { type: "cancel" }]);
    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
    expect(editor.getActivePath()).toBe("select.idle");
  });
});

describe("4. anchored zoom", () => {
  it("keeps the page point under the cursor on ctrl-wheel", () => {
    const camera = { x: 60, y: 40, zoom: 1 };
    const next = applyWheel(
      camera,
      {
        clientX: 300,
        clientY: 200,
        deltaX: 0,
        deltaY: 50,
        deltaMode: 0,
        ctrlKey: true,
        metaKey: false,
        altKey: false,
      },
      { left: 0, top: 0 },
      800,
    );
    expect(next.zoom).toBeGreaterThan(camera.zoom);
    const pageBefore = screenToPage(camera, { x: 300, y: 200 });
    const pageAfter = screenToPage(next, { x: 300, y: 200 });
    expect(pageAfter.x).toBeCloseTo(pageBefore.x, 9);
    expect(pageAfter.y).toBeCloseTo(pageBefore.y, 9);
  });

  it("treats a trackpad pinch (wheel with ctrlKey) as a zoom, not a pan", () => {
    const camera = { x: 60, y: 40, zoom: 1 };
    const next = applyWheel(
      camera,
      {
        clientX: 100,
        clientY: 100,
        deltaX: 0,
        deltaY: -20,
        deltaMode: 0,
        ctrlKey: true,
        metaKey: false,
        altKey: false,
      },
      { left: 0, top: 0 },
      800,
    );
    expect(next.zoom).not.toBe(camera.zoom);
  });
});

describe("5. screen-size handles", () => {
  it("keeps the rotate zones the same screen pixels apart at any zoom", () => {
    const gap = (zoom: number): number => {
      const editor = selectSetup();
      editor.createShape(rect("a"));
      editor.select(["a"]);
      editor.setCamera({ x: 0, y: 0, zoom });
      const selection = selectionScreen(editor)!;
      const grip = selection.resize.find((h) => h.handle === "se")!.point;
      const zone = selection.rotate.find((h) => h.corner === "se")!.point;
      return Math.hypot(grip.x - zone.x, grip.y - zone.y);
    };
    expect(gap(2)).toBeCloseTo(gap(1), 9);
    expect(gap(1)).toBeCloseTo(Math.SQRT2 * 18, 9);
  });
});

describe("6. resize modifiers", () => {
  function dragSe(id: string, mods: { shift?: boolean; alt?: boolean }, to: [number, number]) {
    const editor = selectSetup();
    editor.createShape({ id, type: "rect", x: 0, y: 0, w: 200, h: 100, props: { fill: true } });
    editor.select([id]);
    const se = getSelectionHandles(editor).resize.find((h) => h.handle === "se")!.point;
    scriptPointer(editor, [down(se, mods), move(to, mods), up(to, mods)]);
    return editor;
  }

  it("shift on a corner keeps the aspect ratio", () => {
    const editor = dragSe("a", { shift: true }, [260, 160]);
    const shape = editor.getShape("a")!;
    expect(shape.w / shape.h).toBeCloseTo(2, 9);
  });

  it("shift on an edge keeps the aspect ratio", () => {
    const editor = selectSetup();
    editor.createShape({
      id: "a",
      type: "rect",
      x: 0,
      y: 0,
      w: 200,
      h: 100,
      props: { fill: true },
    });
    editor.select(["a"]);
    const e = getSelectionHandles(editor).resize.find((h) => h.handle === "e")!.point;
    scriptPointer(editor, [
      down(e, { shift: true }),
      move([260, 50], { shift: true }),
      up([260, 50], { shift: true }),
    ]);
    const shape = editor.getShape("a")!;
    expect(shape.w / shape.h).toBeCloseTo(2, 9);
    expect(shape.y).toBe(0);
  });

  it("alt resizes from the center", () => {
    const editor = dragSe("a", { alt: true }, [240, 140]);
    const shape = editor.getShape("a")!;
    expect(shape.x + shape.w / 2).toBeCloseTo(100, 9);
    expect(shape.y + shape.h / 2).toBeCloseTo(50, 9);
  });

  it("shift and alt together keep the ratio around the center", () => {
    const editor = dragSe("a", { shift: true, alt: true }, [260, 120]);
    const shape = editor.getShape("a")!;
    expect(shape.w / shape.h).toBeCloseTo(2, 9);
    expect(shape.x + shape.w / 2).toBeCloseTo(100, 9);
    expect(shape.y + shape.h / 2).toBeCloseTo(50, 9);
  });

  it("shift keeps a multi-shape resize proportional", () => {
    const editor = selectSetup();
    editor.createShape({
      id: "a",
      type: "rect",
      x: 0,
      y: 0,
      w: 200,
      h: 100,
      props: { fill: true },
    });
    editor.createShape({
      id: "b",
      type: "rect",
      x: 0,
      y: 200,
      w: 200,
      h: 100,
      props: { fill: true },
    });
    editor.select(["a", "b"]);
    const se = getSelectionHandles(editor).resize.find((h) => h.handle === "se")!.point;
    scriptPointer(editor, [
      down(se, { shift: true }),
      move([260, 360], { shift: true }),
      up([260, 360], { shift: true }),
    ]);
    const a = editor.getShape("a")!;
    const b = editor.getShape("b")!;
    expect(a.w / a.h).toBeCloseTo(2, 9);
    expect(b.w / b.h).toBeCloseTo(2, 9);
  });
});

describe("7. undo ignores selection", () => {
  it("undoes the move, not the select after it", () => {
    const editor = selectSetup();
    editor.createShape(rect("a"));
    editor.createShape(rect("b", { x: 300 }));
    editor.select(["a"]);
    scriptPointer(editor, [down([50, 50]), move([80, 50]), up([80, 50])]);
    expect(editor.getShape("a")).toMatchObject({ x: 30, y: 0 });
    editor.select(["b"]);
    editor.undo();
    expect(editor.getShape("a")).toMatchObject({ x: 0, y: 0 });
    expect(editor.getSelectedIds()).toEqual(["b"]);
  });
});

describe("8. double-click to edit text", () => {
  it.each([
    [
      "text",
      { type: "text", x: 0, y: 0, w: 160, h: 30, props: { text: "hi", fontSize: 20 } },
      [80, 15],
    ],
    [
      "note",
      { id: "n", type: "note", x: 0, y: 0, w: 160, h: 120, props: { text: "hi" } },
      [80, 60],
    ],
  ])("opens the editor on a double-clicked %s", (_name, shape, at) => {
    const editor = selectSetup();
    editor.createShape(shape as Parameters<Editor["createShape"]>[0]);
    scriptPointer(editor, [
      down(at as [number, number], { clicks: 2 }),
      up(at as [number, number]),
    ]);
    expect(editor.getEditingId()).toBe((shape as { id: string }).id ?? editor.getSelectedIds()[0]);
  });

  it("opens the editor on a frame label and saves back to its name", () => {
    const editor = selectSetup();
    editor.createShape({
      id: "f",
      type: "frame",
      x: 0,
      y: 0,
      w: 200,
      h: 100,
      props: { name: "Old" },
    });
    scriptPointer(editor, [down([100, 0], { clicks: 2 }), up([100, 0])]);
    expect(editor.getEditingId()).toBe("f");
    finishEditing(editor, "f", "New");
    expect((editor.getShape("f")!.props as { name: string }).name).toBe("New");
  });

  it.each(["rect", "ellipse", "diamond"])(
    "leaves the editor closed on a %s: it has no text prop",
    (type) => {
      const editor = selectSetup();
      editor.createShape({ id: "s", type, x: 0, y: 0, w: 100, h: 100, props: {} });
      const at = type === "rect" ? [50, 50] : type === "ellipse" ? [50, 50] : [50, 50];
      scriptPointer(editor, [
        down(at as [number, number], { clicks: 2 }),
        up(at as [number, number]),
      ]);
      expect(editor.getEditingId()).toBeNull();
    },
  );
});
