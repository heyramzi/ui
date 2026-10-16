// Turn browser events into the small shapes the editor dispatches. Kept as
// plain functions so the pointer mapping, the wheel math and the shortcut map
// are testable without a DOM.

import { panBy, zoomAt, type Camera, type Mods, type PointerInput, type Vec } from "../core";
import { TOOL_SHORTCUTS } from "./tools";

/** The part of a bounding rect the input math needs. */
export type RectLike = { left: number; top: number };

/** The fields a pointer event must carry. A real `PointerEvent` fits. */
export type PointerEventLike = {
  clientX: number;
  clientY: number;
  pressure: number;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  pointerType: string;
  detail: number;
  button: number;
};

/** The fields a wheel event must carry. A real `WheelEvent` fits. */
export type WheelEventLike = {
  clientX: number;
  clientY: number;
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

/** The fields a key event must carry. A real `KeyboardEvent` fits. */
export type KeyEventLike = {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
};

/** Browsers report "pen", "touch" or "mouse"; anything else is a mouse. */
export function normalizePointerType(value: string): PointerInput["pointerType"] {
  return value === "pen" || value === "touch" ? value : "mouse";
}

/** A pointer event as the editor's `PointerInput`, in root-relative screen space. */
export function pointerInput(event: PointerEventLike, rect: RectLike): PointerInput {
  const pointerType = normalizePointerType(event.pointerType);
  return {
    screen: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    // A mouse reports 0.5 while pressed; other pointers carry their own pressure.
    pressure: pointerType === "mouse" ? 0.5 : event.pressure,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey,
    pointerType,
    clicks: event.detail || 1,
  };
}

/** Convert a wheel delta to pixels. `1` is lines, `2` is pages. */
export function wheelDelta(delta: number, deltaMode: number, viewportHeight: number): number {
  if (!Number.isFinite(delta)) return 0;
  if (deltaMode === 1) return delta * 16;
  if (deltaMode === 2) return delta * viewportHeight;
  return delta;
}

/** The most a single wheel event may change the zoom, as a fraction. */
export const MAX_ZOOM_STEP = 0.1;

/** Zoom factor for a wheel notch, matched to tldraw: at most a tenth per event. */
export function wheelZoomFactor(deltaY: number): number {
  const step = Math.max(-MAX_ZOOM_STEP, Math.min(MAX_ZOOM_STEP, deltaY / 100));
  return 1 + step;
}

/**
 * Apply a wheel event. Ctrl or meta (a trackpad pinch included) zooms about the
 * pointer; a plain wheel pans following the fingers.
 */
export function applyWheel(
  camera: Camera,
  event: WheelEventLike,
  rect: RectLike,
  viewportHeight: number
): Camera {
  const screen = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  if (event.ctrlKey || event.metaKey) {
    const dy = wheelDelta(event.deltaY, event.deltaMode, viewportHeight);
    return zoomAt(camera, screen, wheelZoomFactor(dy));
  }
  return panBy(camera, {
    x: wheelDelta(event.deltaX, event.deltaMode, viewportHeight),
    y: wheelDelta(event.deltaY, event.deltaMode, viewportHeight),
  });
}

/** The modifier set an editor key event takes. */
export function modsOf(event: KeyEventLike): Mods {
  return { shift: event.shiftKey, alt: event.altKey, meta: event.metaKey };
}

/** The tool a single letter key picks, or null. Accel and alt chords never switch tools. */
export function toolForKey(event: KeyEventLike): string | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  if (event.key.length !== 1) return null;
  return TOOL_SHORTCUTS[event.key.toLowerCase()] ?? null;
}

/** True when focus sits in something that wants the keystroke itself. */
export function isTextEntryTarget(target: unknown): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable === true;
}

const HANDLED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Delete",
  "Backspace",
  "Escape",
  " ",
]);

/** True for a key the editor acts on, so the browser default is worth stopping. */
export function isHandledKey(event: KeyEventLike): boolean {
  if (event.key === " ") return true;
  if (toolForKey(event) !== null) return true;
  if (HANDLED_KEYS.has(event.key)) return true;
  const accel = event.metaKey || event.ctrlKey;
  return accel && ["a", "z", "d"].includes(event.key.toLowerCase());
}

/** Drop a page point onto the screen, for overlay geometry that must not scale. */
export function toScreen(point: Vec, camera: Camera): Vec {
  return { x: (point.x - camera.x) * camera.zoom, y: (point.y - camera.y) * camera.zoom };
}
