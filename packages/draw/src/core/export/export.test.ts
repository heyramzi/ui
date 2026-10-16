import { describe, expect, it } from "vitest";
import type { Snapshot } from "../types";
import { exportSvg } from "./export";

function snapshot(): Snapshot {
  return {
    schema: 1,
    shapes: {
      a: {
        id: "a",
        type: "rect",
        x: 10,
        y: 20,
        w: 100,
        h: 50,
        rotation: 0,
        parentId: null,
        index: "a0",
        props: { accent: "blue", fill: true, radius: 0 },
      },
      b: {
        id: "b",
        type: "text",
        x: 200,
        y: 20,
        w: 120,
        h: 30,
        rotation: 0,
        parentId: null,
        index: "a1",
        props: { text: "hello", fontSize: 20, accent: "ink", align: "left" },
      },
      n: {
        id: "n",
        type: "node",
        x: 10,
        y: 200,
        w: 200,
        h: 120,
        rotation: 0,
        parentId: null,
        index: "a2",
        props: { kind: "card", data: {}, accent: "blue" },
      },
    },
    bindings: {},
    camera: { x: 0, y: 0, zoom: 1 },
  };
}

/** The four viewBox numbers, in order. */
function viewBox(svg: string): [number, number, number, number] {
  const match = svg.match(/viewBox="([^"]+)"/);
  if (!match) throw new Error("no viewBox");
  return match[1].split(" ").map(Number) as [number, number, number, number];
}

describe("exportSvg", () => {
  it("gives byte-identical SVG twice for the same snapshot", () => {
    expect(exportSvg(snapshot())).toBe(exportSvg(snapshot()));
  });

  it("differs between hand and clean", () => {
    expect(exportSvg(snapshot(), { style: "hand" })).not.toBe(
      exportSvg(snapshot(), { style: "clean" })
    );
  });

  it("fits the viewBox around the shapes plus padding", () => {
    const [x, y, w, h] = viewBox(exportSvg(snapshot(), { padding: 32 }));
    // Shapes span x 10..320 and y 20..320, so the box grows 32 each side.
    expect([x, y, w, h]).toEqual([-22, -12, 374, 364]);
  });

  it("exports only the listed ids", () => {
    const one = exportSvg(snapshot(), { ids: ["b"] });
    expect(one).toContain("hello");
    const [x, y, w, h] = viewBox(one);
    expect([x, y, w, h]).toEqual([168, -12, 184, 94]);
  });

  it("changes colors in the dark", () => {
    expect(exportSvg(snapshot())).not.toBe(exportSvg(snapshot(), { dark: true }));
  });

  it("draws a node shape as a labeled placeholder box", () => {
    const svg = exportSvg(snapshot(), { ids: ["n"] });
    expect(svg).toContain("card");
    expect(svg).toContain("<rect");
  });

  it("gives a valid empty svg for an empty snapshot", () => {
    const svg = exportSvg({ schema: 1, shapes: {}, bindings: {}, camera: { x: 0, y: 0, zoom: 1 } });
    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
  });

  it("orders shapes by index", () => {
    const first = exportSvg(snapshot());
    const flipped: Snapshot = snapshot();
    flipped.shapes.a = { ...flipped.shapes.a, index: "a9" };
    const second = exportSvg(flipped);
    expect(first).not.toBe(second);
  });
});
