import { describe, it, expect } from "vitest";
import { noteUtil, type NoteShape } from "./note";
import { rotatedBoxBounds, boxCenter } from "../math/box";
import { make } from "./test-fixtures";

const note = (overrides: Partial<Omit<NoteShape, "id" | "index">> = {}) =>
  make(noteUtil, overrides);

describe("note bounds", () => {
  it("is the box when straight and the rotated box otherwise", () => {
    expect(noteUtil.bounds(note())).toEqual({ x: 0, y: 0, w: 160, h: 120 });
    const turned = note({ rotation: Math.PI / 2 });
    expect(noteUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("note hitTest", () => {
  it("is filled, so it hits anywhere inside", () => {
    expect(noteUtil.hitTest(note(), { x: 80, y: 60 }, 0)).toBe(true);
    expect(noteUtil.hitTest(note(), { x: 0, y: 0 }, 0)).toBe(true);
    expect(noteUtil.hitTest(note(), { x: 300, y: 60 }, 0)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = note({ rotation: Math.PI });
    const inside = { x: shape.x + shape.w / 2 + 10, y: shape.y + shape.h / 2 };
    const turned = { x: inside.x, y: inside.y };
    expect(noteUtil.hitTest(shape, turned, 0)).toBe(true);
    const outside = { x: boxCenter(shape).x - shape.w, y: shape.y };
    expect(noteUtil.hitTest(shape, outside, 0)).toBe(false);
  });
});

describe("note resize", () => {
  it("returns only the changed size fields", () => {
    expect(noteUtil.resize(note(), "se", { x: 0, y: 0, w: 200, h: 180 })).toEqual({
      w: 200,
      h: 180,
    });
  });
});

describe("note toSvg", () => {
  it("draws a filled rect and its text", () => {
    const svg = noteUtil.toSvg(note({ props: { text: "hi", fontSize: 16 } }), {
      dark: false,
      style: "clean",
    });
    expect(svg).toContain("<rect");
    expect(svg).toContain("<text");
  });
});
