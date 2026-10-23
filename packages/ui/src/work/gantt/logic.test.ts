import { describe, expect, it } from "vite-plus/test";
import { dayNumber } from "#src/work/dates.js";
import {
  barWidth,
  buildArrows,
  buildMonths,
  buildDays,
  buildRows,
  liveSpan,
  rangeLabel,
  rangeOf,
  roundedPath,
  spanOf,
  type Drag,
  type Layout,
} from "#src/work/gantt/logic.js";

type Task = {
  id: string;
  start?: string;
  end?: string;
  parent?: string;
  group?: string;
  after?: string[];
};

const dates = { getStart: (t: Task) => t.start, getEnd: (t: Task) => t.end };
const source = (overrides: Partial<Parameters<typeof buildRows<Task>>[1]> = {}) => ({
  getId: (t: Task) => t.id,
  ...dates,
  folded: new Set<string>(),
  drag: null,
  ...overrides,
});

describe("spanOf", () => {
  it("reads inclusive dates", () => {
    const span = spanOf({ id: "a", start: "2026-10-05", end: "2026-10-07" }, dates);
    expect(span && span.end - span.start).toBe(2);
  });
  it("lets a lone date stand for a one-day task", () => {
    expect(spanOf({ id: "a", end: "2026-10-05" }, dates)).toEqual({
      start: dayNumber("2026-10-05"),
      end: dayNumber("2026-10-05"),
    });
    expect(spanOf({ id: "a", start: "2026-10-05" }, dates)).toEqual({
      start: dayNumber("2026-10-05"),
      end: dayNumber("2026-10-05"),
    });
  });
  it("gives an undated task no span, and never an end before the start", () => {
    expect(spanOf({ id: "a" }, dates)).toBeNull();
    expect(spanOf({ id: "a", start: "2026-10-09", end: "2026-10-05" }, dates)?.end).toBe(
      dayNumber("2026-10-09"),
    );
  });
});

describe("liveSpan", () => {
  const span = { start: 100, end: 104 };
  const drag = (mode: Drag["mode"], dx: number): Drag => ({ id: "a", mode, originX: 0, dx });
  it("moves, resizes and clamps at the other edge", () => {
    expect(liveSpan(span, drag("move", 3), "a")).toEqual({ start: 103, end: 107 });
    expect(liveSpan(span, drag("start", 9), "a")).toEqual({ start: 104, end: 104 });
    expect(liveSpan(span, drag("end", -9), "a")).toEqual({ start: 100, end: 100 });
  });
  it("leaves other rows and idle drags alone", () => {
    expect(liveSpan(span, drag("move", 3), "b")).toBe(span);
    expect(liveSpan(span, drag("move", 0), "a")).toBe(span);
    expect(liveSpan(null, drag("move", 3), "a")).toBeNull();
  });
});

describe("rangeOf", () => {
  const today = dayNumber("2026-10-21");
  it("pads the tasks' span and starts on a Monday", () => {
    const { first, last } = rangeOf(
      [{ id: "a", start: "2026-10-14", end: "2026-10-30" }],
      dates,
      today,
    );
    expect(new Date(first * 86_400_000).getUTCDay()).toBe(1);
    expect(first).toBeLessThanOrEqual(dayNumber("2026-10-07"));
    expect(last).toBe(dayNumber("2026-10-30") + 21);
  });
  it("honours from and to, and never ends before it starts", () => {
    expect(rangeOf([], dates, today, "2026-10-21", "2026-10-01")).toEqual({
      first: today,
      last: today,
    });
  });
});

