import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";
import { createRegistry, definePlugin } from "#src/canvas/plugin.js";

const ping = z.object({ kind: z.literal("ping") });

const a = definePlugin({
  id: "a",
  nodes: [
    { type: "card", label: "Card", sizing: "content-sized" },
    { type: "frame", label: "Frame", sizing: "layout-owned" },
  ],
  ops: [{ kind: "ping", schema: ping, apply: () => {} }],
  layouts: [
    {
      id: "flat",
      matches: (_d, o) => o.mode === "flat",
      run: (d) => ({ nodes: d.nodes, edges: d.edges }),
    },
  ],
});

describe("createRegistry", () => {
  it("indexes kinds, ops and sizing", () => {
    const registry = createRegistry([a]);
    expect(registry.nodes.get("card")?.label).toBe("Card");
    expect([...registry.contentSizedTypes()]).toEqual(["card"]);
    expect([...registry.layoutOwnedTypes()]).toEqual(["frame"]);
    expect(registry.parseOp({ kind: "ping" })).toEqual({ kind: "ping" });
    expect(() => registry.parseOp({ kind: "pong" })).toThrow(/Unknown op kind/);
  });

  it("picks the first layout pass that matches", () => {
    const registry = createRegistry([a]);
    expect(registry.pickLayout({ nodes: [], edges: [] }, { mode: "flat" })?.id).toBe("flat");
    expect(registry.pickLayout({ nodes: [], edges: [] }, { mode: "tree" })).toBeNull();
  });

  it("refuses a node type or op kind two plugins both claim", () => {
    const b = definePlugin({ id: "b", nodes: [{ type: "card", label: "Other" }] });
    expect(() => createRegistry([a, b])).toThrow(/claimed by both "a" and "b"/);
    const c = definePlugin({ id: "c", ops: [{ kind: "ping", schema: ping, apply: () => {} }] });
    expect(() => createRegistry([a, c])).toThrow(/claimed by both/);
  });
});
