import { describe, it, expect } from "vitest";
import { textUtil, wrapLines, type TextShape } from "./text";
import { rotatedBoxBounds } from "../math/box";
import { make } from "./test-fixtures";

const tx = (overrides: Partial<Omit<TextShape, "id" | "index">> = {}) =>
  make(textUtil, overrides);

describe("text bounds", () => {
  it("is the box when straight and the rotated box otherwise", () => {
    expect(textUtil.bounds(tx())).toEqual({ x: 0, y: 0, w: 160, h: 30 });
    const turned = tx({ rotation: Math.PI / 2 });
    expect(textUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("text hitTest", () => {
  it("hits inside the box only", () => {
    expect(textUtil.hitTest(tx(), { x: 10, y: 10 }, 0)).toBe(true);
    expect(textUtil.hitTest(tx(), { x: 0, y: 0 }, 0)).toBe(true);
    expect(textUtil.hitTest(tx(), { x: 200, y: 10 }, 0)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = tx({ rotation: Math.PI / 2 });
    expect(textUtil.hitTest(shape, { x: 85, y: -55 }, 0.5)).toBe(true);
    expect(textUtil.hitTest(shape, { x: 10, y: 10 }, 0.5)).toBe(false);
  });
});

describe("text resize", () => {
  it("returns only the changed size fields", () => {
    expect(textUtil.resize(tx(), "se", { x: 0, y: 0, w: 200, h: 60 })).toEqual({
      w: 200,
      h: 60,
    });
  });
});

describe("text toSvg", () => {
  it("writes one text element per line", () => {
    const svg = textUtil.toSvg(tx({ props: { text: "a\nb", fontSize: 20, align: "left" } }), {
      dark: false,
      style: "clean",
    });
    expect(svg.match(/<text/g)?.length).toBe(2);
  });

  it("wraps a line wider than the box at a space", () => {
    const svg = textUtil.toSvg(
      tx({ w: 120, props: { text: "one two three four five six", fontSize: 20, align: "left" } }),
      { dark: false, style: "clean" }
    );
    expect(svg.match(/<text/g)!.length).toBeGreaterThan(1);
  });
});

describe("wrapLines", () => {
  it("keeps newlines, breaks at spaces and never splits a word", () => {
    expect(wrapLines("a b\nc", 1000, 16)).toEqual(["a b", "c"]);
    expect(wrapLines("aaaa bbbb", 50, 16)).toEqual(["aaaa", "bbbb"]);
    expect(wrapLines("averyveryverylongword", 10, 16)).toEqual(["averyveryverylongword"]);
  });
});
