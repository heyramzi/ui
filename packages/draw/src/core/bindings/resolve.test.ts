import { describe, it, expect } from "vitest";
import { resolveArrowEnds, edgeCrossing, type GetShape } from "./resolve";
import { arrowUtil, type ArrowShape } from "../shapes/arrow";
import { rectUtil, type RectShape } from "../shapes/rect";
import { make } from "../shapes/test-fixtures";
import { boxCenter } from "../math/box";
import { rotate } from "../math/vec";
import { distanceToBoxPerimeter } from "../shapes/base";
import type { BindingRecord, Id, Vec } from "../types";

const arrow = (overrides: Partial<Omit<ArrowShape, "id" | "index">> = {}) =>
  make(arrowUtil, {
    id: "arrow-1",
    x: 10,
    y: 10,
    w: 100,
    h: 0,
    props: {
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      bend: 0,
      startHead: "none",
      endHead: "arrow",
      color: "ink",
    },
    ...overrides,
  });

const box = (overrides: Partial<Omit<RectShape, "id" | "index">> & { id?: string } = {}) =>
  make(rectUtil, { x: 200, y: 0, w: 100, h: 100, ...overrides });

const binding = (overrides: Partial<BindingRecord> = {}): BindingRecord => ({
  id: "binding-1",
  arrowId: "arrow-1",
  targetId: "target-1",
  terminal: "end",
  anchor: { x: 0, y: 0.5 },
  ...overrides,
});

const fromShapes = (shapes: Record<string, RectShape>): GetShape => (id: Id) => shapes[id];

describe("resolveArrowEnds", () => {
  it("leaves both ends where they are when nothing is bound", () => {
    const ends = resolveArrowEnds(arrow(), [], fromShapes({}));
    expect(ends.start).toEqual({ x: 10, y: 10 });
    expect(ends.end).toEqual({ x: 110, y: 10 });
  });

  it("puts a bound end on the target edge toward the anchor", () => {
    const ends = resolveArrowEnds(
      arrow(),
      [binding({ anchor: { x: 0, y: 0.5 } })],
      fromShapes({ "target-1": box() })
    );
    expect(ends.start).toEqual({ x: 10, y: 10 });
    expect(ends.end.x).toBeCloseTo(200, 6);
    expect(ends.end.y).toBeCloseTo(50, 6);
  });

  it("meets the edge along the line to a center anchor", () => {
    const ends = resolveArrowEnds(
      arrow(),
      [binding({ anchor: { x: 0.5, y: 0.5 } })],
      fromShapes({ "target-1": box() })
    );
    expect(ends.end.x).toBeCloseTo(200, 6);
    expect(ends.end.y).toBeCloseTo(41.6667, 3);
  });

  it("follows a moved target while a free end stays put", () => {
    const target = box({ x: 400 });
    const ends = resolveArrowEnds(arrow(), [binding()], fromShapes({ "target-1": target }));
    expect(ends.start).toEqual({ x: 10, y: 10 });
    expect(ends.end.x).toBeCloseTo(400, 6);
  });

  it("keeps a rotated target's end on its outline", () => {
    const target = box({ x: 200, rotation: Math.PI / 2 });
    const ends = resolveArrowEnds(
      arrow(),
      [binding({ anchor: { x: 0, y: 0.5 } })],
      fromShapes({ "target-1": target })
    );
    const local = rotate(ends.end, boxCenter(target), -target.rotation);
    expect(distanceToBoxPerimeter(local, target)).toBeCloseTo(0, 6);
  });
});

describe("edgeCrossing", () => {
  it("finds the entry point of a segment into the box", () => {
    const hit = edgeCrossing({ x: 0, y: 50 }, { x: 300, y: 50 }, box());
    expect(hit).toEqual({ x: 200, y: 50 });
  });

  it("returns null when the segment misses", () => {
    expect(edgeCrossing({ x: 0, y: 0 }, { x: 0, y: 10 }, box())).toBeNull();
  });
});
