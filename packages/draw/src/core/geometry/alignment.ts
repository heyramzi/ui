// Align a set of boxes to one edge of the group.

import type { Box } from "../types";

/** Align boxes in a row: move every one to the topmost y. */
export function alignBoxesHorizontally(boxes: Box[]): void {
  if (boxes.length < 2) return;
  const targetY = Math.min(...boxes.map((b) => b.y));
  for (const box of boxes) box.y = targetY;
}

/** Align boxes in a column: move every one to the leftmost x. */
export function alignBoxesVertically(boxes: Box[]): void {
  if (boxes.length < 2) return;
  const targetX = Math.min(...boxes.map((b) => b.x));
  for (const box of boxes) box.x = targetX;
}
