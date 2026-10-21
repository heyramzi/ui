// Break apart: a drawn figure's cards become real cards. Pure over a parsed tree, so a
// browser, a CLI and a server run the same code.

import type { CanvasOp } from "#src/canvas/ops/ops.js";
import { sanitizeFigureSvg } from "#src/canvas/headless/svg-figure.js";
import { PEN_HEX } from "#src/canvas/pen/colors.js";
import type { PenColor } from "#src/canvas/pen/types.js";
import {
  isEl,
  translateOf,
  union,
  viewBoxOf,
  boxOfEl,
  type Box,
  type FigureChild,
  type FigureEl,
} from "#src/canvas/headless/figure-geometry.js";
import { findPieces } from "#src/canvas/headless/break-apart-pieces.js";
import { NOTE_BODY_PX, NOTE_TITLE_PX, round1 } from "#src/canvas/headless/break-apart-style.js";
import {
  addCards,
  addEdges,
  addFrames,
  addShapes,
  freshId,
  linksOf,
  placeBadges,
  startPlan,
  type Plan,
  type PlanSource,
} from "#src/canvas/headless/break-apart-plan.js";

// =========================
// TYPES
// =========================

/** What the tree reader needs from a DOM node, so no global `Element` is named here. */
export type DomLike = {
  nodeType: number;
  localName?: string;
  textContent: string | null;
  attributes?: ArrayLike<{ name: string; value: string }>;
  childNodes?: ArrayLike<DomLike>;
};

export type BreakApartInput = PlanSource & {
  /** The parsed `<svg>` root of the figure's markup, unsanitized: `data-pins` is read from it. */
  tree: FigureEl;
};

export type BreakApartResult = {
  ops: CanvasOp[];
  cards: number;
  edges: number;
  /** Bare rectangles and number marks that became shapes. */
  shapes: number;
  /** Rectangles drawn round cards that became frames. */
  frames: number;
  /** The figure stays, smaller, because it still has panels or chrome. */
  remains: boolean;
};

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
/** Space between the drawing and the caption set under it. */
const CAPTION_GAP = 8;

// =========================
// TREE
// =========================

/** Read a DOM element (or any node shaped like one) into a tree. */
export function treeFromElement(el: DomLike): FigureEl {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(el.attributes ?? [])) attrs[attr.name] = attr.value;
  const children: FigureChild[] = [];
  for (const child of Array.from(el.childNodes ?? [])) {
    if (child.nodeType === TEXT_NODE) children.push(child.textContent ?? "");
    else if (child.nodeType === ELEMENT_NODE) children.push(treeFromElement(child));
  }
  return { tag: el.localName ?? "", attrs, children };
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function serialize(child: FigureChild): string {
  if (typeof child === "string") return escapeText(child);
  const attrs = Object.entries(child.attrs)
    .map(([name, value]) => ` ${name}="${value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`)
    .join("");
  return `<${child.tag}${attrs}>${child.children.map(serialize).join("")}</${child.tag}>`;
}

// =========================
// WHAT IS LEFT
// =========================

function prune(el: FigureEl, removed: Set<FigureChild>): FigureEl {
  const children: FigureChild[] = [];
  for (const child of el.children) {
    if (removed.has(child)) continue;
    if (isEl(child) && child.tag === "g") {
      const kept = prune(child, removed);
      // A group left with no shape, only whitespace, is gone.
      if (kept.children.some((c) => (isEl(c) ? true : c.trim() !== ""))) children.push(kept);
      continue;
    }
    children.push(child);
  }
  return { ...el, children };
}

/** The ink left once the cards are out: drawable shapes and text, ignoring defs. */
function leftover(el: FigureEl): Box | null {
  let box: Box | null = null;
  for (const child of el.children) {
    if (!isEl(child) || child.tag === "defs" || child.tag === "title" || child.tag === "desc")
      continue;
    if (child.tag === "g") {
      const shift = translateOf(child) ?? { x: 0, y: 0 };
      const inner = leftover(child);
      if (inner) {
        box = union(box, {
          x1: inner.x1 + shift.x,
          y1: inner.y1 + shift.y,
          x2: inner.x2 + shift.x,
          y2: inner.y2 + shift.y,
        });
      }
      continue;
    }
    box = union(box, boxOfEl(child, { x: 0, y: 0 }));
  }
  return box;
}

