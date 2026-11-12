// vite-plugin-svelte prebundles a dependency's `.svelte.ts` with its types still in, so a consumer's
// dev server dies on the first `import type` (3.6.0, the chat windows' reveal.svelte.ts).

// The tarball carries a type-free `x.svelte.js` twin. Importers already write `.svelte.js`, so Vite
// takes the twin and TypeScript keeps the `.ts`; the repo, with no twin, falls back to it.
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { transformWithOxc } from "vite-plus";

const MODULE = /\.svelte\.ts$/;
const TEST = /\.(test|spec)\.svelte\.ts$/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (MODULE.test(e.name) && !TEST.test(e.name)) out.push(p);
  }
  return out;
}

/** Deletes every `x.svelte.js` that sits beside an `x.svelte.ts` under `src`. */
export function cleanSvelteModules(src) {
  for (const file of walk(src)) rmSync(file.replace(MODULE, ".svelte.js"), { force: true });
}

/** Writes a type-free `x.svelte.js` beside each `x.svelte.ts` under `src`, and returns how many. */
export async function writeSvelteModules(src) {
  cleanSvelteModules(src);
  const files = walk(src);
  await Promise.all(
    files.map(async (file) => {
      const { code } = await transformWithOxc(readFileSync(file, "utf8"), file, { lang: "ts" });
      writeFileSync(file.replace(MODULE, ".svelte.js"), code);
    }),
  );
  return files.length;
}
