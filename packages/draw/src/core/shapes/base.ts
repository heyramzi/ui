import type { Box, ShapeRecord, Vec } from "../types";
import { boxCenter, boxCorners, boxContains, rotatedBoxBounds } from "../math/box";
import { pointToSegmentDistance } from "../math/segment";
import { pointInPolygon } from "../math/polygon";
import { rotate } from "../math/vec";

/** A shape of one type with its own props. */
export type Shape<Type extends string, Props> = ShapeRecord<Type, Props>;

/** The shape's box, rotation applied. */
export function boundsOf(shape: ShapeRecord): Box {
  return rotatedBoxBounds(shape, shape.rotation);
}

/** Bring a page point into the shape's unrotated frame, where its box is axis-aligned. */
export function localPoint(shape: ShapeRecord, point: Vec): Vec {
  return rotate(point, boxCenter(shape), -shape.rotation);
}

/** Shortest distance from a point to the rectangle's outline. */
export function distanceToBoxPerimeter(point: Vec, box: Box): number {
  const [a, b, c, d] = boxCorners(box);
  return Math.min(
    pointToSegmentDistance(point, a, b),
    pointToSegmentDistance(point, b, c),
    pointToSegmentDistance(point, c, d),
    pointToSegmentDistance(point, d, a)
  );
}

/** A point hits a filled box on or inside it, plus the margin. */
export function hitsFilledBox(shape: ShapeRecord, point: Vec, margin: number): boolean {
  const local = localPoint(shape, point);
  const grow = Math.max(margin, 0);
  return boxContains(
    { x: shape.x - grow, y: shape.y - grow, w: shape.w + grow * 2, h: shape.h + grow * 2 },
    local
  );
}

/** A point hits a stroke-only rectangle within the margin of its outline. */
export function hitsBoxOutline(shape: ShapeRecord, point: Vec, margin: number): boolean {
  const local = localPoint(shape, point);
  return distanceToBoxPerimeter(local, shape) <= margin;
}

/** A point hits a filled polygon on or inside it. */
export function hitsFilledPolygon(shape: ShapeRecord, point: Vec, polygon: Vec[]): boolean {
  return pointInPolygon(localPoint(shape, point), polygon);
}

/** Bring a list of box-relative points into page-local coordinates. */
export function toPageLocal(shape: ShapeRecord, points: Vec[]): Vec[] {
  return points.map((point) => ({ x: shape.x + point.x, y: shape.y + point.y }));
}
