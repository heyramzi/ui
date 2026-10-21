import { describe, expect, it } from "vite-plus/test";
import { TONE_CLASS } from "#src/lib/tone.js";

describe("TONE_CLASS", () => {
  // Plain destructive text on its own 10% tint is 3.6:1. The ink mix clears 4.5:1.
  it("sets destructive text in the ink, not the raw colour", () => {
    expect(TONE_CLASS.destructive).toContain("text-destructive-ink");
    expect(TONE_CLASS.destructive.split(" ")).not.toContain("text-destructive");
  });
});
