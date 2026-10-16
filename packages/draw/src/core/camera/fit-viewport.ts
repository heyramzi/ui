// Why compute the viewport from the geometry instead of measuring: it needs no
// paint, so a slide or a server render reads at once and never clips a corner.

import type { Camera } from "../types";

/** What a shape occupies when the saved data does not say. */
const FALLBACK_NODE = { width: 240, height: 80 };

type Sized = { x: number; y: number; width: number; height: number };

/** Bounds only read geometry, so anything with a position and a size fits. */
export type GeometryNode = {
  parentId?: string | null;
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
  style?: unknown;
};

type Size = { width: number; height: number };

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cssDim(css: string, prop: "width" | "height"): number | null {
  const found = css.match(new RegExp(`(?:^|[;\\s])${prop}:\\s*(\\d+(?:\\.\\d+)?)px`))?.[1];
  return found ? Number(found) : null;
}

/** A stored shape often has a width and no height (the DOM measures it), so each
 *  side is read alone. */
function styleDim(style: unknown, prop: "width" | "height"): number | null {
  if (typeof style === "string") return cssDim(style, prop);
  if (!style || typeof style !== "object") return null;
  return num((style as Record<string, unknown>)[prop]);
}

function readSize(node: GeometryNode): Size {
  return {
    width: num(node.width) ?? styleDim(node.style, "width") ?? FALLBACK_NODE.width,
    height: num(node.height) ?? styleDim(node.style, "height") ?? FALLBACK_NODE.height,
  };
}

/** The box every top-level shape sits in. Children are parent-relative, so
 *  counting them would push the bounds out and shrink the drawing. */
export function diagramBounds(nodes: GeometryNode[]): Sized | null {
  const boxes = nodes
    .filter((node) => !node.parentId)
    .map((node) => ({ ...readSize(node), x: node.position.x, y: node.position.y }));
  if (boxes.length === 0) return null;

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** The camera that centres `nodes` inside a `container` of the given size.
 *  `padding` is a fraction of the container. */
export function fitViewport(
  nodes: GeometryNode[],
  container: { width: number; height: number },
  padding = 0.04,
): Camera | null {
  const bounds = diagramBounds(nodes);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;
  if (container.width <= 0 || container.height <= 0) return null;

  const usableWidth = container.width * (1 - padding * 2);
  const usableHeight = container.height * (1 - padding * 2);
  const zoom = Math.min(usableWidth / bounds.width, usableHeight / bounds.height);

  return {
    x: (container.width - bounds.width * zoom) / 2 - bounds.x * zoom,
    y: (container.height - bounds.height * zoom) / 2 - bounds.y * zoom,
    zoom,
  };
}

/** Below this a whole-board fit is too small to read a card's text. */
const MIN_READABLE_ZOOM = 0.3;

/** Where a board with no camera opens: a board that fits reads whole, but a tall wall would fit at 8%, so it fits its width from the top. */
export function openingViewport(
  nodes: GeometryNode[],
  container: { width: number; height: number },
  padding = 0.04,
  gutter = 0,
): Camera | null {
  const whole = fitViewport(nodes, container, padding);
  if (!whole || whole.zoom >= MIN_READABLE_ZOOM) return whole;

  const bounds = diagramBounds(nodes);
  if (!bounds) return null;
  const inset = container.width * padding;
  const left = inset + gutter;
  const zoom = Math.min((container.width - left - inset) / bounds.width, 1);
  return { x: left - bounds.x * zoom, y: inset - bounds.y * zoom, zoom };
}
