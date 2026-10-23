import { describe, expect, it } from "vite-plus/test";
import { locate, nextJump, outputAt, playlist, relocate } from "#src/core/clock.js";
import type { LiveRange } from "#src/core/types.js";

const r = (source: string, start: number, end: number, kept = true): LiveRange => ({
  source,
  start,
  end,
  kept,
});

// Two takes: A 0-4 and 6-9 kept, B 10-12 kept, A 4-6 dropped.
const ranges = [r("a", 0, 4), r("a", 4, 6, false), r("a", 6, 9), r("b", 10, 12)];

describe("playlist", () => {
  it("counts kept lengths only, so a dropped range takes no time", () => {
    const list = playlist(ranges);
    expect(list.duration).toBe(9);
    expect(list.pieces.map((p) => [p.source, p.start, p.end, p.at])).toEqual([
      ["a", 0, 4, 0],
      ["a", 6, 9, 4],
      ["b", 10, 12, 7],
    ]);
  });

  it("follows the array's order for a reorder", () => {
    const list = playlist([r("b", 10, 12), r("a", 6, 9), r("a", 0, 4)]);
    expect(list.pieces.map((p) => [p.source, p.start, p.at])).toEqual([
      ["b", 10, 0],
      ["a", 6, 2],
      ["a", 0, 5],
    ]);
  });

  it("plays ranges that touch in one take as one piece", () => {
    const list = playlist([r("a", 0, 2), r("a", 2, 5), r("a", 5, 6, false), r("a", 6, 7)]);
    expect(list.pieces).toHaveLength(2);
    expect(list.pieces[0]).toMatchObject({ start: 0, end: 5 });
  });

  it("holds nothing when nothing is kept", () => {
    expect(playlist([r("a", 0, 4, false)])).toEqual({ pieces: [], duration: 0 });
  });

  it("counts the render's frames with fps, so many cuts don't drift off the timeline", () => {
    // 40 ranges of 0.52s: 15.6 frames each at 30 fps. The render plays round(end) minus round(start) frames.
    const ranges = Array.from({ length: 40 }, (_, i) => r("a", i, i + 0.52));
    const list = playlist(ranges, 30);
    expect(list.duration * 30).toBeCloseTo(40 * 16);
    expect(list.pieces[1]?.at).toBeCloseTo(16 / 30);
  });

  it("holds one frame for a range too short to round to one, as the render does", () => {
    const list = playlist([r("a", 0, 1), r("b", 3, 3)], 30);
    expect(list.duration).toBeCloseTo(31 / 30);
    expect(list.pieces).toHaveLength(2);
  });
});

describe("locate and outputAt", () => {
  const list = playlist(ranges);

  it("seeks into the middle of a range", () => {
    expect(locate(list, 1.5)).toEqual({ index: 0, source: "a", seconds: 1.5 });
    expect(locate(list, 5)).toEqual({ index: 1, source: "a", seconds: 7 });
    expect(locate(list, 8)).toEqual({ index: 2, source: "b", seconds: 11 });
  });

  it("lands a range's boundary in the next range", () => {
    expect(locate(list, 4)).toEqual({ index: 1, source: "a", seconds: 6 });
  });

  it("clamps to the first moment and the last range's end", () => {
    expect(locate(list, -3)).toEqual({ index: 0, source: "a", seconds: 0 });
    expect(locate(list, 99)).toEqual({ index: 2, source: "b", seconds: 12 });
  });

  it("answers null for a cut with nothing in it", () => {
    expect(locate(playlist([]), 1)).toBeNull();
  });

  it("maps a take's second back to the cut's clock", () => {
    expect(outputAt(list, 1, 7)).toBe(5);
    expect(outputAt(list, 2, 12)).toBe(9);
    expect(outputAt(list, 2, 3)).toBe(7);
  });
});

describe("nextJump", () => {
  const list = playlist(ranges);

  it("names the next piece's take and start, across takes too", () => {
    expect(nextJump(list, 0)).toEqual({ index: 1, source: "a", seconds: 6 });
    expect(nextJump(list, 1)).toEqual({ index: 2, source: "b", seconds: 10 });
  });

  it("has nothing after the last range ends", () => {
    expect(nextJump(list, 2)).toBeNull();
  });
});

describe("relocate", () => {
  it("finds the same moment of a take after a note moved the cut", () => {
    const before = playlist([r("a", 0, 4), r("b", 10, 12)]);
    const after = playlist([r("a", 0, 3.7), r("b", 10, 12)]);
    expect(locate(before, 1)).toEqual({ index: 0, source: "a", seconds: 1 });
    expect(relocate(after, "a", 1)).toEqual({ index: 0, source: "a", seconds: 1 });
    expect(relocate(after, "b", 11)).toEqual({ index: 1, source: "b", seconds: 11 });
  });

  it("is null for a moment the edit cut out", () => {
    const after = playlist([r("a", 0, 3.7)]);
    expect(relocate(after, "a", 3.8)).toBeNull();
  });
});
