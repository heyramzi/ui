import { describe, expect, it } from "vite-plus/test";
import { serializeFlowEdge } from "#src/canvas/headless/edge-serialization.js";
import type { Edge } from "@xyflow/svelte";

function makeFlowEdge(overrides: Partial<Edge> = {}): Edge {
  return {
    id: overrides.id ?? "e1",
    source: overrides.source ?? "a",
    target: overrides.target ?? "b",
    ...overrides,
  };
}

describe("serializeFlowEdge", () => {
  it("serializes minimal edge with id, source, target", () => {
    const result = serializeFlowEdge(makeFlowEdge());
    expect(result).toEqual({ id: "e1", source: "a", target: "b" });
  });

  it("includes type when present", () => {
    const result = serializeFlowEdge(makeFlowEdge({ type: "smoothstep" }));
    expect(result.type).toBe("smoothstep");
  });

  it("includes label when present", () => {
    const result = serializeFlowEdge(makeFlowEdge({ label: "connects to" }));
    expect(result.label).toBe("connects to");
  });

  it("includes animated when present", () => {
    const result = serializeFlowEdge(makeFlowEdge({ animated: true }));
    expect(result.animated).toBe(true);
  });

  it("includes sourceHandle and targetHandle when present", () => {
    const result = serializeFlowEdge(makeFlowEdge({ sourceHandle: "out-1", targetHandle: "in-1" }));
    expect(result.sourceHandle).toBe("out-1");
    expect(result.targetHandle).toBe("in-1");
  });

  it("includes data when present", () => {
    const result = serializeFlowEdge(makeFlowEdge({ data: { custom: true } }));
    expect(result.data).toEqual({ custom: true });
  });

  it("omits falsy optional fields", () => {
    const result = serializeFlowEdge(
      makeFlowEdge({ type: undefined, label: undefined, animated: undefined }),
    );
    expect(result).toEqual({ id: "e1", source: "a", target: "b" });
    expect("type" in result).toBe(false);
    expect("label" in result).toBe(false);
    expect("animated" in result).toBe(false);
  });
});
