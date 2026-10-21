import { describe, expect, it } from "vite-plus/test";
import type { Node } from "@xyflow/svelte";
import { deletableIds, refuseLockedOps, toggleLock, withLockFlags } from "#src/canvas/editor/lock.js";

function card(id: string, data: Record<string, unknown> = {}, extra: Partial<Node> = {}): Node {
  return { id, type: "note", position: { x: 0, y: 0 }, data, ...extra };
}

describe("refuseLockedOps", () => {
  const nodes = [card("free"), card("held", { locked: true })];

  it("drops moves, edits and removals on a locked card", () => {
    const ops = [
      { kind: "moveNode", nodeId: "held", position: { x: 1, y: 1 } },
      { kind: "patchNode", nodeId: "held", data: { content: "x" } },
      { kind: "removeNode", nodeId: "held" },
      { kind: "moveNode", nodeId: "free", position: { x: 1, y: 1 } },
    ];
    expect(refuseLockedOps(nodes, ops)).toEqual([ops[3]]);
  });

  it("lets a locked card be unlocked and linked", () => {
    const ops = [
      { kind: "patchNode", nodeId: "held", data: { locked: false } },
      { kind: "addEdge", edge: { source: "held", target: "free" } },
    ];
    expect(refuseLockedOps(nodes, ops)).toEqual(ops);
  });

  it("refuses an unlock that also edits the card", () => {
    const op = { kind: "patchNode", nodeId: "held", data: { locked: false, content: "x" } };
    expect(refuseLockedOps(nodes, [op])).toEqual([]);
  });
});

describe("toggleLock", () => {
  it("locks, then unlocks when every pick is locked", () => {
    const board = [card("a"), card("b", { locked: true })];
    const locked = toggleLock(board, new Set(["a", "b"]));
    expect(locked?.locked).toBe(true);
    expect(locked?.nodes.every((n) => n.draggable === false && n.deletable === false)).toBe(true);
    const unlocked = toggleLock(locked?.nodes ?? [], new Set(["a", "b"]));
    expect(unlocked?.locked).toBe(false);
    expect(unlocked?.nodes.some((n) => "draggable" in n)).toBe(false);
  });

  it("does nothing for an empty pick", () => {
    expect(toggleLock([card("a")], new Set())).toBeNull();
  });
});

describe("deletableIds", () => {
  it("keeps a locked card and the group that holds one", () => {
    const board = [
      card("g", {}, { type: "wrapper" }),
      card("held", { locked: true }, { parentId: "g" }),
      card("free"),
    ];
    expect(deletableIds(board, ["g", "held", "free"])).toEqual(["free"]);
  });
});

describe("withLockFlags", () => {
  it("leaves a synced copy's own flags alone", () => {
    const copy = card("c", { syncedCopy: true, locked: true });
    expect(withLockFlags(copy)).toBe(copy);
  });
});
