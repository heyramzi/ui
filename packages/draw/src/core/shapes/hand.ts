import { seedFrom, sketchColors, type SketchPath, type SketchPen } from "../rough";
import type { ShapeRecord, SvgContext } from "../types";
import { accentOf } from "./colors";
import { num, pathEl } from "./svg";

/** The seed and colours the rough module draws a shape with. */
export function penFor(shape: ShapeRecord, ctx: SvgContext): SketchPen {
  return { seed: seedFrom(shape.id), colors: sketchColors(accentOf(shape), ctx.dark) };
}

/** Rough paths as SVG path elements. */
export function pathsToSvg(paths: SketchPath[]): string {
  return paths.map((path) => pathEl(path.d, path.stroke, path.fill, path.strokeWidth)).join("");
}

/** Move box-local rough output onto the shape's page position. */
export function localGroup(shape: ShapeRecord, markup: string): string {
  return `<g transform="translate(${num(shape.x)} ${num(shape.y)})">${markup}</g>`;
}
