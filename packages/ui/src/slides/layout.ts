/* Where a slide sits inside the stage: centred to fit, or in the overview grid. */

import type { Canvas } from "#src/slides/types.js";

export type Size = { w: number; h: number };

/** A slide's place: its top-left corner in stage px and its scale. */
export type Box = { x: number; y: number; scale: number };

export type Grid = { cols: number; boxes: Box[] };

export function fitBox(view: Size, canvas: Canvas): Box {
  const scale = Math.max(0, Math.min(view.w / canvas.w, view.h / canvas.h));
  return { x: (view.w - canvas.w * scale) / 2, y: (view.h - canvas.h * scale) / 2, scale };
}

/** The scale at which `cols` columns of `count` canvases fit the view. */
function scaleFor(
  cols: number,
  count: number,
  view: Size,
  canvas: Canvas,
  pad: number,
  gap: number,
): number {
  const rows = Math.ceil(count / cols);
  const byWidth = (view.w - 2 * pad - (cols - 1) * gap) / cols / canvas.w;
  const byHeight = (view.h - 2 * pad - (rows - 1) * gap) / rows / canvas.h;
  return Math.min(byWidth, byHeight);
}

/** Lays `count` canvases in the roomiest grid that shows them all, centred. */
export function gridBoxes(view: Size, canvas: Canvas, count: number): Grid {
  if (count === 0 || view.w <= 0 || view.h <= 0) return { cols: 1, boxes: [] };
  const pad = Math.min(56, Math.max(16, view.w * 0.04));
  /* The gap holds the slide number that hangs below each cell. */
  const gap = Math.max(26, pad * 0.6);

  let cols = 1;
  let scale = scaleFor(1, count, view, canvas, pad, gap);
  for (let c = 2; c <= count; c++) {
    const candidate = scaleFor(c, count, view, canvas, pad, gap);
    if (candidate > scale) [cols, scale] = [c, candidate];
  }

  const cellW = canvas.w * scale;
  const cellH = canvas.h * scale;
  const rows = Math.ceil(count / cols);
  const left = (view.w - (cols * cellW + (cols - 1) * gap)) / 2;
  const top = (view.h - (rows * cellH + (rows - 1) * gap)) / 2;

  const boxes = Array.from({ length: count }, (_, i) => ({
    x: left + (i % cols) * (cellW + gap),
    y: top + Math.floor(i / cols) * (cellH + gap),
    scale,
  }));
  return { cols, boxes };
}
