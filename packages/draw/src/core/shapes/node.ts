import type { ShapeUtil } from "../types";
import { boundsOf, hitsFilledBox, type Shape } from "./base";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { fillColor, strokeColor, textColor } from "./colors";
import { escapeXml, num, wrapSvg } from "./svg";

export type NodeProps = {
  /** Which host component renders the shape. */
  kind: string;
  /** The data the host component reads. The core never looks inside it. */
  data: Record<string, unknown>;
  accent?: string;
};

export type NodeShape = Shape<"node", NodeProps>;

const RADIUS = 8;

/** A box a host component draws inside, swapped in by `kind`; headless export draws a rounded box labeled with the kind so a server render is never blank. */
export const nodeUtil: ShapeUtil<NodeShape> = {
  type: "node",
  defaults: () => ({
    type: "node",
    x: 0,
    y: 0,
    w: 200,
    h: 120,
    rotation: 0,
    parentId: null,
    props: { kind: "node", data: {}, accent: DEFAULT_ACCENT },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => hitsFilledBox(shape, point, margin),
  resize: (shape, handle, to) => boxPatch(shape, resizeShapeBox(shape, handle, to)),
  toSvg: (shape, ctx) => {
    const box = `<rect x="${num(shape.x)}" y="${num(shape.y)}" width="${num(shape.w)}" height="${num(
      shape.h,
    )}" rx="${RADIUS}" fill="${fillColor(shape, ctx)}" stroke="${strokeColor(
      shape,
      ctx,
    )}" stroke-width="2"/>`;
    const label = `<text x="${num(shape.x + shape.w / 2)}" y="${num(
      shape.y + shape.h / 2,
    )}" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle" fill="${textColor(
      shape,
      ctx,
    )}">${escapeXml(shape.props.kind)}</text>`;
    return wrapSvg(shape, box + label);
  },
};
