import type { Box, Camera, Vec } from "../types";

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;
/** Default screen padding for a fit, capped at a share of the viewport width. */
export const ZOOM_TO_FIT_PADDING = 128;

/** Keep a zoom within the range the engine can render. */
export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Page space to screen space: the page origin lands at `-camera.x * zoom`. */
export function pageToScreen(camera: Camera, page: Vec): Vec {
  return { x: (page.x - camera.x) * camera.zoom, y: (page.y - camera.y) * camera.zoom };
}

/** Screen space back to page space. */
export function screenToPage(camera: Camera, screen: Vec): Vec {
  return { x: screen.x / camera.zoom + camera.x, y: screen.y / camera.zoom + camera.y };
}

/** Pan by a screen-space drag delta, so the content follows the pointer. */
export function panBy(camera: Camera, screenDelta: Vec): Camera {
  return {
    x: camera.x - screenDelta.x / camera.zoom,
    y: camera.y - screenDelta.y / camera.zoom,
    zoom: camera.zoom,
  };
}

/** Zoom about a screen point: the page point under the cursor stays put. */
export function zoomAt(camera: Camera, screenPoint: Vec, factor: number): Camera {
  const zoom = clampZoom(camera.zoom * factor);
  const page = screenToPage(camera, screenPoint);
  return { x: page.x - screenPoint.x / zoom, y: page.y - screenPoint.y / zoom, zoom };
}

/**
 * A camera that fits `page` inside `viewport`, centred. `inset` is the total
 * screen padding, half on each side, defaulting to the fit padding capped at
 * 28% of the viewport width.
 */
export function zoomToBox(page: Box, viewport: Box, inset?: number): Camera {
  const pad = inset ?? Math.min(ZOOM_TO_FIT_PADDING, viewport.w * 0.28);
  const w = Math.max(page.w, Number.EPSILON);
  const h = Math.max(page.h, Number.EPSILON);
  const zoom = clampZoom(Math.min((viewport.w - pad) / w, (viewport.h - pad) / h));
  const pageCx = page.x + page.w / 2;
  const pageCy = page.y + page.h / 2;
  const viewCx = viewport.x + viewport.w / 2;
  const viewCy = viewport.y + viewport.h / 2;
  return { x: pageCx - viewCx / zoom, y: pageCy - viewCy / zoom, zoom };
}
