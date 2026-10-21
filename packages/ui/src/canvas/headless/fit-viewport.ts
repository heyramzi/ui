// WHY not SvelteFlow's `fitView`: it needs a paint to measure, and a deck slide
// reads at once, so it blew up one corner of the drawing.

// The saved diagram holds the geometry, so the viewport is computed from it.

import type { CanvasViewport } from "#src/canvas/types.js";

/** What a node occupies when the saved data does not say. */
const FALLBACK_NODE = { width: 240, height: 80 };

type Sized = { x: number; y: number; width: number; height: number };

// WHY not `CanvasNode`: bounds only read geometry, so an xyflow `Node` fits too
// and neither side of the boundary needs a cast.
type GeometryNode = {
  parentId?: string;
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

/** A stored node often has a width and no height (the DOM measures it), so each side is read alone. */
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

/**
 * The box every top-level node sits in. Children are parent-relative, so
 * counting them would push the bounds out and shrink the drawing.
 */
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

/**
 * The viewport that centres `nodes` inside a `container` of the given size.
 * `padding` is a fraction of the container, matching fitView's own meaning.
 */
export function fitViewport(
  nodes: GeometryNode[],
  container: { width: number; height: number },
  padding = 0.04,
): CanvasViewport | null {
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

/*
 * Where a board with no view opens: a board that fits reads whole, but a tall
 * wall fits at 8%, so it fits its width and starts at the top.
 */
export function openingViewport(
  nodes: GeometryNode[],
  container: { width: number; height: number },
  padding = 0.04,
  gutter = 0,
): CanvasViewport | null {
  const whole = fitViewport(nodes, container, padding);
  if (!whole || whole.zoom >= MIN_READABLE_ZOOM) return whole;

  const bounds = diagramBounds(nodes);
  if (!bounds) return null;
  const inset = container.width * padding;
  const left = inset + gutter;
  const zoom = Math.min((container.width - left - inset) / bounds.width, 1);
  return { x: left - bounds.x * zoom, y: inset - bounds.y * zoom, zoom };
}

/**
 * Whether a saved view still shows the board: a card is on screen, and a fitting board isn't
 * pushed off the left. `inset` is the tool rail's strip.
 */
export function viewShowsContent(
  nodes: GeometryNode[],
  viewport: CanvasViewport,
  container: { width: number; height: number },
  inset = { left: 0 },
): boolean {
  const bounds = diagramBounds(nodes);
  if (!bounds || viewport.zoom <= 0) return true;
  const left = (inset.left - viewport.x) / viewport.zoom;
  const right = (container.width - viewport.x) / viewport.zoom;
  const top = -viewport.y / viewport.zoom;
  const bottom = (container.height - viewport.y) / viewport.zoom;
  const onScreen =
    bounds.x < right &&
    bounds.x + bounds.width > left &&
    bounds.y < bottom &&
    bounds.y + bounds.height > top;
  if (!onScreen) return false;
  const fits = bounds.width * viewport.zoom <= container.width - inset.left;
  return !(fits && bounds.x < left - 4 / viewport.zoom);
}
