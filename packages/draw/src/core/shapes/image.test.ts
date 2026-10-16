import { describe, it, expect } from "vitest";
import { imageUtil, type ImageShape } from "./image";
import { rotatedBoxBounds } from "../math/box";
import { make } from "./test-fixtures";

const img = (overrides: Partial<Omit<ImageShape, "id" | "index">> = {}) =>
  make(imageUtil, overrides);

describe("image bounds", () => {
  it("is the box when straight and the rotated box otherwise", () => {
    expect(imageUtil.bounds(img())).toEqual({ x: 0, y: 0, w: 200, h: 140 });
    const turned = img({ rotation: Math.PI / 2 });
    expect(imageUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("image hitTest", () => {
  it("hits inside the box", () => {
    expect(imageUtil.hitTest(img(), { x: 100, y: 70 }, 0)).toBe(true);
    expect(imageUtil.hitTest(img(), { x: 0, y: 0 }, 0)).toBe(true);
    expect(imageUtil.hitTest(img(), { x: 400, y: 70 }, 0)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = img({ rotation: Math.PI / 2 });
    expect(imageUtil.hitTest(shape, { x: 100, y: -60 }, 0)).toBe(false);
    expect(imageUtil.hitTest(shape, { x: 100, y: 70 }, 0)).toBe(true);
  });
});

describe("image resize", () => {
  it("returns only the changed size fields", () => {
    expect(imageUtil.resize(img(), "se", { x: 0, y: 0, w: 250, h: 200 })).toEqual({
      w: 250,
      h: 200,
    });
  });
});

describe("image toSvg", () => {
  it("draws an image when there is a source, a placeholder otherwise", () => {
    expect(imageUtil.toSvg(img({ props: { src: "a.png" } }), { dark: false, style: "clean" })).toContain(
      "<image"
    );
    expect(imageUtil.toSvg(img(), { dark: false, style: "clean" })).toContain("<rect");
  });
});
