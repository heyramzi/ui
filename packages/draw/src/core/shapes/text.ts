import type { ShapeUtil } from "../types";
import { boundsOf, hitsFilledBox, type Shape } from "./base";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT } from "./style";
import { textColor } from "./colors";
import { localGroup, pathsToSvg, penFor } from "./hand";
import { roughUnderline } from "../rough";
import { escapeXml, num, wrapSvg } from "./svg";

export type TextAlign = "left" | "center" | "right";

export type TextProps = {
  text: string;
  fontSize: number;
  accent?: string;
  align?: TextAlign;
};

export type TextShape = Shape<"text", TextProps>;

export const LINE_HEIGHT = 1.25;

/** Everything text layout needs, so a note's inset text reuses it. */
export type TextLayout = { x: number; y: number; w: number; h: number; props: TextProps };

/** Average sans-serif glyph width in ems, for when no canvas can measure (tests, SSR). */
const AVG_GLYPH_EM = 0.55;

let measureCtx: CanvasRenderingContext2D | null | undefined;

/** Rendered width of `text` at `size`, measured on a canvas when there is one. */
export function measureText(text: string, size: number): number {
  if (measureCtx === undefined) {
    measureCtx =
      typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return text.length * size * AVG_GLYPH_EM;
  measureCtx.font = `${size}px sans-serif`;
  return measureCtx.measureText(text).width;
}

/** The lines the box shows: each newline starts one, and a line wider than `width` breaks at the last space that fits, but a single wide word stays whole. */
export function wrapLines(text: string, width: number, size: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (line && measureText(next, size) > width) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    out.push(line);
  }
  return out;
}

/** One line element per wrapped line, stacked from the top of the box. */
export function textLines(shape: TextLayout, colors: { text: string }): string {
  const lines = wrapLines(shape.props.text, shape.w, shape.props.fontSize);
  const size = shape.props.fontSize;
  const align = shape.props.align ?? "left";
  const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
  const anchorX =
    align === "center" ? shape.x + shape.w / 2 : align === "right" ? shape.x + shape.w : shape.x;
  return lines
    .map((line, i) => {
      const y = shape.y + size + i * size * LINE_HEIGHT;
      return `<text x="${num(anchorX)}" y="${num(y)}" font-size="${num(
        size,
      )}" font-family="sans-serif" text-anchor="${anchor}" fill="${colors.text}">${escapeXml(
        line,
      )}</text>`;
    })
    .join("");
}

export const textUtil: ShapeUtil<TextShape> = {
  type: "text",
  defaults: () => ({
    type: "text",
    x: 0,
    y: 0,
    w: 160,
    h: 30,
    rotation: 0,
    parentId: null,
    props: { text: "", fontSize: 20, accent: DEFAULT_ACCENT, align: "left" },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => hitsFilledBox(shape, point, margin),
  resize: (shape, handle, to) => boxPatch(shape, resizeShapeBox(shape, handle, to)),
  toSvg: (shape, ctx) => {
    if (ctx.style === "hand") {
      // A rule under each line, the hand-drawn underline the drawn layer uses.
      const local = { x: 0, y: 0, w: shape.w, h: shape.h, props: shape.props };
      const pen = penFor(shape, ctx);
      const size = shape.props.fontSize;
      const lineCount = wrapLines(shape.props.text, shape.w, size).length;
      let markup = textLines(local, { text: textColor(shape, ctx) });
      for (let i = 0; i < lineCount; i += 1) {
        const y = size + i * size * LINE_HEIGHT + size * 0.2;
        markup += pathsToSvg(roughUnderline(shape.w, pen, { y }));
      }
      return wrapSvg(shape, localGroup(shape, markup));
    }
    return wrapSvg(shape, textLines(shape, { text: textColor(shape, ctx) }));
  },
};
