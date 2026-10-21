// Break apart, the writing half: the ops that swap a figure's pieces for real nodes and edges.

import type { CanvasOp } from "#src/canvas/ops/ops.js";
import type { PenColor } from "#src/canvas/pen/types.js";
import {
  distanceToBox,
  distanceToSegment,
  areaOf,
  contains,
  num,
  solid,
  within,
  type Box,
  type FigureChild,
  type FigureEl,
  type Pt,
} from "#src/canvas/headless/figure-geometry.js";
import {
  LAND_TOLERANCE,
  type Badge,
  type Found,
  type Loose,
} from "#src/canvas/headless/break-apart-find.js";
import type { Arrow, Pieces } from "#src/canvas/headless/break-apart-pieces.js";
import {
  NOTE_TITLE_PX,
  accentOf,
  escapeMarkdown,
  fitScale,
  inked,
  penColorOf,
} from "#src/canvas/headless/break-apart-style.js";

/** The heading above the drawing; mirrors LABEL_H in svg-figure.ts. */
const LABEL_H = 27;
/** A step number sits this many drawing units from the card or arrow it numbers. */
const BADGE_REACH = 6;
const BADGE_LINK_REACH = 60;
const MARK_MIN = 24;

export type FigureNode = {
  id: string;
  position: { x: number; y: number };
  width?: number;
  parentId?: string;
  data: Record<string, unknown>;
};

/** The figure node and what a caller measured about it. The parsed tree is read separately. */
export type PlanSource = {
  /** The figure node as the board holds it. */
  node: FigureNode;
  /** Where the drawing sits inside the node box, in board px. Measured in a browser; headless callers omit it. */
  art?: { left: number; top: number; width: number };
  /** Ids already on the board, so a new card never reuses one. */
  takenIds?: ReadonlySet<string>;
  /** The look every new link starts with (the app's `NEW_EDGE_STYLE`). */
  edgeData?: Record<string, unknown>;
};

/** Everything the emitters share while one figure breaks apart. */
export type Plan = {
  node: FigureNode;
  drawing: Box;
  /** Board px per drawing unit. */
  scale: number;
  artLeft: number;
  artTop: number;
  artWidth: number;
  cards: Found[];
  loose: Loose;
  arrows: Arrow[];
  edgeData?: Record<string, unknown>;
  taken: Set<string>;
  removed: Set<FigureChild>;
  ops: CanvasOp[];
  cardIds: string[];
  frameIds: string[];
  /** Shapes and marks added so far, which numbers their ids. */
  shapes: number;
};

type Link = { arrow: Arrow; src: number; dst: number };

export function freshId(base: string, taken: Set<string>): string {
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  taken.add(id);
  return id;
}

export function startPlan(
  source: PlanSource,
  pieces: Pieces,
  drawing: Box,
  artWidth: number,
): Plan {
  const { node } = source;
  const taken = new Set(source.takenIds ?? []);
  taken.add(node.id);
  const cardIds = pieces.cards.map((_, i) => freshId(`${node.id}-card-${i + 1}`, taken));
  const frameIds = pieces.loose.frames.map((_, i) => freshId(`${node.id}-frame-${i + 1}`, taken));
  return {
    node,
    drawing,
    scale: artWidth / (drawing.x2 - drawing.x1),
    artLeft: source.art?.left ?? 0,
    artTop: source.art?.top ?? (node.data.label ? LABEL_H : 0),
    artWidth,
    cards: pieces.cards,
    loose: pieces.loose,
    arrows: pieces.arrows,
    edgeData: source.edgeData,
    taken,
    removed: new Set(),
    ops: [],
    cardIds,
    frameIds,
    shapes: 0,
  };
}

// =========================
// PLACEMENT
// =========================

export function toBoard(plan: Plan, p: Pt): Pt {
  return {
    x: Math.round(plan.node.position.x + plan.artLeft + (p.x - plan.drawing.x1) * plan.scale),
    y: Math.round(plan.node.position.y + plan.artTop + (p.y - plan.drawing.y1) * plan.scale),
  };
}

/** The smallest frame round a box, so a card inside two frames sits in the inner one. */
function frameOf(plan: Plan, box: Box, self = -1): number {
  const { frames } = plan.loose;
  let best = -1;
  frames.forEach((frame, i) => {
    if (i === self || !within(box, frame.box, 1) || areaOf(frame.box) <= areaOf(box)) return;
    if (best < 0 || areaOf(frame.box) < areaOf(frames[best].box)) best = i;
  });
  return best;
}

/** Where a frame's own space starts on the board, or the figure's origin when there is no frame. */
function frameOrigin(plan: Plan, frame: number): Pt {
  if (frame < 0) return { x: 0, y: 0 };
  const { box } = plan.loose.frames[frame];
  return toBoard(plan, { x: box.x1, y: box.y1 });
}

