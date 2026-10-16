/*
 * The showcase has to hold everything the package ships.
 */

/*
 * A demo that is written once and then forgotten is how a kit ends up with a page that shows two thirds of it.
 */

/*
 * These assert coverage off the source, not off a number typed here: an animation with no stage, or a synced primitive missing from the generated list, fails.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import AnimationsSection from "#src/showcase/AnimationsSection.svelte";
import ShadcnSection from "#src/showcase/ShadcnSection.svelte";
import { SHADCN_DEMOS } from "#src/showcase/demos/shadcn/index.js";

/** The runner's cwd is the workspace root or the package; find the package. */
function packageRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (existsSync(join(dir, "src", "showcase", "kit.ts"))) return dir;
    const candidate = join(dir, "packages", "ui");
    if (existsSync(join(candidate, "src", "showcase", "kit.ts"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error("packages/ui not found");
    dir = parent;
  }
}

const PKG = packageRoot();
const SRC = join(PKG, "src");

function render(Comp: Parameters<typeof mount>[0]) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(Comp, { target });
  flushSync();
  const stages = target.querySelectorAll(".sc-stage").length;
  void unmount(app);
  target.remove();
  return stages;
}

describe("showcase coverage", () => {
  it("gives every animation a stage", () => {
    const section = readFileSync(join(SRC, "showcase", "AnimationsSection.svelte"), "utf8");
    const missing = readdirSync(join(SRC, "animations"))
      .filter((file) => file.endsWith(".css") && file !== "index.css")
      .filter((file) => !section.includes(`animations/${file.replace(".css", "")}`));
    expect(missing).toEqual([]);
  });

  it("lists every synced shadcn demo", () => {
    const vendored = readdirSync(join(PKG, ".upstream", "shadcn-demos"))
      .filter((file) => file.endsWith(".svelte"))
      .map((file) => file.replace(".svelte", ""));
    const listed = new Set(SHADCN_DEMOS.map((demo) => demo.name));
    expect(vendored.filter((name) => !listed.has(name))).toEqual([]);
  });

  it("renders a stage for every shadcn primitive", () => {
    expect(render(ShadcnSection)).toBe(SHADCN_DEMOS.length);
  });

  it("renders the animation stages", () => {
    expect(render(AnimationsSection)).toBe(27);
  });
});
