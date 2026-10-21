// What an arrow needs to know whether to redraw. A box reduces to a string, so a derived
// reading it stays equal when only another card moved.

import type { Rect } from "#src/canvas/headless/edge-anchors.js";

/** A box as `x,y,width,height`, or "" for a card with no size yet. */
export function boxKey(rect: Rect | null | undefined): string {
  return rect ? `${rect.x},${rect.y},${rect.width},${rect.height}` : "";
}

export function parseBox(key: string): Rect | null {
  if (!key) return null;
  const [x, y, width, height] = key.split(",").map(Number);
  return { x, y, width, height };
}

/** Remembers up to `limit` results by key, dropping the least recently read first. */
export function createMemo<T>(limit: number) {
  const seen = new Map<string, T>();
  return (key: string, compute: () => T): T => {
    const hit = seen.get(key);
    if (hit !== undefined) {
      seen.delete(key);
      seen.set(key, hit);
      return hit;
    }
    const value = compute();
    seen.set(key, value);
    if (seen.size > limit) seen.delete(seen.keys().next().value as string);
    return value;
  };
}
