import { describe, expect, it } from "vitest";
import { createEditor, type Camera, type Editor } from "../core";
import {
  guideScreen,
  polygonPoints,
  rotatedScreenCorners,
  screenPoint,
  screenRect,
  selectionScreen,
} from "./overlay";

const CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

describe("screenPoint and screenRect", () => {
  it("maps a page point and a page box into screen space", () => {
    const camera: Camera = { x: 0, y: 0, zoom: 2 };
    expect(screenPoint({ x: 10, y: 20 }, camera)).toEqual({ x: 20, y: 40 });
    expect(screenRect({ x: 10, y: 20, w: 100, h: 50 }, camera)).toEqual({
      x: 20,
      y: 40,
      w: 200,
      h: 100,
    });
  });
});

describe("guideScreen", () => {
  it("turns a vertical guide into its two screen points", () => {
    expect(guideScreen({ axis: "x", at: 10, from: 0, to: 100 }, CAMERA)).toEqual({
      from: { x: 10, y: 0 },
      to: { x: 10, y: 100 },
    });
  });

  it("turns a horizontal guide into its two screen points", () => {
    expect(guideScreen({ axis: "y", at: 10, from: 0, to: 100 }, CAMERA)).toEqual({
      from: { x: 0, y: 10 },
      to: { x: 100, y: 10 },
    });
  });
});

describe("polygonPoints", () => {
  it("joins the points as SVG points", () => {
    expect(
      polygonPoints([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ])
    ).toBe("0,0 10,0 10,10");
  });
});

describe("rotatedScreenCorners", () => {
  it("returns the four corners in draw order with no rotation", () => {
    expect(rotatedScreenCorners({ x: 0, y: 0, w: 100, h: 100 }, 0, CAMERA)).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);
  });

  it("turns the corners about the box centre", () => {
    const corners = rotatedScreenCorners({ x: 0, y: 0, w: 100, h: 100 }, Math.PI / 2, CAMERA);
    expect(corners[0].x).toBeCloseTo(100);
    expect(corners[0].y).toBeCloseTo(0);
    expect(corners[2].x).toBeCloseTo(0);
    expect(corners[2].y).toBeCloseTo(100);
  });
});

describe("selectionScreen", () => {
  function editorWithRect(): Editor {
    const editor = createEditor();
    const id = editor.createShape({ type: "rect", x: 0, y: 0, w: 100, h: 100 });
    editor.setCamera(CAMERA);
    editor.select([id]);
    return editor;
  }

  it("returns null when nothing is selected", () => {
    expect(selectionScreen(createEditor())).toBeNull();
  });

  it("lays the box corners and grips out in screen space", () => {
    const screen = selectionScreen(editorWithRect());
    expect(screen).not.toBeNull();
    if (!screen) return;
    expect(screen.corners).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);
    expect(screen.resize).toHaveLength(8);
    expect(screen.rotate).toHaveLength(4);
  });
});
