import { describe, expect, it } from "vitest";
import { diagramBounds, fitViewport, openingViewport, type GeometryNode } from "./fit-viewport";

function node(_id: string, x: number, y: number, size: Partial<GeometryNode> = {}): GeometryNode {
  return { position: { x, y }, ...size };
}

describe("diagramBounds", () => {
  it("spans every top-level shape, size read off the style object", () => {
    const bounds = diagramBounds([
      node("a", 0, 0, { style: { width: 520, height: 1484 } }),
      node("b", 1600, 0, { style: { width: 460, height: 446 } }),
    ]);
    expect(bounds).toEqual({ x: 0, y: 0, width: 2060, height: 1484 });
  });

  it("ignores children, whose positions are relative to their parent", () => {
    const bounds = diagramBounds([
      node("parent", 0, 0, { style: { width: 500, height: 500 } }),
      node("child", 20, 20, { parentId: "parent", style: { width: 460, height: 200 } }),
    ]);
    expect(bounds).toEqual({ x: 0, y: 0, width: 500, height: 500 });
  });

  it("reads an explicit width and height before the style string", () => {
    const bounds = diagramBounds([node("a", 5, 5, { width: 40, height: 30 })]);
    expect(bounds).toEqual({ x: 5, y: 5, width: 40, height: 30 });
  });

  it("falls back to a default size when nothing is measured", () => {
    const bounds = diagramBounds([node("a", 0, 0)]);
    expect(bounds).toEqual({ x: 0, y: 0, width: 240, height: 80 });
  });

  it("returns null when there is nothing to frame", () => {
    expect(diagramBounds([])).toBeNull();
  });
});

describe("fitViewport", () => {
  it("scales to the tighter axis and centres what is left over", () => {
    const nodes = [node("a", 0, 0, { style: { width: 1000, height: 500 } })];
    const viewport = fitViewport(nodes, { width: 500, height: 500 }, 0);

    expect(viewport?.zoom).toBe(0.5);
    expect(viewport?.x).toBe(0);
    // 500 tall at zoom 0.5 is 250, so 125 of slack above and below.
    expect(viewport?.y).toBe(125);
  });

  it("pulls a negative origin back into frame", () => {
    const nodes = [node("a", -280, 120, { style: { width: 1000, height: 500 } })];
    const viewport = fitViewport(nodes, { width: 1000, height: 500 }, 0);

    expect(viewport?.zoom).toBe(1);
    expect(viewport?.x).toBe(280);
    expect(viewport?.y).toBe(-120);
  });

  it("honours padding as a fraction of the container", () => {
    const nodes = [node("a", 0, 0, { style: { width: 1000, height: 1000 } })];
    expect(fitViewport(nodes, { width: 500, height: 500 }, 0.1)?.zoom).toBeCloseTo(0.4);
  });

  it("returns null when the container has no size yet", () => {
    const nodes = [node("a", 0, 0, { style: { width: 100, height: 100 } })];
    expect(fitViewport(nodes, { width: 0, height: 0 })).toBeNull();
  });
});

describe("openingViewport", () => {
  it("uses the whole fit when the board reads at that zoom", () => {
    const nodes = [node("a", 0, 0, { style: { width: 1000, height: 500 } })];
    expect(openingViewport(nodes, { width: 500, height: 500 }, 0)).toEqual(
      fitViewport(nodes, { width: 500, height: 500 }, 0),
    );
  });

  it("fits the width and starts at the top for a tall wall", () => {
    const nodes = [node("a", 0, 0, { style: { width: 1000, height: 10000 } })];
    const viewport = openingViewport(nodes, { width: 500, height: 500 }, 0.04)!;
    expect(viewport.zoom).toBeCloseTo(0.46);
    expect(viewport.y).toBe(20);
  });

  it("returns null when there is nothing to frame", () => {
    expect(openingViewport([], { width: 500, height: 500 })).toBeNull();
  });
});
