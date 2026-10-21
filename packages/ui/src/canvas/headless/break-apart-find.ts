// Break apart, the reading half: which cards, shapes, frames and step numbers a figure holds.

import {
  areaOf,
  boxOfEl,
  centerOf,
  contains,
  fontSize,
  hasText,
  isBold,
  isEl,
  num,
  plus,
  solid,
  strokeEnds,
  textLines,
  translateOf,
  visible,
  within,
  type Box,
  type FigureChild,
  type FigureEl,
  type Pt,
} from "#src/canvas/headless/figure-geometry.js";

/** A group with more text than this is a panel, not a card. */
const MAX_CARD_TEXTS = 8;
/** Smaller than this share of the drawing, or it is a panel. */
const MAX_CARD_AREA = 0.4;
/** How far an arrow end may sit from a card edge and still land on it, in drawing units. */
export const LAND_TOLERANCE = 8;
export const ARROWHEAD_MAX = 20;
/** A dot's number is at most this long. */
const BADGE_MAX_CHARS = 2;
const BADGE_MAX_R = 30;
/** Nothing under this on a side is a card or a shape: a rule or a speck. */
const MIN_SIDE = 4;

const ORIGIN: Pt = { x: 0, y: 0 };

export type Found = {
  group: FigureEl;
  offset: Pt;
  rect: FigureEl;
  box: Box;
  claimed: Set<FigureChild>;
  title: string;
  kicker?: string;
  body: string[];
  /** The font size the title was drawn at, in drawing units. */
  titleSize: number;
};

/** One drawn element with its box in drawing units and the siblings it sits among. */
type Atom = {
  el: FigureEl;
  box: Box | null;
  offset: Pt;
  kids: FigureEl[];
  container: FigureEl;
  pins: boolean;
};

type Boxed = Atom & { box: Box };
type Shape = { el: FigureEl; box: Box };
type Frame = { el: FigureEl; box: Box };
/** A number in a dot: a step number. */
export type Badge = { circle: FigureEl; text: FigureEl; center: Pt; r: number; label: string };

export type Loose = {
  cards: Found[];
  shapes: Shape[];
  frames: Frame[];
  badges: Badge[];
  /** Panels that keep their chrome in the figure. */
  panels: Box[];
};

/** What `cardFromRect` needs: the rect, the box it draws, and the siblings it may claim. */
type CardRequest = {
  group: FigureEl;
  kids: FigureEl[];
  rect: FigureEl;
  box: Box;
  offset: Pt;
  taken: Set<FigureChild>;
};

// =========================
// CARDS
// =========================

const anchorOf = (el: FigureEl, offset: Pt): Pt => ({
  x: num(el.attrs.x) + offset.x,
  y: num(el.attrs.y) + offset.y,
});

/** A solid rect that has text standing inside it. */
function holdsText(rect: FigureEl, texts: FigureEl[], offset: Pt): Box | null {
  if (rect.tag !== "rect" || !visible(rect) || rect.attrs.fill === "none") return null;
  const box = boxOfEl(rect, offset);
  if (!box) return null;
  return texts.some((t) => contains(box, anchorOf(t, offset), 3)) ? box : null;
}

/** A number in a dot is a pin marker, not copy: the ring that stays in the figure carries it. */
function splitBadge(inside: FigureEl[], kids: FigureEl[]) {
  let badge: string | undefined;
  const words: FigureEl[] = [];
  const badgeParts: FigureEl[] = [];
  for (const t of inside) {
    const line = textLines(t).join(" ");
    const dot = kids.find(
      (k) =>
        k.tag === "circle" &&
        Math.hypot(num(k.attrs.cx) - num(t.attrs.x), num(k.attrs.cy) - num(t.attrs.y)) <=
          num(k.attrs.r) + 2,
    );
    if (dot && line.length <= 2) {
      badge = line;
      badgeParts.push(dot, t);
    } else words.push(t);
  }
  return { badge, words, badgeParts };
}

