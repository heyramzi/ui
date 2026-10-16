import { getStroke } from "perfect-freehand";
import type { ShapeUtil, Vec } from "../types";
import { boundsOf, localPoint, toPageLocal, type Shape } from "./base";
import { distanceToPolyline, simplifyPolyline } from "../math/polygon";
import { boxPatch, resizeShapeBox, scalePoints } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { strokeColor } from "./colors";
import { num, pathEl, strokeOutlineToPath, wrapSvg } from "./svg";

export type FreehandPoint = { x: number; y: number; pressure: number };

export type FreehandProps = {
  accent?: string;
  /** Points relative to the box's top-left. */
  points: FreehandPoint[];
  /** Stroke width in page units. */
  size?: number;
};

export type FreehandShape = Shape<"freehand", FreehandProps>;

export function strokeSize(shape: FreehandShape): number {
  return shape.props.size ?? 4;
}

/** The perfect-freehand outline, in box-local coordinates. */
export function outline(shape: FreehandShape): number[][] {
  const points = shape.props.points;
  if (points.length === 0) return [];
  return getStroke(
    points.map((point) => [point.x, point.y, point.pressure]),
    {
      size: strokeSize(shape),
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      // Our own pressure, not the simulated one, so a constant-pressure mouse
      // draws a constant-width stroke.
      simulatePressure: false,
    }
  );
}

/** Grow the box to hold every point, keeping them relative to the top-left. */
function fitBox(shape: FreehandShape): FreehandShape {
  const points = shape.props.points;
  if (points.length === 0) return shape;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }
  const shifted = points.map((point) => ({
    x: point.x - minX,
    y: point.y - minY,
    pressure: point.pressure,
  }));
  return {
    ...shape,
    x: shape.x + minX,
    y: shape.y + minY,
    w: maxX - minX,
    h: maxY - minY,
    props: { ...shape.props, points: shifted },
  };
}

/** Append a page-space point, expanding the box around it. */
export function addPoint(
  shape: FreehandShape,
  point: Vec & { pressure?: number }
): FreehandShape {
  const local = {
    x: point.x - shape.x,
    y: point.y - shape.y,
    pressure: point.pressure ?? 0.5,
  };
  return fitBox({ ...shape, props: { ...shape.props, points: [...shape.props.points, local] } });
}

/** Simplify the path, then fit the box to what is left. */
export function finish(shape: FreehandShape): FreehandShape {
  const simplified = simplifyPolyline(shape.props.points, 1);
  return fitBox({ ...shape, props: { ...shape.props, points: simplified } });
}

export const freehandUtil: ShapeUtil<FreehandShape> = {
  type: "freehand",
  defaults: () => ({
    type: "freehand",
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    rotation: 0,
    parentId: null,
    props: { accent: DEFAULT_ACCENT, points: [], size: 4 },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => {
    if (shape.props.points.length === 0) return false;
    const local = localPoint(shape, point);
    const path = toPageLocal(shape, shape.props.points);
    return distanceToPolyline(local, path) <= margin + strokeSize(shape) / 2;
  },
  resize: (shape, handle, to) => {
    const patch = resizeShapeBox(shape, handle, to);
    const out: Partial<FreehandShape> = boxPatch(shape, patch);
    if (patch.w !== shape.w || patch.h !== shape.h) {
      out.props = {
        ...shape.props,
        points: scalePoints(shape.props.points, shape, patch),
      };
    }
    return out;
  },
  toSvg: (shape, ctx) => {
    if (shape.props.points.length === 0) return "";
    const d = strokeOutlineToPath(outline(shape));
    if (!d) return "";
    // Ink is ink in both styles: the outline comes from perfect-freehand, only
    // the colour follows the palette.
    const inner = `<g transform="translate(${num(shape.x)} ${num(
      shape.y
    )})">${pathEl(d, "none", strokeColor(shape, ctx), 0)}</g>`;
    return wrapSvg(shape, inner);
  },
};
