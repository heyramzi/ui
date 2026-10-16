import { describe, it, expect } from "vitest";
import { createShapeRegistry, defaultShapes, get } from "./registry";
import { rectUtil } from "./rect";

describe("shape registry", () => {
  it("returns the util for a known type", () => {
    expect(get("rect")).toBe(rectUtil);
    expect(get("freehand").type).toBe("freehand");
  });

  it("throws a clear error for an unknown type", () => {
    expect(() => get("blob")).toThrowError(/Unknown shape type: "blob"/);
  });

  it("registers every built-in exactly once", () => {
    const types = defaultShapes.map((util) => util.type);
    expect(types.length).toBe(11);
    expect(new Set(types).size).toBe(11);
  });

  it("lets a later util override an earlier one", () => {
    const registry = createShapeRegistry([
      { ...rectUtil, type: "custom" },
      { ...rectUtil, type: "custom", defaults: rectUtil.defaults },
    ]);
    expect(registry.get("custom").type).toBe("custom");
  });
});
