import type { ShapeUtil } from "../types";
import { boundsOf, hitsBoxOutline, type Shape } from "./base";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { strokeColor, textColor } from "./colors";
import { localGroup, pathsToSvg, penFor } from "./hand";
import { roughRect } from "../rough";
import { escapeXml, num, wrapSvg } from "./svg";

export type FrameProps = {
  name?: string;
  accent?: string;
};

export type FrameShape = Shape<"frame", FrameProps>;

/** A frame is an outline you grab by its edge, never a filled box. */
export const frameUtil: ShapeUtil<FrameShape> = {
  type: "frame",
  defaults: () => ({
    type: "frame",
    x: 0,
    y: 0,
    w: 240,
    h: 180,
    rotation: 0,
    parentId: null,
    props: { name: "Frame", accent: DEFAULT_ACCENT },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => hitsBoxOutline(shape, point, margin),
  resize: (shape, handle, to) => boxPatch(shape, resizeShapeBox(shape, handle, to)),
  toSvg: (shape, ctx) => {
    const label = (x: number, y: number) =>
      shape.props.name
        ? `<text x="${num(x)}" y="${num(y)}" font-size="12" font-family="sans-serif" fill="${textColor(
            shape,
            ctx
          )}">${escapeXml(shape.props.name)}</text>`
        : "";
    if (ctx.style === "hand") {
      const paths = roughRect(shape.w, shape.h, penFor(shape, ctx), { filled: false });
      return wrapSvg(shape, localGroup(shape, pathsToSvg(paths) + label(0, -6)));
    }
    const box = `<rect x="${num(shape.x)}" y="${num(shape.y)}" width="${num(shape.w)}" height="${num(
      shape.h
    )}" rx="4" fill="none" stroke="${strokeColor(shape, ctx)}" stroke-width="2"/>`;
    return wrapSvg(shape, box + label(shape.x, shape.y - 6));
  },
};
