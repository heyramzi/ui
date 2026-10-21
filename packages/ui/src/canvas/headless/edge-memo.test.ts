import { describe, expect, it, vi } from "vite-plus/test";
import { boxKey, createMemo, parseBox } from "#src/canvas/headless/edge-memo.js";

describe("boxKey", () => {
  it("round-trips a box, fractions and negatives included", () => {
    const box = { x: -12.5, y: 40, width: 220, height: 96.25 };
    expect(parseBox(boxKey(box))).toEqual(box);
  });

  it("reads a card with no size as no box", () => {
    expect(boxKey(null)).toBe("");
    expect(parseBox("")).toBeNull();
  });

  it("is equal for equal boxes and different when any side moves", () => {
    const base = { x: 1, y: 2, width: 3, height: 4 };
    expect(boxKey({ ...base })).toBe(boxKey(base));
    for (const key of ["x", "y", "width", "height"] as const) {
      expect(boxKey({ ...base, [key]: base[key] + 1 })).not.toBe(boxKey(base));
    }
  });
});

describe("createMemo", () => {
  it("computes once per key", () => {
    const memo = createMemo<number>(10);
    const compute = vi.fn(() => 7);
    expect(memo("a", compute)).toBe(7);
    expect(memo("a", compute)).toBe(7);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it("returns the very same object on a hit, so a derived reading it stays equal", () => {
    const memo = createMemo<{ d: string }>(10);
    const first = memo("a", () => ({ d: "M0 0" }));
    expect(memo("a", () => ({ d: "other" }))).toBe(first);
  });

  it("drops the least recently read key past the limit", () => {
    const memo = createMemo<number>(2);
    memo("a", () => 1);
    memo("b", () => 2);
    memo("a", () => 99);
    memo("c", () => 3);
    const again = vi.fn(() => 0);
    memo("a", again);
    memo("b", again);
    expect(again).toHaveBeenCalledTimes(1);
  });

  it("keeps a falsy result", () => {
    const memo = createMemo<number>(2);
    const compute = vi.fn(() => 0);
    memo("zero", compute);
    memo("zero", compute);
    expect(compute).toHaveBeenCalledTimes(1);
  });
});
