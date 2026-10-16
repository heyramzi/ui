// Building, inverting and stacking diffs. A diff names only the records that
// changed, so undo, redo and a later sync layer share one shape.

import type { BindingRecord, Diff, Id, ShapeRecord, Tables } from "../types";

/** One table's worth of a diff: what appeared, what changed, what went. */
export type TableDiff<T extends { id: Id }> = {
  added: Record<Id, T>;
  updated: Record<Id, [before: T, after: T]>;
  removed: Record<Id, T>;
};

/** Any record the tables hold. It only has to carry an id. */
export type AnyRecord = { id: Id } & Record<string, unknown>;

/** Fields that churn without changing anything real. A record carrying one of
 *  these is compared without it, so a selection never lands in history. */
export const VOLATILE_FIELDS: ReadonlySet<string> = new Set(["selected", "dragging"]);

function emptyTable<T extends { id: Id }>(): TableDiff<T> {
  return { added: {}, updated: {}, removed: {} };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isEmptyTable<T extends { id: Id }>(table: TableDiff<T>): boolean {
  return (
    Object.keys(table.added).length === 0 &&
    Object.keys(table.updated).length === 0 &&
    Object.keys(table.removed).length === 0
  );
}

/** The record without its volatile fields, so a comparison sees the real value only. */
function pick<T extends { id: Id }>(record: T, ignore: ReadonlySet<string>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
    if (ignore.has(key) || value === undefined) continue;
    out[key] = value;
  }
  return out as T;
}

/** Diff one id-keyed table. Volatile fields are ignored, so a selection change
 *  leaves the entry empty. */
export function diffTable<T extends { id: Id }>(
  base: Record<Id, T>,
  current: Record<Id, T>,
  ignore: ReadonlySet<string> = VOLATILE_FIELDS,
): TableDiff<T> {
  const out = emptyTable<T>();
  for (const id of Object.keys(base)) {
    const before = base[id];
    const after = current[id];
    if (after === undefined) {
      out.removed[id] = clone(pick(before, ignore));
      continue;
    }
    if (!equal(pick(before, ignore), pick(after, ignore))) {
      out.updated[id] = [clone(pick(before, ignore)), clone(pick(after, ignore))];
    }
  }
  for (const id of Object.keys(current)) {
    if (!(id in base)) out.added[id] = clone(pick(current[id], ignore));
  }
  return out;
}

/** Diff both tables of a snapshot, or null when the document is unchanged. */
export function diffRecords(base: Tables, current: Tables): Diff | null {
  const diff: Diff = {};
  const shapes = diffTable<ShapeRecord>(base.shapes, current.shapes);
  const bindings = diffTable<BindingRecord>(base.bindings, current.bindings);
  if (!isEmptyTable(shapes)) diff.shapes = shapes;
  if (!isEmptyTable(bindings)) diff.bindings = bindings;
  return isEmptyDiff(diff) ? null : diff;
}

/** True when a diff carries no change at all. */
export function isEmptyDiff(diff: Diff | null | undefined): boolean {
  if (!diff) return true;
  return Object.values(diff).every(
    (table) => !table || isEmptyTable(table as TableDiff<AnyRecord>),
  );
}

function invertTable<T extends { id: Id }>(table: TableDiff<T>): TableDiff<T> {
  const updated: Record<Id, [T, T]> = {};
  for (const id of Object.keys(table.updated)) {
    const [before, after] = table.updated[id];
    updated[id] = [after, before];
  }
  return { added: table.removed, updated, removed: table.added };
}

/** Undo a diff by swapping added and removed and flipping every updated pair. */
export function invertDiff(diff: Diff): Diff {
  const out: Diff = {};
  if (diff.shapes) out.shapes = invertTable(diff.shapes);
  if (diff.bindings) out.bindings = invertTable(diff.bindings);
  return out;
}

/** Merge `a` then `b` into one diff. An add that a later remove cancels drops
 *  out, so a two-step gesture collapses to a single undo step. */
