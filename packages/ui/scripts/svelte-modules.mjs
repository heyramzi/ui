#!/usr/bin/env node
// Writes `x.svelte.js` beside each `x.svelte.ts` for the tarball; lib/svelte-modules.mjs says why.
// prepack writes them, postpack deletes them (`--clean`): left in src, they'd shadow the source.
import { dirname, join } from "node:path";
import { argv } from "node:process";
import { fileURLToPath } from "node:url";
import { cleanSvelteModules, writeSvelteModules } from "#scripts/lib/svelte-modules.mjs";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
if (argv.includes("--clean")) cleanSvelteModules(src);
else
  console.log(
    `svelte-modules: ${await writeSvelteModules(src)} module(s) beside src/**/*.svelte.ts`,
  );
