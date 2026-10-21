import type { KanbanColumn } from "#src/tasks/kanban-types.js";
import { dayNumber, isoFromDay, weekday } from "#src/tasks/dates.js";

export type Span = { start: number; end: number };
export type Drag = { id: string; mode: "move" | "start" | "end"; originX: number; dx: number };

export type TaskRow<T> = {
  kind: "task";
  item: T;
  id: string;
  order: number;
  depth: number;
  hasChildren: boolean;
  open: boolean;
  /** The task's own dates, with a live drag applied. Null when undated. */
  own: Span | null;
  /** What the row draws: its own span, else the span of what is below it. */
  span: Span | null;
};
export type GroupRow = { kind: "group"; group: KanbanColumn; count: number; span: Span | null };
export type Row<T> = GroupRow | TaskRow<T>;

export type Arrow = { key: string; d: string; head: string; from: string; to: string };

/** The numbers every part of the chart measures from. */
export type Layout = {
  /** The first day drawn, as a day number. */
  first: number;
  last: number;
  dayWidth: number;
  rowHeight: number;
  /** Gap either side of a bar. Under 18px a day is too narrow for one. */
  inset: number;
  timelineWidth: number;
  todayDay: number;
};

type Dates<T> = {
  getStart: (item: T) => string | null | undefined;
  getEnd: (item: T) => string | null | undefined;
};

export type RowSource<T> = Dates<T> & {
  getId: (item: T) => string;
  getParent?: (item: T) => string | null | undefined;
  getGroup?: (item: T) => string;
  groups?: KanbanColumn[];
  folded: Set<string>;
  drag: Drag | null;
};

const DAY_MS = 86_400_000;

export function dayX(layout: Layout, day: number): number {
  return (day - layout.first) * layout.dayWidth;
}

/** The task's own dates. A lone date stands for a one-day task. */
export function spanOf<T>(item: T, { getStart, getEnd }: Dates<T>): Span | null {
  const first = getStart(item) || getEnd(item);
  const last = getEnd(item) || getStart(item);
  if (!first || !last) return null;
  const start = dayNumber(first);
  return { start, end: Math.max(start, dayNumber(last)) };
}

/** A bar's span, with the live drag applied. Resizes never cross the other edge. */
export function liveSpan(span: Span | null, drag: Drag | null, id: string): Span | null {
  if (!span || drag?.id !== id || drag.dx === 0) return span;
  if (drag.mode === "move") return { start: span.start + drag.dx, end: span.end + drag.dx };
  if (drag.mode === "start") return { start: Math.min(span.start + drag.dx, span.end), end: span.end };
  return { start: span.start, end: Math.max(span.end + drag.dx, span.start) };
}

function join(a: Span | null, b: Span | null): Span | null {
  return !a ? b : !b ? a : { start: Math.min(a.start, b.start), end: Math.max(a.end, b.end) };
}

/** The days shown: the tasks' span, padded, starting on a Monday, unless `from` and `to` say otherwise. */
export function rangeOf<T>(
  items: T[],
  source: Dates<T>,
  todayDay: number,
  from?: string,
  to?: string,
): { first: number; last: number } {
  let lo = todayDay;
  let hi = todayDay;
  for (const item of items) {
    const span = spanOf(item, source);
    if (!span) continue;
    lo = Math.min(lo, span.start);
    hi = Math.max(hi, span.end);
  }
  let first = from ? dayNumber(from) : lo - 7;
  // Day 0 was a Thursday. Step back to the Monday on or before `first`.
  if (!from) first -= (weekday(first) + 6) % 7;
  const last = to ? dayNumber(to) : hi + 21;
  return { first, last: Math.max(last, first) };
}

export function buildDays(first: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const day = first + i;
    const wd = weekday(day);
    return { day, i, date: Number(isoFromDay(day).slice(8, 10)), wd, weekend: wd === 0 || wd === 6 };
  });
}
export type GanttDay = ReturnType<typeof buildDays>[number];

export function buildMonths(days: GanttDay[], format: Intl.DateTimeFormat) {
  const out: { key: string; label: string; i: number; length: number }[] = [];
  for (const d of days) {
    const key = isoFromDay(d.day).slice(0, 7);
    const last = out.at(-1);
    if (last?.key === key) last.length++;
    else out.push({ key, label: format.format(new Date(d.day * DAY_MS)), i: d.i, length: 1 });
  }
  return out;
}

