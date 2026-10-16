import { it, expect, describe } from "vitest";
import { ZERO_INDEX, indexBetween } from "./index";

describe("indexBetween", () => {
  it("returns the zero index for an empty list", () => {
    expect(indexBetween(null, null)).toBe(ZERO_INDEX);
  });

  it("matches the index domain tldraw uses", () => {
    expect(indexBetween("a0", "a2")).toBe("a1");
    expect(indexBetween("a0", null)).toBe("a1");
    expect(indexBetween(null, "a0")).toBe("Zz");
    const between = indexBetween("a0", "a1");
    expect("a0" < between && between < "a1").toBe(true);
  });

  it("steps the integer part when appending", () => {
    expect(indexBetween("a1", null)).toBe("a2");
    expect(indexBetween("az", null)).toBe("b00");
    expect(indexBetween("Zz", null)).toBe("a0");
  });

  it("steps the integer part when prepending", () => {
    expect(indexBetween(null, "Zz")).toBe("Zy");
    expect(indexBetween(null, "Z0")).toBe("Yzz");
  });

  it("keeps 1,000 appends short and strict", () => {
    let previous = ZERO_INDEX;
    let longest = 0;
    for (let i = 0; i < 1000; i += 1) {
      const key = indexBetween(previous, null);
      expect(key > previous).toBe(true);
      previous = key;
      longest = Math.max(longest, key.length);
    }
    expect(longest).toBeLessThanOrEqual(4);
  });

  it("keeps 1,000 inserts between the same neighbours strict", () => {
    const low = "a0";
    let high = "a1";
    const keys: string[] = [];
    for (let i = 0; i < 1000; i += 1) {
      const key = indexBetween(low, high);
      expect(low < key && key < high).toBe(true);
      keys.push(key);
      high = key;
    }
    const sorted = [...keys].sort();
    expect(new Set(keys).size).toBe(keys.length);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i - 1] < sorted[i]).toBe(true);
    }
  });

  it("keeps random inserts ordered", () => {
    const items = [indexBetween(null, null)];
    for (let i = 0; i < 500; i += 1) {
      const at = Math.floor(Math.random() * (items.length + 1));
      const a = at === 0 ? null : items[at - 1];
      const b = at === items.length ? null : items[at];
      const key = indexBetween(a, b);
      if (a !== null) {
        expect(a < key).toBe(true);
      }
      if (b !== null) {
        expect(key < b).toBe(true);
      }
      items.splice(at, 0, key);
    }
    for (let i = 1; i < items.length; i += 1) {
      expect(items[i - 1] < items[i]).toBe(true);
    }
  });

  it("throws when the range is inverted", () => {
    expect(() => indexBetween("a2", "a1")).toThrow();
  });

  it("rejects a malformed key", () => {
    expect(() => indexBetween("00", "a2")).toThrow(/invalid index/);
    expect(() => indexBetween("a00", "a2")).toThrow(/invalid index/);
    expect(() => indexBetween("A" + "0".repeat(26), "a2")).toThrow(/invalid index/);
  });
});
