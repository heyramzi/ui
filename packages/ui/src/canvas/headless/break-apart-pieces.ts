// Break apart, the reading half: which cards, shapes, frames, step numbers and arrows a figure holds.

import {
  boxOfEl,
  centerOf,
  isEl,
  plus,
  solid,
  strokeEnds,
  translateOf,
  type Box,
  type FigureChild,
  type FigureEl,
  type Pt,
} from "#src/canvas/headless/figure-geometry.js";
import {
  ARROWHEAD_MAX,
  findCards,
  findLoose,
  type Found,
  type Loose,
} from "#src/canvas/headless/break-apart-find.js";

const ORIGIN: Pt = { x: 0, y: 0 };

export type Arrow = {
  el: FigureEl;
  head?: FigureEl;
  from: Pt;
  to: Pt;
  startArrow: boolean;
  endArrow: boolean;
};

/** Everything a figure breaks into, with the arrows that may link the cards. */
export type Pieces = { cards: Found[]; loose: Loose; arrows: Arrow[] };

/** A closed path with a fill: the shape of a drawn arrowhead. */
function isTipPath(el: FigureEl): boolean {
  return el.tag === "path" && /z\s*$/i.test(el.attrs.d ?? "") && solid(el.attrs.fill);
}

/** A small filled closed path beside a line's end: the way the pin figures draw an arrowhead. */
function headNear(
  siblings: FigureChild[],
  from: number,
  ends: [Pt, Pt],
  offset: Pt,
): { el: FigureEl; end: 0 | 1 } | null {
  // Whitespace between tags is a string child, so the next element is not always the next child.
  const next = siblings.slice(from + 1).find(isEl);
  if (!next || !isTipPath(next)) return null;
  const box = boxOfEl(next, offset);
  if (!box || box.x2 - box.x1 > ARROWHEAD_MAX || box.y2 - box.y1 > ARROWHEAD_MAX) return null;
  const middle = centerOf(box);
  const d0 = Math.hypot(middle.x - ends[0].x, middle.y - ends[0].y);
  const d1 = Math.hypot(middle.x - ends[1].x, middle.y - ends[1].y);
  if (Math.min(d0, d1) > ARROWHEAD_MAX) return null;
  return { el: next, end: d1 <= d0 ? 1 : 0 };
}

/** A stroked line, polyline or path with no fill: a candidate link. */
function isStrokeOnly(el: FigureEl): boolean {
  if (el.tag !== "path" && el.tag !== "line" && el.tag !== "polyline") return false;
  return solid(el.attrs.stroke) && !solid(el.attrs.fill);
}

function arrowOf(parent: FigureEl, child: FigureEl, index: number, offset: Pt): Arrow | null {
  if (!isStrokeOnly(child)) return null;
  const ends = strokeEnds(child, offset);
  if (!ends) return null;
  const head = headNear(parent.children, index, ends, offset);
  const startArrow = Boolean(child.attrs["marker-start"]) || head?.end === 0;
  const endArrow = Boolean(child.attrs["marker-end"]) || head?.end === 1;
  // With no head at all the line still links two cards; it just draws without a tip.
  return { el: child, head: head?.el, from: ends[0], to: ends[1], startArrow, endArrow };
}

function collectArrows(el: FigureEl, offset: Pt, out: Arrow[]) {
  el.children.forEach((child, index) => {
    if (!isEl(child)) return;
    if (child.tag !== "g") {
      const arrow = arrowOf(el, child, index, offset);
      if (arrow) out.push(arrow);
      return;
    }
    const shift = translateOf(child);
    if (shift) collectArrows(child, plus(offset, shift), out);
  });
}

/** Cards, loose pieces and arrows in a figure, or null when nothing in it can break apart. */
export function findPieces(tree: FigureEl, drawing: Box): Pieces | null {
  const groupCards: Found[] = [];
  findCards(tree, ORIGIN, drawing, groupCards);
  const claimed = new Set<FigureChild>();
  for (const card of groupCards) for (const part of card.claimed) claimed.add(part);
  const loose = findLoose(tree, drawing, claimed, groupCards);
  const cards = [...groupCards, ...loose.cards];
  if (cards.length + loose.shapes.length + loose.frames.length === 0) return null;
  const arrows: Arrow[] = [];
  collectArrows(tree, ORIGIN, arrows);
  return { cards, loose, arrows };
}
