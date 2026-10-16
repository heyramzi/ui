import type { ShapeUtil, Vec } from "../types";
import { boundsOf, localPoint, type Shape } from "./base";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { fillColor, strokeColor } from "./colors";
import { localGroup, pathsToSvg, penFor } from "./hand";
import { roughEllipse } from "../rough";
import { num, wrapSvg } from "./svg";

export type EllipseProps = {
  accent?: string;
  fill?: boolean;
};

export type EllipseShape = Shape<"ellipse", EllipseProps>;

/** Distance from the ellipse boundary in page units, negative inside. */
function fromEdge(shape: EllipseShape, point: Vec): number {
  const local = localPoint(shape, point);
  const a = shape.w / 2;
  const b = shape.h / 2;
  if (a <= 0 || b <= 0) return Infinity;
  const dx = (local.x - (shape.x + a)) / a;
  const dy = (local.y - (shape.y + b)) / b;
  const r = Math.hypot(dx, dy);
  return (r - 1) * Math.min(a, b);
}

export const ellipseUtil: ShapeUtil<EllipseShape> = {
  type: "ellipse",
  defaults: () => ({
    type: "ellipse",
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
    const distance = fromEdge(shape, point);
    return shape.props.fill ? distance <= margin : Math.abs(distance) <= margin;
  },
  resize: (shape, handle, to) => boxPatch(shape, resizeShapeBox(shape, handle, to)),
  toSvg: (shape, ctx) => {
    if (ctx.style === "hand") {
      const paths = roughEllipse(shape.w, shape.h, penFor(shape, ctx));
      return wrapSvg(shape, localGroup(shape, pathsToSvg(paths)));
    }
    const fill = shape.props.fill ? fillColor(shape, ctx) : "none";
    const inner = `<ellipse cx="${num(shape.x + shape.w / 2)}" cy="${num(
      shape.y + shape.h / 2
    )}" rx="${num(shape.w / 2)}" ry="${num(shape.h / 2)}" fill="${fill}" stroke="${strokeColor(
      shape,
      ctx
    )}" stroke-width="2"/>`;
    return wrapSvg(shape, inner);
  },
};
