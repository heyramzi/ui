// Rewrites every `#src/` and `#scripts/` specifier to a relative path, in place, before publish.
// WHY: Vite cannot resolve a package's own `#` imports inside node_modules (ai-doc/references/publishing-packages.md).
// It edits the source tree, so only scripts/release.sh runs it, right before `pnpm publish`, and restores the tree after.
// It is not a `build` script: `pnpm -r build` would rewrite the working tree.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const targets = { src: join(root, "src"), scripts: join(root, "scripts") };
const TEXT = /\.(ts|js|mjs|svelte|css)$/;
const SPECIFIER = /(["'`])#(src|scripts)\/([^"'`]+)\1/g;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (TEXT.test(entry.name)) yield full;
  }
}

let files = 0;
let specifiers = 0;
for (const dir of Object.values(targets)) {
  for await (const file of walk(dir)) {
    const text = await readFile(file, "utf8");
    const next = text.replace(SPECIFIER, (_, quote, base, rest) => {
      specifiers++;
      let rel = relative(dirname(file), join(targets[base], rest));
      if (!rel.startsWith(".")) rel = `./${rel}`;
      return `${quote}${rel}${quote}`;
    });
    if (next !== text) {
      await writeFile(file, next);
      files++;
    }
  }
}
console.log(`relative-imports: ${specifiers} specifiers in ${files} files`);
