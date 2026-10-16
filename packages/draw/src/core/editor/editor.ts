// The editor ties the store, history, camera and tool state machine together; a
// gesture is a single undo step, committed or cancelled.

import { screenToPage } from "../camera/camera";
import { indexBetween } from "../order";
import { createHistory } from "../history";
import { mergeDiffs } from "../history/diff";
import { createStore, type Store } from "../store";
import { defaultShapes, createShapeRegistry } from "../shapes/registry";
import type {
  BindingRecord,
  Box,
  Camera,
  Diff,
  EditorApi,
  EditorEvent,
  Guide,
  Id,
  PointerInfo,
  ShapeRecord,
  ShapeUtil,
  Snapshot,
  ToolFactory,
  Vec,
} from "../types";
import { createToolRunner, type ToolRunner } from "./toolRunner";

/** The editor a renderer drives, with the overlay and store handles it needs. */
export type Editor = EditorApi & {
  getBrush(): Box | null;
  getGuides(): Guide[];
  getCursor(): string;
  getStore(): Store;
};

export type EditorOptions = {
  /** Shape utils to register. Defaults to every built-in type. */
  shapes?: ShapeUtil[];
  /** A saved page to open. */
  snapshot?: Snapshot;
};

/** A uuid when the runtime has one, so ids are unguessable and sortable enough. */
function randomId(): string {
  const crypto = globalThis.crypto;
  if (crypto?.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function byIndex(a: ShapeRecord, b: ShapeRecord): number {
  if (a.index < b.index) return -1;
  if (a.index > b.index) return 1;
  return 0;
}

export function createEditor(options: EditorOptions = {}): Editor {
  const registry = createShapeRegistry(options.shapes ?? defaultShapes);
  const store = createStore(options.snapshot);
  const history = createHistory();

  let selection = new Set<Id>();
  let brush: Box | null = null;
  let guides: Guide[] = [];
  let cursor = "default";
  let editingId: Id | null = null;

  const changeListeners = new Set<() => void>();
  const diffListeners = new Set<(diff: Diff) => void>();

  function notifyChange(): void {
    for (const listener of [...changeListeners]) listener();
  }

  function notifyDiff(diff: Diff): void {
    for (const listener of [...diffListeners]) listener(diff);
  }

  // Recording state. `batch` gathers every store diff an editor operation makes
  // (including the ones a side effect makes) so the whole operation is one step.
  let recording = true;
  let batch: Diff[] = [];
  let gesture: Diff[] | null = null;

  function combine(diffs: Diff[]): Diff {
    let merged = diffs[0] as Diff;
    for (let i = 1; i < diffs.length; i += 1) merged = mergeDiffs(merged, diffs[i] as Diff);
    return merged;
  }

  function flush(): void {
    if (batch.length === 0) return;
    const merged = combine(batch);
    batch = [];
    if (gesture) gesture.push(merged);
    else history.push(merged);
  }

  let opDepth = 0;

  /** Run one editor operation. Its diffs become a single history step. */
  function write<T>(fn: () => T): T {
    // The outermost op holds one store transaction, so a 500-shape drag emits once;
    // a throw rolls the store back and drops the batch.
    const outer = opDepth === 0;
    opDepth += 1;
    try {
      const result = outer ? store.transactWith(fn) : fn();
      opDepth -= 1;
      if (opDepth === 0) {
        if (recording) flush();
        else batch = [];
      }
      return result;
    } catch (error) {
      opDepth -= 1;
      if (opDepth === 0) batch = [];
      throw error;
    }
  }

  /** Apply a diff without recording it, for undo, redo and a cancel. */
  function applySilently(fn: () => void): void {
    const wasRecording = recording;
    recording = false;
    try {
      fn();
    } finally {
      recording = wasRecording;
      batch = [];
    }
  }

  store.subscribe((diff) => {
    const removed = diff.shapes?.removed;
    if (removed) {
      for (const id of Object.keys(removed)) selection.delete(id);
    }
    if (recording) batch.push(diff);
    notifyDiff(diff);
    notifyChange();
  });

  function utilFor(type: string): ShapeUtil {
    return registry.get(type);
  }

  function sorted(): ShapeRecord[] {
    return store.getAll("shapes").sort(byIndex);
  }

  function getShape(id: Id): ShapeRecord | undefined {
    return store.get("shapes", id);
  }

  function getPageBounds(id: Id): Box {
    const shape = getShape(id);
    if (!shape) throw new Error(`No shape with id "${id}"`);
    return utilFor(shape.type).bounds(shape);
  }

  function topIndex(parentId: Id | null): string | null {
    let top: string | null = null;
    for (const shape of store.getAll("shapes")) {
      if ((shape.parentId ?? null) !== parentId) continue;
      if (top === null || shape.index > top) top = shape.index;
    }
    return top;
  }

  function stepOrder(list: ShapeRecord[], moving: Set<Id>, forward: boolean): ShapeRecord[] {
    const order = [...list];
    if (forward) {
      for (let i = order.length - 2; i >= 0; i -= 1) {
        if (moving.has(order[i]!.id) && !moving.has(order[i + 1]!.id)) {
          const swap = order[i]!;
          order[i] = order[i + 1]!;
          order[i + 1] = swap;
        }
      }
    } else {
      for (let i = 1; i < order.length; i += 1) {
        if (moving.has(order[i]!.id) && !moving.has(order[i - 1]!.id)) {
          const swap = order[i]!;
          order[i] = order[i - 1]!;
          order[i - 1] = swap;
        }
      }
    }
    return order;
  }

  const api: EditorApi = {
    getShape,
    getShapes: sorted,
    getChildren(id) {
      return sorted().filter((shape) => shape.parentId === id);
    },
    getBindingsFor(shapeId) {
      return store
        .getAll("bindings")
        .filter((binding) => binding.arrowId === shapeId || binding.targetId === shapeId);
    },
    getSelectedIds: () => [...selection],
    getCamera: () => store.getCamera(),
    getShapeUtil: utilFor,
    getPageBounds,
    getTopShapeAt(point: Vec, margin = 0) {
      const marginPage = margin / (store.getCamera().zoom || 1);
      const shapes = sorted();
      for (let i = shapes.length - 1; i >= 0; i -= 1) {
        const shape = shapes[i]!;
        if (utilFor(shape.type).hitTest(shape, point, marginPage)) return shape.id;
      }
      return null;
    },
    getShapesInBox(box, mode) {
      return sorted()
        .filter((shape) => {
          const bounds = utilFor(shape.type).bounds(shape);
          if (mode === "contain") {
            return (
              bounds.x >= box.x &&
              bounds.y >= box.y &&
              bounds.x + bounds.w <= box.x + box.w &&
              bounds.y + bounds.h <= box.y + box.h
            );
          }
          return (
            box.x <= bounds.x + bounds.w &&
            bounds.x <= box.x + box.w &&
            box.y <= bounds.y + bounds.h &&
            bounds.y <= box.y + box.h
          );
        })
        .map((shape) => shape.id);
    },

    select(ids) {
      selection = new Set(ids);
      notifyChange();
    },
    createShape(partial) {
      return write(() => {
        const util = utilFor(partial.type);
        const defaults = util.defaults();
        const parentId = partial.parentId ?? defaults.parentId ?? null;
        const record = {
          ...defaults,
          ...partial,
          id: partial.id ?? `shape:${randomId()}`,
          parentId,
          index: partial.index ?? indexBetween(topIndex(parentId), null),
        } as ShapeRecord;
        store.add("shapes", record);
        return record.id;
      });
    },
    updateShapes(patches) {
      if (patches.length === 0) return;
      write(() => {
        for (const patch of patches) {
          const { id, ...rest } = patch;
          if (!store.get("shapes", id)) continue;
          store.update("shapes", id, rest);
        }
      });
    },
    deleteShapes(ids) {
      const present = ids.filter((id) => store.get("shapes", id));
      if (present.length === 0) return;
      write(() => {
        for (const id of present) store.remove("shapes", id);
      });
    },
    createBinding(binding: Omit<BindingRecord, "id">) {
      return write(() => {
        const id = `binding:${randomId()}`;
        store.add("bindings", { ...binding, id });
        return id;
      });
    },
    deleteBinding(id) {
      if (!store.get("bindings", id)) return;
      write(() => store.remove("bindings", id));
    },
    reorder(ids, to) {
      const moving = new Set(ids.filter((id) => store.get("shapes", id)));
      if (moving.size === 0) return;
      write(() => {
        const groups = new Map<Id | null, ShapeRecord[]>();
        for (const shape of sorted()) {
          const list = groups.get(shape.parentId) ?? [];
          list.push(shape);
          groups.set(shape.parentId, list);
        }
        for (const list of groups.values()) {
          if (!list.some((shape) => moving.has(shape.id))) continue;
          const kept = list.filter((shape) => !moving.has(shape.id));
          const moved = list.filter((shape) => moving.has(shape.id));
          let order: ShapeRecord[];
          if (to === "front") order = [...kept, ...moved];
          else if (to === "back") order = [...moved, ...kept];
          else if (to === "forward") order = stepOrder(list, moving, true);
          else order = stepOrder(list, moving, false);
          let previous: string | null = null;
          for (const shape of order) {
            const index = indexBetween(previous, null);
            previous = index;
            if (shape.index !== index) store.update("shapes", shape.id, { index });
          }
        }
      });
    },

    beginGesture(label) {
      if (gesture) throw new Error(`beginGesture: a gesture is already open ("${label}")`);
      gesture = [];
    },
    commitGesture() {
      if (!gesture) throw new Error("commitGesture: no gesture is open");
      const diffs = gesture;
      gesture = null;
      if (diffs.length > 0) history.push(combine(diffs));
    },
    cancelGesture() {
      if (!gesture) throw new Error("cancelGesture: no gesture is open");
      const diffs = gesture;
      gesture = null;
      if (diffs.length === 0) return;
      const merged = combine(diffs);
      applySilently(() => store.applyDiffReverse(merged));
    },
    undo() {
      const diff = history.undo();
      if (!diff) return;
      applySilently(() => store.applyDiff(diff));
    },
    redo() {
      const diff = history.redo();
      if (!diff) return;
      applySilently(() => store.applyDiff(diff));
    },

    setCamera(camera: Camera) {
      store.setCamera(camera);
      notifyChange();
    },
    setTool: (id: string) => tools().setTool(id),
    transition: (path: string, info?: unknown) => tools().transition(path, info),
    getActivePath: () => tools().getActivePath(),
    registerTool: (id: string, factory: ToolFactory) => tools().register(id, factory),

    setBrush(next) {
      brush = next;
      notifyChange();
    },
    setGuides(next) {
      guides = next;
      notifyChange();
    },
    setCursor(next) {
      cursor = next;
      notifyChange();
    },
    setEditingId(id) {
      editingId = id;
      notifyChange();
    },
    getEditingId: () => editingId,

    dispatch(event: EditorEvent) {
      if (event.type === "key_down") {
        tools().keyDown(event.key, event.mods);
        return;
      }
      if (event.type === "key_up") {
        tools().keyUp(event.key);
        return;
      }
      if (event.type === "cancel") {
        tools().cancel();
        return;
      }
      const input = event.input;
      const point = screenToPage(store.getCamera(), input.screen);
      const info: PointerInfo = { ...input, point, targetId: api.getTopShapeAt(point, 0) };
      const handler =
        event.type === "pointer_down"
          ? "onPointerDown"
          : event.type === "pointer_move"
            ? "onPointerMove"
            : "onPointerUp";
      tools().pointer(handler, info);
    },

    onChange(listener) {
      changeListeners.add(listener);
      return () => {
        changeListeners.delete(listener);
      };
    },
    onDiff(listener) {
      diffListeners.add(listener);
      return () => {
        diffListeners.delete(listener);
      };
    },
  };

  let runner: ToolRunner | null = null;
  function tools(): ToolRunner {
    if (!runner) runner = createToolRunner(api, notifyChange);
    return runner;
  }

  const editor: Editor = {
    ...api,
    getBrush: () => brush,
    getGuides: () => guides,
    getCursor: () => cursor,
    getStore: () => store,
  };

  return editor;
}
