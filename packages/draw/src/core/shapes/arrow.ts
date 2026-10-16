import rough from "roughjs";
import type { ShapeUtil, SvgContext, Vec } from "../types";
import { boundsOf, localPoint, type Shape } from "./base";
import { distanceToPolyline } from "../math/polygon";
import { boxPatch, resizeShapeBox } from "./resize";
import { DEFAULT_ACCENT, shapeColors } from "./style";
import { sketchColors, type SketchPath } from "../rough";
import { localGroup, pathsToSvg, penFor } from "./hand";
import { polylineToPath, wrapSvg } from "./svg";

export type ArrowHead = "none" | "arrow";

export type ArrowProps = {
  /** Where the tail sits, relative to the box's top-left. */
  start: Vec;
  /** Where the tip sits, relative to the box's top-left. */
  end: Vec;
  /** 0 is straight. The signed distance the curve bows off the line at its middle. */
  bend: number;
  startHead: ArrowHead;
  endHead: ArrowHead;
  color?: string;
};

export type ArrowShape = Shape<"arrow", ArrowProps>;

/** How far past the tip each arrowhead wing reaches, and how wide they fan. */
const HEAD_LENGTH = 11;
const HEAD_SPREAD = 0.42;

function accentOf(shape: ArrowShape): string {
  return shape.props.color ?? DEFAULT_ACCENT;
}

/** A bent arrow draws in the drawn palette's stroke in hand style, the plain one in clean. */
function arrowStroke(shape: ArrowShape, ctx: SvgContext): string {
  return ctx.style === "hand"
    ? sketchColors(accentOf(shape), ctx.dark).stroke
    : shapeColors(accentOf(shape), ctx.dark).stroke;
}

/** The shaft as a sampled quadratic, box-local, with the control point pushed out twice the bend so the curve crosses exactly `bend` off the line (tldraw's meaning). */
export function arrowCurve(start: Vec, end: Vec, bend: number, samples = 24): Vec[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0 || bend === 0) return [start, end];

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const controlX = midX + (-dy / length) * bend * 2;
  const controlY = midY + (dx / length) * bend * 2;

  const points: Vec[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const u = 1 - t;
    points.push({
      x: u * u * start.x + 2 * u * t * controlX + t * t * end.x,
      y: u * u * start.y + 2 * u * t * controlY + t * t * end.y,
    });
  }
  return points;
}

/** The direction the shaft points as it reaches one end, so the head can face out. */
function tipAngle(curve: Vec[], atStart: boolean): number {
  const tip = atStart ? curve[0] : curve[curve.length - 1];
  const behind = atStart ? curve[1] : curve[curve.length - 2];
  return Math.atan2(tip.y - behind.y, tip.x - behind.x);
}

function headWings(tip: Vec, angle: number): Vec[][] {
  return [angle - HEAD_SPREAD, angle + HEAD_SPREAD].map((a) => [
    { x: tip.x, y: tip.y },
    {
      x: tip.x + Math.cos(Math.PI + a) * HEAD_LENGTH,
      y: tip.y + Math.sin(Math.PI + a) * HEAD_LENGTH,
    },
  ]);
}

/** The shaft plus an arrowhead as two short strokes, all box-local. */
export function arrowStrokes(shape: ArrowShape): Vec[][] {
  const curve = arrowCurve(shape.props.start, shape.props.end, shape.props.bend);
  const strokes: Vec[][] = [curve];
  if (curve.length < 2) return strokes;
  if (shape.props.endHead === "arrow") {
    strokes.push(...headWings(curve[curve.length - 1], tipAngle(curve, false)));
  }
  if (shape.props.startHead === "arrow") {
    strokes.push(...headWings(curve[0], tipAngle(curve, true)));
  }
  return strokes;
}

function cleanSvg(shape: ArrowShape, ctx: SvgContext): string {
  const d = arrowStrokes(shape)
    .map((stroke) => polylineToPath(stroke))
    .join(" ");
  return `<path d="${d}" fill="none" stroke="${arrowStroke(
    shape,
    ctx,
  )}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function handSvg(shape: ArrowShape, ctx: SvgContext): string {
  const generator = rough.generator();
  const pen = penFor(shape, ctx);
  const paths: SketchPath[] = [];
  arrowStrokes(shape).forEach((stroke, i) => {
    const points = stroke.map((point) => [point.x, point.y] as [number, number]);
    const options = {
      seed: pen.seed + i,
      stroke: pen.colors.stroke,
      strokeWidth: 1.8,
      fillStyle: "solid" as const,
    };
    const drawable =
      points.length > 2
        ? generator.curve(points, { ...options, roughness: 1.1, bowing: 1.4 })
        : generator.line(points[0][0], points[0][1], points[1][0], points[1][1], {
            ...options,
            roughness: 0.8,
          });
    for (const path of generator.toPaths(drawable)) {
      paths.push({
        d: path.d,
        stroke: path.stroke,
        fill: path.fill ?? "none",
        strokeWidth: path.strokeWidth,
      });
    }
  });
  return pathsToSvg(paths);
}

/** Put the box around a pair of page endpoints and store them relative to it, assuming the arrow's rotation is squared away since only straight arrow ends move. */
export function fitArrowEnds(shape: ArrowShape, start: Vec, end: Vec): Partial<ArrowShape> {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
    props: {
      ...shape.props,
      start: { x: start.x - x, y: start.y - y },
      end: { x: end.x - x, y: end.y - y },
    },
  };
}

export const arrowUtil: ShapeUtil<ArrowShape> = {
  type: "arrow",
  defaults: () => ({
    type: "arrow",
    x: 0,
    y: 0,
    w: 160,
    h: 0,
    rotation: 0,
    parentId: null,
    props: {
      start: { x: 0, y: 0 },
      end: { x: 160, y: 0 },
      bend: 0,
      startHead: "none",
      endHead: "arrow",
      color: DEFAULT_ACCENT,
    },
  }),
  bounds: (shape) => boundsOf(shape),
  hitTest: (shape, point, margin) => {
    const local = localPoint(shape, point);
    const curve = arrowCurve(shape.props.start, shape.props.end, shape.props.bend).map((p) => ({
      x: shape.x + p.x,
      y: shape.y + p.y,
    }));
    return distanceToPolyline(local, curve) <= margin;
  },
  resize: (shape, handle, to) => {
    const patch = resizeShapeBox(shape, handle, to);
    const out: Partial<ArrowShape> = boxPatch(shape, patch);
    if (patch.w !== shape.w || patch.h !== shape.h) {
      const sx = shape.w === 0 ? 1 : patch.w / shape.w;
      const sy = shape.h === 0 ? 1 : patch.h / shape.h;
      out.props = {
        ...shape.props,
        start: { x: shape.props.start.x * sx, y: shape.props.start.y * sy },
        end: { x: shape.props.end.x * sx, y: shape.props.end.y * sy },
        bend: shape.props.bend * ((sx + sy) / 2),
      };
    }
    return out;
  },
  toSvg: (shape, ctx) => {
    const inner = ctx.style === "hand" ? handSvg(shape, ctx) : cleanSvg(shape, ctx);
    return wrapSvg(shape, localGroup(shape, inner));
  },
};
