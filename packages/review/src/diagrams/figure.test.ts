import { describe, expect, it } from "vite-plus/test";
import { person } from "#src/diagrams/figure.js";

const box = (role: string, x: number, y: number, w: number, h: number, zoom?: number) => ({
  role,
  x,
  y,
  w,
  h,
  ...(zoom ? { zoom } : {}),
});

describe("person", () => {
  it("stands in its own rect, centred on it", () => {
    const rect = box("cam", 200, 100, 400, 800);
    expect(person(rect).cx).toBe(400);
    expect(person(rect).cy).toBeGreaterThan(100);
    expect(person(rect).top).toBeGreaterThan(100);
  });

  it("puts the Shorts Bottom cutout's head above the camera panel, as the render does", () => {
    const panel = box("cam", 0.4, 1201.1, 1079.2, 718.9, 1.3);
    const cutout = box("cutout", 0.4, 846, 1079.2, 1074, 1.01);
    expect(person(cutout).top).toBeGreaterThan(cutout.y);
    expect(person(cutout).top).toBeLessThan(panel.y);
  });
});
