import type { ShapeUtil } from "../types";
import { boundsOf, hitsFilledBox, type Shape } from "./base";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { fillColor, strokeColor, textColor } from "./colors";
import { localGroup, pathsToSvg, penFor } from "./hand";
import { roughRect } from "../rough";
import { num, wrapSvg } from "./svg";
import { textLines, type TextLayout } from "./text";

export type NoteProps = {
  text: string;
  accent?: string;
  fontSize?: number;
};

export type NoteShape = Shape<"note", NoteProps>;

const PADDING = 8;

/** The text box, inset from the note's edge. In box-local coordinates when `local`. */
function textBox(shape: NoteShape, local: boolean): TextLayout {
  return {
    x: (local ? 0 : shape.x) + PADDING,
    y: (local ? 0 : shape.y) + PADDING,
    w: shape.w - PADDING * 2,
    h: shape.h - PADDING * 2,
    props: {
      text: shape.props.text,
      fontSize: shape.props.fontSize ?? 16,
      accent: shape.props.accent,
      align: "left",
    },
  };
}

/** A filled sticky with its text inset from the top-left. */
export const noteUtil: ShapeUtil<NoteShape> = {
  type: "note",
  defaults: () => ({
    type: "note",
    x: 0,
    y: 0,
    w: 160,
    h: 120,
    rotation: 0,
    parentId: null,
    props: { text: "", accent: DEFAULT_ACCENT, fontSize: 16 },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => hitsFilledBox(shape, point, margin),
  resize: (shape, handle, to) => boxPatch(shape, resizeShapeBox(shape, handle, to)),
  toSvg: (shape, ctx) => {
    const text = { text: textColor(shape, ctx) };
    if (ctx.style === "hand") {
      const paths = roughRect(shape.w, shape.h, penFor(shape, ctx), { filled: true });
      const inner = pathsToSvg(paths) + textLines(textBox(shape, true), text);
      return wrapSvg(shape, localGroup(shape, inner));
    }
    const box = `<rect x="${num(shape.x)}" y="${num(shape.y)}" width="${num(shape.w)}" height="${num(
      shape.h
    )}" rx="6" fill="${fillColor(shape, ctx)}" stroke="${strokeColor(
      shape,
      ctx
    )}" stroke-width="2"/>`;
    return wrapSvg(shape, box + textLines(textBox(shape, false), text));
  },
};
