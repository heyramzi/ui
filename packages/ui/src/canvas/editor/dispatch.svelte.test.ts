import { describe, expect, it } from "vite-plus/test";
import type { Node } from "@xyflow/svelte";
import { createCanvasDispatcher } from "#src/canvas/editor/dispatch.svelte.js";
import type { FlowState } from "#src/canvas/editor/history-core.js";

function node(id: string, label = id): Node {
  return { id, type: "node", position: { x: 0, y: 0 }, data: { label } } as Node;
}

function setup(nodes: Node[] = [node("a"), node("b")]) {
  let state: FlowState = { nodes, edges: [] };
  let now = 1_000;
  const dispatcher = createCanvasDispatcher({
    getState: () => state,
    setState: (next) => {
      state = next;
    },
    onMutated: () => {},
    now: () => now,
  });
  const label = (id: string) => state.nodes.find((n) => n.id === id)?.data.label;
  const type = (id: string, text: string, key = `text:${id}`) =>
    dispatcher.dispatch(
      { kind: "patchNode", nodeId: id, data: { label: text } },
      { coalesceKey: key },
    );
  return {
    dispatcher,
    label,
    type,
    advance: (ms: number) => {
      now += ms;
    },
    // A drag writes the store itself between begin and commit.
    moveNode: (id: string, x: number) => {
      state = {
        ...state,
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, position: { x, y: 0 } } : n)),
      };
    },
    position: (id: string) => state.nodes.find((n) => n.id === id)?.position.x,
  };
}

describe("text coalescing", () => {
  it("merges keystrokes under 1 s apart into one undo step", () => {
    const t = setup();
    t.type("a", "h");
    t.advance(300);
    t.type("a", "he");
    t.advance(900);
    t.type("a", "hey");
    expect(t.label("a")).toBe("hey");

    t.dispatcher.undo();
    expect(t.label("a")).toBe("a");
    expect(t.dispatcher.canUndo).toBe(false);

    t.dispatcher.redo();
    expect(t.label("a")).toBe("hey");
  });

  it("starts a new step after a pause of 1 s or more", () => {
    const t = setup();
    t.type("a", "h");
    t.advance(1000);
    t.type("a", "he");

    t.dispatcher.undo();
    expect(t.label("a")).toBe("h");
    t.dispatcher.undo();
    expect(t.label("a")).toBe("a");
  });

  it("does not merge across different keys", () => {
    const t = setup();
    t.type("a", "x");
    t.advance(100);
    t.type("b", "y");

    t.dispatcher.undo();
    expect(t.label("b")).toBe("b");
    expect(t.label("a")).toBe("x");
  });

  it("ends the session on endCoalesce", () => {
    const t = setup();
    t.type("a", "h");
    t.dispatcher.endCoalesce();
    t.advance(100);
    t.type("a", "he");

    t.dispatcher.undo();
    expect(t.label("a")).toBe("h");
  });

  it("ends the session on a plain commit between two keystrokes", () => {
    const t = setup();
    t.type("a", "h");
    t.dispatcher.dispatch({ kind: "moveNode", nodeId: "b", position: { x: 5, y: 5 } });
    t.type("a", "he");

    t.dispatcher.undo();
    expect(t.label("a")).toBe("h");
  });

  it("ends the session on undo and redo", () => {
    const t = setup();
    t.type("a", "h");
    t.dispatcher.undo();
    t.dispatcher.redo();
    t.advance(100);
    t.type("a", "he");

    t.dispatcher.undo();
    expect(t.label("a")).toBe("h");
  });

  it("undoes one step to the text before the session after a merged run", () => {
    const t = setup([node("a", "start")]);
    for (const text of ["s", "st", "sta", "star", "start!"]) {
      t.type("a", text);
      t.advance(200);
    }
    t.dispatcher.undo();
    expect(t.label("a")).toBe("start");
    expect(t.dispatcher.canUndo).toBe(false);
  });
});

