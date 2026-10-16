import { describe, expect, it } from "vite-plus/test";
import { positionAt } from "#src/effects/image-comparison/compare.js";

describe("positionAt", () => {
  it("maps the pointer to a percentage of the frame", () => {
    expect(positionAt(150, 100, 200)).toBe(25);
  });

  it("clamps a pointer outside the frame", () => {
    expect(positionAt(50, 100, 200)).toBe(0);
    expect(positionAt(400, 100, 200)).toBe(100);
  });

  it("rests in the middle of a frame with no width", () => {
    expect(positionAt(10, 0, 0)).toBe(50);
  });
});