function mergeTable<T extends { id: Id }>(
  a: TableDiff<T> = emptyTable<T>(),
  b: TableDiff<T> = emptyTable<T>(),
): TableDiff<T> {
  const out = emptyTable<T>();
  const ids = new Set([
    ...Object.keys(a.added),
    ...Object.keys(a.updated),
    ...Object.keys(a.removed),
    ...Object.keys(b.added),
    ...Object.keys(b.updated),
    ...Object.keys(b.removed),
  ]);

  for (const id of ids) {
    const aAdded = a.added[id];
    const aUpdated = a.updated[id];
    const aRemoved = a.removed[id];
    const presentAfterA = aAdded !== undefined || aUpdated !== undefined;

    if (b.added[id] !== undefined) {
      const value = b.added[id];
      if (!presentAfterA) {
        if (aRemoved === undefined) {
          out.added[id] = clone(value);
        } else if (!equal(aRemoved, value)) {
          out.updated[id] = [clone(aRemoved), clone(value)];
        }
      } else if (aAdded !== undefined) {
        out.added[id] = clone(value);
      } else {
        out.updated[id] = [clone(aUpdated![0]), clone(value)];
      }
    } else if (b.updated[id] !== undefined) {
      const [before, after] = b.updated[id];
      if (!presentAfterA) {
        out.updated[id] = aRemoved === undefined ? [clone(before), clone(after)] : [clone(aRemoved), clone(after)];
      } else if (aAdded !== undefined) {
        out.added[id] = clone(after);
      } else {
        out.updated[id] = [clone(aUpdated![0]), clone(after)];
      }
    } else if (b.removed[id] !== undefined) {
      if (presentAfterA && aAdded === undefined) {
        out.removed[id] = clone(aUpdated![0]);
      } else if (aRemoved !== undefined) {
        out.removed[id] = clone(aRemoved);
      } else if (!presentAfterA) {
        // Nothing in `a` touched the record; `b` is the one that removed it.
        out.removed[id] = clone(b.removed[id]);
      }
      // present after a and added there: an add then a remove cancels to nothing.
    } else if (aAdded !== undefined) {
      out.added[id] = clone(aAdded);
    } else if (aUpdated !== undefined) {
      out.updated[id] = [clone(aUpdated[0]), clone(aUpdated[1])];
    } else if (aRemoved !== undefined) {
      out.removed[id] = clone(aRemoved);
    }
  }
  return out;
}

/** Two diffs that ran one after the other, as one diff. */
export function mergeDiffs(a: Diff, b: Diff): Diff {
  const out: Diff = {};
  const shapes = mergeTable(a.shapes, b.shapes);
  const bindings = mergeTable(a.bindings, b.bindings);
  if (!isEmptyTable(shapes)) out.shapes = shapes;
  if (!isEmptyTable(bindings)) out.bindings = bindings;
  return out;
}

function applyTable<T extends { id: Id }>(
  table: Record<Id, T>,
  change: TableDiff<T>,
  direction: "forward" | "backward",
): Record<Id, T> {
  const next: Record<Id, T> = { ...table };
  if (direction === "forward") {
    for (const id of Object.keys(change.removed)) delete next[id];
    for (const id of Object.keys(change.updated)) next[id] = clone(change.updated[id][1]);
    for (const id of Object.keys(change.added)) next[id] = clone(change.added[id]);
  } else {
    for (const id of Object.keys(change.added)) delete next[id];
    for (const id of Object.keys(change.updated)) next[id] = clone(change.updated[id][0]);
    for (const id of Object.keys(change.removed)) next[id] = clone(change.removed[id]);
  }
  return next;
}

/** Apply a diff to a snapshot's tables. "forward" redoes it, "backward" undoes it. */
export function applyDiff(
  records: Tables,
  diff: Diff,
  direction: "forward" | "backward" = "forward",
): Tables {
  return {
    shapes: diff.shapes ? applyTable<ShapeRecord>(records.shapes, diff.shapes, direction) : records.shapes,
    bindings: diff.bindings
      ? applyTable<BindingRecord>(records.bindings, diff.bindings, direction)
      : records.bindings,
  };
}
