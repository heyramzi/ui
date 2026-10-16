/*
 * The free transitions.dev catalogue has to stay fully owned.
 */

/*
 * `pnpm sync:transitions` reports an unowned slug, but only when someone runs it.
 */

/*
 * This asserts the same contract offline, off the lockfile, so a sync that lands a new upstream transition cannot be committed without a home for it.
 */

/*
 * The homes are not all in this folder: five live on the component that already did the job. See README.md.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";

/** The runner's cwd is the workspace root or the package; find the package. */
function packageRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (existsSync(join(dir, ".upstream", "transitions.lock.json"))) return dir;
    const candidate = join(dir, "packages", "ui");
    if (existsSync(join(candidate, ".upstream", "transitions.lock.json"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error("transitions.lock.json not found");
    dir = parent;
  }
}

type Lock = {
  free: number;
  entries: Record<string, { name: string; sha256: string; local: string | null }>;
};

const PKG = packageRoot();
const SRC = resolve(PKG, "src");
const lock: Lock = JSON.parse(
  readFileSync(join(PKG, ".upstream", "transitions.lock.json"), "utf8"),
);

describe("transitions.dev coverage", () => {
  it("vendors every free transition", () => {
    expect(Object.keys(lock.entries)).toHaveLength(lock.free);
  });

  it("gives every free transition an owner that exists", () => {
    const orphans = Object.entries(lock.entries)
      .filter(([, entry]) => !entry.local || !existsSync(resolve(SRC, entry.local)))
      .map(([slug, entry]) => `${slug} -> ${entry.local ?? "(nothing)"}`);
    expect(orphans).toEqual([]);
  });

  it("keeps the barrel importing every file in this folder", () => {
    const dir = join(SRC, "animations");
    const barrel = readFileSync(join(dir, "index.css"), "utf8");
    const missing = readdirSync(dir)
      .filter((file) => file.endsWith(".css") && file !== "index.css")
      .filter((file) => !barrel.includes(`"./${file}"`));
    expect(missing).toEqual([]);
  });
});
