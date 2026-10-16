import type { ShapeUtil, Vec } from "../types";
import { boundsOf, localPoint, type Shape } from "./base";
import { distanceToPolyline, pointInPolygon } from "../math/polygon";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { fillColor, strokeColor } from "./colors";
import { num, polylineToPath, wrapSvg } from "./svg";

export type DiamondProps = {
  accent?: string;
  fill?: boolean;
};

export type DiamondShape = Shape<"diamond", DiamondProps>;

/** The four points of the diamond in page-local coordinates. */
function corners(shape: DiamondShape): Vec[] {
  const cx = shape.x + shape.w / 2;
  const cy = shape.y + shape.h / 2;
  return [
    { x: cx, y: shape.y },
    { x: shape.x + shape.w, y: cy },
    { x: cx, y: shape.y + shape.h },
    { x: shape.x, y: cy },
  ];
}

export const diamondUtil: ShapeUtil<DiamondShape> = {
  type: "diamond",
  defaults: () => ({
    type: "diamond",
    x: 0,
    y: 0,
    w: 160,
    h: 100,
    rotation: 0,
    parentId: null,
    props: { accent: DEFAULT_ACCENT, fill: false },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => {
    const local = localPoint(shape, point);
    const points = corners(shape);
    if (shape.props.fill) return pointInPolygon(local, points);
    return distanceToPolyline(local, [...points, points[0]]) <= margin;
  },
  resize: (shape, handle, to) => boxPatch(shape, resizeShapeBox(shape, handle, to)),
  toSvg: (shape, ctx) => {
    // The rough module has no arbitrary polygon, so a diamond keeps its corners
    // and takes the drawn palette in hand style.
    const fill = shape.props.fill ? fillColor(shape, ctx) : "none";
    const d = polylineToPath(corners(shape)).concat(" Z");
    const inner = `<path d="${d}" fill="${fill}" stroke="${strokeColor(
      shape,
      ctx
    )}" stroke-width="2"/>`;
    return wrapSvg(shape, inner);
  },
};
