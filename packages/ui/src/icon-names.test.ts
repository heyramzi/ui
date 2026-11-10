/*
 * A Phosphor icon renders role="img", so one with no name is a nameless image to a screen reader (axe svg-img-alt, 527 hits on 10 Nov 2026).
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { parse } from "svelte/compiler";
import { describe, expect, it } from "vite-plus/test";

/** The runner's cwd is the workspace root or the package; find the workspace. */
function workspaceRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (existsSync(join(dir, "packages", "ui", "src"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error("workspace root not found");
    dir = parent;
  }
}

function svelteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return svelteFiles(path);
    return entry.name.endsWith(".svelte") ? [path] : [];
  });
}

function phosphorNames(source: string): Set<string> {
  const names = new Set<string>();
  for (const match of source.matchAll(/import\s+\{([^}]*)\}\s+from\s+["']phosphor-svelte["']/g)) {
    for (const part of match[1].split(",")) {
      const [imported, local = imported] = part.trim().split(/\s+as\s+/);
      if (imported && !imported.startsWith("type ")) names.add(local.trim());
    }
  }
  for (const match of source.matchAll(
    /import\s+(\w+)\s+from\s+["']phosphor-svelte\/lib\/\w+["']/g,
  )) {
    names.add(match[1]);
  }
  return names;
}

type Node = {
  type?: string;
  name?: string;
  start?: number;
  attributes?: { name?: string }[];
  fragment?: { nodes: Node[] };
};

const NAMING = new Set(["aria-hidden", "aria-label", "aria-labelledby"]);

function unnamedIcons(file: string, root: string): string[] {
  const source = readFileSync(file, "utf8");
  const names = phosphorNames(source);
  if (names.size === 0) return [];
  const found: string[] = [];
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    const node = value as Node;
    if (node.type === "Component" && node.name && names.has(node.name)) {
      const named = node.attributes?.some((attr) => attr.name && NAMING.has(attr.name));
      const titled = node.fragment?.nodes.some((child) => child.name === "title");
      if (!named && !titled) {
        const line = source.slice(0, node.start).split("\n").length;
        found.push(`${relative(root, file)}:${line} <${node.name}>`);
      }
    }
    for (const [key, child] of Object.entries(node)) {
      if (key !== "metadata" && key !== "parent") visit(child);
    }
  };
  visit(parse(source, { modern: true }).fragment);
  return found;
}

describe("Phosphor icons", () => {
  it("are hidden or named at every use", () => {
    const root = workspaceRoot();
    const files = [join(root, "packages", "ui", "src"), join(root, "site", "src")].flatMap(
      svelteFiles,
    );
    expect(files.flatMap((file) => unnamedIcons(file, root))).toEqual([]);
  });
});
