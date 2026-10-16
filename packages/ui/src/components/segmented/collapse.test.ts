import { describe, expect, it } from "vite-plus/test";
import { splitSegments } from "#src/components/segmented/collapse.js";

const items = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

describe("splitSegments", () => {
  it("keeps everything when the row can hold it", () => {
    expect(splitSegments(items.slice(0, 6), 6, 0)).toEqual({
      visible: ["a", "b", "c", "d", "e", "f"],
      hidden: [],
    });
  });

  it("leaves one slot for the menu once the row overflows", () => {
    const { visible, hidden } = splitSegments(items, 6, 0);
    expect(visible).toEqual(["a", "b", "c", "d", "e"]);
    expect(hidden).toEqual(["f", "g", "h"]);
  });

  it("pulls the current item into the last visible slot", () => {
    const { visible, hidden } = splitSegments(items, 6, 6);
    expect(visible).toEqual(["a", "b", "c", "d", "g"]);
    expect(hidden).toEqual(["e", "f", "h"]);
  });

  it("loses nothing whichever item is current", () => {
    for (let i = 0; i < items.length; i++) {
      const { visible, hidden } = splitSegments(items, 6, i);
      expect([...visible, ...hidden].sort()).toEqual([...items].sort());
      expect(visible).toContain(items[i]);
      expect(visible).toHaveLength(5);
    }
  });

  it("draws the whole strip when nothing is current and it fits", () => {
    expect(splitSegments(items.slice(0, 3), 6, -1).hidden).toEqual([]);
  });

  it("collapses the tail when nothing is current", () => {
    expect(splitSegments(items, 6, -1)).toEqual({
      visible: ["a", "b", "c", "d", "e"],
      hidden: ["f", "g", "h"],
    });
  });

  it("refuses to split into a menu plus one segment", () => {
    expect(splitSegments(items, 2, 5).hidden).toEqual([]);
  });
});
