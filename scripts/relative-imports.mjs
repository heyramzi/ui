// Rewrites `#alias/` imports to relative paths for publish, since Vite can't resolve them in
// node_modules (ai-doc/references/publishing-packages.md). Only scripts/release.sh calls it.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const TEXT = /\.(ts|js|mjs|svelte|css)$/;
const MANIFEST = "manifest.json";

// A wildcard alias like "#src/*": "./src/*" maps a prefix to a directory. Patterns with an extension stay out.
function aliasesOf(pkgDir, imports) {
  const aliases = new Map();
  for (const [key, value] of Object.entries(imports ?? {})) {
    if (!key.startsWith("#") || !key.endsWith("/*") || typeof value !== "string") continue;
    if (!value.endsWith("/*")) continue;
    aliases.set(key.slice(0, -1), resolve(pkgDir, value.slice(0, -2)));
  }
  return aliases;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (TEXT.test(entry.name)) yield full;
  }
}

async function rewrite(backupDir, pkgDirs) {
  const changed = [];
  let specifiers = 0;
  for (const pkgDir of pkgDirs.map((dir) => resolve(dir))) {
    const pkg = JSON.parse(await readFile(join(pkgDir, "package.json"), "utf8"));
    const aliases = aliasesOf(pkgDir, pkg.imports);
    if (aliases.size === 0) continue;
    const prefixes = [...aliases.keys()].map((prefix) =>
      prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    const specifier = new RegExp(`(["'\`])(${prefixes.join("|")})([^"'\`]+)\\1`, "g");
    for (const root of new Set(aliases.values())) {
      for await (const file of walk(root)) {
        const original = await readFile(file, "utf8");
        const next = original.replace(specifier, (_, quote, prefix, rest) => {
          specifiers++;
          let rel = relative(dirname(file), join(aliases.get(prefix), rest));
          if (!rel.startsWith(".")) rel = `./${rel}`;
          return `${quote}${rel}${quote}`;
        });
        if (next === original) continue;
        await writeFile(file, next);
        changed.push({ file, original, rewritten: next });
      }
    }
  }
  await mkdir(backupDir, { recursive: true });
  await writeFile(join(backupDir, MANIFEST), JSON.stringify(changed));
  console.log(`relative-imports: ${specifiers} specifiers in ${changed.length} files`);
}

async function restore(backupDir) {
  const changed = JSON.parse(await readFile(join(backupDir, MANIFEST), "utf8"));
  let restored = 0;
  for (const { file, original, rewritten } of changed) {
    if ((await readFile(file, "utf8")) !== rewritten) {
      console.warn(`relative-imports: ${file} changed since the rewrite, left as it is`);
      continue;
    }
    await writeFile(file, original);
    restored++;
  }
  console.log(`relative-imports: restored ${restored} of ${changed.length} files`);
}

const [first, ...rest] = process.argv.slice(2);
if (first === "--restore" && rest.length === 1) await restore(resolve(rest[0]));
else if (first && first !== "--restore" && rest.length > 0) await rewrite(resolve(first), rest);
else {
  console.error(
    "usage: relative-imports.mjs <backup-dir> <package-dir>... | --restore <backup-dir>",
  );
  process.exit(2);
}
