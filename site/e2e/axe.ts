import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AxeBuilder } from "@axe-core/playwright";
import type { TestInfo } from "@playwright/test";

type Result = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];

/**
 * Known axe violations: page, then rule, then the projects it fires in. An unlisted one fails,
 * and so does a listed one that stopped firing, so the list only shrinks.
 */
export type Allowlist = Record<string, Record<string, string[]>>;

export const ALLOWLIST = fileURLToPath(new URL("axe-allowlist.json", import.meta.url));

/** GALLERY_AXE=record writes what each test saw here, and axe-record.ts folds it into the allowlist. */
export const recording = process.env.GALLERY_AXE === "record";

export function readAllowlist(): Allowlist {
  return JSON.parse(readFileSync(ALLOWLIST, "utf8")) as Allowlist;
}

/** Where a recording run leaves each test's findings; axe-record.ts reads the same folder. */
export const OBSERVED = fileURLToPath(new URL("results/axe-observed/", import.meta.url));

export function recordObserved(info: TestInfo, path: string, rules: string[]): void {
  const file = join(OBSERVED, info.project.name, `${path === "/" ? "home" : path.slice(1)}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ path, project: info.project.name, rules }));
}

function describe(v: Result): string {
  const nodes = v.nodes.slice(0, 3).map((n) => `      ${n.target.join(" ")}`);
  const more = v.nodes.length > 3 ? [`      ...and ${v.nodes.length - 3} more`] : [];
  return [`  ${v.id} (${v.impact}, ${v.nodes.length} nodes): ${v.help}`, ...nodes, ...more].join(
    "\n",
  );
}

/** What the run found against what the allowlist expects, as failure messages. */
export function compareAxe(
  path: string,
  project: string,
  violations: Result[],
  allowlist: Allowlist,
) {
  const allowed = allowlist[path] ?? {};
  const fired = new Set(violations.map((v) => v.id));
  const unexpected = violations.filter((v) => !allowed[v.id]?.includes(project));
  const stale = Object.entries(allowed)
    .filter(([rule, projects]) => projects.includes(project) && !fired.has(rule))
    .map(([rule]) => rule);
  return {
    unexpected: unexpected.length
      ? `New axe violations on ${path} (${project}):\n${unexpected.map(describe).join("\n")}`
      : "",
    stale: stale.length
      ? `Fixed, so delete from e2e/axe-allowlist.json: ${path} ${stale.map((r) => `${r} [${project}]`).join(", ")}`
      : "",
  };
}
