import { sketchColors } from "../rough";
import type { ShapeRecord, SvgContext } from "../types";
import { shapeColors } from "./style";

/** The accent a shape carries, or undefined for the default. */
export function accentOf(shape: ShapeRecord): string | undefined {
  const accent = (shape.props as { accent?: unknown }).accent;
  return typeof accent === "string" ? accent : undefined;
}

/** Stroke colour: the drawn palette in hand style, the plain one in clean. */
export function strokeColor(shape: ShapeRecord, ctx: SvgContext): string {
  const accent = accentOf(shape);
  return ctx.style === "hand"
    ? sketchColors(accent, ctx.dark).stroke
    : shapeColors(accent, ctx.dark).stroke;
}

/** The wash behind a filled shape. */
export function fillColor(shape: ShapeRecord, ctx: SvgContext): string {
  const accent = accentOf(shape);
  return ctx.style === "hand"
    ? sketchColors(accent, ctx.dark).fill
    : shapeColors(accent, ctx.dark).fill;
}

/** Text and labels. */
export function textColor(shape: ShapeRecord, ctx: SvgContext): string {
  const accent = accentOf(shape);
  return ctx.style === "hand"
    ? sketchColors(accent, ctx.dark).heading
    : shapeColors(accent, ctx.dark).text;
}
