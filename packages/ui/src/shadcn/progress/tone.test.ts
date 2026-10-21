import { describe, expect, it } from "vite-plus/test";
import { progressToneClass } from "#src/shadcn/progress/tone.js";

describe("progressToneClass", () => {
  it("keeps the primary fill when no tone is given", () => {
    expect(progressToneClass()).toBe("bg-primary");
  });
  it("gives each tone its own fill", () => {
    expect(progressToneClass("success")).toBe("bg-success");
    expect(progressToneClass("destructive")).toBe("bg-destructive");
    expect(progressToneClass("accent")).toContain("--tone-accent");
  });
});