describe("history cap", () => {
  it("keeps 200 entries and drops the oldest", () => {
    const t = setup([node("a", "0")]);
    for (let i = 1; i <= 250; i++) {
      t.dispatcher.dispatch({ kind: "patchNode", nodeId: "a", data: { label: String(i) } });
    }
    let undone = 0;
    while (t.dispatcher.canUndo) {
      t.dispatcher.undo();
      undone += 1;
    }
    expect(undone).toBe(200);
    expect(t.label("a")).toBe("50");
  });
});

describe("open transaction", () => {
  it("reports isOpen while a gesture is in flight", () => {
    const t = setup();
    expect(t.dispatcher.isOpen).toBe(false);
    t.dispatcher.begin();
    expect(t.dispatcher.isOpen).toBe(true);
    t.dispatcher.commit();
    expect(t.dispatcher.isOpen).toBe(false);
  });

  it("undo is blocked while a gesture is fresh", () => {
    const t = setup();
    t.dispatcher.dispatch({ kind: "moveNode", nodeId: "b", position: { x: 5, y: 5 } });
    t.dispatcher.begin();
    t.advance(9_000);
    t.dispatcher.undo();
    expect(t.dispatcher.canUndo).toBe(true);
    expect(t.dispatcher.isOpen).toBe(true);
  });

  it("recovers a drag whose stop never fired: undo closes it, then undoes it", () => {
    const t = setup();
    t.dispatcher.begin();
    t.moveNode("a", 100);
    t.advance(10_001);
    expect(t.dispatcher.isOpen).toBe(false);

    t.dispatcher.undo();
    expect(t.position("a")).toBe(0);
    expect(t.dispatcher.canUndo).toBe(false);
    expect(t.dispatcher.canRedo).toBe(true);
  });

  it("recovers on begin, so the next edit gets its own step", () => {
    const t = setup();
    t.dispatcher.begin();
    t.moveNode("a", 100);
    t.advance(10_001);
    t.dispatcher.dispatch({ kind: "patchNode", nodeId: "b", data: { label: "B" } });

    t.dispatcher.undo();
    expect(t.label("b")).toBe("b");
    expect(t.position("a")).toBe(100);
    t.dispatcher.undo();
    expect(t.position("a")).toBe(0);
  });

  it("treats a commit with no begin as harmless", () => {
    const t = setup();
    t.dispatcher.commit();
    t.dispatcher.commit();
    expect(t.dispatcher.isOpen).toBe(false);
    t.dispatcher.begin();
    expect(t.dispatcher.isOpen).toBe(true);
  });
});

describe("a drag held longer than the stuck limit", () => {
  it("stays open while drag frames keep reporting activity", () => {
    const t = setup();
    t.dispatcher.begin();
    for (let i = 1; i <= 8; i += 1) {
      t.advance(3_000);
      t.moveNode("a", i * 10);
      t.dispatcher.touch();
    }
    expect(t.dispatcher.isOpen).toBe(true);
    t.dispatcher.commit();
    t.dispatcher.undo();
    expect(t.position("a")).toBe(0);
  });

  it("still reads stuck when nothing reports for the full limit", () => {
    const t = setup();
    t.dispatcher.begin();
    t.advance(11_000);
    expect(t.dispatcher.isOpen).toBe(false);
  });
});

describe("a big board", () => {
  it("records and undoes an edit without reading the cards it did not touch", () => {
    const untouched = Array.from({ length: 50 }, (_, i) => ({
      ...node(`n${i}`),
      toJSON: () => {
        throw new Error("an untouched card was serialised");
      },
    }));
    const t = setup([...untouched, node("a", "one")]);
    t.type("a", "two");
    expect(t.label("a")).toBe("two");
    t.dispatcher.undo();
    expect(t.label("a")).toBe("one");
    t.dispatcher.redo();
    expect(t.label("a")).toBe("two");
  });
});
