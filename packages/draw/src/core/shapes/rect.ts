import type { ShapeUtil } from "../types";
import { boundsOf, hitsBoxOutline, hitsFilledBox, type Shape } from "./base";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { fillColor, strokeColor } from "./colors";
import { localGroup, pathsToSvg, penFor } from "./hand";
import { roughRect } from "../rough";
import { num, wrapSvg } from "./svg";

export type RectProps = {
  accent?: string;
  /** Filled shapes hit anywhere inside; outlines hit on the line. */
  fill?: boolean;
  /** Corner radius, 0 for square. */
  radius?: number;
};

export type RectShape = Shape<"rect", RectProps>;

export const rectUtil: ShapeUtil<RectShape> = {
  type: "rect",
  defaults: () => ({
    type: "rect",
    x: 0,
    y: 0,
    w: 160,
    h: 100,
    rotation: 0,
    parentId: null,
    props: { accent: DEFAULT_ACCENT, fill: false, radius: 0 },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) =>
    shape.props.fill ? hitsFilledBox(shape, point, margin) : hitsBoxOutline(shape, point, margin),
  resize: (shape, handle, to) => boxPatch(shape, resizeShapeBox(shape, handle, to)),
  toSvg: (shape, ctx) => {
    if (ctx.style === "hand") {
      const paths = roughRect(shape.w, shape.h, penFor(shape, ctx), {
        filled: !!shape.props.fill,
      });
      return wrapSvg(shape, localGroup(shape, pathsToSvg(paths)));
    }
    const fill = shape.props.fill ? fillColor(shape, ctx) : "none";
    const inner = `<rect x="${num(shape.x)}" y="${num(shape.y)}" width="${num(
      shape.w
    )}" height="${num(shape.h)}" rx="${num(shape.props.radius ?? 0)}" fill="${fill}" stroke="${strokeColor(
      shape,
      ctx
    )}" stroke-width="2"/>`;
    return wrapSvg(shape, inner);
  },
};