/** Nothing is left to draw: the figure goes, and its title and caption stay as text above and below the pieces. */
function replaceWithText(plan: Plan) {
  const { node, taken, ops, drawing, scale, artTop } = plan;
  ops.push({ kind: "removeNode", nodeId: node.id });
  const accent = node.data.accent as string | undefined;
  const color = (Object.keys(PEN_HEX) as PenColor[]).find((c) => c === accent) ?? "ink";
  const textWidth = Math.round(plan.artWidth);
  const words: [string, number, number][] = [
    [String(node.data.label ?? ""), NOTE_TITLE_PX, node.position.y],
    [
      String(node.data.caption ?? ""),
      NOTE_BODY_PX,
      Math.round(node.position.y + artTop + (drawing.y2 - drawing.y1) * scale + CAPTION_GAP),
    ],
  ];
  for (const [i, [text, fontSize, y]] of words.entries()) {
    if (!text) continue;
    ops.push({
      kind: "addNode",
      node: {
        id: freshId(`${node.id}-text-${i === 0 ? "title" : "caption"}`, taken),
        type: "text",
        position: { x: node.position.x, y },
        data: { text, color, fontSize, fixedWidth: true },
        width: textWidth,
        height: Math.round(fontSize * 1.4),
        ...(node.parentId ? { parentId: node.parentId } : {}),
      },
    });
  }
}

/** The figure keeps its height, so its caption stays under the pieces; only the sides shrink. */
function shrinkFigure(plan: Plan, rest: FigureEl, ink: Box) {
  const { node, drawing, scale, ops } = plan;
  const crop: Box = {
    x1: Math.max(ink.x1, drawing.x1),
    y1: drawing.y1,
    x2: Math.min(ink.x2, drawing.x2),
    y2: drawing.y2,
  };
  const cropW = crop.x2 - crop.x1;
  const cropH = crop.y2 - crop.y1;
  const markup = sanitizeFigureSvg(
    serialize({
      ...rest,
      attrs: {
        ...rest.attrs,
        viewBox: `${round1(crop.x1)} ${round1(crop.y1)} ${round1(cropW)} ${round1(cropH)}`,
      },
    }),
  );
  const width = Math.round(cropW * scale);
  const board = node.data.board as { w?: number } | undefined;
  ops.push({
    kind: "patchNode",
    nodeId: node.id,
    data: { svg: markup ?? "", ...(board?.w ? { board: { ...board, w: width } } : {}) },
    width,
    style: { width },
  });
  const shift = {
    x: Math.round(node.position.x + (crop.x1 - drawing.x1) * scale),
    y: Math.round(node.position.y + (crop.y1 - drawing.y1) * scale),
  };
  if (shift.x !== node.position.x || shift.y !== node.position.y) {
    ops.push({ kind: "moveNode", nodeId: node.id, position: shift });
  }
}

// =========================
// BREAK APART
// =========================

/** Ops that swap a figure for cards, links, shapes and frames, or null with none in it. The rest stays as a smaller figure. */
export function breakApartFigure(input: BreakApartInput): BreakApartResult | null {
  const { node, tree } = input;
  const drawing = viewBoxOf(tree);
  const artWidth = input.art?.width ?? node.width;
  if (!drawing || !artWidth) return null;
  const pieces = findPieces(tree, drawing);
  if (!pieces) return null;

  const plan = startPlan(input, pieces, drawing, artWidth);
  addFrames(plan);
  addShapes(plan);
  const links = linksOf(plan);
  const linkLabels = placeBadges(plan, links);
  addCards(plan);
  addEdges(plan, links, linkLabels);

  const counts = {
    cards: plan.cards.length,
    edges: links.length,
    shapes: plan.shapes,
    frames: plan.loose.frames.length,
  };
  const rest = prune(tree, plan.removed);
  const ink = leftover(rest);
  if (!ink) {
    replaceWithText(plan);
    return { ops: plan.ops, ...counts, remains: false };
  }
  shrinkFigure(plan, rest, ink);
  return { ops: plan.ops, ...counts, remains: true };
}
