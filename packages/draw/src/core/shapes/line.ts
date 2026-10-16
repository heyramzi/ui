import type { ShapeUtil, Vec } from "../types";
import { boundsOf, localPoint, toPageLocal, type Shape } from "./base";
import { distanceToPolyline } from "../math/polygon";
import { boxPatch, resizeShapeBox, scalePoints } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { strokeColor } from "./colors";
import { num, polylineToPath, wrapSvg } from "./svg";

export type LineProps = {
  accent?: string;
  /** Points relative to the box's top-left. */
  points: Vec[];
};

export type LineShape = Shape<"line", LineProps>;

export const lineUtil: ShapeUtil<LineShape> = {
  type: "line",
  defaults: () => ({
    type: "line",
    x: 0,
    y: 0,
    w: 160,
    h: 100,
    rotation: 0,
    parentId: null,
    props: {
      accent: DEFAULT_ACCENT,
      points: [
        { x: 0, y: 0 },
        { x: 160, y: 100 },
      ],
    },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => {
    const local = localPoint(shape, point);
    return distanceToPolyline(local, toPageLocal(shape, shape.props.points)) <= margin;
  },
  resize: (shape, handle, to) => {
    const patch = resizeShapeBox(shape, handle, to);
    const out: Partial<LineShape> = boxPatch(shape, patch);
    if (patch.w !== shape.w || patch.h !== shape.h) {
      out.props = {
        ...shape.props,
        points: scalePoints(shape.props.points, shape, patch),
      };
    }
    return out;
  },
  toSvg: (shape, ctx) => {
    const d = polylineToPath(shape.props.points);
    const inner = `<g transform="translate(${num(shape.x)} ${num(shape.y)})"><path d="${d}" fill="none" stroke="${strokeColor(
      shape,
      ctx
    )}" stroke-width="2" stroke-linecap="round"/></g>`;
    return wrapSvg(shape, inner);
  },
};
