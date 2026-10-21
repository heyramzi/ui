// A stroke's points become one SVG path through perfect-freehand. The editor,
// the headless export and the tests all call this, so they draw the same shape.

import { getStroke } from "perfect-freehand";
import type { StrokeData, StrokePoint } from "#src/canvas/pen/types.js";

function average(a: number, b: number): number {
  return (a + b) / 2;
}

/** Quadratic smoothing through the outline's midpoints, the way perfect-freehand's README does it. */
export function outlineToPath(outline: ReadonlyArray<readonly number[]>): string {
  if (outline.length < 4) return "";
  const first = outline[0];
  const second = outline[1];
  const third = outline[2];
  let path =
    `M${first[0].toFixed(2)},${first[1].toFixed(2)} ` +
    `Q${second[0].toFixed(2)},${second[1].toFixed(2)} ` +
    `${average(second[0], third[0]).toFixed(2)},${average(second[1], third[1]).toFixed(2)} T`;
  for (let i = 2; i < outline.length - 1; i++) {
    const a = outline[i];
    const b = outline[i + 1];
    path += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
  }
  return `${path}Z`;
}

type StrokeShape = Pick<StrokeData, "size" | "tool" | "simulatePressure">;

/** `last` is false while the pen is still down, so the live tip isn't tapered to a point. */
export function strokePath(
  points: readonly StrokePoint[],
  shape: StrokeShape,
  last = true,
): string {
  if (points.length === 0) return "";
  const highlighter = shape.tool === "highlighter";
  const outline = getStroke(
    points.map((point) =>
      point[2] === undefined ? [point[0], point[1]] : [point[0], point[1], point[2]],
    ),
    {
      size: shape.size,
      // Flat ink for the highlighter: no pressure taper, a straight sweep.
      thinning: highlighter ? 0 : 0.55,
      smoothing: 0.6,
      streamline: highlighter ? 0.7 : 0.5,
      simulatePressure: shape.simulatePressure && !highlighter,
      last,
    },
  );
  return outlineToPath(outline);
}
