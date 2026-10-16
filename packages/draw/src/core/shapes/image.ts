import type { ShapeUtil } from "../types";
import { boundsOf, hitsFilledBox, type Shape } from "./base";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { strokeColor } from "./colors";
import { escapeXml, num, wrapSvg } from "./svg";

export type ImageProps = {
  /** Data URL or path. Empty draws a placeholder. */
  src?: string;
  alt?: string;
  accent?: string;
};

export type ImageShape = Shape<"image", ImageProps>;

function placeholder(shape: ImageShape, stroke: string): string {
  const inner = `<rect x="${num(shape.x)}" y="${num(shape.y)}" width="${num(shape.w)}" height="${num(
    shape.h
  )}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
  const lines = `<path d="M ${num(shape.x)} ${num(shape.y)} L ${num(shape.x + shape.w)} ${num(
    shape.y + shape.h
  )} M ${num(shape.x + shape.w)} ${num(shape.y)} L ${num(shape.x)} ${num(shape.y + shape.h)}" stroke="${stroke}" stroke-width="1"/>`;
  return inner + lines;
}

export const imageUtil: ShapeUtil<ImageShape> = {
  type: "image",
  defaults: () => ({
    type: "image",
    x: 0,
    y: 0,
    w: 200,
    h: 140,
    rotation: 0,
    parentId: null,
    props: { src: "", alt: "", accent: DEFAULT_ACCENT },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => hitsFilledBox(shape, point, margin),
  resize: (shape, handle, to) => boxPatch(shape, resizeShapeBox(shape, handle, to)),
  toSvg: (shape, ctx) => {
    const inner = shape.props.src
      ? `<image href="${escapeXml(shape.props.src)}" x="${num(shape.x)}" y="${num(
          shape.y
        )}" width="${num(shape.w)}" height="${num(
          shape.h
        )}" preserveAspectRatio="xMidYMid slice"/>`
      : placeholder(shape, strokeColor(shape, ctx));
    return wrapSvg(shape, inner);
  },
};
