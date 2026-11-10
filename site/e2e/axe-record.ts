import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ALLOWLIST, type Allowlist, OBSERVED, readAllowlist, recording } from "./axe.ts";

type Observed = { path: string; project: string; rules: string[] };

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

/**
 * Global teardown. After a GALLERY_AXE=record run, rewrites the allowlist for exactly the pages and
 * projects that ran, so a filtered run (one page, one project) leaves every other entry alone.
 */
export default function axeRecord(): void {
  if (!recording || !existsSync(OBSERVED)) return;
  const list: Allowlist = readAllowlist();
  for (const file of walk(OBSERVED)) {
    const { path, project, rules } = JSON.parse(readFileSync(file, "utf8")) as Observed;
    const page = (list[path] ??= {});
    for (const rule of Object.keys(page)) page[rule] = page[rule].filter((p) => p !== project);
    for (const rule of rules) (page[rule] ??= []).push(project);
  }
  const sorted: Allowlist = {};
  for (const path of Object.keys(list).toSorted()) {
    const rules = Object.entries(list[path])
      .filter(([, projects]) => projects.length > 0)
      .toSorted(([a], [b]) => a.localeCompare(b));
    if (rules.length) sorted[path] = Object.fromEntries(rules.map(([r, p]) => [r, p.toSorted()]));
  }
  // One rule per line, the shape `vp fmt` keeps, so a recording passes `pnpm lint` as written.
  const pages = Object.entries(sorted).map(([path, rules]) => {
    const lines = Object.entries(rules).map(
      ([r, p]) => `    ${JSON.stringify(r)}: ${JSON.stringify(p).replaceAll(",", ", ")}`,
    );
    return `  ${JSON.stringify(path)}: {\n${lines.join(",\n")}\n  }`;
  });
  writeFileSync(ALLOWLIST, pages.length ? `{\n${pages.join(",\n")}\n}\n` : "{}\n");
  const count = Object.values(sorted).reduce((n, rules) => n + Object.keys(rules).length, 0);
  console.log(`gallery: axe allowlist now holds ${count} page-rule entries`);
}
