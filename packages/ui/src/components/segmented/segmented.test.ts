import { describe, expect, it } from "vite-plus/test";
import { segmentedTrackClass } from "#src/components/segmented/segmented.js";

describe("segmentedTrackClass", () => {
  // Every segmented control shares one height, whatever its look.
  it("holds one height across variants", () => {
    for (const variant of ["pill", "underline"] as const) {
      const classes = segmentedTrackClass({ variant }).split(" ");
      expect(classes).toContain("h-7");
      expect(classes).toContain("any-pointer-coarse:h-10");
    }
  });

  it("draws the pill as a bordered well and the underline as a hairline", () => {
    expect(segmentedTrackClass({ variant: "pill" })).toContain("rounded-lg");
    const underline = segmentedTrackClass({ variant: "underline" });
    expect(underline).toContain("border-b");
    expect(underline).not.toContain("rounded-lg");
  });
});