/** The title is the top bold line, not an end-pinned tag or a big count further down. */
function headlineOf(ordered: FigureEl[]) {
  const titleEl =
    ordered.find((t) => isBold(t) && t.attrs["text-anchor"] !== "end") ??
    [...ordered].sort(
      (a, b) => Number(isBold(b)) - Number(isBold(a)) || fontSize(b) - fontSize(a),
    )[0];
  const tag = ordered.find(
    (t) =>
      t !== titleEl &&
      t.attrs["text-anchor"] === "end" &&
      Math.abs(num(t.attrs.y) - num(titleEl.attrs.y)) < 8,
  );
  // A title set over two lines (CLAUDE, then CODE) is one title: the same face, directly after.
  const titleEls = [titleEl];
  const sameFace = (t: FigureEl) =>
    fontSize(t) === fontSize(titleEl) &&
    isBold(t) === isBold(titleEl) &&
    t.attrs["text-anchor"] === titleEl.attrs["text-anchor"];
  for (const t of ordered.slice(ordered.indexOf(titleEl) + 1)) {
    if (t === tag || !sameFace(t)) break;
    titleEls.push(t);
  }
  const bodyEls = ordered.filter((t) => !titleEls.includes(t) && t !== tag);
  return { titleEls, tag, bodyEls };
}

/** Same-line fragments read as one line, left to right. */
function bodyLines(bodyEls: FigureEl[]): string[] {
  const body: string[] = [];
  let lastY = Number.NaN;
  for (const t of bodyEls) {
    const text = textLines(t).join(" ");
    if (Math.abs(num(t.attrs.y) - lastY) < 3 && body.length > 0)
      body[body.length - 1] += ` ${text}`;
    else body.push(text);
    lastY = num(t.attrs.y);
  }
  return body;
}

/** Anything else drawn inside the card's own rect is its chrome and goes with it. */
function chromeOf(req: CardRequest, claimed: Set<FigureChild>): FigureEl[] {
  const { kids, box, offset, taken } = req;
  return kids.filter((k) => {
    if (claimed.has(k) || taken.has(k) || k.attrs.fill === "none") return false;
    const kb = boxOfEl(k, offset);
    return kb !== null && within(kb, box);
  });
}

const readingOrder = (a: FigureEl, b: FigureEl) =>
  num(a.attrs.y) - num(b.attrs.y) || num(a.attrs.x) - num(b.attrs.x);

/** One card: `rect` and whatever of its group's other children stands inside it. */
function cardFromRect(req: CardRequest): Found | null {
  const { group, kids, rect, box, offset, taken } = req;
  const inside = kids.filter(
    (k) => hasText(k) && !taken.has(k) && contains(box, anchorOf(k, offset), 3),
  );
  if (inside.length === 0 || inside.length > MAX_CARD_TEXTS) return null;

  const { badge, words, badgeParts } = splitBadge(inside, kids);
  if (words.length === 0) return null;

  const { titleEls, tag, bodyEls } = headlineOf([...words].sort(readingOrder));
  const claimed = new Set<FigureChild>([
    rect,
    ...badgeParts,
    ...titleEls,
    ...(tag ? [tag] : []),
    ...bodyEls,
  ]);
  for (const k of chromeOf(req, claimed)) claimed.add(k);

  return {
    group,
    offset,
    rect,
    box,
    claimed,
    title: titleEls.map((t) => textLines(t).join(" ")).join(" "),
    titleSize: fontSize(titleEls[0]),
    kicker:
      [badge, tag ? textLines(tag).join(" ") : undefined].filter(Boolean).join(" · ") || undefined,
    body: bodyLines(bodyEls),
  };
}

/** One group's children, split into the texts that might be copy. */
type GroupRead = { group: FigureEl; kids: FigureEl[]; texts: FigureEl[]; offset: Pt };

/** A `data-pins` group holds a pin per card rect. */
function readPinCards({ group, kids, texts, offset }: GroupRead): Found[] {
  const taken = new Set<FigureChild>();
  const out: Found[] = [];
  for (const rect of kids) {
    const box = holdsText(rect, texts, offset);
    const found = box && cardFromRect({ group, kids, rect, box, offset, taken });
    if (!found) continue;
    for (const part of found.claimed) taken.add(part);
    out.push(found);
  }
  return out;
}

