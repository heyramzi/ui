import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vite-plus/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const js = join(root, "dist", "review.js");
const css = join(root, "dist", "review.css");

describe("dist", () => {
  beforeAll(() => {
    if (!existsSync(js) || !existsSync(css))
      execFileSync("pnpm", ["build"], { cwd: root, stdio: "ignore" });
  }, 120_000);

  it("ships one script and one stylesheet", () => {
    expect(existsSync(js)).toBe(true);
    expect(existsSync(css)).toBe(true);
    expect(readFileSync(js, "utf8")).toContain("mountReview");
  });
  it("never carries the dev tools", () => {
    for (const file of [js, css]) expect(readFileSync(file, "utf8")).not.toMatch(/__heyramziGrab/);
  });
  it("has no runtime import: Svelte is bundled in", () => {
    expect(readFileSync(js, "utf8")).not.toMatch(/^import .* from ["'][^./]/m);
  });
});
