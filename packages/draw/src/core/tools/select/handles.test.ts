import { describe, expect, it } from "vitest";
import { createEditor } from "../../editor";
import { rotate } from "../../math/vec";
import { findHandleAt, getSelectionBox, getSelectionHandles } from "./handles";

function filled(x: number, y: number, extra: Record<string, unknown> = {}) {
  return { type: "rect", x, y, w: 100, h: 100, props: { fill: true }, ...extra };
}

describe("getSelectionBox", () => {
  it("keeps one shape's own box and rotation", () => {
    const editor = createEditor();
    editor.createShape({ id: "a", ...filled(0, 0, { rotation: Math.PI / 4 }) });
    editor.select(["a"]);
    const geometry = getSelectionBox(editor);
    expect(geometry.single?.id).toBe("a");
    expect(geometry.rotation).toBeCloseTo(Math.PI / 4);
    expect(geometry.box).toEqual({ x: 0, y: 0, w: 100, h: 100 });
  });

  it("falls back to the union box for many shapes", () => {
    const editor = createEditor();
    editor.createShape({ id: "a", ...filled(0, 0) });
    editor.createShape({ id: "b", ...filled(200, 50) });
    editor.select(["a", "b"]);
    const geometry = getSelectionBox(editor);
    expect(geometry.single).toBeNull();
    expect(geometry.rotation).toBe(0);
    expect(geometry.box).toEqual({ x: 0, y: 0, w: 300, h: 150 });
  });
});

describe("getSelectionHandles", () => {
  it("lays out eight resize grips and four rotate zones", () => {
    const editor = createEditor();
    editor.createShape({ id: "a", ...filled(0, 0) });
    editor.select(["a"]);
    const handles = getSelectionHandles(editor);
    expect(handles.resize.map((h) => h.handle)).toEqual([
      "nw",
      "n",
      "ne",
      "e",
      "se",
      "s",
      "sw",
      "w",
    ]);
    expect(handles.rotate.map((h) => h.corner)).toEqual(["nw", "ne", "se", "sw"]);
    expect(handles.resize.find((h) => h.handle === "n")?.point).toEqual({ x: 50, y: 0 });
    expect(handles.resize.find((h) => h.handle === "se")?.point).toEqual({ x: 100, y: 100 });
  });

  it("turns the grips with a rotated shape", () => {
    const editor = createEditor();
    editor.createShape({ id: "a", ...filled(0, 0, { rotation: Math.PI / 4 }) });
    editor.select(["a"]);
    const handles = getSelectionHandles(editor);
    const expected = rotate({ x: 0, y: 0 }, { x: 50, y: 50 }, Math.PI / 4);
    const nw = handles.resize.find((h) => h.handle === "nw");
    expect(nw?.point.x).toBeCloseTo(expected.x);
    expect(nw?.point.y).toBeCloseTo(expected.y);
  });

  it("scales the rotate offset with zoom so it stays on screen", () => {
    const editor = createEditor();
    editor.createShape({ id: "a", ...filled(0, 0) });
    editor.select(["a"]);
    const near = getSelectionHandles(editor).rotate.find((h) => h.corner === "nw")!.point;
    editor.setCamera({ x: 0, y: 0, zoom: 2 });
    const far = getSelectionHandles(editor).rotate.find((h) => h.corner === "nw")!.point;
    expect(far.x - 0).toBeCloseTo((near.x - 0) / 2);
  });
});

describe("findHandleAt", () => {
  it("hits a resize grip on the box edge", () => {
    const editor = createEditor();
    editor.createShape({ id: "a", ...filled(0, 0) });
    editor.select(["a"]);
    expect(findHandleAt(editor, { x: 50, y: 0 })).toEqual({ kind: "resize", handle: "n" });
    expect(findHandleAt(editor, { x: 100, y: 100 })).toEqual({ kind: "resize", handle: "se" });
  });

  it("hits a rotate zone just outside a corner", () => {
    const editor = createEditor();
    editor.createShape({ id: "a", ...filled(0, 0) });
    editor.select(["a"]);
    expect(findHandleAt(editor, { x: -18, y: -18 })).toEqual({ kind: "rotate", corner: "nw" });
  });

  it("returns null in the middle of a shape", () => {
    const editor = createEditor();
    editor.createShape({ id: "a", ...filled(0, 0) });
    editor.select(["a"]);
    expect(findHandleAt(editor, { x: 50, y: 50 })).toBeNull();
  });
});
