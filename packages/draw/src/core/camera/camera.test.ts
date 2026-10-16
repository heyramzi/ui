import { it, expect, describe } from "vitest";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_TO_FIT_PADDING,
  clampZoom,
  pageToScreen,
  panBy,
  screenToPage,
  zoomAt,
  zoomToBox,
} from "./camera";

describe("camera", () => {
  it("round-trips page and screen points", () => {
    const camera = { x: 12.5, y: -7.25, zoom: 1.7 };
    const page = { x: 340, y: 210 };
    const back = screenToPage(camera, pageToScreen(camera, page));
    expect(Math.abs(back.x - page.x)).toBeLessThan(1e-9);
    expect(Math.abs(back.y - page.y)).toBeLessThan(1e-9);
  });

  it("pans so content follows the pointer", () => {
    const camera = { x: 0, y: 0, zoom: 2 };
    const panned = panBy(camera, { x: 40, y: -20 });
    expect(panned).toEqual({ x: -20, y: 10, zoom: 2 });
  });

  it("keeps the page point under the cursor fixed when zooming", () => {
    const camera = { x: 12.5, y: -7.25, zoom: 1.7 };
    const screen = { x: 321, y: 245 };
    const before = screenToPage(camera, screen);
    const after = screenToPage(zoomAt(camera, screen, 1.37), screen);
    expect(Math.abs(after.x - before.x)).toBeLessThan(1e-9);
    expect(Math.abs(after.y - before.y)).toBeLessThan(1e-9);
  });

  it("clamps zoom at both ends", () => {
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(0.0001)).toBe(MIN_ZOOM);
  });

  it("keeps the anchor fixed even when zoomAt clamps", () => {
    const camera = { x: 0, y: 0, zoom: 4 };
    const screen = { x: 100, y: 100 };
    const page = screenToPage(camera, screen);
    for (const factor of [100, 0.0001]) {
      const next = zoomAt(camera, screen, factor);
      expect(next.zoom).toBe(factor > 1 ? MAX_ZOOM : MIN_ZOOM);
      const after = screenToPage(next, screen);
      expect(Math.abs(after.x - page.x)).toBeLessThan(1e-9);
      expect(Math.abs(after.y - page.y)).toBeLessThan(1e-9);
    }
  });

  it("fits a page box inside the viewport with half the inset per side", () => {
    const page = { x: 100, y: 50, w: 400, h: 200 };
    const viewport = { x: 0, y: 0, w: 800, h: 600 };
    const camera = zoomToBox(page, viewport, 20);
    const topLeft = pageToScreen(camera, { x: page.x, y: page.y });
    const bottomRight = pageToScreen(camera, { x: page.x + page.w, y: page.y + page.h });
    expect(Math.abs(topLeft.x - 10)).toBeLessThan(1e-9);
    expect(Math.abs(viewport.w - bottomRight.x - 10)).toBeLessThan(1e-9);
    const centre = pageToScreen(camera, { x: page.x + page.w / 2, y: page.y + page.h / 2 });
    expect(Math.abs(centre.x - viewport.w / 2)).toBeLessThan(1e-9);
    expect(Math.abs(centre.y - viewport.h / 2)).toBeLessThan(1e-9);
  });

  it("uses the default fit padding, capped at 28% of the width", () => {
    const page = { x: 0, y: 0, w: 1000, h: 1000 };
    const wide = zoomToBox(page, { x: 0, y: 0, w: 2000, h: 2000 });
    expect(wide.zoom).toBeCloseTo((2000 - ZOOM_TO_FIT_PADDING) / 1000, 9);
    const narrow = zoomToBox(page, { x: 0, y: 0, w: 300, h: 2000 });
    expect(narrow.zoom).toBeCloseTo((300 - 300 * 0.28) / 1000, 9);
  });

  it("clamps a fit of a huge page to the minimum zoom", () => {
    const camera = zoomToBox({ x: 0, y: 0, w: 1e6, h: 1e6 }, { x: 0, y: 0, w: 800, h: 600 });
    expect(camera.zoom).toBe(MIN_ZOOM);
  });
});
