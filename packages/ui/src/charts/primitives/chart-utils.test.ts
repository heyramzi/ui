import { describe, expect, it } from "vite-plus/test";
import { valueTick } from "#src/charts/primitives/chart-utils.js";

describe("valueTick", () => {
  const tick = valueTick((v) => v.toLocaleString("en-US"));

  it("keeps a label of 6 characters or fewer as the formatter wrote it", () => {
    expect(tick(1234)).toBe("1,234");
    expect(tick(12345)).toBe("12,345");
  });

  it("shortens a longer label to compact notation", () => {
    expect(tick(1_000_000)).toBe("1M");
    expect(tick(1_234_567)).toBe("1.2M");
    expect(tick(-12345)).toBe("-12.3K");
  });
});
