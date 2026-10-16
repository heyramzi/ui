import { it, expect, describe } from "vitest";
import type { BindingRecord, Diff, ShapeRecord } from "../types";
import { indexBetween } from "../order";
import { createStore } from "./store";

function shape(id: string, over: Partial<ShapeRecord> = {}): ShapeRecord {
  return {
    id,
    type: "rect",
    x: 0,
    y: 0,
    w: 10,
    h: 10,
    rotation: 0,
    parentId: null,
    index: id,
    props: {},
    ...over,
  };
}

function binding(id: string, arrowId: string, targetId: string): BindingRecord {
  return { id, arrowId, targetId, terminal: "end", anchor: { x: 0.5, y: 0.5 } };
}

describe("store", () => {
  it("adds, reads, updates and removes", () => {
    const store = createStore();
    store.add("shapes", shape("a"));
    expect(store.get("shapes", "a")).toEqual(shape("a"));
    expect(store.getAll("shapes")).toHaveLength(1);
    expect(store.update("shapes", "a", { x: 5 })?.x).toBe(5);
    expect(store.get("shapes", "a")?.x).toBe(5);
    expect(store.remove("shapes", "a")).toBe(true);
    expect(store.get("shapes", "a")).toBeUndefined();
  });

  it("hands back copies, not the live records", () => {
    const store = createStore();
    store.add("shapes", shape("a"));
    const got = store.get("shapes", "a");
    if (got) {
      got.x = 999;
    }
    expect(store.get("shapes", "a")?.x).toBe(0);
  });

  it("batches a transaction into one diff", () => {
    const store = createStore();
    const diff = store.transact(() => {
      store.add("shapes", shape("a"));
      store.add("shapes", shape("b"));
      store.update("shapes", "a", { x: 3 });
    });
    expect(Object.keys(diff.shapes?.added ?? {}).sort()).toEqual(["a", "b"]);
    expect(diff.shapes?.added.a.x).toBe(3);
    expect(Object.keys(diff.shapes?.updated ?? {})).toEqual([]);
  });

  it("merges nested transactions", () => {
    const store = createStore();
    const events: Diff[] = [];
    store.subscribe((diff) => events.push(diff));
    const diff = store.transact(() => {
      store.add("shapes", shape("a"));
      store.transact(() => {
        store.add("shapes", shape("b"));
      });
    });
    expect(Object.keys(diff.shapes?.added ?? {}).sort()).toEqual(["a", "b"]);
    expect(events).toHaveLength(1);
  });

  it("emits one diff per finished transaction", () => {
    const store = createStore();
    const events: Diff[] = [];
    store.subscribe((diff) => events.push(diff));
    store.add("shapes", shape("a"));
    store.add("shapes", shape("b"));
    expect(events).toHaveLength(2);
  });

  it("rolls everything back when a transaction throws", () => {
    const store = createStore();
    store.add("shapes", shape("a"));
    const events: Diff[] = [];
    store.subscribe((diff) => events.push(diff));
    expect(() =>
      store.transact(() => {
        store.add("shapes", shape("b"));
        store.update("shapes", "a", { x: 99 });
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(store.get("shapes", "b")).toBeUndefined();
    expect(store.get("shapes", "a")?.x).toBe(0);
    expect(events).toHaveLength(0);
  });

  it("rejects a duplicate id and rolls the transaction back", () => {
    const store = createStore();
    store.add("shapes", shape("a"));
    expect(() =>
      store.transact(() => {
        store.add("shapes", shape("b"));
        store.add("shapes", shape("a"));
      }),
    ).toThrow(/duplicate/);
    expect(store.get("shapes", "b")).toBeUndefined();
    expect(store.getAll("shapes")).toHaveLength(1);
  });

  it("removes a shape with its bindings and children", () => {
    const store = createStore();
    store.add("shapes", shape("frame"));
    store.add("shapes", shape("child", { parentId: "frame" }));
    store.add("shapes", shape("grandchild", { parentId: "child" }));
    store.add("shapes", shape("arrow"));
    store.add("bindings", binding("b1", "arrow", "child"));
    store.add("bindings", binding("b2", "arrow", "frame"));
    const diff = store.transact(() => {
      store.remove("shapes", "frame");
    });
    expect(store.get("shapes", "frame")).toBeUndefined();
    expect(store.get("shapes", "child")).toBeUndefined();
    expect(store.get("shapes", "grandchild")).toBeUndefined();
    expect(store.get("shapes", "arrow")).toBeDefined();
    expect(store.get("bindings", "b1")).toBeUndefined();
    expect(store.get("bindings", "b2")).toBeUndefined();
    expect(Object.keys(diff.shapes?.removed ?? {}).sort()).toEqual(["child", "frame", "grandchild"]);
    expect(Object.keys(diff.bindings?.removed ?? {}).sort()).toEqual(["b1", "b2"]);
  });

  it("cancels an add then remove inside one transaction", () => {
    const store = createStore();
    const events: Diff[] = [];
    store.subscribe((diff) => events.push(diff));
    const diff = store.transact(() => {
      store.add("shapes", shape("a"));
      store.remove("shapes", "a");
    });
    expect(diff).toEqual({});
    expect(store.get("shapes", "a")).toBeUndefined();
    expect(events).toHaveLength(0);
  });

  it("carries the original in a removed diff after an update", () => {
    const store = createStore();
    store.add("shapes", shape("a"));
    const diff = store.transact(() => {
      store.update("shapes", "a", { x: 5 });
      store.remove("shapes", "a");
    });
    expect(diff.shapes?.removed.a.x).toBe(0);
    store.applyDiffReverse(diff);
    expect(store.get("shapes", "a")?.x).toBe(0);
  });

  it("notifies subscribers and marks remote diffs", () => {
    const store = createStore();
    const local: Diff[] = [];
    const remote: Diff[] = [];
    const off = store.subscribe((diff, isRemote) => {
      if (isRemote) {
        remote.push(diff);
      } else {
        local.push(diff);
      }
    });
    store.add("shapes", shape("a"));
    expect(local).toHaveLength(1);
    store.applyDiffReverse(local[0]);
    expect(store.get("shapes", "a")).toBeUndefined();
    store.applyDiff(local[0]);
    expect(store.get("shapes", "a")).toBeDefined();
    expect(remote).toHaveLength(2);
    off();
    store.add("shapes", shape("b"));
    expect(local).toHaveLength(1);
  });

  it("round-trips a snapshot", () => {
    const store = createStore();
    store.add("shapes", shape("a"));
    store.add("bindings", binding("b", "a", "a"));
    store.setCamera({ x: 4, y: 5, zoom: 2 });
    const snap = store.snapshot();
    const restored = createStore(snap);
    expect(restored.snapshot()).toEqual(snap);
    expect(restored.getCamera()).toEqual({ x: 4, y: 5, zoom: 2 });
  });

  it("undoes 100 random edits through reverse diffs", () => {
    const store = createStore();
    const start = store.snapshot();
    const diffs: Diff[] = [];
    const off = store.subscribe((diff) => diffs.push(diff));
    let seed = 123456789;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    let nextShape = 0;
    let nextBinding = 0;
    let lastIndex: string | null = null;
    const shapeIds: string[] = [];
    for (let i = 0; i < 100; i += 1) {
      const roll = rand();
      if (roll < 0.4 || shapeIds.length === 0) {
        const id = `s${nextShape++}`;
        lastIndex = indexBetween(lastIndex, null);
        store.add("shapes", shape(id, { index: lastIndex }));
        shapeIds.push(id);
      } else if (roll < 0.6) {
        const id = shapeIds[Math.floor(rand() * shapeIds.length)];
        store.update("shapes", id, { x: Math.round(rand() * 100), rotation: rand() });
      } else if (roll < 0.75) {
        const id = shapeIds[Math.floor(rand() * shapeIds.length)];
        if (store.remove("shapes", id)) {
          shapeIds.splice(shapeIds.indexOf(id), 1);
        }
      } else if (shapeIds.length >= 2) {
        const arrowId = shapeIds[Math.floor(rand() * shapeIds.length)];
        const targetId = shapeIds[Math.floor(rand() * shapeIds.length)];
        store.add("bindings", binding(`b${nextBinding++}`, arrowId, targetId));
      }
    }
    off();
    for (let i = diffs.length - 1; i >= 0; i -= 1) {
      store.applyDiffReverse(diffs[i]);
    }
    expect(store.snapshot()).toEqual(start);
  });
});
