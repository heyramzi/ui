import {
  SCHEMA_VERSION,
  type BindingRecord,
  type Camera,
  type Diff,
  type Id,
  type RecordMap,
  type ShapeRecord,
  type Snapshot,
} from "../types";

export type TableName = keyof RecordMap;
/** A finished transaction. The second argument is true for remote or history diffs. */
export type StoreListener = (diff: Diff, remote: boolean) => void;

type AnyRecord = ShapeRecord | BindingRecord;
type TableChanges<T> = {
  added: Record<Id, T>;
  updated: Record<Id, [T, T]>;
  removed: Record<Id, T>;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function collect<T>(before: Map<Id, unknown>, after: Record<Id, T>): TableChanges<T> {
  const changes: TableChanges<T> = { added: {}, updated: {}, removed: {} };
  for (const [id, prev] of before) {
    const next = after[id];
    if (prev === undefined) {
      if (next !== undefined) {
        changes.added[id] = next;
      }
    } else if (next === undefined) {
      changes.removed[id] = prev as T;
    } else if (prev !== next) {
      changes.updated[id] = [prev as T, next];
    }
  }
  return changes;
}

function hasChanges<T>(changes: TableChanges<T>): boolean {
  return (
    Object.keys(changes.added).length > 0 ||
    Object.keys(changes.updated).length > 0 ||
    Object.keys(changes.removed).length > 0
  );
}

function diffIsEmpty(diff: Diff): boolean {
  const shapesEmpty = !diff.shapes || !hasChanges(diff.shapes);
  const bindingsEmpty = !diff.bindings || !hasChanges(diff.bindings);
  return shapesEmpty && bindingsEmpty;
}

export type Store = {
  get<T extends TableName>(table: T, id: Id): RecordMap[T] | undefined;
  getAll<T extends TableName>(table: T): RecordMap[T][];
  add<T extends TableName>(table: T, record: RecordMap[T]): RecordMap[T];
  update<T extends TableName>(
    table: T,
    id: Id,
    patch: Partial<RecordMap[T]>,
  ): RecordMap[T] | undefined;
  remove(table: TableName, id: Id): boolean;
  transact(fn: () => void): Diff;
  /** Run `fn` as one transaction: one diff and one emit however many records it touches, so a 500-shape drag notifies once, and a throw rolls back. */
  transactWith<T>(fn: () => T): T;
  subscribe(listener: StoreListener): () => void;
  applyDiff(diff: Diff): void;
  applyDiffReverse(diff: Diff): void;
  snapshot(): Snapshot;
  getCamera(): Camera;
  setCamera(camera: Camera): void;
};

/** The record store: edits go through `transact`, which emits one diff to every subscriber, and state stays plain data so a server can run it. */
export function createStore(initial?: Snapshot): Store {
  let shapes: Record<Id, ShapeRecord> = initial ? clone(initial.shapes) : {};
  let bindings: Record<Id, BindingRecord> = initial ? clone(initial.bindings) : {};
  let camera: Camera = initial ? { ...initial.camera } : { x: 0, y: 0, zoom: 1 };

  const listeners = new Set<StoreListener>();
  let depth = 0;
  let touched: Map<TableName, Map<Id, unknown>> | null = null;
  let rollback: { shapes: Record<Id, ShapeRecord>; bindings: Record<Id, BindingRecord> } | null =
    null;

  function tableData(table: TableName): Record<Id, AnyRecord> {
    return table === "shapes" ? shapes : bindings;
  }

  function emit(diff: Diff, remote: boolean): void {
    for (const listener of [...listeners]) {
      listener(diff, remote);
    }
  }

  function noteOriginal(table: TableName, id: Id): void {
    if (!touched) {
      return;
    }
    let tableMap = touched.get(table);
    if (!tableMap) {
      tableMap = new Map();
      touched.set(table, tableMap);
    }
    if (!tableMap.has(id)) {
      tableMap.set(id, tableData(table)[id]);
    }
  }

  function beginTxn(): void {
    touched = new Map();
    rollback = { shapes: { ...shapes }, bindings: { ...bindings } };
  }

  function buildDiff(): Diff {
    const diff: Diff = {};
    const shapeChanges = touched?.get("shapes");
    if (shapeChanges) {
      const changes = collect(shapeChanges, shapes);
      if (hasChanges(changes)) {
        diff.shapes = changes;
      }
    }
    const bindingChanges = touched?.get("bindings");
    if (bindingChanges) {
      const changes = collect(bindingChanges, bindings);
      if (hasChanges(changes)) {
        diff.bindings = changes;
      }
    }
    return diff;
  }

  function abortTxn(): void {
    if (rollback) {
      shapes = rollback.shapes;
      bindings = rollback.bindings;
    }
    depth = 0;
    touched = null;
    rollback = null;
  }

  function runTransaction<T>(fn: () => T): { result: T; diff: Diff } {
    const isOuter = depth === 0;
    if (isOuter) {
      beginTxn();
    }
    depth += 1;
    try {
      const result = fn();
      depth -= 1;
      if (depth === 0) {
        const diff = buildDiff();
        touched = null;
        rollback = null;
        if (!diffIsEmpty(diff)) {
          emit(diff, false);
        }
        return { result, diff };
      }
      return { result, diff: {} };
    } catch (error) {
      if (isOuter) {
        abortTxn();
      }
      throw error;
    }
  }

  function withTxn<T>(fn: () => T): T {
    return runTransaction(fn).result;
  }

  function transactWith<T>(fn: () => T): T {
    return withTxn(fn);
  }

  function get<T extends TableName>(table: T, id: Id): RecordMap[T] | undefined {
    const record = tableData(table)[id];
    return record ? (clone(record) as RecordMap[T]) : undefined;
  }

  function getAll<T extends TableName>(table: T): RecordMap[T][] {
    return Object.values(tableData(table)).map((record) => clone(record) as RecordMap[T]);
  }

  function add<T extends TableName>(table: T, record: RecordMap[T]): RecordMap[T] {
    return withTxn(() => {
      const target = tableData(table);
      if (target[record.id]) {
        throw new Error(`duplicate id "${record.id}" in ${table}`);
      }
      noteOriginal(table, record.id);
      const stored = clone(record) as AnyRecord;
      target[record.id] = stored;
      return clone(stored) as RecordMap[T];
    });
  }

  function update<T extends TableName>(
    table: T,
    id: Id,
    patch: Partial<RecordMap[T]>,
  ): RecordMap[T] | undefined {
    return withTxn(() => {
      const target = tableData(table);
      const before = target[id];
      if (!before) {
        return undefined;
      }
      noteOriginal(table, id);
      const next = { ...before, ...patch, id } as AnyRecord;
      target[id] = next;
      return clone(next) as RecordMap[T];
    });
  }

  function cascadeRemove(id: Id): void {
    if (!shapes[id]) {
      return;
    }
    for (const child of Object.values(shapes)) {
      if (child.parentId === id) {
        cascadeRemove(child.id);
      }
    }
    for (const binding of Object.values(bindings)) {
      if (binding.arrowId === id || binding.targetId === id) {
        noteOriginal("bindings", binding.id);
        delete bindings[binding.id];
      }
    }
    noteOriginal("shapes", id);
    delete shapes[id];
  }

  function remove(table: TableName, id: Id): boolean {
    return withTxn(() => {
      if (table === "bindings") {
        if (!bindings[id]) {
          return false;
        }
        noteOriginal("bindings", id);
        delete bindings[id];
        return true;
      }
      if (!shapes[id]) {
        return false;
      }
      cascadeRemove(id);
      return true;
    });
  }

  function subscribe(listener: StoreListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function applyChanges<T>(
    target: Record<Id, T>,
    changes: TableChanges<T> | undefined,
    reverse: boolean,
  ): void {
    if (!changes) {
      return;
    }
    const add = reverse ? changes.removed : changes.added;
    const remove = reverse ? changes.added : changes.removed;
    for (const [id, record] of Object.entries(add)) {
      target[id] = record;
    }
    for (const [id, pair] of Object.entries(changes.updated)) {
      target[id] = reverse ? pair[0] : pair[1];
    }
    for (const id of Object.keys(remove)) {
      delete target[id];
    }
  }

  function applyDiff(diff: Diff): void {
    applyChanges(shapes, diff.shapes, false);
    applyChanges(bindings, diff.bindings, false);
    emit(diff, true);
  }

  function applyDiffReverse(diff: Diff): void {
    applyChanges(shapes, diff.shapes, true);
    applyChanges(bindings, diff.bindings, true);
    emit(diff, true);
  }

  function snapshot(): Snapshot {
    return {
      schema: SCHEMA_VERSION,
      shapes: clone(shapes),
      bindings: clone(bindings),
      camera: { ...camera },
    };
  }

  function getCamera(): Camera {
    return { ...camera };
  }

  function setCamera(next: Camera): void {
    camera = { ...next };
  }

  return {
    get,
    getAll,
    add,
    update,
    remove,
    transact: (fn) => runTransaction(fn).diff,
    transactWith,
    subscribe,
    applyDiff,
    applyDiffReverse,
    snapshot,
    getCamera,
    setCamera,
  };
}
