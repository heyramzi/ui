import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, "row-context-menu.svelte");
if (!existsSync(sourcePath)) {
  throw new Error(`Unable to find source file: ${sourcePath}`);
}
const source = readFileSync(sourcePath, "utf8");

describe("row context menu delete affordance", () => {
  it("renders the hold-to-delete action at full menu-item width", () => {
    expect(source).toContain("w-full");
    expect(source).toContain("justify-start");
  });
});
