import { describe, expect, it } from "vite-plus/test";
import { stepTo } from "#src/components/list-page/step.js";

describe("stepTo", () => {
  const ids = ["a", "b", "c"];

  it("steps both ways from the middle", () => {
    expect(stepTo(ids, "b", -1)).toBe("a");
    expect(stepTo(ids, "b", 1)).toBe("c");
  });

  it("stops at either end", () => {
    expect(stepTo(ids, "a", -1)).toBe(null);
    expect(stepTo(ids, "c", 1)).toBe(null);
  });

  it("goes nowhere without a listed selection", () => {
    expect(stepTo(ids, null, 1)).toBe(null);
    expect(stepTo(ids, "z", 1)).toBe(null);
  });
});
