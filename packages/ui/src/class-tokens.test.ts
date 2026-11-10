/*
 * A missing space glues two classes into one Tailwind never matches: trace-line's pending state never dimmed (10 Nov 2026).
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

const src = dirname(fileURLToPath(import.meta.url));

function svelteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return svelteFiles(path);
    return entry.name.endsWith(".svelte") ? [path] : [];
  });
}

// A data-[...] or aria-[...] variant starts a class, so a letter or digit right before it is a lost space.
const GLUED = /[a-z0-9](?:data|aria)-\[/g;

describe("class strings", () => {
  it("never glue a variant onto the class before it", () => {
    const found = svelteFiles(src).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return [...source.matchAll(GLUED)].map((match) => {
        const line = source.slice(0, match.index).split("\n").length;
        return `${relative(src, file)}:${line}`;
      });
    });
    expect(found).toEqual([]);
  });
});