/** A position in the frame's own space, or the figure's when there is no frame. */
function placed(plan: Plan, box: Box, frame: number): Pt {
  const at = toBoard(plan, { x: box.x1, y: box.y1 });
  const origin = frameOrigin(plan, frame);
  return { x: at.x - origin.x, y: at.y - origin.y };
}

function parentOf(plan: Plan, frame: number): { parentId?: string } {
  if (frame >= 0) return { parentId: plan.frameIds[frame] };
  return plan.node.parentId ? { parentId: plan.node.parentId } : {};
}

function sizeOf(plan: Plan, box: Box): { width: number; height: number } {
  return {
    width: Math.round((box.x2 - box.x1) * plan.scale),
    height: Math.round((box.y2 - box.y1) * plan.scale),
  };
}

/** A shape drawn with fill alone gets the thinnest line the pen has. */
function strokeOf(plan: Plan, el: FigureEl): number {
  if (!solid(el.attrs.stroke)) return 1;
  return Math.max(1, Math.round(num(el.attrs["stroke-width"], 1.5) * plan.scale));
}

function colorOf(el: FigureEl): PenColor {
  const stroked = solid(el.attrs.stroke) ? penColorOf(el.attrs.stroke) : undefined;
  return stroked ?? penColorOf(el.attrs.fill) ?? "ink";
}

// =========================
// FRAMES AND SHAPES
// =========================

/** Frames come first so what sits in them draws above. */
export function addFrames(plan: Plan) {
  plan.loose.frames.forEach((frame, i) => {
    plan.removed.add(frame.el);
    const parent = frameOf(plan, frame.box, i);
    const { width, height } = sizeOf(plan, frame.box);
    plan.ops.push({
      kind: "addNode",
      node: {
        id: plan.frameIds[i],
        type: "wrapper",
        position: placed(plan, frame.box, parent),
        data: {
          nodeType: "wrapper",
          label: "",
          frame: true,
          stroke: colorOf(frame.el),
          strokeWidth: strokeOf(plan, frame.el),
          fill: inked(frame.el.attrs.fill) ? (penColorOf(frame.el.attrs.fill) ?? "none") : "none",
        },
        style: { width, height },
        width,
        height,
        ...parentOf(plan, parent),
      },
    });
  });
}

function addShape(plan: Plan, shape: Record<string, unknown>, box: Box, frame: number) {
  plan.shapes += 1;
  const { width, height } = sizeOf(plan, box);
  plan.ops.push({
    kind: "addNode",
    node: {
      id: freshId(`${plan.node.id}-shape-${plan.shapes}`, plan.taken),
      type: "shape",
      position: placed(plan, box, frame),
      data: { strokeWidth: 2, filled: false, label: "", ...shape },
      width,
      height,
      ...parentOf(plan, frame),
    },
  });
}

export function addShapes(plan: Plan) {
  for (const shape of plan.loose.shapes) {
    plan.removed.add(shape.el);
    const fill = shape.el.attrs.fill;
    const fillPen = inked(fill) ? penColorOf(fill) : undefined;
    addShape(
      plan,
      {
        shape: "rectangle",
        color: colorOf(shape.el),
        strokeWidth: strokeOf(plan, shape.el),
        filled: inked(fill),
        ...(fillPen ? { fill: fillPen } : {}),
      },
      shape.box,
      frameOf(plan, shape.box),
    );
  }
}

// =========================
// LINKS AND STEP NUMBERS
// =========================