/** Any other group is one card, unless it is a panel: too much text, a subgroup or too much of the drawing. */
function readOneCard({ group, kids, texts, offset }: GroupRead, drawing: Box): Found[] {
  if (texts.length > MAX_CARD_TEXTS || kids.some((k) => k.tag === "g")) return [];
  for (const rect of kids) {
    const box = holdsText(rect, texts, offset);
    if (!box) continue;
    if (areaOf(box) > areaOf(drawing) * MAX_CARD_AREA) return [];
    const found = cardFromRect({ group, kids, rect, box, offset, taken: new Set() });
    return found ? [found] : [];
  }
  return [];
}

/** Cards in one group. */
function readCards(group: FigureEl, offset: Pt, drawing: Box): Found[] {
  const kids = group.children.filter(isEl);
  const texts = kids.filter(hasText);
  if (texts.length === 0) return [];
  const read = { group, kids, texts, offset };
  return "data-pins" in group.attrs ? readPinCards(read) : readOneCard(read, drawing);
}

export function findCards(el: FigureEl, offset: Pt, drawing: Box, out: Found[]) {
  for (const child of el.children) {
    if (!isEl(child) || child.tag !== "g") continue;
    const shift = translateOf(child);
    if (!shift) continue;
    const at = plus(offset, shift);
    const found = readCards(child, at, drawing);
    if (found.length > 0) out.push(...found);
    else findCards(child, at, drawing, out);
  }
}

// =========================
// LOOSE SHAPES
// =========================

function flatten(container: FigureEl, offset: Pt, pins: boolean, out: Atom[]) {
  const kids = container.children.filter(isEl);
  for (const el of kids) {
    if (el.tag === "g") {
      const shift = translateOf(el);
      if (shift) flatten(el, plus(offset, shift), pins || "data-pins" in el.attrs, out);
      continue;
    }
    if (el.tag === "defs" || el.tag === "title" || el.tag === "desc") continue;
    out.push({ el, box: boxOfEl(el, offset), offset, kids, container, pins });
  }
}

/** Whether a text sits on a dot and is short enough to be its number. */
function numbersDot(a: Atom, center: Pt, r: number): boolean {
  const at = anchorOf(a.el, a.offset);
  return (
    textLines(a.el).join(" ").length <= BADGE_MAX_CHARS &&
    Math.hypot(at.x - center.x, at.y - center.y) <= r + 2
  );
}

/** A number in a dot is a step number. */
function findBadges(free: Atom[], texts: Atom[]) {
  const parts = new Set<FigureChild>();
  const badges: Badge[] = [];
  for (const c of free.filter((a) => a.el.tag === "circle")) {
    const r = num(c.el.attrs.r);
    if (!c.box || r <= 0 || r > BADGE_MAX_R) continue;
    const center = centerOf(c.box);
    const t = texts.find((a) => !parts.has(a.el) && numbersDot(a, center, r));
    if (!t) continue;
    parts.add(c.el);
    parts.add(t.el);
    badges.push({ circle: c.el, text: t.el, center, r, label: textLines(t.el).join(" ") });
  }
  return { badges, parts };
}

const isTip = (box: Box | null) =>
  box !== null && box.x2 - box.x1 <= ARROWHEAD_MAX && box.y2 - box.y1 <= ARROWHEAD_MAX;

/** A line that ends on two items joins them, and a small filled tip beside it is its arrowhead. */
function isConnector(a: Atom, itemBoxes: Box[]): boolean {
  if (!["line", "polyline", "path"].includes(a.el.tag)) return false;
  if (solid(a.el.attrs.fill)) return isTip(a.box);
  const ends = strokeEnds(a.el, a.offset);
  return ends !== null && ends.every((p) => itemBoxes.some((b) => contains(b, p, LAND_TOLERANCE)));
}

/** What `sweepRects` weighs each rect against. */
type Sweep = {
  rects: Boxed[];
  words: Atom[];
  strays: Atom[];
  groupCards: Found[];
  drawing: Box;
  taken: Set<FigureChild>;
};

