import { describe, expect, it } from "vite-plus/test";
import { resolveContextMenuHit } from "#src/canvas/editor/context-menu.js";
import type { Node } from "@xyflow/svelte";

function elementStub(attrs: Record<string, string> = {}, data: Record<string, string> = {}) {
  const rect = { x: 1, y: 2, width: 3, height: 4 };
  const el = {
    getAttribute: (name: string) => attrs[name] ?? null,
    getBoundingClientRect: () => rect,
    dataset: data,
    closest: (sel: string) => {
      if (sel === ".svelte-flow__edge" && attrs.edge) return el;
      if (sel === "[data-id]" && attrs["data-id"]) return el;
      if (sel === "[data-table-row]" && data.tableRow) return el;
      return null;
    },
  };
  return el as unknown as HTMLElement;
}

function event(target: HTMLElement): MouseEvent {
  return { target, clientX: 10, clientY: 20 } as unknown as MouseEvent;
}

describe("resolveContextMenuHit", () => {
  it("reads an edge hit and skips the node lookup", () => {
    const target = elementStub({ edge: "1", "data-id": "e1" });
    const hit = resolveContextMenuHit(event(target), []);
    expect(hit).toEqual({ kind: "edge", edgeId: "e1", position: { x: 10, y: 20 } });
  });

  it("reads a node hit with its rect and type", () => {
    const target = elementStub({ "data-id": "n1" });
    const nodes = [{ id: "n1", type: "note" }] as unknown as Node[];
    const hit = resolveContextMenuHit(event(target), nodes);
    expect(hit).toEqual({
      kind: "canvas",
      position: { x: 10, y: 20 },
      anchorRect: { x: 1, y: 2, width: 3, height: 4 },
      nodeId: "n1",
      nodeType: "note",
      tableCell: null,
    });
  });

  it("reads a table cell under the pointer", () => {
    const target = elementStub({ "data-id": "n1" }, { tableRow: "1", tableCol: "2" });
    const nodes = [{ id: "n1", type: "table" }] as unknown as Node[];
    const hit = resolveContextMenuHit(event(target), nodes);
    expect(hit.kind === "canvas" && hit.tableCell).toEqual({ row: 1, col: 2 });
  });

  it("reads a bare canvas click as a null node", () => {
    const target = elementStub({});
    const hit = resolveContextMenuHit(event(target), []);
    expect(hit).toEqual({
      kind: "canvas",
      position: { x: 10, y: 20 },
      anchorRect: null,
      nodeId: null,
      nodeType: null,
      tableCell: null,
    });
  });
});
