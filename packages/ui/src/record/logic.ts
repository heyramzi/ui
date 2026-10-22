// The record's pure logic: grouping, merging, picking. No DOM, no clock of its own.
import type {
  RecordEvent,
  RecordFilterDef,
  RecordNext,
  RecordSummary,
  StageDef,
  StepDef,
  StepGroupDef,
  StepMarker,
} from "#src/record/types.js";

// =========================
// EVENTS
// =========================

/** The calendar day of a timestamp as `YYYY-MM-DD`, in the given zone or the viewer's own. */
export function localDay(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export type DayGroup = { day: string; events: RecordEvent[] };

/** Newest day first, newest event first inside a day. */
export function groupEventsByDay(events: readonly RecordEvent[], timeZone?: string): DayGroup[] {
  const sorted = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  const groups: DayGroup[] = [];
  for (const event of sorted) {
    const day = localDay(event.occurredAt, timeZone);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.events.push(event);
    else groups.push({ day, events: [event] });
  }
  return groups;
}

/** `today`, `yesterday` or `date`, by calendar distance from `today`. */
export function dayRelation(day: string, today: string): "today" | "yesterday" | "date" {
  if (day === today) return "today";
  const gap = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000;
  return gap === 1 ? "yesterday" : "date";
}

/** The events one filter chip shows. An unknown or empty key shows everything. */
export function eventsForFilter(
  events: readonly RecordEvent[],
  filterKey: string,
  filters: readonly RecordFilterDef[],
): RecordEvent[] {
  const filter = filters.find((f) => f.key === filterKey);
  if (!filter) return [...events];
  const kinds = new Set(filter.kinds);
  return events.filter((e) => kinds.has(e.kind));
}

/** Per-chip counts. Chips with no events are the host's to hide. */
export function filterCounts(
  events: readonly RecordEvent[],
  filters: readonly RecordFilterDef[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const filter of filters) {
    const kinds = new Set(filter.kinds);
    counts[filter.key] = events.filter((e) => kinds.has(e.kind)).length;
  }
  return counts;
}

/** Keep the newest `limit` events and count the rest, cutting a day group where the limit falls. */
export function foldGroups(
  groups: readonly DayGroup[],
  limit: number,
): { groups: DayGroup[]; hidden: number } {
  const kept: DayGroup[] = [];
  let used = 0;
  let total = 0;
  for (const group of groups) total += group.events.length;
  for (const group of groups) {
    if (used >= limit) break;
    const room = limit - used;
    const events = group.events.slice(0, room);
    kept.push({ day: group.day, events });
    used += events.length;
  }
  return { groups: kept, hidden: total - used };
}

export type ProjectEvents = {
  id: string;
  name: string;
  href?: string | null;
  events: readonly RecordEvent[];
};

/**
 * One client's timeline: its own events and every project's, each project event
 * tagged with where it came from. An id seen twice keeps the first, so a source
 * passed in both lists draws once. Newest first.
 */
export function mergeClientEvents(
  clientEvents: readonly RecordEvent[],
  projects: readonly ProjectEvents[],
): RecordEvent[] {
  const seen = new Set<string>();
  const merged: RecordEvent[] = [];
  const add = (event: RecordEvent) => {
    if (seen.has(event.id)) return;
    seen.add(event.id);
    merged.push(event);
  };
  for (const project of projects) {
    for (const event of project.events) {
      add({
        ...event,
        projectId: project.id,
        projectName: project.name,
        projectHref: project.href ?? null,
      });
    }
  }
  for (const event of clientEvents)
    add({ ...event, projectId: null, projectName: null, projectHref: null });
  return merged.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

// =========================
// PROJECTS
// =========================

const ACTIVE: ReadonlySet<string> = new Set(["open", "proposal", "ongoing"]);

/** Projects still in play: not closed, and in a stage that isn't won-and-done or lost. */
export function activeProjects(
  projects: readonly RecordSummary[],
  stages: readonly StageDef[],
): RecordSummary[] {
  const category = new Map(stages.map((s) => [s.key, s.category]));
  return projects.filter((p) => {
    if (p.closed) return false;
    const c = category.get(p.stageKey);
    return c === undefined || ACTIVE.has(c);
  });
}

/** The earliest dated next across active projects, undated ones after, ties by list order. */
export function nextAcrossProjects(
  projects: readonly RecordSummary[],
  stages: readonly StageDef[],
): RecordNext | null {
  let best: RecordNext | null = null;
  for (const project of activeProjects(projects, stages)) {
    const next = project.next;
    if (!next) continue;
    const candidate: RecordNext = { ...next, projectId: project.id, projectName: project.name };
    if (!best) {
      best = candidate;
      continue;
    }
    if (!best.date && candidate.date) best = candidate;
    else if (best.date && candidate.date && candidate.date < best.date) best = candidate;
  }
  return best;
}

export type LatestStatus = NonNullable<RecordSummary["whereWeAre"]> & {
  projectId: string;
  projectName: string;
};

/** The newest "where we are" across projects, tagged with its project. */
export function latestWhereWeAre(projects: readonly RecordSummary[]): LatestStatus | null {
  let best: LatestStatus | null = null;
  for (const project of projects) {
    const status = project.whereWeAre;
    if (!status || !status.text) continue;
    const at = status.at ? new Date(status.at).getTime() : 0;
    const bestAt = best?.at ? new Date(best.at).getTime() : -1;
    if (!best || at > bestAt)
      best = { ...status, projectId: project.id, projectName: project.name };
  }
  return best;
}

export type MoneyTotals = Record<string, { pipeline: number; won: number; paid: number }>;

export type ClientRollup = {
  count: number;
  activeCount: number;
  totals: MoneyTotals;
  lastCallAt: string | null;
};

/**
 * The client's strip. Pipeline is the value of projects in an open or proposal
 * stage, won the value in an ongoing or completed one, paid what came in. A lost
 * project adds to none. Totals stay per currency, because a sum across two is a lie.
 */
export function rollupProjects(
  projects: readonly RecordSummary[],
  stages: readonly StageDef[],
  fallbackCurrency = "EUR",
): ClientRollup {
  const category = new Map(stages.map((s) => [s.key, s.category]));
  const totals: MoneyTotals = {};
  let lastCallAt: string | null = null;
  for (const project of projects) {
    const currency = project.currency ?? fallbackCurrency;
    const bucket = (totals[currency] ??= { pipeline: 0, won: 0, paid: 0 });
    const c = category.get(project.stageKey);
    const value = project.value ?? 0;
    if (c === "open" || c === "proposal") bucket.pipeline += value;
    if (c === "ongoing" || c === "completed") bucket.won += value;
    bucket.paid += project.paid ?? 0;
    if (project.lastCallAt && (!lastCallAt || project.lastCallAt > lastCallAt))
      lastCallAt = project.lastCallAt;
  }
  return {
    count: projects.length,
    activeCount: activeProjects(projects, stages).length,
    totals,
    lastCallAt,
  };
}

// =========================
// STEPS
// =========================

/** A step is visible unless hidden. */
export function visibleSteps(steps: readonly StepDef[]): StepDef[] {
  return steps.filter((s) => !s.hidden);
}

export function stepProgress(steps: readonly StepDef[]): { done: number; total: number } {
  const visible = visibleSteps(steps);
  return { done: visible.filter((s) => s.done).length, total: visible.length };
}

/**
 * One marker per visible step. The current step is the first one not done. Any
 * open step before it, or past its own date, is late. Nothing else is.
 * `today` is an ISO date.
 */
export function stepMarkers(steps: readonly StepDef[], today: string): Map<string, StepMarker> {
  const visible = visibleSteps(steps);
  const currentId = visible.find((s) => !s.done)?.id ?? null;
  const markers = new Map<string, StepMarker>();
  let beforeCurrent = currentId !== null;
  for (const step of visible) {
    if (step.done) {
      markers.set(step.id, "complete");
      continue;
    }
    if (step.id === currentId) {
      markers.set(step.id, "current");
      beforeCurrent = false;
      continue;
    }
    const due = (step.end ?? step.start)?.slice(0, 10);
    const overdue = due !== undefined && due < today;
    markers.set(step.id, beforeCurrent || overdue ? "late" : "pending");
  }
  return markers;
}

export type StepBucket = { key: string; label: string | null; steps: StepDef[] };

/**
 * Buckets by group in the declared order, not by consecutive runs, so a reordered
 * rail still draws one header per group. Steps with no or an unknown group go last,
 * under no header.
 */
export function groupSteps(
  steps: readonly StepDef[],
  groups: readonly StepGroupDef[] = [],
): StepBucket[] {
  const known = new Set(groups.map((g) => g.key));
  const buckets: StepBucket[] = groups.map((g) => ({ key: g.key, label: g.label, steps: [] }));
  const loose: StepBucket = { key: "", label: null, steps: [] };
  for (const step of steps) {
    const bucket = buckets.find((b) => b.key === step.group);
    (step.group && known.has(step.group) && bucket ? bucket : loose).steps.push(step);
  }
  const result = buckets.filter((b) => b.steps.length > 0);
  if (loose.steps.length > 0) result.push(loose);
  return result;
}

/** Move `movedId` next to `targetId` inside the id list. Same list back when nothing moves. */
export function reorderIds(
  ids: readonly string[],
  movedId: string,
  targetId: string,
  before: boolean,
): string[] {
  if (movedId === targetId) return [...ids];
  const from = ids.indexOf(movedId);
  if (from < 0 || !ids.includes(targetId)) return [...ids];
  const next = [...ids];
  next.splice(from, 1);
  const at = next.indexOf(targetId);
  next.splice(before ? at : at + 1, 0, movedId);
  return next;
}

/** Swap a step with its neighbour in its own group. Same list back at an edge. */
export function nudgeStep(steps: readonly StepDef[], id: string, direction: -1 | 1): string[] {
  const ids = steps.map((s) => s.id);
  const step = steps.find((s) => s.id === id);
  if (!step) return ids;
  const mates = steps.filter((s) => s.group === step.group && !s.hidden);
  const at = mates.findIndex((s) => s.id === id);
  const neighbour = mates[at + direction];
  if (!neighbour) return ids;
  const a = ids.indexOf(id);
  const b = ids.indexOf(neighbour.id);
  const first = ids[a];
  const second = ids[b];
  if (first === undefined || second === undefined) return ids;
  ids[a] = second;
  ids[b] = first;
  return ids;
}
