import { describe, expect, it } from "vite-plus/test";
import { ICON_SIZE, ICON_W, iconGeometry } from "#src/canvas/headless/icon-node.js";

describe("iconGeometry", () => {
  it("centres a labelled-below mark and hands off at its own edges", () => {
    const geo = iconGeometry({ label: "Acme" });
    expect(geo.markX).toBe((ICON_W - ICON_SIZE) / 2);
    expect(geo.left).toEqual({ x: geo.markX, y: ICON_SIZE / 2 });
    expect(geo.right).toEqual({ x: geo.markX + ICON_SIZE, y: ICON_SIZE / 2 });
    expect(geo.height).toBeGreaterThan(ICON_SIZE);
  });

  it("leaves a right-labelled mark from the box edge, level with the mark's centre", () => {
    const geo = iconGeometry(
      { label: "Delivery", lines: ["a", "b"], labelSide: "right", size: 60 },
      400,
    );
    expect(geo.left.x).toBe(0);
    expect(geo.right.x).toBe(400);
    expect(geo.left.y).toBe(geo.right.y);
    expect(geo.left.y).toBe(geo.markY + 30);
  });
});
