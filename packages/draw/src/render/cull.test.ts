import { describe, expect, it } from "vitest";
import type { Camera, EditorApi, ShapeRecord } from "../core";
import { isShapeVisible, pageViewport, shapeBounds, zOrdered } from "./cull";

function shape(over: Partial<ShapeRecord> & { id: string }): ShapeRecord {
  const { id, ...rest } = over;
  return {
    id,
    type: "rect",
    x: 0,
    y: 0,
    w: 10,
    h: 10,
    rotation: 0,
    parentId: null,
    index: "a1",
    props: {},
    ...rest,
  };
}

describe("pageViewport", () => {
  it("is the page box a screen-sized viewport covers at the zoom", () => {
    const camera: Camera = { x: 10, y: 20, zoom: 2 };
    expect(pageViewport(camera, { w: 400, h: 300 })).toEqual({ x: 10, y: 20, w: 200, h: 150 });
  });

  it("treats a zero zoom as one", () => {
    const camera: Camera = { x: 0, y: 0, zoom: 0 };
    expect(pageViewport(camera, { w: 100, h: 100 })).toEqual({ x: 0, y: 0, w: 100, h: 100 });
  });
});

describe("isShapeVisible", () => {
  const viewport = { x: 100, y: 100, w: 50, h: 50 };

  it("is true only when the box touches the viewport", () => {
    expect(isShapeVisible({ x: 0, y: 0, w: 10, h: 10 }, viewport)).toBe(false);
    expect(isShapeVisible({ x: 120, y: 120, w: 10, h: 10 }, viewport)).toBe(true);
    expect(isShapeVisible({ x: 145, y: 145, w: 10, h: 10 }, viewport)).toBe(true);
  });

  it("grows the viewport by the margin", () => {
    expect(isShapeVisible({ x: 0, y: 0, w: 10, h: 10 }, viewport, 200)).toBe(true);
  });
});

describe("shapeBounds", () => {
  it("reads the bounds from the util", () => {
    const editor = {
      getPageBounds: () => ({ x: 1, y: 2, w: 3, h: 4 }),
    } as unknown as EditorApi;
    expect(shapeBounds(editor, shape({ id: "a" }))).toEqual({ x: 1, y: 2, w: 3, h: 4 });
  });

  it("falls back to the shape's own box when the type is unregistered", () => {
    const editor = {
      getPageBounds: () => {
        throw new Error("Unknown shape type");
      },
    } as unknown as EditorApi;
    expect(shapeBounds(editor, shape({ id: "a", x: 5, y: 6, w: 7, h: 8 }))).toEqual({
      x: 5,
      y: 6,
      w: 7,
      h: 8,
    });
  });
});

describe("zOrdered", () => {
  it("sorts siblings by index and keeps a child after its parent", () => {
    const ordered = zOrdered([
      shape({ id: "child", parentId: "p", index: "a0" }),
      shape({ id: "second", index: "b1" }),
      shape({ id: "p", index: "b0" }),
      shape({ id: "first", index: "a1" }),
    ]);
    expect(ordered.map((s) => s.id)).toEqual(["first", "p", "child", "second"]);
  });

  it("still draws a shape whose parent is missing", () => {
    const ordered = zOrdered([shape({ id: "orphan", parentId: "gone", index: "a1" })]);
    expect(ordered.map((s) => s.id)).toEqual(["orphan"]);
  });
});