/** A rect with no rect inside it: a bare shape, or a card when it holds its own text. */
function leafRect(sweep: Sweep, x: Boxed, hasWords: boolean, out: Loose) {
  if (!hasWords) {
    out.shapes.push({ el: x.el, box: x.box });
    return;
  }
  if (areaOf(x.box) > areaOf(sweep.drawing) * MAX_CARD_AREA) return;
  const found = cardFromRect({
    group: x.container,
    kids: x.kids,
    rect: x.el,
    box: x.box,
    offset: x.offset,
    taken: sweep.taken,
  });
  if (!found) return;
  for (const part of found.claimed) sweep.taken.add(part);
  out.cards.push(found);
}

/** A rect round other items is a panel, a frame or a shape, by what it holds. */
function classifyRect(sweep: Sweep, x: Boxed, dropped: Set<Atom>, out: Loose) {
  const { box } = x;
  const inner = sweep.rects.filter(
    (o) => o !== x && !dropped.has(o) && within(o.box, box, 1) && areaOf(o.box) < areaOf(box),
  );
  const innerBoxes = [
    ...inner.map((o) => o.box),
    ...sweep.groupCards.filter((c) => within(c.box, box, 1)).map((c) => c.box),
  ];
  const held = (point: Pt) =>
    innerBoxes.some((b) => contains(b, point, 3)) ? false : contains(box, point, 3);
  const own = sweep.words.filter((w) => held(anchorOf(w.el, w.offset)));

  if (innerBoxes.length === 0) {
    leafRect(sweep, x, own.length > 0, out);
    return;
  }
  const stray = sweep.strays.some(
    ({ box: sb }) => sb !== null && within(sb, box, 1) && !innerBoxes.some((b) => within(sb, b, 1)),
  );
  if (own.length > 0 || stray) {
    out.panels.push(box);
    for (const o of inner) dropped.add(o);
    return;
  }
  if (innerBoxes.length >= 2) out.frames.push({ el: x.el, box });
  else out.shapes.push({ el: x.el, box });
}

function sweepRects(sweep: Sweep, out: Loose) {
  const dropped = new Set<Atom>();
  for (const x of sweep.rects) {
    if (!dropped.has(x)) classifyRect(sweep, x, dropped, out);
  }
}

/** Loose cards, bare rectangles, frames and step numbers. A rectangle with its own text and shapes inside is a panel, so its chrome stays. */
export function findLoose(
  tree: FigureEl,
  drawing: Box,
  taken: Set<FigureChild>,
  groupCards: Found[],
): Loose {
  const atoms: Atom[] = [];
  flatten(tree, ORIGIN, false, atoms);
  const free = atoms.filter((a) => !a.pins && a.box && !taken.has(a.el));
  const texts = free.filter((a) => hasText(a.el));
  const { badges, parts } = findBadges(free, texts);

  const rects = free
    .filter((a): a is Boxed => a.el.tag === "rect" && visible(a.el) && a.box !== null)
    .filter((a) => a.box.x2 - a.box.x1 >= MIN_SIDE && a.box.y2 - a.box.y1 >= MIN_SIDE)
    .sort((a, b) => areaOf(b.box) - areaOf(a.box));
  const itemBoxes = [...rects.map((a) => a.box), ...groupCards.map((c) => c.box)];
  const strays = free.filter(
    (a) => !["rect", "text"].includes(a.el.tag) && !parts.has(a.el) && !isConnector(a, itemBoxes),
  );

  const out: Loose = { cards: [], shapes: [], frames: [], badges, panels: [] };
  const words = texts.filter((a) => !parts.has(a.el));
  sweepRects({ rects, words, strays, groupCards, drawing, taken }, out);

  // A number a card already took is not a mark of its own.
  out.badges = out.badges.filter((b) => !taken.has(b.circle) && !taken.has(b.text));
  out.badges = out.badges.filter((b) => !out.panels.some((p) => contains(p, b.center, 0)));
  return out;
}
