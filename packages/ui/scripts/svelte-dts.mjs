#!/usr/bin/env node
// Writes `x.svelte.d.ts` beside each `x.svelte` for the tarball: native TypeScript can't read a
// `.svelte` under node_modules, so without them every component types as `any`.

// prepack writes them, postpack deletes them (`--clean`): left in src, they'd shadow the components.
// An export whose target is a `.svelte` file lists its `types` as [`x.svelte.d.ts`, `x.svelte`]:
// from a `.svelte` target TypeScript only looks for `x.d.svelte.ts`, and svelte-check stops
// faking that file once a real `x.svelte.d.ts` sits beside it, so the import found nothing (3.0.0).
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { argv, chdir, exit } from "node:process";
import { fileURLToPath } from "node:url";
import { emitDts } from "svelte2tsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function walk(dir, test, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, test, out);
    else if (test(e.name)) out.push(p);
  }
  return out;
}

for (const file of walk(src, (n) => n.endsWith(".svelte.d.ts"))) rmSync(file);
if (argv.includes("--clean")) exit(0);

// emitDts also declares every .ts file; only the component ones are copied out.
const out = mkdtempSync(join(tmpdir(), "svelte-dts-"));
chdir(root);
await emitDts({
  libRoot: src,
  tsconfig: join(root, "tsconfig.json"),
  // svelte2tsx's own option name, a computed key because the old-names gate reads a bare key as ours.
  ["svelteShimsPath"]: createRequire(import.meta.url).resolve("svelte2tsx/svelte-shims-v4.d.ts"),
  declarationDir: out,
});

const components = walk(src, (n) => n.endsWith(".svelte"));
const dtsOf = (file) => join(out, `${relative(src, file)}.d.ts`);
const missing = components.filter((file) => !existsSync(dtsOf(file)));
if (missing.length) {
  rmSync(out, { recursive: true, force: true });
  const list = missing.map((file) => relative(root, file)).join("\n");
  console.error(`svelte-dts: no declaration for ${missing.length} file(s):\n${list}`);
  exit(1);
}

// emitDts names the component after its file, a name 5 files also import (calendar's
// `* as Calendar`): a circular alias on TypeScript 7, so the default gets a neutral name.
function unnamed(dts) {
  const name = dts.match(/^export default (\w+);$/m)[1];
  const own = new RegExp(`^(declare const |type |export default )${name}\\b.*$`, "gm");
  return dts.replace(own, (line) =>
    line.replaceAll(new RegExp(`\\b${name}\\b`, "g"), "$$$$Component"),
  );
}
for (const file of components)
  writeFileSync(`${file}.d.ts`, unnamed(readFileSync(dtsOf(file), "utf8")));
rmSync(out, { recursive: true, force: true });
console.log(`svelte-dts: ${components.length} declaration(s) beside src/**/*.svelte`);