/** Rows in draw order. Groups come first, then their tasks, a parent before its children. */
export function buildRows<T>(items: T[], source: RowSource<T>): Row<T>[] {
  const { getId, getParent, groups, getGroup, folded, drag } = source;
  const out: Row<T>[] = [];
  let order = 0;
  const live = (item: T, id: string) => liveSpan(spanOf(item, source), drag, id);

  // Depth first, so a parent's row comes before its children. A parent's span is known
  // only after its children are, so the row is pushed first and filled in after.
  const emit = (members: T[]) => {
    if (!getParent) {
      for (const item of members) {
        const id = getId(item);
        const own = live(item, id);
        out.push({ kind: "task", item, id, order: order++, depth: 0, hasChildren: false, open: true, own, span: own });
      }
      return;
    }
    const ids = new Set(members.map((item) => getId(item)));
    const kids = new Map<string | null, T[]>();
    for (const item of members) {
      const parent = getParent(item);
      const key = parent && ids.has(parent) ? parent : null;
      kids.set(key, [...(kids.get(key) ?? []), item]);
    }
    const walk = (item: T, depth: number, visible: boolean): Span | null => {
      const id = getId(item);
      const children = kids.get(id) ?? [];
      const open = !folded.has(id);
      const own = live(item, id);
      const row: TaskRow<T> = { kind: "task", item, id, order: 0, depth, hasChildren: children.length > 0, open, own, span: own };
      if (visible) {
        row.order = order++;
        out.push(row);
      }
      let below: Span | null = null;
      for (const child of children) below = join(below, walk(child, depth + 1, visible && open));
      if (!own) row.span = below;
      return join(own, below);
    };
    for (const item of kids.get(null) ?? []) walk(item, 0, true);
  };

  if (!groups || !getGroup) {
    emit(items);
    return out;
  }
  for (const group of groups) {
    const members = items.filter((item) => getGroup(item) === group.id);
    let span: Span | null = null;
    for (const item of members) span = join(span, live(item, getId(item)));
    out.push({ kind: "group", group, count: members.length, span });
    emit(members);
  }
  return out;
}

/** A right-angled path through `points`, each corner rounded by up to `radius`. */
export function roundedPath(points: [number, number][], radius: number): string {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const r = Math.min(radius, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2);
    const inX = cx - Math.sign(cx - px) * r;
    const inY = cy - Math.sign(cy - py) * r;
    const outX = cx + Math.sign(nx - cx) * r;
    const outY = cy + Math.sign(ny - cy) * r;
    d += ` L${inX},${inY} Q${cx},${cy} ${outX},${outY}`;
  }
  const [lx, ly] = points[points.length - 1];
  return `${d} L${lx},${ly}`;
}

/** Each arrow runs from the end of the task waited on to the start of the one waiting. */
export function buildArrows<T>(rows: Row<T>[], layout: Layout, getDependsOn: (item: T) => string[] | undefined): Arrow[] {
  const { rowHeight, inset } = layout;
  const at = new Map<string, { row: number; span: Span }>();
  rows.forEach((row, index) => {
    if (row.kind === "task" && row.span) at.set(row.id, { row: index, span: row.span });
  });
  const out: Arrow[] = [];
  for (const row of rows) {
    if (row.kind !== "task") continue;
    const target = at.get(row.id);
    if (!target) continue;
    for (const dep of getDependsOn(row.item) ?? []) {
      const source = at.get(dep);
      if (!source) continue;
      const x1 = dayX(layout, source.span.end + 1) - inset;
      const y1 = source.row * rowHeight + rowHeight / 2;
      const x2 = dayX(layout, target.span.start) + inset;
      const y2 = target.row * rowHeight + rowHeight / 2;
      // Room between the bars: one bend in the gap. No room: out, round the row gap, and back in.
      const points: [number, number][] =
        x2 - x1 >= 24
          ? [[x1, y1], [x1 + 12, y1], [x1 + 12, y2], [x2, y2]]
          : [
              [x1, y1],
              [x1 + 10, y1],
              [x1 + 10, y1 + (y2 > y1 ? rowHeight / 2 : -rowHeight / 2)],
              [x2 - 12, y1 + (y2 > y1 ? rowHeight / 2 : -rowHeight / 2)],
              [x2 - 12, y2],
              [x2, y2],
            ];
      out.push({
        key: `${dep}->${row.id}`,
        d: roundedPath(points, 6),
        head: `M${x2 - 5},${y2 - 3.5} L${x2},${y2} L${x2 - 5},${y2 + 3.5}`,
        from: dep,
        to: row.id,
      });
    }
  }
  return out;
}

/** The pixel width of a span's bar, never under 8px. */
export function barWidth(span: Span, layout: Layout): number {
  return Math.max((span.end - span.start + 1) * layout.dayWidth - layout.inset * 2, 8);
}

export function rangeLabel(span: Span, format: Intl.DateTimeFormat): string {
  const length = span.end - span.start + 1;
  return `${format.format(new Date(span.start * DAY_MS))} to ${format.format(new Date(span.end * DAY_MS))}, ${length} ${length === 1 ? "day" : "days"}`;
}
