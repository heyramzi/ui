/*
 * The gallery lives on the site, one copy of every demo, and it has to hold everything this package ships.
 */

/*
 * These read the site's files off disk, so an animation without a stage or a synced primitive without a demo fails here and not in front of a reader.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

/** The runner's cwd is the workspace root or the package; find the package. */
function packageRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (existsSync(join(dir, ".upstream", "shadcn.lock.json"))) return dir;
    const candidate = join(dir, "packages", "ui");
    if (existsSync(join(candidate, ".upstream", "shadcn.lock.json"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error("packages/ui not found");
    dir = parent;
  }
}

const PKG = packageRoot();
const SITE = join(PKG, "..", "..", "site", "src", "lib");

describe("site gallery coverage", () => {
  it("gives every animation a stage", () => {
    const section = readFileSync(join(SITE, "demos", "motion.svelte"), "utf8");
    const missing = readdirSync(join(PKG, "src", "animations"))
      .filter((file) => file.endsWith(".css") && file !== "index.css")
      .filter((file) => !section.includes(`animations/${file.replace(".css", "")}`));
    expect(missing).toEqual([]);
  });

  it("lists every synced shadcn demo", () => {
    const manifest = readFileSync(join(SITE, "shadcn-demos", "index.ts"), "utf8");
    const vendored = readdirSync(join(PKG, ".upstream", "shadcn-demos"))
      .filter((file) => file.endsWith(".svelte"))
      .map((file) => file.replace(".svelte", ""));
    expect(vendored.filter((name) => !manifest.includes(`name: "${name}"`))).toEqual([]);
  });

  it("gives every component, AI part and effect a place on the site", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(join(dir, d.name)) : /\.(svelte|ts)$/.test(d.name) ? [join(dir, d.name)] : [],
      );
    const site = walk(join(SITE, "..")).map((file) => readFileSync(file, "utf8")).join("\n");
    const parts = ["components", "ai", "effects"].flatMap((top) =>
      readdirSync(join(PKG, "src", top), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => `${top}/${d.name}`),
    );
    expect(parts.filter((part) => !site.includes(`${part}/`) && !site.includes(`${part}"`))).toEqual([]);
  });

  it("keeps a demo file behind every listed primitive", () => {
    const manifest = readFileSync(join(SITE, "shadcn-demos", "index.ts"), "utf8");
    const listed = [...manifest.matchAll(/name: "([a-z-]+)"/g)].map((m) => m[1]);
    expect(listed.length).toBeGreaterThan(0);
    expect(listed.filter((name) => !existsSync(join(SITE, "shadcn-demos", `${name}.svelte`)))).toEqual([]);
  });
});
