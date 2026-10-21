import { describe, expect, it } from "vite-plus/test";
import { buttonVariants } from "#src/shadcn/button/button.svelte";

describe("buttonVariants text", () => {
  for (const size of ["sm", "default", "lg"] as const) {
    it(`wraps and grows with its lines at size ${size}`, () => {
      const classes = buttonVariants({ variant: "text", size }).split(" ");
      expect(classes).toContain("h-auto");
      expect(classes).toContain("whitespace-normal");
      expect(classes).toContain("any-pointer-coarse:min-h-11");
      expect(classes).not.toContain("whitespace-nowrap");
      expect(classes).not.toContain("h-7");
      expect(classes).not.toContain("h-8");
    });
  }
  it("leaves the other variants fixed-height", () => {
    expect(buttonVariants({ variant: "ghost" }).split(" ")).toContain("h-8");
  });
});