function cardAt(cards: Found[], point: Pt): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => {
    if (!contains(card.box, point, LAND_TOLERANCE)) return;
    const dx = Math.max(card.box.x1 - point.x, 0, point.x - card.box.x2);
    const dy = Math.max(card.box.y1 - point.y, 0, point.y - card.box.y2);
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

function sideOf(box: Box, point: Pt): "top" | "bottom" | "left" | "right" {
  const gaps = [
    ["left", Math.abs(point.x - box.x1)],
    ["right", Math.abs(point.x - box.x2)],
    ["top", Math.abs(point.y - box.y1)],
    ["bottom", Math.abs(point.y - box.y2)],
  ] as const;
  return [...gaps].sort((a, b) => a[1] - b[1])[0][0];
}

/** The arrows that run from one card to another. */
export function linksOf(plan: Plan): Link[] {
  const links: Link[] = [];
  for (const arrow of plan.arrows) {
    const src = cardAt(plan.cards, arrow.from);
    const dst = cardAt(plan.cards, arrow.to);
    if (src >= 0 && dst >= 0 && src !== dst) links.push({ arrow, src, dst });
  }
  return links;
}

function nearestCard(cards: Found[], badge: Badge): number {
  const reach = badge.r + BADGE_REACH;
  let card = -1;
  let cardGap = Number.POSITIVE_INFINITY;
  cards.forEach((c, i) => {
    const gap = distanceToBox(c.box, badge.center);
    if (gap <= reach && gap < cardGap) {
      card = i;
      cardGap = gap;
    }
  });
  return card;
}

function nearestLink(links: Link[], badge: Badge): Arrow | null {
  let link: Arrow | null = null;
  let linkGap = Math.max(BADGE_LINK_REACH, badge.r * 3);
  for (const l of links) {
    const gap = distanceToSegment(l.arrow.from, l.arrow.to, badge.center);
    if (gap < linkGap) {
      link = l.arrow;
      linkGap = gap;
    }
  }
  return link;
}

/** A step number with no card or link to join becomes a small filled circle of its own. */
function addMark(plan: Plan, badge: Badge) {
  const side = Math.max(Math.round(badge.r * 2 * plan.scale), MARK_MIN);
  const at = toBoard(plan, badge.center);
  const frame = frameOf(plan, {
    x1: badge.center.x,
    y1: badge.center.y,
    x2: badge.center.x,
    y2: badge.center.y,
  });
  const origin = frameOrigin(plan, frame);
  plan.shapes += 1;
  plan.ops.push({
    kind: "addNode",
    node: {
      id: freshId(`${plan.node.id}-mark-${plan.shapes}`, plan.taken),
      type: "shape",
      position: {
        x: at.x - origin.x - Math.round(side / 2),
        y: at.y - origin.y - Math.round(side / 2),
      },
      data: {
        shape: "ellipse",
        color: colorOf(badge.circle),
        strokeWidth: 2,
        filled: true,
        label: badge.label,
      },
      width: side,
      height: side,
      ...parentOf(plan, frame),
    },
  });
}

/** A step number next to a card is its badge, next to a link its label, and otherwise a mark. */
export function placeBadges(plan: Plan, links: Link[]): Map<Arrow, string> {
  const linkLabels = new Map<Arrow, string>();
  for (const badge of plan.loose.badges) {
    const card = nearestCard(plan.cards, badge);
    const link = card < 0 ? nearestLink(links, badge) : null;
    if (card >= 0) {
      const kicker = plan.cards[card].kicker;
      plan.cards[card].kicker = [badge.label, kicker].filter(Boolean).join(" · ");
    } else if (link && !linkLabels.has(link)) linkLabels.set(link, badge.label);
    else addMark(plan, badge);
    plan.removed.add(badge.circle);
    plan.removed.add(badge.text);
  }
  return linkLabels;
}

// =========================
// CARDS AND EDGES
// =========================

function noteData(plan: Plan, card: Found, width: number, height: number) {
  const accent = accentOf(card.rect.attrs.stroke);
  const rx = num(card.rect.attrs.rx);
  const textScale = fitScale(card, (card.titleSize * plan.scale) / NOTE_TITLE_PX, width, height);
  return {
    nodeType: "note",
    label: card.title,
    ...(card.body.length > 0 ? { content: card.body.map(escapeMarkdown).join("\n") } : {}),
    ...(card.kicker ? { kicker: card.kicker } : {}),
    ...(accent ? { accent } : {}),
    ...(rx < 3 ? { shape: "rect" } : {}),
    userHeight: height,
    ...(Math.abs(textScale - 1) > 0.02 ? { textScale } : {}),
  };
}

export function addCards(plan: Plan) {
  const cardFrames = plan.cards.map((card) => frameOf(plan, card.box));
  plan.cards.forEach((card, i) => {
    for (const part of card.claimed) plan.removed.add(part);
    const frame = cardFrames[i];
    const { width, height } = sizeOf(plan, card.box);
    plan.ops.push({
      kind: "addNode",
      node: {
        id: plan.cardIds[i],
        type: "note",
        position: placed(plan, card.box, frame),
        data: noteData(plan, card, width, height),
        style: { width },
        width,
        ...parentOf(plan, frame),
      },
    });
  });
}

export function addEdges(plan: Plan, links: Link[], linkLabels: Map<Arrow, string>) {
  links.forEach(({ arrow, src: a, dst: b }, i) => {
    plan.removed.add(arrow.el);
    if (arrow.head) plan.removed.add(arrow.head);
    // An arrow drawn tip-first reads backwards: the link runs from the tail to the tip.
    const reversed = arrow.startArrow && !arrow.endArrow;
    const [src, dst] = reversed ? [b, a] : [a, b];
    const [srcPt, dstPt] = reversed ? [arrow.to, arrow.from] : [arrow.from, arrow.to];
    const label = linkLabels.get(arrow);
    plan.ops.push({
      kind: "addEdge",
      edge: {
        id: freshId(`${plan.node.id}-link-${i + 1}`, plan.taken),
        source: plan.cardIds[src],
        target: plan.cardIds[dst],
        sourceHandle: sideOf(plan.cards[src].box, srcPt),
        targetHandle: sideOf(plan.cards[dst].box, dstPt),
        ...(label ? { label } : {}),
        data: {
          ...plan.edgeData,
          endArrow: arrow.startArrow || arrow.endArrow,
          startArrow: arrow.startArrow && arrow.endArrow,
        },
      },
    });
  });
}