describe("buildRows", () => {
  const tasks: Task[] = [
    { id: "p", parent: undefined },
    { id: "c1", parent: "p", start: "2026-10-05", end: "2026-10-06" },
    { id: "c2", parent: "p", start: "2026-10-08", end: "2026-10-09" },
    { id: "solo", start: "2026-10-01", end: "2026-10-02" },
  ];
  it("is flat without a parent accessor", () => {
    const rows = buildRows(tasks, source());
    expect(rows.map((r) => (r.kind === "task" ? r.depth : -1))).toEqual([0, 0, 0, 0]);
  });
  it("nests children under their parent and draws the span below an undated parent", () => {
    const rows = buildRows(tasks, source({ getParent: (t) => t.parent }));
    const ids = rows.map((r) => (r.kind === "task" ? `${r.id}:${r.depth}` : "g"));
    expect(ids).toEqual(["p:0", "c1:1", "c2:1", "solo:0"]);
    const parent = rows[0];
    if (parent.kind !== "task") throw new Error("expected a task row");
    expect(parent.own).toBeNull();
    expect(parent.span).toEqual({ start: dayNumber("2026-10-05"), end: dayNumber("2026-10-09") });
    expect(parent.hasChildren).toBe(true);
  });
  it("hides the children of a folded parent but keeps its span", () => {
    const rows = buildRows(tasks, source({ getParent: (t) => t.parent, folded: new Set(["p"]) }));
    expect(rows.map((r) => (r.kind === "task" ? r.id : "g"))).toEqual(["p", "solo"]);
    const parent = rows[0];
    if (parent.kind !== "task") throw new Error("expected a task row");
    expect(parent.open).toBe(false);
    expect(parent.span).not.toBeNull();
  });
  it("puts a group header before its tasks, in the order given", () => {
    const grouped: Task[] = [
      { id: "a", group: "two", start: "2026-10-05", end: "2026-10-06" },
      { id: "b", group: "one", start: "2026-10-01", end: "2026-10-02" },
      { id: "c", group: "one", start: "2026-10-10", end: "2026-10-12" },
    ];
    const rows = buildRows(
      grouped,
      source({
        groups: [
          { id: "one", label: "One" },
          { id: "two", label: "Two" },
        ],
        getGroup: (t) => t.group ?? "",
      }),
    );
    expect(rows.map((r) => (r.kind === "group" ? `#${r.group.id}:${r.count}` : r.id))).toEqual([
      "#one:2",
      "b",
      "c",
      "#two:1",
      "a",
    ]);
    expect(rows[0].span).toEqual({ start: dayNumber("2026-10-01"), end: dayNumber("2026-10-12") });
  });
  it("applies a live drag to the row it moves", () => {
    const rows = buildRows(
      [{ id: "a", start: "2026-10-05", end: "2026-10-06" }],
      source({ drag: { id: "a", mode: "move", originX: 0, dx: 2 } }),
    );
    const row = rows[0];
    if (row.kind !== "task") throw new Error("expected a task row");
    expect(row.span).toEqual({ start: dayNumber("2026-10-07"), end: dayNumber("2026-10-08") });
  });
});

describe("buildArrows", () => {
  const first = dayNumber("2026-10-05");
  const layout: Layout = {
    first,
    last: first + 30,
    dayWidth: 32,
    rowHeight: 40,
    inset: 3,
    timelineWidth: 31 * 32,
    todayDay: first,
  };
  const rows = (tasks: Task[]) => buildRows(tasks, source());
  it("draws one arrow per known dependency and skips unknown or undated ones", () => {
    const tasks: Task[] = [
      { id: "a", start: "2026-10-05", end: "2026-10-06" },
      { id: "b", start: "2026-10-12", end: "2026-10-13", after: ["a", "ghost"] },
      { id: "c", after: ["a"] },
    ];
    const arrows = buildArrows(rows(tasks), layout, (t) => tasks.find((x) => x.id === t.id)?.after);
    expect(arrows.map((a) => a.key)).toEqual(["a->b"]);
  });
  it("bends once in the gap when there's room", () => {
    const tasks: Task[] = [
      { id: "a", start: "2026-10-05", end: "2026-10-05" },
      { id: "b", start: "2026-10-12", end: "2026-10-12", after: ["a"] },
    ];
    const [arrow] = buildArrows(
      rows(tasks),
      layout,
      (t) => tasks.find((x) => x.id === t.id)?.after,
    );
    expect(arrow.d.match(/Q/g)).toHaveLength(2);
  });
  it("routes round the row gap when the bars touch", () => {
    const tasks: Task[] = [
      { id: "a", start: "2026-10-05", end: "2026-10-08" },
      { id: "b", start: "2026-10-06", end: "2026-10-09", after: ["a"] },
    ];
    const [arrow] = buildArrows(
      rows(tasks),
      layout,
      (t) => tasks.find((x) => x.id === t.id)?.after,
    );
    expect(arrow.d.match(/Q/g)).toHaveLength(4);
  });
});

describe("roundedPath", () => {
  it("rounds each corner by up to the radius and ends on the last point", () => {
    expect(
      roundedPath(
        [
          [0, 0],
          [20, 0],
          [20, 20],
        ],
        6,
      ),
    ).toBe("M0,0 L14,0 Q20,0 20,6 L20,20");
  });
});

describe("timeline helpers", () => {
  it("groups days under their month", () => {
    const first = dayNumber("2026-10-30");
    const months = buildMonths(
      buildDays(first, 4),
      new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    );
    expect(months).toEqual([
      { key: "2026-10", label: "October 2026", i: 0, length: 2 },
      { key: "2026-11", label: "November 2026", i: 2, length: 2 },
    ]);
  });
  it("never draws a bar under 8px, and labels the span", () => {
    const layout: Layout = {
      first: 0,
      last: 9,
      dayWidth: 4,
      rowHeight: 40,
      inset: 0,
      timelineWidth: 40,
      todayDay: 0,
    };
    expect(barWidth({ start: 1, end: 1 }, layout)).toBe(8);
    const format = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    const start = dayNumber("2026-10-05");
    expect(rangeLabel({ start, end: start }, format)).toBe("Oct 5 to Oct 5, 1 day");
    expect(rangeLabel({ start, end: start + 2 }, format)).toBe("Oct 5 to Oct 7, 3 days");
  });
});
